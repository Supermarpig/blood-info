import { NextResponse } from "next/server";
import { loadDataJson } from "@/lib/getDonations";

type RoomRecord = Record<
  string,
  { lat: number; lng: number; hours?: string; center?: string }
>;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
} as const;

export async function GET() {
  try {
    const rooms = (await loadDataJson<RoomRecord>("blood-rooms.json")) ?? {};

    // Deduplicate by coordinates — keep the shortest (cleanest) name per location
    const coordMap = new Map<
      string,
      { name: string; lat: number; lng: number; hours?: string; center?: string }
    >();
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

    return NextResponse.json(
      { rooms: Array.from(coordMap.values()) },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Error loading blood rooms:", error);
    return NextResponse.json(
      { rooms: [], error: "無法載入捐血室資料" },
      { status: 200, headers: CACHE_HEADERS }
    );
  }
}
