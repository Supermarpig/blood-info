"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, Calendar } from "lucide-react";
import { debounce } from "@/utils";
import CardInfo from "@/components/CardInfo";
import BackToTopButton from "@/components/BackToTopButton";
import { Button } from "@/components/ui/button";
import { useNearbyLocations } from "@/hooks/useNearbyLocations";
import NearbyLocationsModal from "@/components/NearbyLocationsModal";
import HeroSection from "@/components/HeroSection";
import FilterPanel from "@/components/FilterPanel";
import { REGIONS } from "@/lib/regionConfig";
import { GIFTS } from "@/lib/giftConfig";

interface DonationEvent {
  id?: string;
  time: string;
  organization: string;
  location: string;
  rawContent: string;
  customNote?: string;
  activityDate: string;
  center?: string;
  detailUrl?: string;
  tags?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  pttData?: {
    rawLine: string;
    images: string[];
    url: string;
    tags?: string[];
  };
}

interface SearchableDonationListProps {
  data: Record<string, DonationEvent[]>;
  /** 當前選中的地區 slug，undefined 表示全部 */
  currentRegionSlug?: string;
}

export default function SearchableDonationList({
  data,
  currentRegionSlug,
}: SearchableDonationListProps) {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState<boolean>(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  const {
    isLoading: isNearbyLoading,
    error: nearbyError,
    nearbyLocations,
    findNearbyLocations,
    clearResults,
  } = useNearbyLocations();

  // 使用台灣時區來判斷今日日期
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Taipei",
  });

  // 動態計算搜尋列高度
  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // 使用 useMemo 優化資料處理
  const { todayEvents, upcomingEvents, pastEvents } = useMemo(() => {
    const _pastEvents: Record<string, DonationEvent[]> = {};
    const _todayEvents: Record<string, DonationEvent[]> = {};
    const _upcomingEvents: Record<string, DonationEvent[]> = {};

    Object.entries(data).forEach(([date, events]) => {
      // 1. 篩選關鍵字
      const keywordFilteredEvents = events.filter(
        (event) =>
          event.organization.includes(searchKeyword) ||
          event.location.includes(searchKeyword) ||
          event.time.includes(searchKeyword)
      );

      // 2. 篩選贈品 tags
      const tagFilteredEvents =
        selectedTags.length === 0
          ? keywordFilteredEvents
          : keywordFilteredEvents.filter((event) => {
              const eventTags = event.tags || event.pttData?.tags || [];
              return selectedTags.some((tag) => eventTags.includes(tag));
            });

      if (tagFilteredEvents.length > 0) {
        if (date < today) {
          _pastEvents[date] = tagFilteredEvents;
        } else if (date === today) {
          _todayEvents[date] = tagFilteredEvents;
        } else {
          _upcomingEvents[date] = tagFilteredEvents;
        }
      }
    });

    return {
      todayEvents: _todayEvents,
      upcomingEvents: _upcomingEvents,
      pastEvents: _pastEvents,
    };
  }, [data, searchKeyword, selectedTags, today]);

  // 取得所有當前和未來的活動事件（用於找附近功能）
  const allCurrentEvents = useMemo(() => {
    const events: DonationEvent[] = [];
    Object.values(todayEvents).forEach((arr) => events.push(...arr));
    Object.values(upcomingEvents).forEach((arr) => events.push(...arr));
    return events;
  }, [todayEvents, upcomingEvents]);

  const handleFindNearby = async () => {
    setIsNearbyModalOpen(true);
    await findNearbyLocations(allCurrentEvents);
  };

  const handleCloseNearbyModal = () => {
    setIsNearbyModalOpen(false);
    clearResults();
  };

  const renderEventSection = (
    eventsByDate: Record<string, DonationEvent[]>,
    title: string,
    icon: React.ReactNode
  ) => {
    const dates = Object.keys(eventsByDate).sort();
    if (dates.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {dates.reduce((acc, date) => acc + eventsByDate[date].length, 0)} 場
          </span>
        </div>

        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date} className="relative">
              <div
                className="sticky z-10 py-2 -mx-4 px-4 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 mb-2"
                style={{ top: headerHeight }}
              >
                <h3 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {date}
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsByDate[date].map((donation, index) => (
                  <CardInfo
                    key={`${donation.id}-${index}`}
                    donation={donation}
                    searchKeyword={searchKeyword}
                    className="h-full"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 計算統計數據（供 HeroSection 使用）
  const todayCount = useMemo(() => {
    return Object.values(todayEvents).reduce((acc, arr) => acc + arr.length, 0);
  }, [todayEvents]);

  const upcomingCount = useMemo(() => {
    return Object.values(upcomingEvents).reduce(
      (acc, arr) => acc + arr.length,
      0
    );
  }, [upcomingEvents]);

  // 取得「今日」有的贈品類型（使用篩選後的資料）
  const todayGiftTags = useMemo(() => {
    const allTags = new Set<string>();
    Object.values(todayEvents).forEach((events) => {
      events.forEach((event) => {
        const tags = event.tags || event.pttData?.tags || [];
        tags.forEach((tag) => allTags.add(tag));
      });
    });
    return Array.from(allTags);
  }, [todayEvents]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section - 快速行動區 */}
      <HeroSection
        todayCount={todayCount}
        upcomingCount={upcomingCount}
        todayGiftTags={todayGiftTags}
        onFindNearby={handleFindNearby}
      />

      {/* 搜尋與篩選區 */}
      <div
        ref={headerRef}
        className="sticky top-0 z-20 bg-white/95 backdrop-blur-md py-3 mb-4 -mx-2 px-2"
      >
        {/* 搜尋框 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜尋機構、地點..."
            onChange={debounce(
              (e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchKeyword(e.target.value),
              300
            )}
            className="pl-9 bg-white border-slate-200 focus:border-primary w-full"
          />
        </div>

        {/* 篩選面板 */}
        <FilterPanel
          currentRegionSlug={currentRegionSlug}
          selectedTags={selectedTags}
          onTagChange={setSelectedTags}
        />
      </div>

      {/* 主要內容區 */}
      <div className="space-y-8 pb-20">
        {/* 今日活動 */}
        {renderEventSection(
          todayEvents,
          "今日活動",
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}

        {/* 未來活動 */}
        {renderEventSection(
          upcomingEvents,
          "即將開始",
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-1"></span>
        )}

        {/* 歷史活動控制 */}
        <div className="pt-8 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-12"
          >
            {showPastEvents ? (
              <>
                <ChevronUp className="w-4 h-4" />
                隱藏已過期的活動
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                查看已過期的活動 ({Object.keys(pastEvents).length} 天)
              </>
            )}
          </Button>

          {showPastEvents && (
            <div className="mt-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {renderEventSection(
                pastEvents,
                "已過期活動",
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 相關連結區塊 - Internal Linking for SEO */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">探索更多</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 地區快速導航 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              按地區瀏覽
            </h3>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <Link
                  key={region.slug}
                  href={`/region/${region.slug}`}
                  className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  {region.displayName}
                </Link>
              ))}
            </div>
          </div>
          {/* 贈品分類 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              按贈品瀏覽
            </h3>
            <div className="flex flex-wrap gap-2">
              {GIFTS.map((gift) => (
                <Link
                  key={gift.slug}
                  href={`/gift/${gift.slug}`}
                  className="text-sm px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                >
                  {gift.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {/* FAQ 連結 */}
        <div className="mt-4 flex items-center gap-4">
          <Link
            href="/calendar"
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            月曆模式 →
          </Link>
          <Link
            href="/faq"
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            捐血常見問題 (FAQ) →
          </Link>
        </div>
      </div>

      <BackToTopButton />

      {/* 附近捐血點 Modal */}
      <NearbyLocationsModal
        isOpen={isNearbyModalOpen}
        onClose={handleCloseNearbyModal}
        isLoading={isNearbyLoading}
        error={nearbyError}
        locations={nearbyLocations}
      />
    </div>
  );
}
