// /app/api/admin/reports/[number]/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  updateIssue,
  buildDonationBody,
  ParsedDonation,
} from "@/services/githubIssuesService";

export const dynamic = "force-dynamic";

function errMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知錯誤";
}

// PATCH /api/admin/reports/[number]
//   body.state  = "open" | "closed"  → 開關 issue
//   body.fields = ParsedDonation     → 重建 issue 標題與內容
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { number } = await params;
  const issueNumber = Number(number);
  if (!Number.isInteger(issueNumber)) {
    return NextResponse.json(
      { success: false, error: "issue 編號不合法" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const patch: {
      title?: string;
      body?: string;
      state?: "open" | "closed";
      state_reason?: "completed" | "reopened";
    } = {};

    if (body.state === "open" || body.state === "closed") {
      patch.state = body.state;
      patch.state_reason = body.state === "closed" ? "completed" : "reopened";
    }

    if (body.fields) {
      const f = body.fields as ParsedDonation;
      if (!f.address || !f.activityDate) {
        return NextResponse.json(
          { success: false, error: "缺少必要欄位：地址或日期" },
          { status: 400 }
        );
      }
      patch.title = `[回報] ${f.activityDate} - ${f.address}`;
      patch.body = buildDonationBody({
        address: f.address,
        activityDate: f.activityDate,
        time: f.time || "",
        tags: Array.isArray(f.tags) ? f.tags : [],
        imgurUrl: f.imgurUrl || "",
        email: f.email || "",
      });
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { success: false, error: "沒有可更新的內容" },
        { status: 400 }
      );
    }

    const updated = await updateIssue(issueNumber, patch);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}
