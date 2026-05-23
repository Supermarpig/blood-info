// /app/api/announcement/route.ts
// 公開（唯讀）取得站台公告，含記憶體快取以避免每次頁面載入都打 GitHub。
import { NextResponse } from "next/server";
import { getAnnouncement, EMPTY_ANNOUNCEMENT } from "@/services/announcementService";
import {
  getCachedAnnouncement,
  setCachedAnnouncement,
} from "@/lib/announcementCache";

export const dynamic = "force-dynamic";

export async function GET() {
  const cached = getCachedAnnouncement();
  if (cached) {
    return NextResponse.json({ success: true, data: cached });
  }

  try {
    const { data } = await getAnnouncement();
    setCachedAnnouncement(data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching public announcement:", error);
    // 失敗時回傳空公告（停用），不影響前台
    return NextResponse.json({ success: true, data: EMPTY_ANNOUNCEMENT });
  }
}
