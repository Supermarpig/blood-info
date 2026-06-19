/**
 * 今天的台灣日期（UTC+8，台灣無 DST），格式 YYYY-MM-DD。
 * 用來判斷活動是否過期：Workers/Node 都跑 UTC，不能直接用 new Date()。
 */
export function taiwanToday(): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
