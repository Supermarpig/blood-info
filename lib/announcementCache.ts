// /lib/announcementCache.ts
// 公告的伺服器端記憶體快取（單一 instance、盡力而為）。
// 抽成共用模組，讓公開讀取與後台儲存能共用同一份、後台存檔後可主動清除。
import type { Announcement } from "@/services/announcementService";

let cache: { data: Announcement; ts: number } | null = null;

// dev 縮短方便測試；prod 拉長以保護 GitHub API 額度
const TTL = process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 15 * 1000;

export function getCachedAnnouncement(): Announcement | null {
  if (cache && Date.now() - cache.ts < TTL) return cache.data;
  return null;
}

export function setCachedAnnouncement(data: Announcement): void {
  cache = { data, ts: Date.now() };
}

export function clearAnnouncementCache(): void {
  cache = null;
}
