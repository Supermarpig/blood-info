import NextLink from "next/link";
import type { ComponentProps } from "react";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * 全站 Link wrapper：預設 prefetch={false}。
 *
 * 為什麼：App Router 的 <Link> 預設會在連結進入視窗時預抓 RSC payload，本專案部署在
 * Cloudflare Workers（OpenNext），每次預抓都會喚醒 Worker、各計一次 request 額度。
 * 清單型頁面一頁數十個連結 → 一次曝光就放大成數十倍請求。改用此 wrapper 讓 prefetch
 * 預設關閉；個別需要即時導航的連結仍可顯式傳 prefetch（例如 prefetch={true}）覆寫。
 *
 * 用法與 next/link 完全相同：import Link from "@/components/Link"。
 */
export default function Link({ prefetch = false, ...props }: LinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}
