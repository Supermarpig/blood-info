// /app/api/reverse-geocode/route.ts
//
// 「用目前位置」的後端：座標 → 中文地址。
//   GET ?lat=25.0328&lng=121.5169 → { city, detail, formatted }
//
// 為什麼要有這支：回報的人常常人就站在捐血車旁邊，卻要在手機上打完整地址。
// 有了它，定位一次就把「縣市」和「詳細地址」兩欄填好。
//
// 供應商：有設 GOOGLE_MAPS_API_KEY 就用 Google（門牌最準），沒設則退到
// OpenStreetMap Nominatim，讓沒配金鑰的環境（例如還沒設變數的 Cloudflare）
// 也不會整個功能不見。金鑰只在伺服端使用，不會外流到瀏覽器。

import { NextResponse } from "next/server";
import { splitCityFromAddress } from "@/lib/addressValidation";

export const dynamic = "force-dynamic";

// 台灣本島＋離島的粗略範圍。超出範圍代表定位有問題（或不在台灣），
// 直接擋掉，省得拿到一個填了也沒用的地址。
const TAIWAN_BOUNDS = { minLat: 20.5, maxLat: 26.5, minLng: 118.0, maxLng: 122.5 };

// 盡力而為的限流：Workers 每個 isolate 各自計數，擋不了分散式濫用，
// 但足以避免有人開著迴圈把地理編碼額度燒光。
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 30;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // 粗暴但有效的記憶體上限
  return recent.length > RATE_MAX;
}

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

interface GoogleResult {
  formatted_address?: string;
  types?: string[];
}

async function viaGoogle(
  lat: number,
  lng: number,
  key: string
): Promise<string | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("language", "zh-TW");
  url.searchParams.set("region", "tw");
  url.searchParams.set("key", key);

  const res = await fetch(url);
  if (!res.ok) return null;
  const body = (await res.json()) as { status?: string; results?: GoogleResult[] };
  if (body.status !== "OK" || !body.results?.length) return null;

  // 門牌 > 建物 > 其他：Google 第一筆通常已是最精確的，但不保證，明確挑一次
  const byType = (type: string) =>
    body.results!.find((r) => r.types?.includes(type));
  const preferred =
    byType("street_address") || byType("premise") || body.results[0];
  return preferred.formatted_address || null;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city_district?: string;
  city?: string;
  county?: string;
  state?: string;
}

async function viaNominatim(lat: number, lng: number): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("accept-language", "zh-TW");

  const res = await fetch(url, {
    // Nominatim 的使用條款要求帶可辨識的 User-Agent
    headers: { "User-Agent": "bloodtw.com report form (https://www.bloodtw.com)" },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { address?: NominatimAddress };
  const a = body.address;
  if (!a) return null;

  // 由大到小組回台灣習慣的順序（Nominatim 給的是拆好的欄位）
  const city = a.city || a.county || a.state || "";
  const district = a.city_district || a.suburb || a.town || a.village || "";
  const road = a.road || a.quarter || a.neighbourhood || "";
  const number = a.house_number ? `${a.house_number}號` : "";
  const composed = `${city}${district}${road}${number}`.trim();
  return composed.length >= 6 ? composed : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const lat = Number(latParam);
  const lng = Number(lngParam);

  // Number(null) === 0，所以要先確認參數存在，否則缺參數會被當成座標 0,0
  if (latParam === null || lngParam === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "座標格式錯誤" }, { status: 400 });
  }
  if (
    lat < TAIWAN_BOUNDS.minLat ||
    lat > TAIWAN_BOUNDS.maxLat ||
    lng < TAIWAN_BOUNDS.minLng ||
    lng > TAIWAN_BOUNDS.maxLng
  ) {
    return NextResponse.json(
      { error: "定位結果不在台灣範圍內，請手動填寫" },
      { status: 400 }
    );
  }
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json({ error: "查詢太頻繁，請稍後再試" }, { status: 429 });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  try {
    const formatted = googleKey
      ? (await viaGoogle(lat, lng, googleKey)) || (await viaNominatim(lat, lng))
      : await viaNominatim(lat, lng);

    if (!formatted) {
      return NextResponse.json(
        { error: "找不到這個位置的地址，請手動填寫" },
        { status: 404 }
      );
    }

    const { city, detail } = splitCityFromAddress(formatted);
    return NextResponse.json({ city, detail, formatted });
  } catch (err) {
    console.error("reverse-geocode error:", err);
    return NextResponse.json(
      { error: "定位查詢失敗，請手動填寫" },
      { status: 502 }
    );
  }
}
