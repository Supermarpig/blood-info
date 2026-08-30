// /lib/apiAuth.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * 在 API route 中驗證是否為已登入管理者。
 * 未授權時回傳 401/503 Response；已授權回傳 null（呼叫端繼續）。
 *
 * ⚠️ 這裡的兩道檢查都是被正式站的事故逼出來的，不要簡化回 `if (!session)`：
 *
 * 1. AUTH_SECRET 若沒設（例如只加在 build 變數、忘了加 runtime），Auth.js 驗不了
 *    JWT 簽章，但 `auth()` 不見得回 null——它可能回一個沒有 user 的 session 物件，
 *    於是 `if (!session)` 放行，整組後台 API 對外開放（含 PATCH/DELETE）。
 * 2. 因此改成：沒有密鑰就直接拒絕（fail closed），有密鑰也必須真的拿到 user 才放行。
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!process.env.AUTH_SECRET?.trim()) {
    console.error("AUTH_SECRET 未設定：後台 API 一律拒絕");
    return NextResponse.json(
      { error: "伺服器未設定驗證密鑰" },
      { status: 503 }
    );
  }

  const session = await auth().catch((err) => {
    console.error("auth() 失敗:", err);
    return null;
  });

  if (!session?.user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  return null;
}
