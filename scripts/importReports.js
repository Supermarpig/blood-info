// scripts/importReports.js
// 從 GitHub Issues 匯入回報資料到當月 JSON
// 使用方式: node scripts/importReports.js

import fs from 'fs/promises';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'Supermarpig/blood-info';

async function fetchDonationReportIssues() {
    if (!GITHUB_TOKEN) {
        throw new Error('請設定環境變數 GITHUB_TOKEN');
    }

    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/issues?labels=donation-report&state=open&per_page=100`,
        {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
        }
    );

    if (!response.ok) {
        throw new Error(`GitHub API 錯誤: ${response.status}`);
    }

    return response.json();
}

function parseIssueBody(body) {
    // 嘗試從 JSON code block 解析
    const jsonMatch = body.match(/```json\n([\s\S]*?)\n```/);

    if (jsonMatch) {
        try {
            const data = JSON.parse(jsonMatch[1]);
            return {
                address: data.address,
                activityDate: data.activityDate,
                time: data.time || '',
                tags: data.tags || [],
                imageUrl: data.imgurUrl || '',
            };
        } catch (e) {
            console.error('JSON 解析失敗:', e);
        }
    }

    // 舊格式 fallback: 從表格解析
    const addressMatch = body.match(/\| 📍 地址 \| (.+?) \|/);
    const dateMatch = body.match(/\| 📅 日期 \| (.+?) \|/);
    const tagsMatch = body.match(/\| 🏷️ 標籤 \| (.+?) \|/) || body.match(/\| 🏷️ 贈品 \| (.+?) \|/);
    const imageMatch = body.match(/!\[.*?\]\((.+?)\)/);

    if (!addressMatch || !dateMatch) {
        return null;
    }

    const address = addressMatch[1].trim();
    const activityDate = dateMatch[1].trim();
    const tagsStr = tagsMatch ? tagsMatch[1].trim() : '';
    const tags = tagsStr && tagsStr !== '無' ? tagsStr.split(', ').map(t => t.trim()) : [];
    const imageUrl = imageMatch ? imageMatch[1].trim() : '';

    return {
        address,
        activityDate,
        time: '',
        tags,
        imageUrl,
    };
}

function createDonationEvent(parsed, issueNumber) {
    const { address, activityDate, time, tags, imageUrl } = parsed;

    // 生成唯一 ID (使用 report 前綴區分)
    const idBase = `report-${activityDate}-${address}`;
    const id = Buffer.from(idBase).toString('base64');

    return {
        id,
        time: time || '',
        organization: '使用者回報',
        location: address,
        rawContent: `使用者回報: ${address}`,
        activityDate,
        center: '使用者回報',
        detailUrl: `https://github.com/${GITHUB_REPO}/issues/${issueNumber}`,
        tags: tags || [],
        reportData: {
            images: imageUrl ? [imageUrl] : [],
            issueUrl: `https://github.com/${GITHUB_REPO}/issues/${issueNumber}`,
        },
        isUserReport: true,
    };
}

async function loadExistingData(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return {};
    }
}

async function saveData(filePath, data) {
    // 按日期排序
    const sortedData = {};
    const sortedKeys = Object.keys(data).sort();
    for (const key of sortedKeys) {
        sortedData[key] = data[key];
    }
    await fs.writeFile(filePath, JSON.stringify(sortedData, null, 2), 'utf-8');
}

async function closeIssue(issueNumber) {
    if (!GITHUB_TOKEN) return;

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ state: 'closed' }),
    });
}

async function main() {
    console.log('🔍 正在從 GitHub Issues 拉取回報資料...');

    const issues = await fetchDonationReportIssues();
    console.log(`📋 找到 ${issues.length} 個待處理的回報`);

    if (issues.length === 0) {
        console.log('✅ 沒有需要處理的回報');
        return;
    }

    // 按月份分組
    const groupedByMonth = {};

    for (const issue of issues) {
        const parsed = parseIssueBody(issue.body);
        if (!parsed) {
            console.log(`⚠️ 無法解析 Issue #${issue.number}: ${issue.title}`);
            continue;
        }

        const event = createDonationEvent(parsed, issue.number);
        const month = parsed.activityDate.substring(0, 7).replace('-', ''); // YYYYMM

        if (!groupedByMonth[month]) {
            groupedByMonth[month] = [];
        }
        groupedByMonth[month].push({ event, issueNumber: issue.number });
    }

    // 寫入各月份檔案
    for (const [month, items] of Object.entries(groupedByMonth)) {
        const fileName = `bloodInfo-${month}.json`;
        const filePath = path.join(process.cwd(), 'data', fileName);

        console.log(`\n📁 處理 ${fileName}...`);

        const existingData = await loadExistingData(filePath);

        for (const { event, issueNumber } of items) {
            const date = event.activityDate;

            if (!existingData[date]) {
                existingData[date] = [];
            }

            // 檢查是否已存在相同地址的資料
            const exists = existingData[date].some(
                (e) => e.location === event.location
            );

            if (!exists) {
                existingData[date].push(event);
                console.log(`  ✅ 新增: ${date} - ${event.location}`);

                // 關閉已處理的 Issue
                await closeIssue(issueNumber);
                console.log(`  🔒 已關閉 Issue #${issueNumber}`);
            } else {
                console.log(`  ⏩ 跳過 (已存在): ${date} - ${event.location}`);
            }
        }

        await saveData(filePath, existingData);
        console.log(`  💾 已儲存 ${fileName}`);
    }

    console.log('\n🎉 匯入完成！');
}

main().catch(console.error);
