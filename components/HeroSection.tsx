"use client";

import { useRef, useEffect, useState } from "react";
import { MapPin, Calendar, Sparkles, TrendingUp, Gift, Heart, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BloodInventoryPanel from "@/components/BloodInventoryPanel";
import { motion, useInView } from "framer-motion";

interface HeroSectionProps {
  todayCount: number;
  upcomingCount: number;
  todayGiftTags: string[];
  onFindNearby: () => void;
  onCenterSelect?: (center: string) => void;
  selectedCenter?: string | null;
}

function AnimatedNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    if (value === 0) {
      setCount(0);
      return;
    }
    let current = 0;
    const increment = Math.max(1, Math.ceil(value / 25));
    const timer = setInterval(() => {
      current = Math.min(current + increment, value);
      setCount(current);
      if (current >= value) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [isInView, value]);

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
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 rounded-2xl p-6 overflow-hidden"
      >
        {/* 背景血滴裝飾 */}
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-red-200 text-xs font-medium uppercase tracking-widest mb-2"
        >
          全台捐血資訊即時查詢
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className="text-2xl font-extrabold text-white leading-snug"
        >
          你的 300cc
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
          className="text-xl font-bold text-pink-200 mb-4"
        >
          是別人的全部
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <a
            href="#today-events"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            <Droplets className="w-4 h-4" />
            今日 {todayCount} 場活動 →
          </a>
        </motion.div>
      </motion.div>

      {/* 統計卡片組 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 今日活動 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50 hover:shadow-md transition-all duration-300"
        >
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-emerald-600/80 mb-1">今日活動</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            <AnimatedNumber value={todayCount} />
            <span className="text-sm font-normal text-gray-500 ml-1">場</span>
          </p>
        </motion.div>

        {/* 即將開始 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50 hover:shadow-md transition-all duration-300"
        >
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-blue-600/80 mb-1">即將開始</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            <AnimatedNumber value={upcomingCount} />
            <span className="text-sm font-normal text-gray-500 ml-1">場</span>
          </p>
        </motion.div>
      </div>

      {/* 今日贈品提示 */}
      {todayGiftTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-2.5 bg-amber-50 border border-amber-200/50 rounded-xl px-4 py-3"
        >
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-amber-800">
            今日贈品：{todayGiftTags.join("、")}
          </p>
        </motion.div>
      )}

      {/* 血液庫存儀表板 */}
      <BloodInventoryPanel onCenterSelect={onCenterSelect} selectedCenter={selectedCenter} />

      {/* 主要行動按鈕 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3 pt-1"
      >
        <Button
          onClick={onFindNearby}
          size="lg"
          className="flex-1 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-lg shadow-red-200/50 font-semibold h-12 text-base rounded-xl"
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
      </motion.div>
    </div>
  );
}
