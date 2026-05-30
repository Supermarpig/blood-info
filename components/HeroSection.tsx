"use client";

import { useEffect, useRef } from "react";
import {
  MapPin,
  Calendar,
  Sparkles,
  TrendingUp,
  Heart,
  Film,
  Tag,
  Store,
  Coffee,
  Package,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const GIFT_ICONS: Record<string, LucideIcon> = {
  "movie-ticket": Film,
  voucher: Tag,
  "convenience-store": Store,
  "food-beverage": Coffee,
  "daily-necessities": Package,
  food: UtensilsCrossed,
};
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BloodInventoryPanel, { type BloodInventory } from "@/components/BloodInventoryPanel";
import { GIFTS } from "@/lib/giftConfig";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, SplitText);

interface CpEvent {
  href?: string;
  location: string;
  score: number;
  topTag: string;
}

const CP_BADGE: Record<number, string> = {
  5: "bg-red-50 border-red-200 text-red-800",
  4: "bg-orange-50 border-orange-200 text-orange-800",
  3: "bg-yellow-50 border-yellow-200 text-yellow-800",
  2: "bg-gray-50 border-gray-200 text-gray-600",
};

interface HeroSectionProps {
  todayCount: number;
  upcomingCount: number;
  cpEvents?: CpEvent[];
  onFindNearby: () => void;
  onCenterSelect?: (
    center: string,
    withScroll?: boolean,
    toggle?: boolean,
  ) => void;
  selectedCenter?: string | null;
  filterLabel?: string;
  initialInventory?: BloodInventory;
}

// 星星位置與動畫延遲設定
const SPARKLES = [
  { top: "-10px", left: "30%", delay: "0s", fontSize: "12px" },
  { top: "50%", left: "-12px", delay: "0.55s", fontSize: "10px" },
  { top: "-8px", left: "72%", delay: "1.1s", fontSize: "8px" },
  { top: "110%", left: "20%", delay: "0.3s", fontSize: "10px" },
  { top: "35%", left: "108%", delay: "0.85s", fontSize: "8px" },
  { top: "100%", left: "65%", delay: "1.4s", fontSize: "12px" },
];

function GiftPills() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {GIFTS.map((g) => {
        const Icon = GIFT_ICONS[g.slug];
        const isMovie = g.slug === "movie-ticket";
        return (
          <div
            key={g.slug}
            className={isMovie ? "relative inline-block" : undefined}
          >
            <Link
              href={`/gift/${g.slug}`}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-200"
            >
              {Icon ? <Icon className="w-3 h-3" /> : null}
              {g.name}
            </Link>
            {isMovie &&
              SPARKLES.map((s, i) => (
                <i
                  key={i}
                  className="sparkle-dot"
                  style={{
                    top: s.top,
                    left: s.left,
                    fontSize: s.fontSize,
                    animationDelay: s.delay,
                  }}
                >
                  ✦
                </i>
              ))}
          </div>
        );
      })}
    </div>
  );
}

// 單一數字滾輪
// CSS animation 在第一次 paint 就啟動（不需等 JS hydration）
// settleDelay < 0 → 永遠滾；>= 0 → settleDelay ms 後讀出當前位置、接手成 transition 定格
function SlotDigit({ target, settleDelay }: { target: number; settleDelay: number }) {
  const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const stripRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (settleDelay < 0) return; // 永遠滾，不做任何事

    const timer = setTimeout(() => {
      const el = stripRef.current;
      if (!el) return;

      // 讀出 CSS animation 目前的 translateY（px）
      const matrix = new DOMMatrix(window.getComputedStyle(el).transform);
      const currentPx = matrix.m42; // 負值 = 往上位移
      const totalH = el.scrollHeight; // 整條 strip 高度
      const currentPct = (currentPx / totalH) * 100;

      // 停止 CSS animation，固定在目前位置
      el.style.animation = "none";
      el.style.transform = `translateY(${currentPct}%)`;

      // 兩幀後開始 transition 到目標位置（讓瀏覽器確實套用上面的 transform）
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const targetPct = ((target + 10) / 20) * 100;
          el.style.transition = "transform 0.55s cubic-bezier(0.25, 1, 0.3, 1)";
          el.style.transform = `translateY(-${targetPct}%)`;
        })
      );
    }, settleDelay);

    return () => clearTimeout(timer);
  }, [target, settleDelay]);

  return (
    <span
      className="inline-block overflow-hidden"
      style={{ height: "1.1em", lineHeight: "1.1em", verticalAlign: "bottom" }}
    >
      <span
        ref={stripRef}
        className="slot-spinning"
        style={{ display: "block", willChange: "transform" }}
      >
        {DIGITS.map((d, i) => (
          <span key={i} style={{ display: "block", height: "1.1em", lineHeight: "1.1em", textAlign: "center" }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const digitArr = value > 0 ? String(value).split("").map(Number) : [0];
  return (
    <span className="inline-flex" aria-label={String(value)}>
      {digitArr.map((d, i) => {
        const fromRight = digitArr.length - 1 - i; // 個位=0，十位=1，百位=2
        // 先滾 1 秒，再從個位開始每隔 250ms 依序定格
        const settleDelay = value > 0 ? 1000 + fromRight * 250 : -1;
        return <SlotDigit key={i} target={d} settleDelay={settleDelay} />;
      })}
    </span>
  );
}

interface CpCardProps {
  isTop: boolean;
  colorClass: string;
  giftName: string;
  area: string;
}

function CpCard({ isTop, colorClass, giftName, area }: CpCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const loopRef = useRef<gsap.core.Tween | null>(null);
  const isHovering = useRef(false);

  const { contextSafe } = useGSAP(() => {
    if (!isTop) return;
    loopRef.current = gsap.to(ref.current, {
      boxShadow: "0 0 12px rgba(251,146,60,0.5)",
      duration: 1.4,
      delay: 0.4,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2,
      ease: "sine.inOut",
    });
  }, { scope: ref });

  const onMouseEnter = contextSafe(() => {
    isHovering.current = true;
    loopRef.current?.pause();
    gsap.to(ref.current, {
      scale: 1.12, y: -5, rotation: isTop ? 1 : -1,
      boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
      duration: 0.2,
    });
  });

  const onMouseLeave = contextSafe(() => {
    isHovering.current = false;
    gsap.to(ref.current, {
      scale: 1, y: 0, rotation: 0,
      boxShadow: "0 0 0px rgba(0,0,0,0)",
      duration: 0.2,
      onComplete: () => loopRef.current?.resume(),
    });
  });

  const onPointerDown = contextSafe(() => {
    gsap.to(ref.current, { scale: 0.94, duration: 0.1, overwrite: "auto" });
  });

  const onPointerUp = contextSafe(() => {
    gsap.to(ref.current, {
      scale: isHovering.current ? 1.12 : 1,
      duration: 0.15,
      overwrite: "auto",
    });
  });

  return (
    <div
      ref={ref}
      className={`flex-shrink-0 border-2 rounded-xl px-3 py-2 text-xs min-w-[84px] cursor-pointer ${colorClass}`}
      style={{ transformOrigin: "bottom center" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {isTop && <div className="text-[10px] font-bold mb-0.5 opacity-60">🏆 今日最強</div>}
      <div className="font-semibold truncate max-w-[84px] text-[11px] opacity-70">{area}</div>
      <div className="mt-0.5 font-bold text-[14px]">{giftName}</div>
    </div>
  );
}

export default function HeroSection({
  todayCount,
  upcomingCount,
  cpEvents,
  onFindNearby,
  onCenterSelect,
  selectedCenter,
  filterLabel,
  initialInventory,
}: HeroSectionProps) {
  const heroBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const banner = heroBannerRef.current;
    if (!banner) return;
    const h2 = banner.querySelector("h2");
    const sub = banner.querySelector(".hero-sub");
    if (!h2 || !sub) return;
    const splitH2 = new SplitText(h2, { type: "chars" });
    const splitSub = new SplitText(sub, { type: "chars" });
    const tl = gsap.timeline({ delay: 0.55 })
      .from(splitH2.chars, { opacity: 0, y: 18, stagger: 0.05, duration: 0.35, ease: "power2.out" })
      .from(splitSub.chars, { opacity: 0, y: 10, stagger: 0.03, duration: 0.25, ease: "power2.out" }, "-=0.1");
    return () => { tl.kill(); splitH2.revert(); splitSub.revert(); };
  }, []);

  return (
    <div className="mb-6 space-y-4">
      {/* Hero Banner */}
      <div
        ref={heroBannerRef}
        className="relative bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 rounded-2xl p-6 overflow-hidden animate-fade-in-up"
        style={{ animationDuration: "0.5s" }}
      >
        <div className="absolute right-0 top-0 w-36 h-36 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50 10 C50 10, 18 42, 18 62 C18 81 32 92 50 92 C68 92 82 81 82 62 C82 42 50 10 50 10 Z"
              fill="white"
            />
          </svg>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
          <Heart className="w-28 h-28 text-white" />
        </div>

        {/* Floating blood drops */}
        {[
          { w: 12, h: 15, left: "5%", bottom: 18, delay: "0s", dur: "4s" },
          { w: 8, h: 10, left: "13%", bottom: 22, delay: "0.8s", dur: "5.5s" },
          { w: 18, h: 22, left: "22%", bottom: 16, delay: "1.6s", dur: "3.8s" },
          { w: 10, h: 13, left: "34%", bottom: 20, delay: "2.4s", dur: "4.8s" },
          { w: 14, h: 18, left: "46%", bottom: 16, delay: "0.4s", dur: "5.2s" },
          { w: 8, h: 10, left: "57%", bottom: 22, delay: "1.2s", dur: "3.5s" },
          { w: 16, h: 20, left: "67%", bottom: 14, delay: "2.0s", dur: "4.4s" },
          { w: 10, h: 13, left: "76%", bottom: 20, delay: "3.0s", dur: "5.0s" },
          { w: 7, h: 9, left: "85%", bottom: 24, delay: "1.8s", dur: "4.2s" },
          { w: 13, h: 16, left: "93%", bottom: 16, delay: "0.6s", dur: "3.6s" },
        ].map((drop, i) => (
          <div
            key={i}
            className="absolute pointer-events-none animate-float-drop"
            style={{
              left: drop.left,
              bottom: drop.bottom,
              width: drop.w,
              height: drop.h,
              animationDelay: drop.delay,
              animationDuration: drop.dur,
            }}
          >
            <svg
              viewBox="0 0 100 120"
              className="w-full h-full fill-white opacity-70"
            >
              <path d="M50 8 C50 8, 14 58, 14 78 C14 99 30 112 50 112 C70 112 86 99 86 78 C86 58 50 8 50 8 Z" />
            </svg>
          </div>
        ))}

        <p className="text-red-200 text-xs font-medium uppercase tracking-widest mb-2">
          全台捐血資訊即時查詢
        </p>
        <h2 className="text-2xl font-extrabold text-white leading-snug">
          你的 250cc
        </h2>
        <p className="hero-sub text-xl font-bold text-pink-200 mb-4">是別人的全部</p>

        <GiftPills />
      </div>

      {/* 統計卡片組 */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="#today-events"
          className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50 hover:shadow-md hover:border-emerald-300/60 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200 animate-fade-in-up cursor-pointer"
          style={{ animationDelay: "80ms" }}
        >
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors duration-200">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-emerald-600/80 mb-1">
            {filterLabel ? (
              <>
                <span className="animate-breathe text-sm font-extrabold text-amber-500">{filterLabel}</span>
                {" "}今日活動
              </>
            ) : "今日活動"}
          </p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            <AnimatedNumber value={todayCount} />
            <span className="text-sm font-normal text-gray-500 ml-1">場</span>
          </p>
          <p className="text-[11px] text-emerald-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            查看今日活動 →
          </p>
        </a>

        <a
          href="#upcoming-events"
          className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50 hover:shadow-md hover:border-blue-300/60 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 animate-fade-in-up cursor-pointer"
          style={{ animationDelay: "140ms" }}
        >
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-blue-600/80 mb-1">
            {filterLabel ? (
              <>
                <span className="animate-breathe text-sm font-extrabold text-amber-500">{filterLabel}</span>
                {" "}未來活動
              </>
            ) : "即將開始"}
          </p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            <AnimatedNumber value={upcomingCount} />
            <span className="text-sm font-normal text-gray-500 ml-1">場</span>
          </p>
          <p className="text-[11px] text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            查看即將活動 →
          </p>
        </a>
      </div>

      {/* 今日精選贈品 */}
      {cpEvents && cpEvents.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <p className="text-xs text-gray-400 mb-1.5">今日精選贈品</p>
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 p-4">
          <div className="flex gap-2 px-1">
            {cpEvents.map((e, i) => {
              const giftName = e.topTag.split("－")[1] ?? e.topTag;
              const area = (e.location.match(/^([^\d]+)/)?.[1] ?? e.location).trim().slice(0, 9);
              const colorClass = CP_BADGE[e.score] ?? CP_BADGE[2];
              const isTop = i === 0;
              const card = (
                <CpCard
                  isTop={isTop}
                  colorClass={colorClass}
                  giftName={giftName}
                  area={area}
                />
              );
              return e.href ? (
                <Link key={i} href={e.href}>{card}</Link>
              ) : (
                <div key={i}>{card}</div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* 血液庫存儀表板 */}
      <BloodInventoryPanel
        onCenterSelect={onCenterSelect}
        selectedCenter={selectedCenter}
        initialInventory={initialInventory}
      />

      {/* 主要行動按鈕 */}
      <div
        className="flex gap-3 pt-1 animate-fade-in-up"
        style={{ animationDelay: "220ms" }}
      >
        <Button
          onClick={onFindNearby}
          size="lg"
          className="shimmer-btn flex-1 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-lg shadow-red-200/50 font-semibold h-12 text-base rounded-xl"
        >
          <MapPin className="w-5 h-5 mr-2" />
          找附近捐血點
        </Button>

        <Link href="/calendar" className="flex-shrink-0">
          <Button
            size="lg"
            variant="outline"
            className="border-gray-200 bg-white hover:bg-gray-50 h-12 w-12 rounded-xl p-0"
          >
            <Calendar className="w-5 h-5 text-gray-600" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
