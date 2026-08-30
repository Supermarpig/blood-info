-- 「活動海報投稿」資料表（Cloudflare D1 / SQLite）。
--
-- 由來：只有被 PTT 貼過的場次才有海報圖，其餘幾千場都是純文字。
-- 但海報是使用者最想看的東西（贈品、詳細時間、地點示意都在圖上），
-- 主辦單位手上本來就有這張圖，捐血人現場也拍得到——缺的只是一個上傳的地方。
--
-- 審核：一律先進 pending，後台按過才對外顯示（與現場照片同一套標準，
-- 見 lib/onsiteReport.ts 的 needsReview：有圖一律送審）。
CREATE TABLE IF NOT EXISTS event_posters (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id        TEXT NOT NULL,              -- 形如 YYYY-MM-DD-shortId，與現場回報一致
  image_url       TEXT NOT NULL,              -- 上傳後的圖床網址（Cloudinary）
  event_label     TEXT NOT NULL DEFAULT '',   -- 送出當下的活動描述，純粹讓後台看得懂在審哪一場
  moderation      TEXT NOT NULL DEFAULT 'pending', -- approved / pending / rejected
  submitter_token TEXT NOT NULL DEFAULT '',   -- 讓投稿者自己看得到「審核中」的那張
  ip_hash         TEXT NOT NULL DEFAULT '',   -- 來源 IP 的雜湊（不存原始 IP），供限流用
  created_at      TEXT NOT NULL,              -- ISO 8601 UTC，字典序即時間序
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_poster_event      ON event_posters (event_id);
CREATE INDEX IF NOT EXISTS idx_poster_moderation ON event_posters (moderation);
CREATE INDEX IF NOT EXISTS idx_poster_ip         ON event_posters (ip_hash);
CREATE INDEX IF NOT EXISTS idx_poster_created    ON event_posters (created_at);
