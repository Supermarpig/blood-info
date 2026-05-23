// /app/api/admin/publish/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { dispatchWorkflow } from "@/services/githubIssuesService";

export const dynamic = "force-dynamic";

const WORKFLOW_FILE = "import-reports.yml";

// POST /api/admin/publish — 觸發匯入 workflow（把核准的回報匯入 /data 並開 PR）
export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dispatchWorkflow(WORKFLOW_FILE);
    return NextResponse.json({
      success: true,
      message: "已觸發匯入流程，稍後會自動建立 PR。",
    });
  } catch (error) {
    console.error("Error dispatching publish workflow:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知錯誤",
      },
      { status: 500 }
    );
  }
}
