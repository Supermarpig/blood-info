/**
 * 「已知捐血地點」索引——回報表單的快選來源。
 *
 * 由來：回報的人打字不方便（不少是長輩），只打「台北」兩個字就送出。
 * 但捐血活動絕大多數辦在重複出現的場地（廟口、里民活動中心、捐血室），
 * 這些地址我們早就有了：
 *   - data/geocode-cache.json：歷來被地理編碼過的地址（含座標，可算距離）
 *   - 當月＋次月的活動：哪些場地還在用、用得多不多（拿來排序）
 * 讓使用者打兩個字就從清單點一個，回報反而比自己打更精確。
 *
 * 資料在 build 時被複製到 public/data（見 next.config.mjs），
 * runtime 由 lib/getDonations 的 loadDataJson 統一處理 fs / Workers ASSETS 兩種讀法。
 */

import { loadDataJson, getDonations } from "@/lib/getDonations";
import { splitCityFromAddress } from "@/lib/addressValidation";

export interface KnownLocation {
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  /** 當月＋次月出現的場次數，用來把常用場地排前面 */
  uses: number;
}

interface GeoEntry {
  lat: number;
  lng: number;
}

const TTL_MS = 3600_000;
let cache: { at: number; items: KnownLocation[] } | null = null;

/** 比對用正規化：臺→台、去空白、英數轉小寫 */
function normalize(value: string): string {
  return value.replace(/臺/g, "台").replace(/\s+/g, "").toLowerCase();
}

async function buildIndex(): Promise<KnownLocation[]> {
  const geo =
    (await loadDataJson<Record<string, GeoEntry | null>>(
      "geocode-cache.json"
    )) || {};

  // 場次數：同一地址在當月/次月出現幾次
  const uses = new Map<string, number>();
  try {
    const donations = await getDonations<{ location?: string }>();
    for (const date in donations) {
      for (const event of donations[date] || []) {
        const location = (event.location || "").trim();
        if (location) uses.set(location, (uses.get(location) || 0) + 1);
      }
    }
  } catch {
    /* 活動資料讀不到就只靠 geocode cache，不要讓快選整個消失 */
  }

  const addresses = new Set<string>([
    ...Object.keys(geo),
    ...Array.from(uses.keys()),
  ]);

  const items: KnownLocation[] = [];
  for (const address of addresses) {
    const trimmed = address.trim();
    if (trimmed.length < 6) continue;
    const coords = geo[address];
    const { city } = splitCityFromAddress(trimmed);
    items.push({
      address: trimmed,
      city,
      lat: coords?.lat,
      lng: coords?.lng,
      uses: uses.get(address) || 0,
    });
  }
  return items;
}

async function getIndex(): Promise<KnownLocation[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items;
  const items = await buildIndex();
  cache = { at: Date.now(), items };
  return items;
}

/** 依縣市（必要）＋關鍵字（選填）找地點，常用的排前面。 */
export async function findByCity(
  city: string,
  query: string,
  limit: number
): Promise<KnownLocation[]> {
  const items = await getIndex();
  const targetCity = normalize(city);
  const q = normalize(query);

  return items
    .filter((item) => normalize(item.city) === targetCity)
    .filter((item) => !q || normalize(item.address).includes(q))
    .sort(
      (a, b) =>
        b.uses - a.uses ||
        Number(Boolean(b.lat)) - Number(Boolean(a.lat)) ||
        a.address.length - b.address.length
    )
    .slice(0, limit);
}

/** 兩點距離（公尺）。只用在排序與「幾公尺」的顯示，用球面近似即可。 */
function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 找座標附近的已知地點（近的排前面）。 */
export async function findNearby(
  lat: number,
  lng: number,
  limit: number,
  maxMeters = 3000
): Promise<(KnownLocation & { distanceM: number })[]> {
  const items = await getIndex();
  return items
    .filter((item) => typeof item.lat === "number" && typeof item.lng === "number")
    .map((item) => ({
      ...item,
      distanceM: Math.round(distanceMeters(lat, lng, item.lat!, item.lng!)),
    }))
    .filter((item) => item.distanceM <= maxMeters)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}
