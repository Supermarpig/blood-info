/**
 * 全站對外網址的唯一真實來源（single source of truth）。
 *
 * canonical、Open Graph、sitemap、JSON-LD 結構化資料都需要「正式且完整的絕對網址」。
 * 過去各檔直接讀 `process.env.NEXT_PUBLIC_BASE_URL`，但 Next.js 的 env 優先序是
 * `.env.local` 高於 `.env.production`，所以本機 `.env.local` 的 `http://localhost:3000`
 * 會在 `next build` 時被「悄悄」烤進正式版（build 還不會報錯，因為值不是 undefined），
 * 導致 Google Search Console 把活動頁結構化資料的 `url` / `offers.url` / `image`
 * 判為「網址無效」。
 *
 * 這裡在 production 一律以正式網域為保險，杜絕 localhost / undefined / 漏設外洩。
 */
const PRODUCTION_BASE_URL = "https://www.bloodtw.com";

function resolveBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (process.env.NODE_ENV === "production") {
    // 正式環境：env 漏設或不小心指到 localhost，一律退回正式網域
    if (!env || env.includes("localhost")) return PRODUCTION_BASE_URL;
    return env.replace(/\/+$/, "");
  }

  // 開發 / 預覽：用 env，沒有就 localhost
  return (env || "http://localhost:3000").replace(/\/+$/, "");
}

/** 完整的站台基底網址，結尾無斜線。例：`https://www.bloodtw.com` */
export const BASE_URL = resolveBaseUrl();

/** 本站網域（去掉 www.），用來判斷站內 / 站外連結。例：`bloodtw.com` */
export const SITE_HOST = (() => {
  try {
    return new URL(BASE_URL).host.replace(/^www\./, "");
  } catch {
    return "";
  }
})();
