import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import incrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  // 用「已部署的靜態資源」當預渲染頁的增量快取（唯讀，配合每日 rebuild）。
  // 沒設這個時，OpenNext 每次冷啟動都會在 worker 重新 render 預渲染頁，
  // 而新聞頁要讀 content/news（fs）→ Workers 沒檔案系統 → 整頁掛掉 / 變慢 / 503。
  // 用現有的 ASSETS binding，不需額外開 R2 或 KV。
  incrementalCache,
});
