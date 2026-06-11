import { promises as fs } from "fs";
import path from "path";

/**
 * 讀 /data 下的 JSON 檔，回傳原始字串。
 *
 * - build / 預渲染：直接讀檔（fs）。
 * - Cloudflare Workers runtime：沒有 fs，且 worker「fetch 自己的公開網址」在 Cloudflare 上
 *   不可靠（會讀不到），所以改用 ASSETS binding 讀已部署的靜態資源。
 */
async function readDataFile(file: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(process.cwd(), "data", file), "utf-8");
  } catch {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const env = getCloudflareContext().env as unknown as {
        ASSETS?: { fetch: (input: Request | string | URL) => Promise<Response> };
      };
      if (!env.ASSETS) return null;
      const res = await env.ASSETS.fetch(
        new URL(`/data/${file}`, "http://assets.local")
      );
      return res.ok ? await res.text() : null;
    } catch {
      return null;
    }
  }
}

/** 讀單一月份檔（例如 bloodInfo-202606.json），解析成 { 日期: 活動[] }。 */
export async function loadMonth<T = unknown>(
  file: string
): Promise<Record<string, T[]> | null> {
  const raw = await readDataFile(file);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, T[]>;
  } catch {
    return null;
  }
}

/** 讀「當月 + 下個月」的捐血活動並合併。給 server component / API route 共用。 */
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
