// /app/api/onsite-reports/route.ts
//
// 「現場真相回報」的公開 API（儲存層：MongoDB）。
//   GET  ?eventId=YYYY-MM-DD-xxxxxx&token=... → 該活動的可見回報
//        （所有 approved + 發文者本人尚在 pending 的）
//   POST → 建立一筆現場回報，套用內容門檻 + 混合審核 + 每 IP 限流
import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  createOnsiteReport,
  getVisibleReports,
  countRecentByIp,
} from "@/services/onsiteReportService";
import {
  hasMeaningfulContent,
  needsReview,
  GIFT_MATCH_KEYS,
  CROWD_KEYS,
  STATUS_KEYS,
  type OnsiteReport,
  type PublicOnsiteReport,
  type GiftMatch,
  type Crowd,
  type EventStatus,
} from "@/lib/onsiteReport";

export const dynamic = "force-dynamic";

// 限流：同一 IP 在 10 分鐘內最多 6 筆
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 6;

function clamp(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function oneOf<T extends readonly string[]>(v: unknown, keys: T): T[number] | "" {
  return typeof v === "string" && (keys as readonly string[]).includes(v)
    ? (v as T[number])
    : "";
}

function hashIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  if (!ip) return "";
  const salt = process.env.AUTH_SECRET || "onsite-report";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const token = searchParams.get("token") || "";
  if (!eventId) return NextResponse.json({ reports: [] });

  try {
    const docs = await getVisibleReports(eventId, token);
    const reports: PublicOnsiteReport[] = docs.map((d) => ({
      giftMatch: d.giftMatch as GiftMatch,
      actualGift: d.actualGift,
      crowd: d.crowd as Crowd,
      status: d.status as EventStatus,
      note: d.note,
      nickname: d.nickname,
      photoUrl: d.photoUrl,
      createdAt: new Date(d.createdAt).toISOString(),
      pending: d.moderation === "pending",
    }));
    return NextResponse.json({ reports });
  } catch (err) {
    console.error("onsite-reports GET error:", err);
    return NextResponse.json({ reports: [] });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  const eventId = clamp(body.eventId, 80);
  if (!eventId || !/^\d{4}-\d{2}-\d{2}-.+/.test(eventId)) {
    return NextResponse.json({ error: "缺少有效的活動代碼" }, { status: 400 });
  }

  const photoUrl =
    typeof body.photoUrl === "string" && /^https:\/\//.test(body.photoUrl)
      ? body.photoUrl.slice(0, 300)
      : "";

  const report: OnsiteReport = {
    eventId,
    giftMatch: oneOf(body.giftMatch, GIFT_MATCH_KEYS),
    actualGift: clamp(body.actualGift, 60),
    crowd: oneOf(body.crowd, CROWD_KEYS),
    status: oneOf(body.status, STATUS_KEYS),
    note: clamp(body.note, 300),
    nickname: clamp(body.nickname, 20),
    photoUrl,
  };

  // 內容門檻：至少一個 chip 或一段文字（純圖片 / 全空白擋掉）
  if (!hasMeaningfulContent(report)) {
    return NextResponse.json(
      { error: "請至少選一項現場狀況或填寫文字（只附圖片無法送出）" },
      { status: 400 }
    );
  }

  // 限流：同一 IP 短時間內不可洗版
  const ipHash = hashIp(request);
  try {
    if (ipHash && (await countRecentByIp(ipHash, RATE_WINDOW_MS)) >= RATE_MAX) {
      return NextResponse.json(
        { error: "回報太頻繁了，請稍後再試" },
        { status: 429 }
      );
    }
  } catch {
    // 限流查詢失敗不阻擋正常回報
  }

  // 混合審核：含照片或自由文字 → 待審；只點 chip → 自動公開
  const moderation = needsReview(report) ? "pending" : "approved";
  const submitterToken = clamp(body.submitterToken, 64);

  try {
    await createOnsiteReport({ ...report, moderation, submitterToken, ipHash });
    return NextResponse.json(
      {
        message:
          moderation === "approved"
            ? "感謝你的現場回報，已即時顯示給其他捐血人！"
            : "感謝回報！含照片或文字的回報送審後就會對外公開。",
        moderation,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("onsite-reports POST error:", err);
    return NextResponse.json({ error: "提交失敗，請稍後再試" }, { status: 500 });
  }
}
