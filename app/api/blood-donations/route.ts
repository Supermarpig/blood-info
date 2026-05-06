import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";

interface DonationEvent {
  id?: string;
  time: string;
  organization: string;
  location: string;
  rawContent: string;
  customNote?: string;
  activityDate: string;
  detailUrl?: string;
  pttData?: {
    rawLine: string;
    images: string[];
    url: string;
  };
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
    timestamp: 0,
  };

  private static TTL = 86400000; // 24小時，單位為毫秒

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
  "https://www.tp.blood.org.tw/Internet/taipei/LocationMonth.aspx?site_id=2",
  "https://www.sc.blood.org.tw/Internet/hsinchu/LocationMonth.aspx?site_id=3",
  "https://www.tc.blood.org.tw/Internet/Taichung/LocationMonth.aspx?site_id=4",
  "https://www.ks.blood.org.tw/Internet/Kaohsiung/LocationMonth.aspx?site_id=6",
];

// 生成當前月份的 JSON 文件名稱
function getCurrentMonthFileName(): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // 月份補零
  // console.log(`bloodInfo-${year}${month}.json😍😍😍`)
  return `bloodInfo-${year}${month}.json`;
}

// 定義函數將中文日期轉換為標準日期格式
function parseChineseDate(chineseDate: string): string {
  const currentYear = new Date().getFullYear();

  // 匹配中文日期格式，如 "10月1日"
  const dateMatch = chineseDate.match(/(\d+)月(\d+)日/);
  if (!dateMatch) return chineseDate; // 如果無法匹配，返回原日期

  const month = parseInt(dateMatch[1], 10);
  const day = parseInt(dateMatch[2], 10);

  // 檢查月份，確保正確處理跨年情況
  const parsedYear =
    month < new Date().getMonth() + 1 ? currentYear + 1 : currentYear;

  // 格式化為 YYYY-MM-DD
  const formattedDate = `${parsedYear}-${String(month).padStart(
    2,
    "0"
  )}-${String(day).padStart(2, "0")}`;
  return formattedDate;
}

// 保存資料到本地 JSON 文件，並將日期轉換為標準格式
async function saveLocalDataWithFormattedDates(
  data: Record<string, DonationEvent[]>,
  filePath: string
): Promise<void> {
  const formattedData = Object.keys(data).reduce((acc, date) => {
    const formattedDate = parseChineseDate(date); // 轉換日期格式
    acc[formattedDate] = data[date]; // 保存轉換後的日期
    return acc;
  }, {} as Record<string, DonationEvent[]>);

  try {
    await fs.writeFile(
      filePath,
      JSON.stringify(formattedData, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Error saving local data:", error);
  }
}

// 從本地文件中讀取資料
async function loadLocalData(
  filePath: string
): Promise<Record<string, DonationEvent[]> | null> {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.log("Error reading local data:", error);
    return null;
  }
}

// GET - 取得捐血活動列表
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    // 檢查記憶體快取
    const cachedData = MemoryCache.get();
    if (cachedData) {
      return NextResponse.json(
        { success: true, data: cachedData },
        {
          headers: {
            "Cache-Control": "no-store", // 禁用快取
          },
        }
      );
    }

    // 載入當月和下個月的資料
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // 計算下個月
    let nextYear = currentYear;
    let nextMonth = currentMonth + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    const currentMonthFile = `bloodInfo-${currentYear}${String(
      currentMonth
    ).padStart(2, "0")}.json`;
    const nextMonthFile = `bloodInfo-${nextYear}${String(nextMonth).padStart(
      2,
      "0"
    )}.json`;

    const currentMonthPath = path.join(process.cwd(), "data", currentMonthFile);
    const nextMonthPath = path.join(process.cwd(), "data", nextMonthFile);

    let allData: Record<string, DonationEvent[]> = {};

    // 載入當月資料
    const currentData = await loadLocalData(currentMonthPath);
    if (currentData) {
      allData = { ...currentData };
    }

    // 載入下個月資料
    const nextData = await loadLocalData(nextMonthPath);
    if (nextData) {
      // 合併資料
      for (const date in nextData) {
        if (allData[date]) {
          allData[date] = [...allData[date], ...nextData[date]];
        } else {
          allData[date] = nextData[date];
        }
      }
    }

    if (Object.keys(allData).length > 0) {
      // 快取並返回資料
      MemoryCache.set(allData);
      return NextResponse.json({
        success: true,
        data: allData,
      });
    }

    // 若無文件或本地檔案不可讀，開始爬取資料
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    };

    const donationsByDate: Record<string, DonationEvent[]> = {};

    for (const url of urls) {
      const response = await axios.get(url, { headers });
      const $ = cheerio.load(response.data);

      // 解析網站並組織資料
      $(
        "table#ctl00_ContentPlaceHolder1_cale_bloodSpotCalendar tbody tr td"
      ).each((_, element) => {
        const date = $(element).find("a").attr("title");
        const tooltipElement = $(element).find("font.tooltip");
        const tooltipText = tooltipElement.attr("title");

        if (date && tooltipText) {
          const eventsArray = tooltipText
            .split(/<font color=red>◎<\/font>/)
            .filter((text) => text.trim() !== "");
          eventsArray.forEach((eventText) => {
            const cleanText = eventText.replace(/<\/?.*?>/g, "").trim();
            const timeRegex = /作業時間：([\d:]+~[\d:]+)/;
            const organizationRegex = /主辦單位：([^。]+)/;
            const locationRegex = /地址：([^<]+)/;
            const timeMatch = cleanText.match(timeRegex);
            const organizationMatch = cleanText.match(organizationRegex);
            const locationMatch = cleanText.match(locationRegex);

            if (timeMatch && organizationMatch && locationMatch) {
              const eventInfo: DonationEvent = {
                id: Buffer.from(cleanText).toString("base64"),
                time: timeMatch[1].trim(),
                organization: organizationMatch[1].trim(),
                location: locationMatch[1].trim(),
                rawContent: cleanText,
                activityDate: parseChineseDate(date),
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

    // 保存爬取到的資料
    const fileName = getCurrentMonthFileName();
    const filePathToSave = path.join(process.cwd(), "data", fileName);
    await saveLocalDataWithFormattedDates(donationsByDate, filePathToSave);

    // 將資料存入快取
    MemoryCache.set(donationsByDate);

    return NextResponse.json({
      success: true,
      data: donationsByDate,
    });
  } catch (error) {
    console.error("Error fetching blood donation data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "無法取得捐血活動資料",
      },
      { status: 500 }
    );
  }
}
