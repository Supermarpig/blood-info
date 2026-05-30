import { NextResponse } from "next/server";
import { getCachedAnnouncement, EMPTY_ANNOUNCEMENT } from "@/services/announcementService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCachedAnnouncement();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching public announcement:", error);
    return NextResponse.json({ success: true, data: EMPTY_ANNOUNCEMENT });
  }
}
