import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';

interface DonationEvent {
    id?: string;
    time: string;
    organization: string;
    location: string;
    rawContent: string;
    customNote?: string;
}

interface ApiResponse {
    success: boolean;
    data?: Record<string, DonationEvent[]>;
    error?: string;
}

// 使用記憶體快取
class MemoryCache {
    private static cache: {
        data: Record<string, DonationEvent[]> | null;
        timestamp: number;
    } = {
        data: null,
        timestamp: 0
    };

    private static TTL = 3600000; // 1小時，單位為毫秒

    static get(): Record<string, DonationEvent[]> | null {
        if (!this.cache.data) return null;

        const now = Date.now();
        if (now - this.cache.timestamp > this.TTL) {
            this.cache.data = null;
            return null;
        }

        return this.cache.data;
    }

    static set(data: Record<string, DonationEvent[]>): void {
        this.cache.data = data;
        this.cache.timestamp = Date.now();
    }

    static clear(): void {
        this.cache.data = null;
        this.cache.timestamp = 0;
    }
}

// 定義要爬取的網址列表
const urls = [
    'https://www.tp.blood.org.tw/Internet/taipei/LocationMonth.aspx?site_id=2',
    'https://www.sc.blood.org.tw/Internet/hsinchu/LocationMonth.aspx?site_id=3',
    'https://www.tc.blood.org.tw/Internet/Taichung/LocationMonth.aspx?site_id=4',
    'https://www.ks.blood.org.tw/Internet/Kaohsiung/LocationMonth.aspx?site_id=6',
];

// 保存資料到本地 JSON 文件
async function saveLocalData(data: Record<string, DonationEvent[]>, filePath: string): Promise<void> {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving local data:', error);
    }
}

// 從本地文件中讀取資料
async function loadLocalData(filePath: string): Promise<Record<string, DonationEvent[]> | null> {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.log('Error reading local data:', error);
        return null;
    }
}

// 生成動態檔案名稱
function generateFileName(donationsByDate: Record<string, DonationEvent[]>): string {
    const dates = Object.keys(donationsByDate);
    let currentYear = new Date().getFullYear();
    let latestMonth = 1; // 默認為1月

    dates.forEach(date => {
        const monthMatch = date.match(/(\d+)月/);
        if (monthMatch) {
            const month = parseInt(monthMatch[1], 10);
            if (month > latestMonth) {
                latestMonth = month;
            }
        }
    });

    if (latestMonth < new Date().getMonth() + 1) {
        currentYear -= 1; 
    }

    const formattedMonth = latestMonth.toString().padStart(2, '0');
    return `bloodInfo-${currentYear}${formattedMonth}.json`;
}

// GET - 取得捐血活動列表
export async function GET(): Promise<NextResponse<ApiResponse>> {
    try {
        const filePath = path.join(process.cwd(), 'data', 'bloodData.json');

        // 檢查本地 JSON 檔案
        const localData = await loadLocalData(filePath);
        if (localData) {
            return NextResponse.json({
                success: true,
                data: localData
            });
        }

        // 檢查記憶體快取
        const cachedData = MemoryCache.get();
        if (cachedData) {
            return NextResponse.json({
                success: true,
                data: cachedData
            });
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        };

        const donationsByDate: Record<string, DonationEvent[]> = {};

        // 遍歷所有網址，並對每個網址進行爬取
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
                            const eventInfo: DonationEvent = {
                                id: Buffer.from(cleanText).toString('base64'), 
                                time: timeMatch[1].trim(),
                                organization: organizationMatch[1].trim(),
                                location: locationMatch[1].trim(),
                                rawContent: cleanText,
                            };

                            if (!donationsByDate[date]) {
                                donationsByDate[date] = [];
                            }
                            donationsByDate[date].push(eventInfo);
                        }
                    });
                }
            });
        }

        const fileName = generateFileName(donationsByDate);
        const filePathToSave = path.join(process.cwd(), 'data', fileName);

        await saveLocalData(donationsByDate, filePathToSave);

        MemoryCache.set(donationsByDate);

        return NextResponse.json({
            success: true,
            data: donationsByDate
        });

    } catch (error) {
        console.error('Error fetching blood donation data:', error);
        return NextResponse.json(
            {
                success: false,
                error: '無法取得捐血活動資料'
            },
            { status: 500 }
        );
    }
}
