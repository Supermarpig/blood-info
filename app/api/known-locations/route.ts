// /app/api/known-locations/route.ts
//
// 回報表單的地點快選：
//   GET ?city=新北市&q=板橋      → 該縣市的已知捐血地點（關鍵字可選）
//   GET ?lat=25.01&lng=121.46    → 這個座標附近的已知捐血地點
//
// 資料來源見 lib/knownLocations.ts。回傳的都是我們資料裡實際用過的完整地址，
// 使用者點一下就填進表單，比自己打精確。

import { NextResponse } from "next/server";
import { findByCity, findNearby } from "@/lib/knownLocations";

const MAX_LIMIT = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 6, 1),
    MAX_LIMIT
  );

  try {
    // 注意 Number(null) === 0：少了參數不能靠 isFinite 判斷，會變成查「經緯度 0,0」
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    if (latParam !== null && lngParam !== null) {
      const lat = Number(latParam);
      const lng = Number(lngParam);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json({ locations: [] });
      }
      const locations = await findNearby(lat, lng, limit);
      return NextResponse.json({ locations });
    }

    const city = (searchParams.get("city") || "").trim();
    if (!city) return NextResponse.json({ locations: [] });

    const query = (searchParams.get("q") || "").trim().slice(0, 30);
    const locations = await findByCity(city, query, limit);
    return NextResponse.json({ locations });
  } catch (err) {
    // 快選只是加分項，壞掉就當作沒有建議，不要影響使用者送出回報
    console.error("known-locations error:", err);
    return NextResponse.json({ locations: [] });
  }
}
