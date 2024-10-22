// app/api/blood-donations/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

// GET - 取得捐血活動列表
export async function GET(): Promise<NextResponse<ApiResponse>> {
    try {
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

            // 遍歷所有<td>標籤，並選擇其中包含的<a>和<font.tooltip>元素
            $('table#ctl00_ContentPlaceHolder1_cale_bloodSpotCalendar tbody tr td').each((_, element) => {
                const date = $(element).find('a').attr('title'); // 獲取日期，例如 "10月9日"
                const tooltipElement = $(element).find('font.tooltip');
                const tooltipText = tooltipElement.attr('title'); // 獲取活動詳細信息

                if (date && tooltipText) {
                    // 使用 '◎' 作為分隔符來分割每個活動
                    const eventsArray = tooltipText.split(/<font color=red>◎<\/font>/).filter(text => text.trim() !== '');

                    eventsArray.forEach(eventText => {
                        const cleanText = eventText.replace(/<\/?.*?>/g, '').trim();

                        // 使用正則表達式來匹配時間、組織和地點
                        const timeRegex = /作業時間：([\d:]+~[\d:]+)/;
                        const organizationRegex = /主辦單位：([^。]+)/;
                        const locationRegex = /地址：([^<]+)/;

                        const timeMatch = cleanText.match(timeRegex);
                        const organizationMatch = cleanText.match(organizationRegex);
                        const locationMatch = cleanText.match(locationRegex);

                        if (timeMatch && organizationMatch && locationMatch) {
                            const eventInfo: DonationEvent = {
                                id: Buffer.from(cleanText).toString('base64'), // 唯一標識符
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

        // 設置記憶體快取
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

// POST - 新增自定義註記
export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
    try {
        const { id, customNote } = await request.json();
        const cachedData = MemoryCache.get();

        if (!cachedData) {
            return NextResponse.json(
                { success: false, error: '找不到活動資料' },
                { status: 404 }
            );
        }

        const updatedData = { ...cachedData };
        for (const date in updatedData) {
            updatedData[date] = updatedData[date].map(event => {
                if (event.id === id) {
                    return { ...event, customNote };
                }
                return event;
            });
        }

        MemoryCache.set(updatedData);

        return NextResponse.json({ success: true, data: updatedData });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: `無法更新註記 -${error}` },
            { status: 500 }
        );
    }
}

// DELETE - 刪除記憶點
export async function DELETE(): Promise<NextResponse<ApiResponse>> {
    try {
        MemoryCache.clear();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: `無法刪除記憶點 -${error}` },
            { status: 500 }
        );
    }
}
