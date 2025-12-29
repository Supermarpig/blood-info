import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
// import { exec } from 'child_process';
// import util from 'util';
import https from 'https';
import { createWorker } from 'tesseract.js';

// const execPromise = util.promisify(exec);

// 新版網站的捐血中心 URL 配置
const bloodCenters = [
    { name: '台北', baseUrl: 'https://www.tp.blood.org.tw', xsmsid: '0P078610132470612427' },
    { name: '新竹', baseUrl: 'https://www.sc.blood.org.tw', xsmsid: '0P078610132470612427' },
    { name: '台中', baseUrl: 'https://www.tc.blood.org.tw', xsmsid: '0P078610132470612427' },
    { name: '高雄', baseUrl: 'https://www.ks.blood.org.tw', xsmsid: '0P078610132470612427' },
];

// 贈品關鍵字對應 tag
const GIFT_TAG_MAPPING = {
    '電影票': ['電影', '威秀', '國賓', '秀泰', 'in89', '美麗華', 'IMAX', '喜滿客', '京站', '影城'],
    '禮券': ['禮券', '禮卷', '商品券', '折價券', '抵用券', '消費券'],
    '超商': ['全家', '7-11', '711', '萊爾富', 'OK超商', '全聯', '家樂福', '美廉社'],
    '餐飲': ['咖啡', '星巴克', '路易莎', '麥當勞', '肯德基', '摩斯', '飲料', '便當', '餐券', '早餐'],
    '生活用品': ['毛巾', '購物袋', '環保袋', '餐具', '保溫杯', '雨傘', '衛生紙'],
    '食品': ['米', '蛋', '泡麵', '餅乾', '零食', '麵包', '蛋糕'],
};

// 初始化 OCR worker (延遲載入)
let ocrWorker = null;

async function getOcrWorker() {
    if (!ocrWorker) {
        console.log('初始化 OCR 引擎...');
        // 使用中文繁體識別
        ocrWorker = await createWorker('chi_tra');
        console.log('OCR 引擎初始化完成');
    }
    return ocrWorker;
}

// 從文字中識別贈品 tags
function extractTagsFromText(text) {
    const tags = new Set();
    const lowerText = text.toLowerCase();

    for (const [tag, keywords] of Object.entries(GIFT_TAG_MAPPING)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                tags.add(tag);
                break;
            }
        }
    }

    return Array.from(tags);
}

// 下載圖片並進行 OCR 識別
async function ocrImageUrl(imageUrl) {
    try {
        // 下載圖片
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
        });

        const worker = await getOcrWorker();
        const { data: { text } } = await worker.recognize(Buffer.from(response.data));

        return text;
    } catch (error) {
        console.error(`OCR 識別失敗 (${imageUrl}): ${error.message}`);
        return '';
    }
}

// 對 PTT 事件的文字和圖片進行分析，提取 tags
async function extractTagsFromEvent(rawLine, images) {
    const allText = [rawLine]; // 先加入 rawLine 文字進行關鍵字匹配

    // 只處理前 3 張圖片以節省時間
    const imagesToProcess = (images || []).slice(0, 3);

    for (const imageUrl of imagesToProcess) {
        const text = await ocrImageUrl(imageUrl);
        if (text) {
            allText.push(text);
        }
    }

    const combinedText = allText.join(' ');
    return extractTagsFromText(combinedText);
}

const PTT_URL = 'https://www.ptt.cc/bbs/Lifeismoney/M.1735838860.A.6F3.html';

// 生成指定月份的文件名
function getMonthFileName(year, month) {
    const mStr = String(month).padStart(2, '0');
    return `bloodInfo-${year}${mStr}.json`;
}

// 取得指定月份的日期範圍
function getMonthDateRange(year, month) {
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

async function fetchPttData() {
    console.log('Fetching PTT data...');
    const maxRetries = 3;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.get(PTT_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Connection': 'keep-alive',
                    'Cookie': 'over18=1'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const mainContent = $('#main-content');

            if (mainContent.length === 0) {
                throw new Error('PTT main content not found');
            }

            // Remove metadata lines
            mainContent.find('.article-metaline, .article-metaline-right').remove();

            let pttEvents = [];
            let lastTextLine = null;

            // Use contents() to traverse nodes including text and elements
            const contents = mainContent.contents();

            contents.each((i, node) => {
                if (node.type === 'text') {
                    const text = $(node).text();
                    if (text) {
                        const lines = text.split('\n');
                        lines.forEach(line => {
                            const trimmed = line.trim();
                            if (trimmed) {
                                // Date pattern: e.g., 12/27(六), 1/3(六)
                                const dateMatch = trimmed.match(/^(\d{1,2}\/\d{1,2})/);
                                if (dateMatch) {
                                    let loc = trimmed.substring(dateMatch[0].length).trim();
                                    // Clean up extended date info (ranges, parens)
                                    // e.g. "-12/28", "(六)", "(六-日)"
                                    loc = loc.replace(/^(\s*-\s*\d{1,2}\/\d{1,2})/, '')
                                        .replace(/^\s*\(.*?\)/, '')
                                        .replace(/^\s*[-~]\s*/, '') // Remove leading separators
                                        .trim();

                                    pttEvents.push({
                                        matchDate: dateMatch[1],
                                        rawLine: trimmed,
                                        locationStr: loc,
                                        images: [],
                                    });
                                    lastTextLine = pttEvents[pttEvents.length - 1];
                                }
                            }
                        });
                    }
                } else if (node.type === 'tag' && node.name === 'a') {
                    const href = $(node).attr('href');
                    // Associate image link with the last found event line
                    if (href && lastTextLine && (href.match(/\.(jpg|jpeg|png)$/i) || href.includes('imgur.com'))) {
                        lastTextLine.images.push(href);
                    }
                } else if (node.type === 'tag' && node.name === 'span') {
                    // Handle colored text (often used for emphasis in PTT)
                    const text = $(node).text().trim();
                    const dateMatch = text.match(/^(\d{1,2}\/\d{1,2})/);
                    if (dateMatch) {
                        let loc = text.substring(dateMatch[0].length).trim();
                        // Clean up extended date info
                        loc = loc.replace(/^(\s*-\s*\d{1,2}\/\d{1,2})/, '')
                            .replace(/^\s*\(.*?\)/, '')
                            .replace(/^\s*[-~]\s*/, '')
                            .trim();

                        pttEvents.push({
                            matchDate: dateMatch[1],
                            rawLine: text,
                            locationStr: loc,
                            images: [],
                        });
                        lastTextLine = pttEvents[pttEvents.length - 1];
                    }

                    // Allow finding links inside span
                    $(node).find('a').each((i, a) => {
                        const href = $(a).attr('href');
                        if (href && lastTextLine && (href.match(/\.(jpg|jpeg|png)$/i) || href.includes('imgur.com'))) {
                            lastTextLine.images.push(href);
                        }
                    });
                }
            });

            // Normalize Data
            const currentYear = new Date().getFullYear(); // e.g. 2024
            const currentMonth = new Date().getMonth() + 1; // e.g. 12

            pttEvents = pttEvents.map(e => {
                const [m, d] = e.matchDate.split('/').map(Number);

                let year = currentYear;
                // Simple logic: if current month is Dec (12), and event is Jan (1) or Feb (2), it's next year
                if (currentMonth >= 11 && m <= 2) {
                    year = currentYear + 1;
                } else if (currentMonth <= 2 && m >= 11) {
                    year = currentYear - 1; // Unlikely but possible for archives
                }

                e.date = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                return e;
            });

            console.log(`Fetched ${pttEvents.length} events from PTT`);

            // OCR 識別圖片，提取贈品 tags
            const eventsWithImages = pttEvents.filter(e => e.images && e.images.length > 0);
            console.log(`開始 OCR 識別 ${eventsWithImages.length} 個有圖片的活動...`);

            for (let i = 0; i < eventsWithImages.length; i++) {
                const event = eventsWithImages[i];
                console.log(`  [${i + 1}/${eventsWithImages.length}] 處理: ${event.locationStr || event.rawLine.substring(0, 30)}`);
                event.tags = await extractTagsFromEvent(event.rawLine, event.images);
                if (event.tags.length > 0) {
                    console.log(`    → 識別到 tags: ${event.tags.join(', ')}`);
                }
            }

            // 終止 OCR worker 釋放資源
            if (ocrWorker) {
                await ocrWorker.terminate();
                ocrWorker = null;
            }

            console.log('OCR 識別完成');
            return pttEvents;

        } catch (e) {
            console.error(`Attempt ${attempt} failed: ${e.message}`);
            if (attempt === maxRetries) {
                console.error('All retry attempts failed. Returning NULL to signal failure.');
                return null;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

function mergeData(officialData, pttData, existingLocalData = null, targetYear = null, targetMonth = null) {
    // If we have valid new PTT data, proceed with normal matching
    if (pttData && pttData.length > 0) {
        let matchCount = 0;
        let preservedCount = 0;
        const noiseWords = [
            '台北', '臺北', '新北', '基隆', '桃園', '新竹', '苗栗', '台中', '臺中', '彰化', '雲林', '南投', '嘉義', '台南', '臺南', '高雄', '屏東', '宜蘭', '花蓮', '台東', '臺東',
            '捐血室', '捐血站', '捐血車', '巡迴車', '捷運站', '公園', '出口', '配合'
        ];

        for (const date in officialData) {
            const events = officialData[date];
            const pttEventsForDate = pttData.filter(p => p.date === date);
            const existingEventsForDate = existingLocalData?.[date] || [];

            events.forEach(event => {
                let eventLoc = event.location || event.center || '';
                // Normalize official location
                eventLoc = eventLoc.replace(/台/g, '臺').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');

                let matchedPtt = null;

                // 只有當該日期有 PTT 資料時才嘗試匹配
                if (pttEventsForDate.length > 0) {
                    matchedPtt = pttEventsForDate.find(p => {
                        // Split PTT location info by common delimiters
                        let pLocRaw = p.locationStr.replace(/台/g, '臺');
                        const pLocs = pLocRaw.split(/[\/、,，\s]+/).map(s => s.trim()).filter(s => s);

                        return pLocs.some(subLoc => {
                            let pLocClean = subLoc.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');

                            // Iteratively strip noise from start/end
                            let prev;
                            do {
                                prev = pLocClean;
                                noiseWords.forEach(w => {
                                    if (pLocClean.startsWith(w)) pLocClean = pLocClean.substring(w.length);
                                    if (pLocClean.endsWith(w)) pLocClean = pLocClean.substring(0, pLocClean.length - w.length);
                                });
                            } while (prev !== pLocClean && pLocClean.length > 2);

                            // Filter out empty or too short tokens (unless specific known short ones? "二信" is 2 chars)
                            // "二信" -> Clean is "二信". Length 2.
                            if (!pLocClean || pLocClean.length < 2 || /^\d+$/.test(pLocClean)) return false;

                            // Check inclusion
                            return eventLoc.includes(pLocClean);
                        });
                    });
                }

                if (matchedPtt) {
                    // 新的 PTT 資料匹配成功
                    event.pttData = {
                        rawLine: matchedPtt.rawLine,
                        images: matchedPtt.images,
                        url: PTT_URL,
                        tags: matchedPtt.tags || []
                    };
                    event.tags = matchedPtt.tags || [];
                    matchCount++;
                } else if (existingEventsForDate.length > 0) {
                    // 匹配失敗，嘗試從舊資料保留 pttData
                    const storedEvent = existingEventsForDate.find(e =>
                        e.id === event.id ||
                        (e.organization === event.organization && e.location === event.location)
                    );

                    if (storedEvent?.pttData) {
                        event.pttData = storedEvent.pttData;
                        preservedCount++;
                    }
                }
            });
        }
        // 新增：將未匹配的 PTT 資料作為獨立記錄加入（只加入符合目標月份的）
        let unmatchedCount = 0;
        pttData.forEach(pttEvent => {
            // 檢查這個 PTT 事件是否有圖片且未被任何官方活動匹配
            if (pttEvent.images && pttEvent.images.length > 0) {
                // 過濾：只處理符合目標月份的 PTT 事件
                if (targetYear && targetMonth) {
                    const [eventYear, eventMonth] = pttEvent.date.split('-').map(Number);
                    if (eventYear !== targetYear || eventMonth !== targetMonth) {
                        return; // 跳過不屬於當前月份的事件
                    }
                }

                const dateEvents = officialData[pttEvent.date] || [];
                const isMatched = dateEvents.some(event => event.pttData?.rawLine === pttEvent.rawLine);

                if (!isMatched) {
                    // 建立一筆獨立的 PTT 來源記錄
                    const pttOnlyEvent = {
                        id: Buffer.from(`ptt-${pttEvent.date}-${pttEvent.rawLine}`).toString('base64'),
                        time: '',
                        organization: pttEvent.locationStr || 'PTT 贈品資訊',
                        location: pttEvent.locationStr,
                        rawContent: pttEvent.rawLine,
                        activityDate: pttEvent.date,
                        center: 'PTT',
                        detailUrl: PTT_URL,
                        tags: pttEvent.tags || [],
                        pttData: {
                            rawLine: pttEvent.rawLine,
                            images: pttEvent.images,
                            url: PTT_URL,
                            tags: pttEvent.tags || []
                        },
                        isPttOnly: true // 標記這是 PTT 獨有的資料
                    };

                    if (!officialData[pttEvent.date]) {
                        officialData[pttEvent.date] = [];
                    }
                    officialData[pttEvent.date].push(pttOnlyEvent);
                    unmatchedCount++;
                }
            }
        });

        console.log(`Merged PTT data: ${matchCount} new matches, ${preservedCount} preserved, ${unmatchedCount} PTT-only events added.`);
    } else if (existingLocalData) {
        // FALLBACK: If PTT fetch failed (pttData is null/empty), try to restore from existing file
        console.log('⚠️ PTT fetch failed or empty. Attempting to preserve PTT data from existing local file...');
        let restoredCount = 0;

        for (const date in officialData) {
            if (existingLocalData[date]) {
                const existingEvents = existingLocalData[date];
                officialData[date].forEach(newEvent => {
                    // Try to find matching event in existing data to restore pttData
                    // We match by ID first, or fallback to location+organization if ID generation changed (shouldn't change though)
                    const storedEvent = existingEvents.find(e =>
                        e.id === newEvent.id ||
                        (e.organization === newEvent.organization && e.location === newEvent.location)
                    );

                    if (storedEvent && storedEvent.pttData) {
                        newEvent.pttData = storedEvent.pttData;
                        restoredCount++;
                    }
                });
            }
        }
        console.log(`✅ Preserved PTT data for ${restoredCount} events from local backup.`);
    }

    return officialData;
}

// 從新版網站爬取單一中心的資料
async function crawlCenter(center, startDate, endDate, httpsAgent, headers) {
    const donationsByDate = {};
    let page = 1;
    let hasMorePages = true;

    console.log(`  爬取 ${center.name} 捐血中心 (${startDate} ~ ${endDate})...`);

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

                        // 提取詳情頁連結
                        const linkElement = $(cells[2]).find('a');
                        let detailUrl = null;
                        if (linkElement.length > 0) {
                            const href = linkElement.attr('href');
                            if (href) {
                                // 處理相對路徑
                                detailUrl = href.startsWith('http') ? href : `${center.baseUrl}${href}`;
                            }
                        }

                        const eventInfo = {
                            id: Buffer.from(`${center.name}-${dateText}-${time}-${organization}`).toString('base64'),
                            time: time,
                            organization: organization,
                            location: location,
                            rawContent: `${time} ${organization} ${location}`,
                            activityDate: formattedDate,
                            center: center.name,
                            detailUrl: detailUrl, // 新增詳情頁連結
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
async function crawlData(startDate, endDate) {
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
            const centerData = await crawlCenter(center, startDate, endDate, httpsAgent, headers);

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

async function processMonth(year, month, pttData) {
    console.log(`\n=== 處理 ${year} 年 ${month} 月資料 ===`);
    const { startDate, endDate } = getMonthDateRange(year, month);
    console.log(`日期範圍: ${startDate} ~ ${endDate}`);

    const fileName = getMonthFileName(year, month);
    const filePath = path.join(process.cwd(), 'data', fileName);

    // 1. Try to read existing data for backup
    let existingData = null;
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        existingData = JSON.parse(fileContent);
        console.log(`Found existing local file: ${fileName}`);
    } catch (e) {
        console.log(`No existing local file found for ${fileName}, creating new. ${e}`);
    }

    const officialData = await crawlData(startDate, endDate);

    // 2. Pass existingData to mergeData for fallback
    const mergedData = mergeData(officialData, pttData, existingData, year, month);

    const totalEvents = Object.values(mergedData).reduce((sum, events) => sum + events.length, 0);
    console.log(`包含 ${Object.keys(mergedData).length} 個日期，共 ${totalEvents} 筆活動`);

    console.log(`儲存至: ${fileName}`);
    await saveLocalData(mergedData, filePath);
    return totalEvents;
}

// 主邏輯：更新數據
async function updateData() {
    try {
        console.log('開始更新資料...');

        // 1. 先取得 PTT 資料 (一次性)
        const pttData = await fetchPttData();

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12

        // 2. 處理當前月份
        await processMonth(currentYear, currentMonth, pttData);

        // 3. 處理下一個月份
        let nextYear = currentYear;
        let nextMonth = currentMonth + 1;
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }
        await processMonth(nextYear, nextMonth, pttData);

        // Git operations are now handled by GitHub Actions
        console.log('資料更新完成！');
    } catch (error) {
        console.error('更新失敗:', error);
    }
}

updateData();
