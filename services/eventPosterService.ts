// /services/eventPosterService.ts
//
// 活動海報投稿的資料層（Cloudflare D1）。寫法比照 services/onsiteReportService.ts。

import { getDB } from "@/lib/d1";
import type {
  IEventPoster,
  IEventPosterInput,
  Moderation,
} from "@/models/EventPoster";

// snake_case 欄位 → camelCase
const COLS = `
  id,
  event_id        AS eventId,
  image_url       AS imageUrl,
  event_label     AS eventLabel,
  moderation,
  submitter_token AS submitterToken,
  ip_hash         AS ipHash,
  created_at      AS createdAt,
  updated_at      AS updatedAt
`;

/** 一場活動最多收幾張已公開海報（清單頁一次要載很多場，別讓單場灌爆） */
const MAX_PER_EVENT = 3;

export async function createEventPoster(
  data: IEventPosterInput
): Promise<IEventPoster> {
  const db = await getDB();
  const now = new Date().toISOString();
  const row = await db
    .prepare(
      `INSERT INTO event_posters
        (event_id, image_url, event_label, moderation, submitter_token, ip_hash,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING ${COLS}`
    )
    .bind(
      data.eventId,
      data.imageUrl,
      data.eventLabel,
      data.moderation,
      data.submitterToken,
      data.ipHash,
      now,
      now
    )
    .first<IEventPoster>();
  if (!row) throw new Error("建立海報投稿失敗");
  return row;
}

/**
 * 取多場活動「已公開」的海報，回傳 eventId → 圖片網址陣列。
 * 清單頁一次會問三十場，所以做成批次查詢（一次 SQL），不要每張卡各打一次。
 */
export async function getApprovedByEventIds(
  eventIds: string[]
): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};
  if (eventIds.length === 0) return result;

  const db = await getDB();
  const placeholders = eventIds.map(() => "?").join(",");
  const { results } = await db
    .prepare(
      `SELECT event_id AS eventId, image_url AS imageUrl
         FROM event_posters
        WHERE moderation = 'approved' AND event_id IN (${placeholders})
        ORDER BY created_at ASC`
    )
    .bind(...eventIds)
    .all<{ eventId: string; imageUrl: string }>();

  for (const row of results) {
    const list = (result[row.eventId] ||= []);
    if (list.length < MAX_PER_EVENT) list.push(row.imageUrl);
  }
  return result;
}

/** 某人在某場已經投過幾張（含待審），用來擋重複灌稿 */
export async function countByEventAndToken(
  eventId: string,
  submitterToken: string
): Promise<number> {
  if (!submitterToken) return 0;
  const db = await getDB();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM event_posters
        WHERE event_id = ? AND submitter_token = ?`
    )
    .bind(eventId, submitterToken)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/** 同一 IP 在時間窗內的投稿數（限流） */
export async function countRecentByIp(
  ipHash: string,
  windowMs: number
): Promise<number> {
  if (!ipHash) return 0;
  const db = await getDB();
  const since = new Date(Date.now() - windowMs).toISOString();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM event_posters
        WHERE ip_hash = ? AND created_at >= ?`
    )
    .bind(ipHash, since)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/** 後台：依審核狀態列出投稿（預設待審） */
export async function listEventPosters(
  moderation?: Moderation
): Promise<IEventPoster[]> {
  const db = await getDB();
  const stmt = moderation
    ? db
        .prepare(
          `SELECT ${COLS} FROM event_posters
            WHERE moderation = ?
            ORDER BY created_at DESC
            LIMIT 200`
        )
        .bind(moderation)
    : db.prepare(
        `SELECT ${COLS} FROM event_posters ORDER BY created_at DESC LIMIT 200`
      );
  const { results } = await stmt.all<IEventPoster>();
  return results;
}

/** 後台徽章用：各審核狀態的件數 */
export async function countByModeration(): Promise<Record<Moderation, number>> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT moderation, COUNT(*) AS n FROM event_posters GROUP BY moderation`
    )
    .all<{ moderation: Moderation; n: number }>();
  const counts: Record<Moderation, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };
  for (const row of results) counts[row.moderation] = row.n;
  return counts;
}

export async function setModeration(
  id: string,
  moderation: Moderation
): Promise<IEventPoster | null> {
  const db = await getDB();
  return db
    .prepare(
      `UPDATE event_posters SET moderation = ?, updated_at = ?
        WHERE id = ?
        RETURNING ${COLS}`
    )
    .bind(moderation, new Date().toISOString(), id)
    .first<IEventPoster>();
}

export async function deleteEventPoster(id: string): Promise<boolean> {
  const db = await getDB();
  const row = await db
    .prepare(`DELETE FROM event_posters WHERE id = ? RETURNING id`)
    .bind(id)
    .first<{ id: number }>();
  return !!row;
}
