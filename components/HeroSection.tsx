"use client";

import { MapPin, Calendar, Sparkles, TrendingUp, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BloodInventoryPanel from "@/components/BloodInventoryPanel";

interface HeroSectionProps {
  todayCount: number;
  upcomingCount: number;
  todayGiftTags: string[];
  onFindNearby: () => void;
}

export default function HeroSection({
  todayCount,
  upcomingCount,
  todayGiftTags,
  onFindNearby,
}: HeroSectionProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* 統計卡片組 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 今日活動 */}
        <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50 hover:shadow-md transition-all duration-300">
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-emerald-600/80 mb-1">
            今日活動
          </p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {todayCount}
            <span className="text-sm font-normal text-gray-500 ml-1">場</span>
          </p>
        </div>

        {/* 即將開始 */}
        <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50 hover:shadow-md transition-all duration-300">
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-blue-600/80 mb-1">即將開始</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {upcomingCount}
            <span className="text-sm font-normal text-gray-500 ml-1">場</span>
          </p>
        </div>
      </div>

      {/* 今日贈品提示 - 動態顯示 */}
      {todayGiftTags.length > 0 && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200/50 rounded-xl px-4 py-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-amber-800">
            今日贈品：{todayGiftTags.join("、")}
          </p>
        </div>
      )}

      {/* 血液庫存儀表板 */}
      <BloodInventoryPanel />

      {/* 主要行動按鈕 */}
      <div className="flex gap-3 pt-1">
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
      </div>
    </div>
  );
}
