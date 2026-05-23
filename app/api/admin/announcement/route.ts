// /app/api/admin/announcement/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { getAnnouncement, saveAnnouncement } from "@/services/announcementService";

export const dynamic = "force-dynamic";

function errMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知錯誤";
}

// GET /api/admin/announcement
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { data } = await getAnnouncement();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}

// PUT /api/admin/announcement
export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const saved = await saveAnnouncement({
      enabled: !!body.enabled,
      title: (body.title || "").trim(),
      message: (body.message || "").trim(),
      spots: Array.isArray(body.spots)
        ? body.spots.map((s: string) => String(s).trim()).filter(Boolean)
        : [],
      gifts: Array.isArray(body.gifts)
        ? body.gifts.map((s: string) => String(s).trim()).filter(Boolean)
        : [],
      ctaText: (body.ctaText || "").trim(),
      ctaUrl: (body.ctaUrl || "").trim(),
    });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Error saving announcement:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}
