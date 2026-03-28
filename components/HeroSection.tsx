"use client";

import { useRef, useEffect, useState } from "react";
import { MapPin, Calendar, Sparkles, TrendingUp, Gift, Heart, Film, Tag, Store, Coffee, Package, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const GIFT_ICONS: Record<string, LucideIcon> = {
  "movie-ticket": Film,
  "voucher": Tag,
  "convenience-store": Store,
  "food-beverage": Coffee,
  "daily-necessities": Package,
  "food": UtensilsCrossed,
};
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BloodInventoryPanel from "@/components/BloodInventoryPanel";
import { GIFTS } from "@/lib/giftConfig";


interface HeroSectionProps {
  todayCount: number;
  upcomingCount: number;
  todayGiftTags: string[];
  onFindNearby: () => void;
  onCenterSelect?: (center: string, withScroll?: boolean, toggle?: boolean) => void;
  selectedCenter?: string | null;
}

function GiftPills() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {GIFTS.map((g) => (
        <Link
          key={g.slug}
          href={`/gift/${g.slug}`}
          className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-200"
        >
          {(() => { const Icon = GIFT_ICONS[g.slug]; return Icon ? <Icon className="w-3 h-3" /> : null; })()}
          {g.name}
        </Link>
      ))}
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || value === 0) {
      setCount(value);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          observer.disconnect();
          let current = 0;
          const increment = Math.max(1, Math.ceil(value / 25));
          const timer = setInterval(() => {
            current = Math.min(current + increment, value);
            setCount(current);
            if (current >= value) clearInterval(timer);
          }, 40);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{count}</span>;
}

export default function HeroSection({
  todayCount,
  upcomingCount,
  todayGiftTags,
  onFindNearby,
  onCenterSelect,
  selectedCenter,
}: HeroSectionProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Hero Banner */}
      <div
        className="relative bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 rounded-2xl p-6 overflow-hidden animate-fade-in-up"
        style={{ animationDuration: "0.5s" }}
      >
        <div className="absolute right-0 top-0 w-36 h-36 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50 10 C50 10, 18 42, 18 62 C18 81 32 92 50 92 C68 92 82 81 82 62 C82 42 50 10 50 10 Z" fill="white" />
          </svg>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
          <Heart className="w-28 h-28 text-white" />
        </div>

        {/* Floating blood drops */}
        {[
          { w: 12, h: 15, left: "5%",  bottom: 18, delay: "0s",    dur: "4s"   },
          { w:  8, h: 10, left: "13%", bottom: 22, delay: "0.8s",  dur: "5.5s" },
          { w: 18, h: 22, left: "22%", bottom: 16, delay: "1.6s",  dur: "3.8s" },
          { w: 10, h: 13, left: "34%", bottom: 20, delay: "2.4s",  dur: "4.8s" },
          { w: 14, h: 18, left: "46%", bottom: 16, delay: "0.4s",  dur: "5.2s" },
          { w:  8, h: 10, left: "57%", bottom: 22, delay: "1.2s",  dur: "3.5s" },
          { w: 16, h: 20, left: "67%", bottom: 14, delay: "2.0s",  dur: "4.4s" },
          { w: 10, h: 13, left: "76%", bottom: 20, delay: "3.0s",  dur: "5.0s" },
          { w:  7, h:  9, left: "85%", bottom: 24, delay: "1.8s",  dur: "4.2s" },
          { w: 13, h: 16, left: "93%", bottom: 16, delay: "0.6s",  dur: "3.6s" },
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
            <svg viewBox="0 0 100 120" className="w-full h-full fill-white opacity-70">
              <path d="M50 8 C50 8, 14 58, 14 78 C14 99 30 112 50 112 C70 112 86 99 86 78 C86 58 50 8 50 8 Z" />
            </svg>
          </div>
        ))}

        <p className="text-red-200 text-xs font-medium uppercase tracking-widest mb-2">
          全台捐血資訊即時查詢
        </p>
        <h2 className="text-2xl font-extrabold text-white leading-snug">你的 300cc</h2>
        <p className="text-xl font-bold text-pink-200 mb-4">是別人的全部</p>

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
          <p className="text-xs font-medium text-emerald-600/80 mb-1">今日活動</p>
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
          <p className="text-xs font-medium text-blue-600/80 mb-1">即將開始</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            <AnimatedNumber value={upcomingCount} />
            <span className="text-sm font-normal text-gray-500 ml-1">場</span>
          </p>
          <p className="text-[11px] text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            查看即將活動 →
          </p>
        </a>
      </div>

      {/* 今日贈品提示 */}
      {todayGiftTags.length > 0 && (
        <div
          className="flex items-center gap-2.5 bg-amber-50 border border-amber-200/50 rounded-xl px-4 py-3 animate-fade-in-up"
          style={{ animationDelay: "180ms" }}
        >
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-amber-800">
            今日贈品：{todayGiftTags.join("、")}
          </p>
        </div>
      )}

      {/* 血液庫存儀表板 */}
      <BloodInventoryPanel onCenterSelect={onCenterSelect} selectedCenter={selectedCenter} />

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
