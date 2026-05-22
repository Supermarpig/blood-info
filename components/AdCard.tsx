"use client";

import { useEffect, useRef } from "react";

const AD_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

interface AdCardProps {
  /** AdSense 廣告版位 ID（在 AdSense 後台建立廣告單元後取得） */
  slot?: string;
  className?: string;
  /** card：首頁卡牌格內的廣告（外觀做成卡片）；inline：文章／列表內的橫幅 */
  variant?: "card" | "inline";
}

/**
 * Google AdSense 廣告單元。
 * 尚未設定 NEXT_PUBLIC_ADSENSE_CLIENT 或對應 slot 時不渲染，
 * 避免在審核通過 / 填入版位 ID 前留下空白廣告框或破版。
 */
export default function AdCard({ slot, className = "", variant = "card" }: AdCardProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!AD_CLIENT || !slot || pushed.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: Record<string, unknown>[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // 廣告載入失敗不影響頁面內容
    }
  }, [slot]);

  if (!AD_CLIENT || !slot) return null;

  const isCard = variant === "card";

  return (
    <div
      className={`${
        isCard
          ? "h-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
          : "rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden"
      } ${className}`}
    >
      <span className="block px-3 pt-2 text-[10px] uppercase tracking-wider text-gray-300">
        廣告
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: isCard ? 250 : 100 }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
