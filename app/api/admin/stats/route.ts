// /app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { countIssues } from "@/services/githubIssuesService";

export const dynamic = "force-dynamic";

// GET /api/admin/stats — 後台首頁統計數字
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const [reportsPending, reportsDone, wishlistPending, wishlistDone] =
      await Promise.all([
        countIssues("donation-report", "open"),
        countIssues("donation-report", "closed"),
        countIssues("wishlist", "open"),
        countIssues("wishlist", "closed"),
      ]);

    return NextResponse.json({
      success: true,
      data: { reportsPending, reportsDone, wishlistPending, wishlistDone },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知錯誤",
      },
      { status: 500 }
    );
  }
}
