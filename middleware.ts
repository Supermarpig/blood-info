import { auth } from "@/auth";

/**
 * 保護 /admin/*：未登入一律導向 /admin/login；已登入再進 login 頁則導回 /admin。
 * /admin/login 本身允許未登入存取，避免無限轉址。
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  // 必須看到 user 才算登入：AUTH_SECRET 沒設時 req.auth 可能是個沒有 user 的物件，
  // 只判斷 `!!req.auth` 會讓 /admin 頁面直接放行（見 lib/apiAuth.ts 的說明）。
  const isLoggedIn = !!req.auth?.user;
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/admin", req.nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/admin/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
