// /app/api/admin/event-posters/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  listEventPosters,
  countByModeration,
} from "@/services/eventPosterService";
import type { Moderation } from "@/models/EventPoster";

export const dynamic = "force-dynamic";

const VALID: Moderation[] = ["pending", "approved", "rejected"];

function errMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知錯誤";
}

// GET /api/admin/event-posters?moderation=pending — 列出海報投稿（預設待審）
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
      listEventPosters(moderation),
      countByModeration(),
    ]);
    const data = docs.map((d) => ({
      id: String(d.id),
      eventId: d.eventId,
      imageUrl: d.imageUrl,
      eventLabel: d.eventLabel,
      moderation: d.moderation,
      createdAt: new Date(d.createdAt).toISOString(),
    }));
    return NextResponse.json({ success: true, data, counts });
  } catch (error) {
    console.error("Error listing event posters:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}
