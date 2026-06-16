"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const AD_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
// 優先用專用的錨定 slot；沒設定就沿用現有的 news 橫幅單元（最接近的格式）。
// 之後若想分開量測成效，建一個專用單元再設 NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR 即可，免動程式碼。
const AD_SLOT =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR ||
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_NEWS;

/** 同一個瀏覽分頁關閉後就不再出現，避免一直彈回來惹人厭 */
const DISMISS_KEY = "anchorAdDismissed";

/**
 * 錨定廣告全站顯示，只排除後台（/admin）。
 * 流量與收益集中在首頁與列表頁，而這些頁的廣告可視率偏低（首頁僅 ~26%），
 * 一條看得到的底部薄錨定正好補這個洞、增量最大。
 */
const HIDDEN_PREFIXES = ["/admin"];

function isHiddenPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * 黏底錨定廣告：固定在畫面底部、可手動關閉。
 * - 用 in-flow 的 spacer 撐高頁面，廣告浮在 spacer 上 → 不會蓋住頁尾、也不造成版面位移(CLS)。
 * - 後台 /admin 與未設定 slot 時不顯示。
 * - 廣告未填滿(unfilled)會自動收起，不留空白條。
 */
export default function AnchorAd() {
  const pathname = usePathname();
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement>(null);
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      // sessionStorage 不可用時忽略
    }
  }, []);

  const enabled =
    mounted &&
    !dismissed &&
    !unfilled &&
    !!AD_CLIENT &&
    !!AD_SLOT &&
    !isHiddenPath(pathname);

  useEffect(() => {
    if (!enabled || pushed.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: Record<string, unknown>[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // 廣告載入失敗不影響頁面內容
    }
  }, [enabled]);

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;
    // AdSense 可能短暫標記 unfilled 後才填上，等 3 秒看最終狀態
    let timer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if ((ins as HTMLElement).dataset.adStatus === "unfilled") setUnfilled(true);
      }, 3000);
    });
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [enabled]);

  if (!enabled) return null;

  const handleClose = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // 忽略
    }
  };

  return (
    <>
      {/* in-flow spacer：把頁面底部撐高，讓固定的廣告條浮在這上面、不蓋住頁尾 */}
      <div aria-hidden className="h-[50px] sm:h-[60px]" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur">
        <button
          type="button"
          onClick={handleClose}
          aria-label="關閉廣告"
          className="absolute -top-7 right-2 flex h-7 w-7 items-center justify-center rounded-t-md border border-b-0 border-gray-200 bg-white/95 text-base leading-none text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>
        <div className="mx-auto h-[50px] overflow-hidden px-2 sm:h-[60px]">
          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={AD_CLIENT}
            data-ad-slot={AD_SLOT}
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </>
  );
}
