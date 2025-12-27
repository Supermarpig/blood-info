import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import util from 'util';
import https from 'https';

const execPromise = util.promisify(exec);

// 新版網站的捐血中心 URL 配置
const bloodCenters = [
    { name: '台北', baseUrl: 'https://www.tp.blood.org.tw', xsmsid: '0P078610132470612427' },
    { name: '新竹', baseUrl: 'https://www.sc.blood.org.tw', xsmsid: '0P078610132470612427' },
    { name: '台中', baseUrl: 'https://www.tc.blood.org.tw', xsmsid: '0P078610132470612427' },
    { name: '高雄', baseUrl: 'https://www.ks.blood.org.tw', xsmsid: '0P078610132470612427' },
];

// 生成當月的文件名
function getCurrentMonthFileName() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    return `bloodInfo-${year}${month}.json`;
}

// 取得當月的日期範圍
function getCurrentMonthDateRange() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const startDate = `${year}/${String(month).padStart(2, '0')}/01`;

    // 計算當月最後一天
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}/${String(month).padStart(2, '0')}/${String(lastDay).padStart(2, '0')}`;

    return { startDate, endDate };
}

// 保存資料到本地文件（日期格式已經是標準格式）
async function saveLocalData(data, filePath) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 從新版網站爬取單一中心的資料
async function crawlCenter(center, httpsAgent, headers) {
    const { startDate, endDate } = getCurrentMonthDateRange();
    const donationsByDate = {};
    let page = 1;
    let hasMorePages = true;

    console.log(`  爬取 ${center.name} 捐血中心...`);

    while (hasMorePages) {
        const url = `${center.baseUrl}/xcevent?xsmsid=${center.xsmsid}&donationdatebegin=${encodeURIComponent(startDate)}&donationdateend=${encodeURIComponent(endDate)}&page=${page}`;

        try {
            const response = await axios.get(url, {
                headers,
                httpsAgent,
                timeout: 30000,
            });

            const $ = cheerio.load(response.data);

            // 找到資料表格 - 新版網站使用 table 顯示資料
            const rows = $('table tbody tr');

            if (rows.length === 0) {
                hasMorePages = false;
                break;
            }

            let foundData = false;
            rows.each((_, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 4) {
                    // 新版網站欄位: 作業時間 | 日期 | 捐血點/主辦單位 | 地點
                    const time = $(cells[0]).text().trim();
                    const dateText = $(cells[1]).text().trim(); // 格式: 2025/12/27
                    const organization = $(cells[2]).text().trim();
                    const location = $(cells[3]).text().trim();

                    if (dateText && time && organization) {
                        foundData = true;
                        // 轉換日期格式 2025/12/27 -> 2025-12-27
                        const formattedDate = dateText.replace(/\//g, '-');

                        const eventInfo = {
                            id: Buffer.from(`${center.name}-${dateText}-${time}-${organization}`).toString('base64'),
                            time: time,
                            organization: organization,
                            location: location,
                            rawContent: `${time} ${organization} ${location}`,
                            activityDate: formattedDate,
                            center: center.name,
                        };

                        if (!donationsByDate[formattedDate]) {
                            donationsByDate[formattedDate] = [];
                        }
                        donationsByDate[formattedDate].push(eventInfo);
                    }
                }
            });

            // 檢查是否有下一頁
            const nextPageLink = $('a').filter((_, el) => $(el).text().includes('下一頁'));
            if (nextPageLink.length > 0 && foundData) {
                page++;
            } else {
                hasMorePages = false;
            }

        } catch (error) {
            console.error(`  ${center.name} 第 ${page} 頁爬取失敗:`, error.message);
            hasMorePages = false;
        }
    }

    console.log(`  ${center.name} 完成，共 ${Object.keys(donationsByDate).length} 個日期`);
    return donationsByDate;
}

// 爬取所有中心的數據
async function crawlData() {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
    });

    const allDonations = {};

    for (const center of bloodCenters) {
        try {
            const centerData = await crawlCenter(center, httpsAgent, headers);

            // 合併資料
            for (const date in centerData) {
                if (!allDonations[date]) {
                    allDonations[date] = [];
                }
                allDonations[date].push(...centerData[date]);
            }
        } catch (error) {
            console.error(`${center.name} 爬取失敗:`, error.message);
        }
    }

    return allDonations;
}

// 主邏輯：更新數據
async function updateData() {
    try {
        console.log('開始爬取資料...');
        const data = await crawlData();

        const totalEvents = Object.values(data).reduce((sum, events) => sum + events.length, 0);
        console.log(`共爬取 ${Object.keys(data).length} 個日期，${totalEvents} 筆活動`);

        console.log('儲存資料...');
        const fileName = getCurrentMonthFileName();
        const filePath = path.join(process.cwd(), 'data', fileName);
        await saveLocalData(data, filePath);

        console.log('提交 Git...');
        await execPromise('git add .');
        await execPromise(`git commit -m "Update data: ${new Date().toISOString()}"`);
        await execPromise('git push');

        console.log('資料更新完成！');
    } catch (error) {
        console.error('更新失敗:', error);
    }
}

updateData();
