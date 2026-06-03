"use client";

import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);
import Link from "next/link";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { debounce } from "@/utils";
import CardInfo from "@/components/CardInfo";
import AdCard from "@/components/AdCard";
import BackToTopButton from "@/components/BackToTopButton";
import { Button } from "@/components/ui/button";
import { useNearbyLocations } from "@/hooks/useNearbyLocations";
import HeroSection from "@/components/HeroSection";
import type { BloodInventory } from "@/components/BloodInventoryPanel";
import NearbyMapSection from "@/components/NearbyMapSection";
import FilterPanel from "@/components/FilterPanel";
import { REGIONS } from "@/lib/regionConfig";
import { GIFTS } from "@/lib/giftConfig";
import { getCityBySlug } from "@/lib/cityConfig";
import { getRegionBySlug } from "@/lib/regionConfig";
import { getEventCpScore, getTopSubTag } from "@/lib/cpScore";
import { eventShortId } from "@/lib/eventId";

// 每 AD_INTERVAL 張捐血卡片後插入一張廣告卡
const AD_INTERVAL = 10;
const AD_SLOT_FEED = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED;

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
  subTags?: string[];
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
  /** 當前選中的城市 slug */
  currentCitySlug?: string;
  /** 靜態 filter 標籤（如贈品頁的贈品名稱），會固定顯示在卡片標題前 */
  staticFilterLabel?: string;
  initialInventory?: BloodInventory;
}

export default function SearchableDonationList({
  data,
  currentRegionSlug,
  currentCitySlug,
  staticFilterLabel,
  initialInventory,
}: SearchableDonationListProps) {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false);
  const [daysAhead, setDaysAhead] = useState<number>(0);
  const [todayCardLimit, setTodayCardLimit] = useState<number>(10);
  const todaySentinelRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const captureFlipState = useCallback(() => {
    if (!contentRef.current) return;
    const cards = contentRef.current.querySelectorAll(".card-item");
    if (cards.length > 0) flipStateRef.current = Flip.getState(cards);
  }, []);

  const handleTagChange = useCallback((tags: string[]) => {
    captureFlipState();
    setSelectedTags(tags);
  }, [captureFlipState]);

  const handleCenterChange = useCallback((center: string | null) => {
    captureFlipState();
    setSelectedCenter(center);
  }, [captureFlipState]);

  useLayoutEffect(() => {
    if (!flipStateRef.current) return;
    const state = flipStateRef.current;
    flipStateRef.current = null;
    Flip.from(state, {
      duration: 0.35,
      ease: "power2.out",
      stagger: 0.015,
      onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.15 }),
      onEnter: (els) => gsap.from(els, { opacity: 0, duration: 0.25 }),
    });
  }, [selectedCenter, selectedTags, searchKeyword]);


  useEffect(() => {
    const sentinel = todaySentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setTodayCardLimit((p) => p + 15); },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const {
    isLoading: isNearbyLoading,
    error: nearbyError,
    nearbyLocations,
    userLocation,
    findNearbyLocations,
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

      // 2. 篩選地區（center）
      const centerFilteredEvents =
        selectedCenter
          ? keywordFilteredEvents.filter((event) => event.center === selectedCenter)
          : keywordFilteredEvents;

      // 3. 篩選贈品 tags
      const tagFilteredEvents =
        selectedTags.length === 0
          ? centerFilteredEvents
          : centerFilteredEvents.filter((event) => {
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
  }, [data, searchKeyword, selectedTags, selectedCenter, today]);

  const visibleUpcomingEvents = useMemo(() => {
    if (daysAhead === 0) return {};
    const [y, m, d] = today.split("-").map(Number);
    const cutoff = new Date(y, m - 1, d + daysAhead);
    const cutoffStr = cutoff.toLocaleDateString("en-CA");
    return Object.fromEntries(
      Object.entries(upcomingEvents)
        .filter(([date]) => date <= cutoffStr)
        .sort(([a], [b]) => a.localeCompare(b))
    );
  }, [upcomingEvents, daysAhead, today]);

  const visibleTodayEvents = useMemo(() => {
    return Object.fromEntries(
      Object.entries(todayEvents).map(([d, events]) => [d, events.slice(0, todayCardLimit)])
    );
  }, [todayEvents, todayCardLimit]);

  const totalTodayCards = useMemo(
    () => Object.values(todayEvents).reduce((s, arr) => s + arr.length, 0),
    [todayEvents]
  );
  const hasMoreToday = totalTodayCards > todayCardLimit;


  // 取得所有當前和未來的活動事件（用於找附近功能，隨日期範圍篩選更新）
  const allCurrentEvents = useMemo(() => {
    const events: DonationEvent[] = [];
    Object.values(todayEvents).forEach((arr) => events.push(...arr));
    Object.values(visibleUpcomingEvents).forEach((arr) => events.push(...arr));
    return events;
  }, [todayEvents, visibleUpcomingEvents]);

  const handleCenterSelect = (centerName: string, withScroll = true, toggle = true) => {
    captureFlipState();
    setSelectedCenter((prev) => (toggle && prev === centerName ? null : centerName));
    if (withScroll) {
      setTimeout(() => {
        document.getElementById("today-events")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  // 城市/地區頁用 centerFilter 篩選捐血室，避免跨地區污染
  const roomCenterFilter = useMemo<string | undefined>(() => {
    if (currentCitySlug) return getCityBySlug(currentCitySlug)?.centerFilter;
    if (currentRegionSlug) return getRegionBySlug(currentRegionSlug)?.centerFilter;
    return undefined;
  }, [currentCitySlug, currentRegionSlug]);

  // tag 篩選或贈品頁才略過靜態捐血室（避免混入無贈品的地標）；地區篩選改用 centerFilter 篩選室地
  const skipStaticRooms = selectedTags.length > 0 || !!staticFilterLabel;
  const effectiveCenterFilter = selectedCenter ?? roomCenterFilter;

  const handleFindNearby = async () => {
    document.getElementById("nearby-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    await findNearbyLocations(allCurrentEvents, skipStaticRooms, effectiveCenterFilter);
  };

  // 自動重算：快取位置恢復或 events 變動時觸發，有結果才隨篩選條件重算
  const hasAutoTriggered = useRef(false);
  useEffect(() => {
    if (!userLocation || allCurrentEvents.length === 0) return;
    if (!hasAutoTriggered.current || nearbyLocations.length > 0) {
      hasAutoTriggered.current = true;
      findNearbyLocations(allCurrentEvents, skipStaticRooms, effectiveCenterFilter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCurrentEvents, userLocation]);


  const renderEventSection = (
    eventsByDate: Record<string, DonationEvent[]>,
    title: string,
    icon: React.ReactNode
  ) => {
    const dates = Object.keys(eventsByDate).sort();
    if (dates.length === 0) return null;

    return (
      <div className="mb-8 animate-fade-in-up">
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
                {eventsByDate[date].flatMap((donation, index) => {
                  const card = (
                    <div
                      key={`${donation.id}-${index}`}
                      className="card-item h-full"
                    >
                      <CardInfo
                        donation={donation}
                        searchKeyword={searchKeyword}
                        className="h-full"
                      />
                    </div>
                  );
                  // 每 AD_INTERVAL 張卡後插入一張廣告卡（占 grid 一格）
                  if (AD_SLOT_FEED && (index + 1) % AD_INTERVAL === 0) {
                    return [
                      card,
                      <AdCard
                        key={`ad-${date}-${index}`}
                        slot={AD_SLOT_FEED}
                        variant="card"
                      />,
                    ];
                  }
                  return [card];
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 計算統計數據（供 HeroSection 使用）
  const todayCount = useMemo(
    () => Object.values(todayEvents).reduce((acc, arr) => acc + arr.length, 0),
    [todayEvents]
  );
  const upcomingCount = useMemo(
    () => Object.values(upcomingEvents).reduce((acc, arr) => acc + arr.length, 0),
    [upcomingEvents]
  );

  const cpEvents = useMemo(() => {
    const allVisible = [
      ...Object.values(todayEvents).flat(),
      ...Object.values(visibleUpcomingEvents).flat(),
    ];
    return allVisible
      .filter((e) => e.subTags?.length)
      .map((e) => ({
        href: e.id ? `/activity/${e.activityDate}-${eventShortId(e.id)}` : undefined,
        location: e.location,
        score: getEventCpScore(e.subTags),
        topTag: getTopSubTag(e.subTags),
      }))
      .filter((e) => e.score >= 2 && e.topTag)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) as { href?: string; location: string; score: number; topTag: string }[];
  }, [todayEvents, visibleUpcomingEvents]);

  // 各血液中心大概座標，用來判斷使用者最近的區域
  const CENTER_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
    台北: { lat: 25.05, lng: 121.53, name: "北區" },
    新竹: { lat: 24.80, lng: 120.97, name: "桃竹苗" },
    台中: { lat: 24.15, lng: 120.67, name: "中區" },
    高雄: { lat: 22.63, lng: 120.30, name: "南區" },
  };

  const nearbyCpEvents = useMemo(() => {
    if (!userLocation) return [];

    // 找距離使用者最近的血液中心
    const nearestCenter = Object.entries(CENTER_COORDS)
      .map(([key, c]) => {
        const dLat = (userLocation.lat - c.lat) * Math.PI / 180;
        const dLng = (userLocation.lng - c.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(c.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return { key, name: c.name, dist: 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) };
      })
      .sort((a, b) => a.dist - b.dist)[0];

    // 附近推薦：跟 chip 一致，但至少往後 3 天（避免今天選 0 卻毫無資料）
    const lookAhead = Math.max(daysAhead, 3);
    const [y, m, d] = today.split("-").map(Number);
    const cutoff = new Date(y, m - 1, d + lookAhead).toLocaleDateString("en-CA");
    const pool = [
      ...Object.values(todayEvents).flat(),
      ...Object.entries(upcomingEvents)
        .filter(([date]) => date <= cutoff)
        .flatMap(([, evts]) => evts),
    ];

    return pool
      .filter((e) => e.center === nearestCenter.key && e.subTags?.length)
      .map((e) => ({
        href: e.id ? `/activity/${e.activityDate}-${eventShortId(e.id)}` : undefined,
        location: `${e.activityDate.slice(5).replace("-", "/")} ${e.location}`,
        score: getEventCpScore(e.subTags),
        topTag: getTopSubTag(e.subTags),
      }))
      .filter((e): e is typeof e & { topTag: string } => e.score >= 2 && e.topTag != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, todayEvents, visibleUpcomingEvents]);

  const filterLabel = useMemo(() => {
    const parts: string[] = [];
    if (staticFilterLabel) parts.push(staticFilterLabel);
    if (selectedCenter) {
      const region = REGIONS.find((r) => r.centerFilter === selectedCenter);
      if (region) parts.push(region.displayName);
    }
    if (selectedTags.length > 0) {
      parts.push(selectedTags.join("、"));
    }
    return parts.join("");
  }, [staticFilterLabel, selectedCenter, selectedTags]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section - 快速行動區 */}
      <HeroSection
        todayCount={todayCount}
        upcomingCount={upcomingCount}
        cpEvents={cpEvents}
        onFindNearby={handleFindNearby}
        onCenterSelect={handleCenterSelect}
        selectedCenter={selectedCenter}
        filterLabel={filterLabel}
        initialInventory={initialInventory}
        daysAhead={daysAhead}
        onDaysAheadChange={setDaysAhead}
        nearbyCpEvents={nearbyCpEvents}
      />

      {/* ── 離你最近的捐血點 ── */}
      <NearbyMapSection
        nearbyLocations={nearbyLocations}
        userLocation={userLocation}
        isLoading={isNearbyLoading}
        error={nearbyError}
        onRetry={handleFindNearby}
      />

      {/* 搜尋與篩選區 */}
      <div
        ref={headerRef}
        className="sticky top-0 z-20 bg-white/95 backdrop-blur-md py-3 mb-4 -mx-2 px-2"
      >
        {/* 篩選面板 */}
        <FilterPanel
          currentRegionSlug={currentRegionSlug}
          currentCitySlug={currentCitySlug}
          selectedTags={selectedTags}
          onTagChange={handleTagChange}
          selectedCenter={selectedCenter}
          onCenterChange={handleCenterChange}
          onSearchChange={debounce(
            (e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchKeyword(e.target.value),
            300
          )}
        />
      </div>
      <div id="today-events" className="scroll-mt-44" />
      {/* 主要內容區 */}
      <div ref={contentRef} className="space-y-8 pb-20">
        {/* 今日活動 */}
        {renderEventSection(
          visibleTodayEvents,
          "今日活動",
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
        {hasMoreToday && <div ref={todaySentinelRef} className="h-px" />}

        {/* 未來活動 */}
        <div id="upcoming-events" className="scroll-mt-44" />
        {renderEventSection(
          visibleUpcomingEvents,
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

    </div>
  );
}
