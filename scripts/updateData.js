import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// 定義爬取的網站 URL
const urls = [
    'https://www.tp.blood.org.tw/Internet/taipei/LocationMonth.aspx?site_id=2',
    'https://www.sc.blood.org.tw/Internet/hsinchu/LocationMonth.aspx?site_id=3',
    'https://www.tc.blood.org.tw/Internet/Taichung/LocationMonth.aspx?site_id=4',
    'https://www.ks.blood.org.tw/Internet/Kaohsiung/LocationMonth.aspx?site_id=6',
];

// 生成當月的文件名
function getCurrentMonthFileName() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    return `bloodInfo-${year}${month}.json`;
}

// 解析中文日期
function parseChineseDate(chineseDate) {
    const currentYear = new Date().getFullYear();
    const dateMatch = chineseDate.match(/(\d+)月(\d+)日/);
    if (!dateMatch) return chineseDate;
    const month = parseInt(dateMatch[1], 10);
    const day = parseInt(dateMatch[2], 10);
    const parsedYear = month < new Date().getMonth() + 1 ? currentYear + 1 : currentYear;
    return `${parsedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 保存資料到本地文件
async function saveLocalData(data, filePath) {
    const formattedData = Object.keys(data).reduce((acc, date) => {
        const formattedDate = parseChineseDate(date);
        acc[formattedDate] = data[date];
        return acc;
    }, {});
    await fs.writeFile(filePath, JSON.stringify(formattedData, null, 2), 'utf-8');
}

// 爬取數據
async function crawlData() {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    };
    const donationsByDate = {};

    for (const url of urls) {
        const response = await axios.get(url, { headers });
        const $ = cheerio.load(response.data);

        $('table#ctl00_ContentPlaceHolder1_cale_bloodSpotCalendar tbody tr td').each((_, element) => {
            const date = $(element).find('a').attr('title');
            const tooltipElement = $(element).find('font.tooltip');
            const tooltipText = tooltipElement.attr('title');

            if (date && tooltipText) {
                const eventsArray = tooltipText.split(/<font color=red>◎<\/font>/).filter(text => text.trim() !== '');
                eventsArray.forEach(eventText => {
                    const cleanText = eventText.replace(/<\/?.*?>/g, '').trim();
                    const timeRegex = /作業時間：([\d:]+~[\d:]+)/;
                    const organizationRegex = /主辦單位：([^。]+)/;
                    const locationRegex = /地址：([^<]+)/;
                    const timeMatch = cleanText.match(timeRegex);
                    const organizationMatch = cleanText.match(organizationRegex);
                    const locationMatch = cleanText.match(locationRegex);

                    if (timeMatch && organizationMatch && locationMatch) {
                        const eventInfo = {
                            id: Buffer.from(cleanText).toString('base64'),
                            time: timeMatch[1].trim(),
                            organization: organizationMatch[1].trim(),
                            location: locationMatch[1].trim(),
                            rawContent: cleanText,
                            activityDate: parseChineseDate(date),
                        };
                        if (!donationsByDate[date]) donationsByDate[date] = [];
                        donationsByDate[date].push(eventInfo);
                    }
                });
            }
        });
    }
    return donationsByDate;
}

// 主邏輯：更新數據
async function updateData() {
    try {
        console.log('Crawling data...');
        const data = await crawlData();

        console.log('Saving data locally...');
        const fileName = getCurrentMonthFileName();
        const filePath = path.join(process.cwd(), 'data', fileName);
        await saveLocalData(data, filePath);

        console.log('Committing changes to Git...');
        await execPromise('git add .');
        await execPromise(`git commit -m "Update data: ${new Date().toISOString()}"`);
        await execPromise('git push');

        console.log('Data updated and pushed to GitHub successfully.');
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

updateData();
