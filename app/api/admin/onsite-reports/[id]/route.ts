// /app/api/admin/onsite-reports/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { setModeration, deleteOnsiteReport } from "@/services/onsiteReportService";
import type { Moderation } from "@/models/OnsiteReport";

export const dynamic = "force-dynamic";

const VALID: Moderation[] = ["pending", "approved", "rejected"];

function errMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知錯誤";
}

// PATCH /api/admin/onsite-reports/[id] — 變更審核狀態
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const body = await request.json();
    const moderation = body.moderation;
    if (!VALID.includes(moderation)) {
      return NextResponse.json(
        { success: false, error: "無效的審核狀態" },
        { status: 400 }
      );
    }
    const updated = await setModeration(id, moderation);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "找不到該回報" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating onsite report:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/onsite-reports/[id] — 刪除回報
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const deleted = await deleteOnsiteReport(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "找不到該回報" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting onsite report:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}
