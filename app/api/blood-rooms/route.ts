import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "blood-rooms.json");
    const content = await fs.readFile(filePath, "utf-8");
    const rooms: Record<string, { lat: number; lng: number }> =
      JSON.parse(content);

    // Deduplicate by coordinates — keep the shortest (cleanest) name per location
    const coordMap = new Map<
      string,
      { name: string; lat: number; lng: number }
    >();
    for (const [name, coords] of Object.entries(rooms)) {
      const key = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
      const existing = coordMap.get(key);
      if (!existing || name.length < existing.name.length) {
        coordMap.set(key, { name, lat: coords.lat, lng: coords.lng });
      }
    }

    return NextResponse.json({ rooms: Array.from(coordMap.values()) });
  } catch {
    return NextResponse.json(
      { error: "無法載入捐血室資料" },
      { status: 500 }
    );
  }
}
