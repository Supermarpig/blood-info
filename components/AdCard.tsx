"use client";

import { useEffect, useRef, useState } from "react";

const AD_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

interface AdCardProps {
  /** AdSense 廣告版位 ID（在 AdSense 後台建立廣告單元後取得） */
  slot?: string;
  className?: string;
  /** card：首頁卡牌；inline：文章內橫幅；sidebar：文章左右側欄 */
  variant?: "card" | "inline" | "sidebar";
}

export default function AdCard({ slot, className = "", variant = "card" }: AdCardProps) {
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement>(null);
  const [unfilled, setUnfilled] = useState(false);

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

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;
    // AdSense may transiently set "unfilled" before settling — wait 3s for final status
    let timer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if ((ins as HTMLElement).dataset.adStatus === "unfilled") setUnfilled(true);
      }, 3000);
    });
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);

  if (!AD_CLIENT || !slot || unfilled) return null;

  if (variant === "sidebar") {
    return (
      <div className={`overflow-hidden ${className}`}>
        <span className="block px-1 pb-1 text-[10px] uppercase tracking-wider text-gray-300">
          廣告
        </span>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", minHeight: 600 }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

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
        ref={insRef}
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
