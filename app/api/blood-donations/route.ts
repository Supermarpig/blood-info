import { NextResponse } from "next/server";
import { getDonations } from "@/lib/getDonations";

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

// 使用記憶體快取（warm isolate 內共用，降低重複讀取）
class MemoryCache {
  private static cache: {
    data: Record<string, DonationEvent[]> | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0,
  };

  private static TTL = 3600000; // 1小時

  static get(): Record<string, DonationEvent[]> | null {
    if (!this.cache.data) return null;
    if (Date.now() - this.cache.timestamp > this.TTL) {
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

// GET - 取得捐血活動列表（當月 + 下個月，資料來源為 /data 靜態資源）
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const cachedData = MemoryCache.get();
    if (cachedData) {
      return NextResponse.json(
        { success: true, data: cachedData },
        { headers: CDN_CACHE_HEADERS }
      );
    }

    const data = await getDonations<DonationEvent>();
    MemoryCache.set(data);

    return NextResponse.json(
      { success: true, data },
      { headers: CDN_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Error fetching blood donation data:", error);
    return NextResponse.json(
      { success: false, error: "無法取得捐血活動資料" },
      { status: 500 }
    );
  }
}
