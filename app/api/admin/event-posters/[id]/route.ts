// /app/api/admin/event-posters/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  setModeration,
  deleteEventPoster,
} from "@/services/eventPosterService";
import type { Moderation } from "@/models/EventPoster";

export const dynamic = "force-dynamic";

const VALID: Moderation[] = ["pending", "approved", "rejected"];

function errMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知錯誤";
}

// PATCH /api/admin/event-posters/[id] — 變更審核狀態
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const body = await request.json();
    if (!VALID.includes(body.moderation)) {
      return NextResponse.json(
        { success: false, error: "無效的審核狀態" },
        { status: 400 }
      );
    }
    const updated = await setModeration(id, body.moderation);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "找不到該投稿" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating event poster:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/event-posters/[id] — 刪除投稿
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const deleted = await deleteEventPoster(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "找不到該投稿" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event poster:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}
