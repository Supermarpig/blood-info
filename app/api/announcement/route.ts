import { NextResponse } from "next/server";
import { getCachedAnnouncement, EMPTY_ANNOUNCEMENT } from "@/services/announcementService";

export async function GET() {
  try {
    const data = await getCachedAnnouncement();
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    console.error("Error fetching public announcement:", error);
    return NextResponse.json({ success: true, data: EMPTY_ANNOUNCEMENT });
  }
}
