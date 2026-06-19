// /app/api/admin/onsite-reports/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { listOnsiteReports, countByModeration } from "@/services/onsiteReportService";
import type { Moderation } from "@/models/OnsiteReport";

export const dynamic = "force-dynamic";

const VALID: Moderation[] = ["pending", "approved", "rejected"];

function errMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知錯誤";
}

// GET /api/admin/onsite-reports?moderation=pending — 列出現場回報（預設待審）
export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const m = searchParams.get("moderation");
  const moderation = VALID.includes(m as Moderation)
    ? (m as Moderation)
    : "pending";

  try {
    const [docs, counts] = await Promise.all([
      listOnsiteReports(moderation),
      countByModeration(),
    ]);
    const data = docs.map((d) => ({
      id: String(d._id),
      eventId: d.eventId,
      giftMatch: d.giftMatch,
      actualGift: d.actualGift,
      crowd: d.crowd,
      status: d.status,
      note: d.note,
      nickname: d.nickname,
      photoUrl: d.photoUrl,
      moderation: d.moderation,
      createdAt: new Date(d.createdAt).toISOString(),
    }));
    return NextResponse.json({ success: true, data, counts });
  } catch (error) {
    console.error("Error listing onsite reports:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}
