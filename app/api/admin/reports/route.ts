// /app/api/admin/reports/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  listIssues,
  createDonationIssue,
  ParsedDonation,
} from "@/services/githubIssuesService";

export const dynamic = "force-dynamic";

const VALID_LABELS = ["donation-report", "wishlist"];
const VALID_STATES = ["open", "closed", "all"] as const;

function errMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知錯誤";
}

// GET /api/admin/reports?label=donation-report&state=open — 列出 issues
export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const labelParam = searchParams.get("label");
  const stateParam = searchParams.get("state");

  const label = VALID_LABELS.includes(labelParam || "")
    ? (labelParam as string)
    : "donation-report";
  const state = VALID_STATES.includes(
    (stateParam || "") as (typeof VALID_STATES)[number]
  )
    ? (stateParam as (typeof VALID_STATES)[number])
    : "open";

  try {
    const issues = await listIssues({ labels: label, state });
    return NextResponse.json({ success: true, data: issues });
  } catch (error) {
    console.error("Error listing issues:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/admin/reports — 後台手動新增地點回報（建立 donation-report issue）
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { address, activityDate } = body;

    if (!address || !activityDate) {
      return NextResponse.json(
        { success: false, error: "缺少必要欄位：地址或日期" },
        { status: 400 }
      );
    }

    const fields: ParsedDonation = {
      address,
      activityDate,
      time: body.time || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      imgurUrl: body.imgurUrl || "",
      email: body.email || "",
    };

    const issue = await createDonationIssue(fields);
    return NextResponse.json({ success: true, data: issue }, { status: 201 });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { success: false, error: errMessage(error) },
      { status: 500 }
    );
  }
}
