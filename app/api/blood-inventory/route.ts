import { NextResponse } from "next/server";
// 直接 import（檔案很小、檔名固定），build 時打包進 bundle，Workers 上無需 fs。
import inventoryData from "@/data/bloodInventory.json";

interface BloodInventoryCenter {
  name: string;
  bloodTypes: Record<string, string>;
}

interface BloodInventory {
  updatedAt: string;
  centers: BloodInventoryCenter[];
}

interface ApiResponse {
  success: boolean;
  data?: BloodInventory;
  error?: string;
}

const inventory = inventoryData as BloodInventory;

// 庫存資料約一小時更新一次，讓 CDN 直接快取回應，避免每個請求都打進 function。
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
} as const;

export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json(
    { success: true, data: inventory },
    { headers: CACHE_HEADERS }
  );
}
