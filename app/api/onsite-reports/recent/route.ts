// /app/api/onsite-reports/recent/route.ts
//
// 跨活動的「最新現場真相」聚合 feed（給首頁 / gift / city）。
// 重活（Mongo 查詢 + 從 eventId 反查活動名稱）放這裡做，前端只負責顯示。
// 60 秒記憶體快取：把多次頁面瀏覽收斂成每分鐘一次 DB 查詢。
import { NextResponse } from "next/server";
import { listRecentApproved } from "@/services/onsiteReportService";
import { loadMonth } from "@/lib/getDonations";
import { eventShortId } from "@/lib/eventId";

export const dynamic = "force-dynamic";

interface FeedEvent {
  id?: string;
  organization?: string;
  location?: string;
  center?: string;
}

export interface RecentReport {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  center: string;
  giftMatch: string;
  actualGift: string;
  crowd: string;
  status: string;
  note: string;
  nickname: string;
  photoUrl: string;
  createdAt: string;
}

const CACHE_MS = 60 * 1000;
let cache: { at: number; key: number; data: RecentReport[] } | null = null;

/** 從 eventId（YYYY-MM-DD-shortId）反查活動 org/location，monthMap 在同一次請求內快取月份檔 */
async function resolveEvent(
  eventId: string,
  monthMap: Map<string, Record<string, FeedEvent[]> | null>
): Promise<FeedEvent | null> {
  const m = eventId.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if (!m) return null;
  const [, y, mo, , shortId] = m;
  const date = `${y}-${mo}-${m[3]}`;
  const file = `bloodInfo-${y}${mo}.json`;
  if (!monthMap.has(file)) {
    monthMap.set(file, await loadMonth<FeedEvent>(file));
  }
  const data = monthMap.get(file);
  const dayEvents = data?.[date] ?? [];
  return dayEvents.find((e) => e.id && eventShortId(e.id) === shortId) ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 6, 1), 12);

  if (cache && Date.now() - cache.at < CACHE_MS && cache.key === limit) {
    return NextResponse.json({ reports: cache.data });
  }

  try {
    const docs = await listRecentApproved(limit);
    const monthMap = new Map<string, Record<string, FeedEvent[]> | null>();
    const reports: RecentReport[] = [];
    for (const d of docs) {
      const ev = await resolveEvent(d.eventId, monthMap);
      reports.push({
        eventId: d.eventId,
        eventTitle: ev?.organization || "捐血活動",
        eventLocation: ev?.location || "",
        center: ev?.center || "",
        giftMatch: d.giftMatch,
        actualGift: d.actualGift,
        crowd: d.crowd,
        status: d.status,
        note: d.note,
        nickname: d.nickname,
        photoUrl: d.photoUrl,
        createdAt: new Date(d.createdAt).toISOString(),
      });
    }
    cache = { at: Date.now(), key: limit, data: reports };
    return NextResponse.json({ reports });
  } catch (err) {
    console.error("onsite-reports recent error:", err);
    return NextResponse.json({ reports: [] });
  }
}
