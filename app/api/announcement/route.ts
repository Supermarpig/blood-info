// /app/api/announcement/route.ts
// 公開（唯讀）取得站台公告，含記憶體快取以避免每次頁面載入都打 GitHub。
import { NextResponse } from "next/server";
import {
  getAnnouncement,
  EMPTY_ANNOUNCEMENT,
  Announcement,
} from "@/services/announcementService";

export const dynamic = "force-dynamic";

let cache: { data: Announcement; ts: number } | null = null;
const TTL = 5 * 60 * 1000; // 5 分鐘

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ success: true, data: cache.data });
  }

  try {
    const { data } = await getAnnouncement();
    cache = { data, ts: Date.now() };
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching public announcement:", error);
    // 失敗時回傳空公告（停用），不影響前台
    return NextResponse.json({ success: true, data: EMPTY_ANNOUNCEMENT });
  }
}
