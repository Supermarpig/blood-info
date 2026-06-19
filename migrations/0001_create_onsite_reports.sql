-- 「現場真相回報」資料表（Cloudflare D1 / SQLite）。
-- 從 MongoDB/mongoose 遷移過來：mongoose 的長連線 driver 會在 Workers 請求結束後
-- 因背景監控計時器繼續做 I/O 而拋出無法 catch 的 1101 例外。D1 是 Workers 原生、
-- 無狀態存取，沒有這個問題。
CREATE TABLE IF NOT EXISTS onsite_reports (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id        TEXT NOT NULL,
  gift_match      TEXT NOT NULL DEFAULT '',
  actual_gift     TEXT NOT NULL DEFAULT '',
  crowd           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT '',   -- 活動是否正常舉辦（domain，非審核狀態）
  note            TEXT NOT NULL DEFAULT '',
  nickname        TEXT NOT NULL DEFAULT '',
  photo_url       TEXT NOT NULL DEFAULT '',
  moderation      TEXT NOT NULL DEFAULT 'pending', -- approved / pending / rejected
  submitter_token TEXT NOT NULL DEFAULT '',
  ip_hash         TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL,              -- ISO 8601 UTC，字典序即時間序
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_onsite_event      ON onsite_reports (event_id);
CREATE INDEX IF NOT EXISTS idx_onsite_moderation ON onsite_reports (moderation);
CREATE INDEX IF NOT EXISTS idx_onsite_ip         ON onsite_reports (ip_hash);
CREATE INDEX IF NOT EXISTS idx_onsite_created    ON onsite_reports (created_at);
