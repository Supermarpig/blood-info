/**
 * 由活動的唯一 id 產生短碼，用於組合活動詳情頁的 URL：
 *   /activity/{activityDate}-{eventShortId(id)}
 *
 * djb2 hash → base36，補零至 6 碼。
 *
 * ⚠️ 這個函式是活動頁 URL 的唯一真實來源（single source of truth）。
 * sitemap、活動頁路由、各列表元件都必須用「同一份」演算法，
 * 否則 sitemap 會產出對不上路由的 URL（變成 404）。新增使用處請一律 import 此函式。
 */
export function eventShortId(id: string): string {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash) + id.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(36).padStart(6, "0");
}
