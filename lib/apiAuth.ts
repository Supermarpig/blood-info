// /lib/apiAuth.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * 在 API route 中驗證是否為已登入管理者。
 * 未授權時回傳 401 Response；已授權回傳 null（呼叫端繼續）。
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  return null;
}
