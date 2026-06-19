// /lib/d1.ts
//
// 取得 Cloudflare D1 binding（在 wrangler.jsonc 以 binding: "DB" 設定）。
// 走 OpenNext 的 getCloudflareContext({ async: true })：
//   - production（Workers runtime）：直接讀 worker 已設好的 env.DB
//   - 本機 next dev：lazy 透過 wrangler 取得本機 D1（檔案在 .wrangler/state）
//
// 用 async 模式而非 sync：sync 模式只讀 globalThis 上的 context，那是
// initOpenNextCloudflareForDev() 非同步設定的——在 Turbopack dev 下會因
// realm 不同 / 首發請求搶跑而抓不到，丟「未呼叫 init」的錯。async 模式不靠
// global、無 race，兩種環境都穩。
//
// 只宣告我們會用到的最小 D1 介面，避免額外安裝 @cloudflare/workers-types。
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface D1Result<T> {
  results: T[];
  success: boolean;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) {
    throw new Error(
      "D1 binding 'DB' 未設定——請確認 wrangler.jsonc 的 d1_databases 與已部署的資料庫"
    );
  }
  return db;
}
