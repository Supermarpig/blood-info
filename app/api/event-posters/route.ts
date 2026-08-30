// /app/api/event-posters/route.ts
//
// 活動海報投稿的公開 API：
//   GET  ?eventIds=a,b,c  → { posters: { eventId: [圖片網址] } }（只回已審核通過的）
//   POST { eventId, imageUrl, eventLabel } → 建立一筆投稿（一律 pending，等後台審）
//
// 圖片本身走既有的 /api/upload-image-public（Cloudinary）上傳，這裡只收網址，
// 所以不接受任意外部網址——只認我們自己圖床的 https 網址，避免變成別人的圖片轉貼板。

import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  createEventPoster,
  getApprovedByEventIds,
  countByEventAndToken,
  countRecentByIp,
} from "@/services/eventPosterService";
import { notifyPosterSubmitted } from "@/lib/notifyAdminEmail";

export const dynamic = "force-dynamic";

// 限流：同一 IP 30 分鐘內最多 5 張；同一人同一場最多 2 張
const RATE_WINDOW_MS = 30 * 60 * 1000;
const RATE_MAX = 5;
const MAX_PER_EVENT_PER_PERSON = 2;

/** 清單頁一次會問一整頁的場次，給個上限免得有人拿它當掃描器 */
const MAX_EVENT_IDS = 60;

const ALLOWED_IMAGE_HOSTS = ["res.cloudinary.com", "i.imgur.com"];

function hashIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for") || "";
  const ip =
    fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "";
  if (!ip) return "";
  const salt = process.env.AUTH_SECRET || "event-poster";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function isValidEventId(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}-.+/.test(value) && value.length <= 80;
}

function isAllowedImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 500) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("eventIds") || searchParams.get("eventId") || "";
  const eventIds = raw
    .split(",")
    .map((id) => id.trim())
    .filter(isValidEventId)
    .slice(0, MAX_EVENT_IDS);

  if (eventIds.length === 0) return NextResponse.json({ posters: {} });

  try {
    const posters = await getApprovedByEventIds(eventIds);
    return NextResponse.json({ posters });
  } catch (err) {
    // 海報是加分內容，資料庫出問題時就當作沒有，不要讓整個清單頁壞掉
    console.error("event-posters GET error:", err);
    return NextResponse.json({ posters: {} });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  if (!isValidEventId(body.eventId)) {
    return NextResponse.json({ error: "缺少有效的活動代碼" }, { status: 400 });
  }
  if (!isAllowedImageUrl(body.imageUrl)) {
    return NextResponse.json(
      { error: "圖片網址無效，請重新上傳圖片" },
      { status: 400 }
    );
  }

  const eventId = body.eventId;
  const imageUrl = body.imageUrl;
  const eventLabel =
    typeof body.eventLabel === "string" ? body.eventLabel.trim().slice(0, 120) : "";
  const submitterToken =
    typeof body.submitterToken === "string" ? body.submitterToken.slice(0, 64) : "";

  const ipHash = hashIp(request);
  try {
    if (ipHash && (await countRecentByIp(ipHash, RATE_WINDOW_MS)) >= RATE_MAX) {
      return NextResponse.json(
        { error: "上傳太頻繁了，請稍後再試" },
        { status: 429 }
      );
    }
    if (
      (await countByEventAndToken(eventId, submitterToken)) >=
      MAX_PER_EVENT_PER_PERSON
    ) {
      return NextResponse.json(
        { error: "這場你已經上傳過了，謝謝你的幫忙" },
        { status: 429 }
      );
    }

    await createEventPoster({
      eventId,
      imageUrl,
      eventLabel,
      moderation: "pending", // 圖片一律先審，與現場照片同標準
      submitterToken,
      ipHash,
    });

    // 通知站長去審。投稿量很小，直接 await 換取「一定會寄出」；
    // notifyAdminEmail 內部已吞掉所有錯誤，寄信失敗不會影響這次投稿。
    await notifyPosterSubmitted({ eventId, eventLabel, imageUrl });

    return NextResponse.json({
      success: true,
      pending: true,
      message: "收到了！審核通過後就會顯示在這場活動上",
    });
  } catch (err) {
    console.error("event-posters POST error:", err);
    return NextResponse.json(
      { error: "送出失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
