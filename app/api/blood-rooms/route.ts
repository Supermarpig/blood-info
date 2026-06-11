import { NextResponse } from "next/server";
// 直接 import（檔案很小、檔名固定），build 時打包進 bundle，Workers 上無需 fs。
import roomsData from "@/data/blood-rooms.json";

type RoomRecord = Record<
  string,
  { lat: number; lng: number; hours?: string; center?: string }
>;

const rooms = roomsData as RoomRecord;

export async function GET() {
  // Deduplicate by coordinates — keep the shortest (cleanest) name per location
  const coordMap = new Map<
    string,
    { name: string; lat: number; lng: number; hours?: string; center?: string }
  >();
  for (const [name, coords] of Object.entries(rooms)) {
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

  return NextResponse.json(
    { rooms: Array.from(coordMap.values()) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
