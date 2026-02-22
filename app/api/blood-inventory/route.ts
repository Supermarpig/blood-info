import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

class InventoryCache {
  private static data: BloodInventory | null = null;
  private static timestamp = 0;
  private static TTL = 3600000; // 1 小時

  static get(): BloodInventory | null {
    if (!this.data) return null;
    if (Date.now() - this.timestamp > this.TTL) {
      this.data = null;
      return null;
    }
    return this.data;
  }

  static set(data: BloodInventory): void {
    this.data = data;
    this.timestamp = Date.now();
  }
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const cached = InventoryCache.get();
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const filePath = path.join(process.cwd(), "data", "bloodInventory.json");
    const content = await fs.readFile(filePath, "utf-8");
    const inventory: BloodInventory = JSON.parse(content);

    InventoryCache.set(inventory);

    return NextResponse.json({ success: true, data: inventory });
  } catch (error) {
    console.error("Error reading blood inventory:", error);
    return NextResponse.json(
      { success: false, error: "無法取得血液庫存資料" },
      { status: 500 }
    );
  }
}
