import { promises as fs } from "fs";
import path from "path";

/**
 * 取得「當月 + 下個月」的捐血活動資料（給 server component 用）。
 *
 * 取代各頁原本「自己 fetch /api/blood-donations」的寫法 —— 那在 Cloudflare Workers 上
 * 會讓 worker 對自己發大量子請求（被 Next 預抓時），爆掉免費方案的 CPU/子請求限制而回 503。
 *
 * build / 預渲染時直接讀 /data 檔（fs）；Workers runtime（ISR 重生）沒有 fs，
 * 改抓同源靜態資源 /data/*.json（build 時由 next.config 從 /data 複製到 public/data）。
 */
async function loadMonth<T>(file: string): Promise<Record<string, T[]> | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", file), "utf-8");
    return JSON.parse(raw);
  } catch {
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (!base) return null;
    try {
      const res = await fetch(new URL(`/data/${file}`, base));
      return res.ok ? ((await res.json()) as Record<string, T[]>) : null;
    } catch {
      return null;
    }
  }
}

export async function getDonations<T = unknown>(): Promise<Record<string, T[]>> {
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  let ny = cy;
  let nm = cm + 1;
  if (nm > 12) {
    nm = 1;
    ny++;
  }

  const files = [
    `bloodInfo-${cy}${String(cm).padStart(2, "0")}.json`,
    `bloodInfo-${ny}${String(nm).padStart(2, "0")}.json`,
  ];

  const all: Record<string, T[]> = {};
  for (const file of files) {
    const month = await loadMonth<T>(file);
    if (month) {
      for (const date in month) {
        all[date] = all[date] ? [...all[date], ...month[date]] : month[date];
      }
    }
  }
  return all;
}
