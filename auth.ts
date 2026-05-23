import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth.js v5 設定。
 *
 * 採用單一管理者帳密（環境變數），credentials provider + JWT session。
 * authorize 內只比對環境變數、不碰資料庫，因此可在 edge middleware 安全執行。
 *
 * 需要的環境變數：
 *   AUTH_SECRET      — Auth.js 簽章用密鑰（`npx auth secret` 產生）
 *   ADMIN_USERNAME   — 後台帳號
 *   ADMIN_PASSWORD   — 後台密碼
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "admin",
      credentials: {
        username: { label: "帳號", type: "text" },
        password: { label: "密碼", type: "password" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username;
        const password = credentials?.password;

        const expectedUser = process.env.ADMIN_USERNAME;
        const expectedPass = process.env.ADMIN_PASSWORD;

        if (!expectedUser || !expectedPass) {
          console.error("ADMIN_USERNAME / ADMIN_PASSWORD 未設定");
          return null;
        }

        if (username === expectedUser && password === expectedPass) {
          return { id: "admin", name: "管理者" };
        }

        return null;
      },
    }),
  ],
});
