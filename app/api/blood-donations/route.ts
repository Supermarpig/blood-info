import { NextResponse } from "next/server";

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

  // instance 閒置幾分鐘就 cold down，24h 撐不住；1h 足以應付手動補資料後的刷新需求
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

/** 供後台「清除快取」呼叫，清掉捐血活動的記憶體快取 */
export function clearBloodDonationsCache(): void {
  MemoryCache.clear();
}

// 捐血活動每日更新，讓 CDN 快取 1 小時，降低 Origin Transfer 用量
const CDN_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
} as const;

// 從靜態資源（/data/*.json，build 時由 next.config 從 /data 複製到 public/data）讀取單月資料。
// Workers 沒有檔案系統，改用 fetch 同源靜態檔，資料由 CDN 提供、不占 worker bundle。
async function loadMonthData(
  origin: string,
  file: string
): Promise<Record<string, DonationEvent[]> | null> {
  try {
    const res = await fetch(new URL(`/data/${file}`, origin));
    if (!res.ok) return null;
    return (await res.json()) as Record<string, DonationEvent[]>;
  } catch (error) {
    console.log("Error loading donation data:", error);
    return null;
  }
}

// GET - 取得捐血活動列表（當月 + 下個月）
export async function GET(request: Request): Promise<NextResponse<ApiResponse>> {
  try {
    // 檢查記憶體快取
    const cachedData = MemoryCache.get();
    if (cachedData) {
      return NextResponse.json(
        { success: true, data: cachedData },
        { headers: CDN_CACHE_HEADERS }
      );
    }

    const origin = new URL(request.url).origin;

    // 計算當月與下個月的檔名
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

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

    let allData: Record<string, DonationEvent[]> = {};

    // 載入當月資料
    const currentData = await loadMonthData(origin, currentMonthFile);
    if (currentData) {
      allData = { ...currentData };
    }

    // 載入下個月資料並合併
    const nextData = await loadMonthData(origin, nextMonthFile);
    if (nextData) {
      for (const date in nextData) {
        if (allData[date]) {
          allData[date] = [...allData[date], ...nextData[date]];
        } else {
          allData[date] = nextData[date];
        }
      }
    }

    MemoryCache.set(allData);

    return NextResponse.json(
      { success: true, data: allData },
      { headers: CDN_CACHE_HEADERS }
    );
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
