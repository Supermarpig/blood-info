"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Film,
  Ticket,
  Store,
  Coffee,
  Package,
  UtensilsCrossed,
  Gift,
  X,
  MapPin,
} from "lucide-react";
import { debounce } from "@/utils";
import CardInfo from "@/components/CardInfo";
import BackToTopButton from "@/components/BackToTopButton";
import { Button } from "@/components/ui/button";
import { useNearbyLocations } from "@/hooks/useNearbyLocations";
import NearbyLocationsModal from "@/components/NearbyLocationsModal";
import { REGIONS } from "@/lib/regionConfig";

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

// 贈品 tag 選項
const GIFT_TAGS = [
  { id: "電影票", label: "電影票", icon: Film },
  { id: "禮券", label: "禮券", icon: Ticket },
  { id: "超商", label: "超商", icon: Store },
  { id: "餐飲", label: "餐飲", icon: Coffee },
  { id: "生活用品", label: "生活用品", icon: Package },
  { id: "食品", label: "食品", icon: UtensilsCrossed },
];

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* 頂部搜尋與篩選區 */}
      <div
        ref={headerRef}
        className="sticky top-0 z-20 bg-white/80 backdrop-blur-md pb-4 pt-2 mb-6 border-b border-gray-100"
      >
        {/* 地區導航 - 使用 Link 進行路由導航 */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          <Link
            href="/"
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              !currentRegionSlug
                ? "bg-red-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            全部
          </Link>
          {REGIONS.map((region) => (
            <Link
              key={region.slug}
              href={`/region/${region.slug}`}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentRegionSlug === region.slug
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {region.displayName}
            </Link>
          ))}
        </div>

        {/* 搜尋框 + 找附近按鈕 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:max-w-md">
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

          {/* 找附近按鈕 */}
          <Button
            variant="outline"
            onClick={handleFindNearby}
            className="flex-shrink-0 gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 px-3"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">找附近</span>
          </Button>
        </div>

        {/* 贈品 Tag 篩選 - 單行水平滾動 */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-shrink-0 flex items-center gap-1.5 text-pink-500">
            <Gift className="w-4 h-4" />
          </div>

          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <div className="flex items-center gap-1.5">
              {GIFT_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                const IconComponent = tag.icon;
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        isSelected
                          ? prev.filter((t) => t !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      isSelected
                        ? "bg-pink-500 text-white shadow-sm"
                        : "bg-pink-50 text-pink-600 hover:bg-pink-100"
                    }`}
                  >
                    <IconComponent className="w-3 h-3" />
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
              title="清除篩選"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
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
              {GIFT_TAGS.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/gift/${
                    tag.id === "電影票"
                      ? "movie-ticket"
                      : tag.id === "禮券"
                      ? "voucher"
                      : tag.id === "超商"
                      ? "convenience-store"
                      : tag.id === "餐飲"
                      ? "food-beverage"
                      : tag.id === "生活用品"
                      ? "daily-necessities"
                      : "food"
                  }`}
                  className="text-sm px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {/* FAQ 連結 */}
        <div className="mt-4">
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
