// /services/onsiteReportService.ts
//
// 現場真相回報的資料層。儲存改用 Cloudflare D1（SQLite，Workers 原生、無狀態存取），
// 取代原本的 mongoose——MongoDB 的長連線 driver 在 Workers 上會在請求結束後因背景
// 計時器繼續做 I/O 而拋出無法 catch 的 1101 例外。
import { getDB } from "@/lib/d1";
import type {
  IOnsiteReport,
  IOnsiteReportInput,
  Moderation,
} from "@/models/OnsiteReport";

// snake_case 欄位 → camelCase（與既有 route / 後台輸出一致）
const COLS = `
  id,
  event_id        AS eventId,
  gift_match      AS giftMatch,
  actual_gift     AS actualGift,
  crowd,
  status,
  note,
  nickname,
  photo_url       AS photoUrl,
  moderation,
  submitter_token AS submitterToken,
  ip_hash         AS ipHash,
  created_at      AS createdAt,
  updated_at      AS updatedAt
`;

/** 建立一筆現場回報 */
export async function createOnsiteReport(
  data: IOnsiteReportInput
): Promise<IOnsiteReport> {
  const db = await getDB();
  const now = new Date().toISOString();
  const row = await db
    .prepare(
      `INSERT INTO onsite_reports
        (event_id, gift_match, actual_gift, crowd, status, note, nickname,
         photo_url, moderation, submitter_token, ip_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING ${COLS}`
    )
    .bind(
      data.eventId,
      data.giftMatch,
      data.actualGift,
      data.crowd,
      data.status,
      data.note,
      data.nickname,
      data.photoUrl,
      data.moderation,
      data.submitterToken,
      data.ipHash,
      now,
      now
    )
    .first<IOnsiteReport>();
  if (!row) throw new Error("建立回報失敗");
  return row;
}

/**
 * 取得某活動「對外可見」的回報：所有 approved，
 * 外加發文者本人尚在 pending 的回報（用 submitterToken 比對）。
 */
export async function getVisibleReports(
  eventId: string,
  submitterToken?: string
): Promise<IOnsiteReport[]> {
  const db = await getDB();
  const stmt = submitterToken
    ? db
        .prepare(
          `SELECT ${COLS} FROM onsite_reports
           WHERE event_id = ?
             AND (moderation = 'approved'
                  OR (moderation = 'pending' AND submitter_token = ?))
           ORDER BY created_at DESC`
        )
        .bind(eventId, submitterToken)
    : db
        .prepare(
          `SELECT ${COLS} FROM onsite_reports
           WHERE event_id = ? AND moderation = 'approved'
           ORDER BY created_at DESC`
        )
        .bind(eventId);
  const { results } = await stmt.all<IOnsiteReport>();
  return results;
}

/**
 * 跨活動取最新已公開回報（給首頁/gift/city 的聚合 feed）。
 * sinceEventDate（YYYY-MM-DD）：只取活動日期 >= 該日的回報，把過期活動濾掉。
 * 可行的原因：event_id 形如 YYYY-MM-DD-shortId，日期前綴等寬，字典序即時間序。
 */
export async function listRecentApproved(
  limit = 6,
  sinceEventDate?: string
): Promise<IOnsiteReport[]> {
  const db = await getDB();
  const n = Math.min(Math.max(limit, 1), 20);
  const stmt = sinceEventDate
    ? db
        .prepare(
          `SELECT ${COLS} FROM onsite_reports
           WHERE moderation = 'approved' AND event_id >= ?
           ORDER BY created_at DESC
           LIMIT ?`
        )
        .bind(sinceEventDate, n)
    : db
        .prepare(
          `SELECT ${COLS} FROM onsite_reports
           WHERE moderation = 'approved'
           ORDER BY created_at DESC
           LIMIT ?`
        )
        .bind(n);
  const { results } = await stmt.all<IOnsiteReport>();
  return results;
}

/** 後台：依審核狀態列出回報（預設待審） */
export async function listOnsiteReports(
  moderation?: Moderation
): Promise<IOnsiteReport[]> {
  const db = await getDB();
  const stmt = moderation
    ? db
        .prepare(
          `SELECT ${COLS} FROM onsite_reports
           WHERE moderation = ?
           ORDER BY created_at DESC
           LIMIT 200`
        )
        .bind(moderation)
    : db.prepare(
        `SELECT ${COLS} FROM onsite_reports
         ORDER BY created_at DESC
         LIMIT 200`
      );
  const { results } = await stmt.all<IOnsiteReport>();
  return results;
}

/** 後台：更新審核狀態 */
export async function setModeration(
  id: string,
  moderation: Moderation
): Promise<IOnsiteReport | null> {
  const db = await getDB();
  const row = await db
    .prepare(
      `UPDATE onsite_reports
       SET moderation = ?, updated_at = ?
       WHERE id = ?
       RETURNING ${COLS}`
    )
    .bind(moderation, new Date().toISOString(), Number(id))
    .first<IOnsiteReport>();
  return row ?? null;
}

/** 後台：刪除一筆回報 */
export async function deleteOnsiteReport(
  id: string
): Promise<IOnsiteReport | null> {
  const db = await getDB();
  const row = await db
    .prepare(`DELETE FROM onsite_reports WHERE id = ? RETURNING ${COLS}`)
    .bind(Number(id))
    .first<IOnsiteReport>();
  return row ?? null;
}

/** 限流：同一 IP 在指定時間內的回報數 */
export async function countRecentByIp(
  ipHash: string,
  sinceMs: number
): Promise<number> {
  if (!ipHash) return 0;
  const db = await getDB();
  const since = new Date(Date.now() - sinceMs).toISOString();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM onsite_reports
       WHERE ip_hash = ? AND created_at >= ?`
    )
    .bind(ipHash, since)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/** 後台統計：各審核狀態筆數 */
export async function countByModeration(): Promise<Record<Moderation, number>> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT moderation AS m, COUNT(*) AS n FROM onsite_reports GROUP BY moderation`
    )
    .all<{ m: Moderation; n: number }>();
  const out: Record<Moderation, number> = { approved: 0, pending: 0, rejected: 0 };
  for (const r of results) if (r.m in out) out[r.m] = r.n;
  return out;
}
