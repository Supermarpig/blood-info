// 直接讀已部署的靜態資料檔（/data/*），取代在 client 端打 /api/blood-*。
//
// 為什麼：本專案用 OpenNext 部署到 Cloudflare Workers，/api/* 的每次呼叫都會
// 喚醒 Worker、各計一次 request 額度；而這幾支 API 其實只是回傳 /data 下的靜態檔
// （build 時由 next.config.mjs 從 /data 複製到 public/data）。改成直接讀 /data/*.json
// 由 ASSETS binding（CDN）直送，「不計入 Worker request」，資料內容與 API 完全一致。
//
// API route 仍保留（給外部/SEO 相容），只是公開頁面的 client 不再走它們。

/** 讀血液庫存。等同 /api/blood-inventory 回傳的 data 欄位。 */
export async function fetchInventory<T = unknown>(): Promise<T | null> {
  try {
    const res = await fetch("/data/bloodInventory.json");
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * 讀「當月 + 次月」捐血活動並合併。等同 /api/blood-donations 回傳的 data 欄位。
 * 與 lib/getDonations.ts 的 getDonations() 行為一致（順序：當月在前、次月在後）。
 */
export async function fetchDonations<T = unknown>(): Promise<Record<string, T[]>> {
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
    try {
      const res = await fetch(`/data/${file}`);
      if (!res.ok) continue; // 缺檔（如次月尚未爬）就略過
      const month = (await res.json()) as Record<string, T[]>;
      for (const date in month) {
        all[date] = all[date] ? [...all[date], ...month[date]] : month[date];
      }
    } catch {
      // 靜默略過
    }
  }
  return all;
}

export interface BloodRoom {
  name: string;
  lat: number;
  lng: number;
  hours?: string;
  center?: string;
}

type RoomRecord = Record<
  string,
  { lat: number; lng: number; hours?: string; center?: string }
>;

/**
 * 讀捐血室並依座標去重（同座標保留名稱最短者）。
 * 等同 /api/blood-rooms 回傳的 rooms 欄位。
 */
export async function fetchBloodRooms(): Promise<BloodRoom[]> {
  try {
    const res = await fetch("/data/blood-rooms.json");
    if (!res.ok) return [];
    const rooms = (await res.json()) as RoomRecord;

    const coordMap = new Map<string, BloodRoom>();
    for (const [name, coords] of Object.entries(rooms)) {
      if (
        !coords ||
        typeof coords.lat !== "number" ||
        typeof coords.lng !== "number" ||
        !Number.isFinite(coords.lat) ||
        !Number.isFinite(coords.lng)
      ) {
        continue;
      }
      const key = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
      const existing = coordMap.get(key);
      if (!existing || name.length < existing.name.length) {
        coordMap.set(key, {
          name,
          lat: coords.lat,
          lng: coords.lng,
          hours: coords.hours,
          center: coords.center,
        });
      }
    }
    return Array.from(coordMap.values());
  } catch {
    return [];
  }
}
