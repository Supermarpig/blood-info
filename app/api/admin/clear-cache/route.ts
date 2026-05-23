// /app/api/admin/clear-cache/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { clearAnnouncementCache } from "@/lib/announcementCache";
import { clearBloodDonationsCache } from "@/app/api/blood-donations/route";

export const dynamic = "force-dynamic";

// POST /api/admin/clear-cache — 手動清除伺服器記憶體快取
export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    clearAnnouncementCache();
    clearBloodDonationsCache();
    return NextResponse.json({
      success: true,
      message: "已清除公告與捐血活動快取",
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知錯誤",
      },
      { status: 500 }
    );
  }
}
