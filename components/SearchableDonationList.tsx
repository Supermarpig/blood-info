"use client";

import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);
import Link from "@/components/Link";
import { Calendar } from "lucide-react";
import { debounce } from "@/utils";
import CardInfo from "@/components/CardInfo";
import AdCard from "@/components/AdCard";
import BackToTopButton from "@/components/BackToTopButton";
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
import { normalizeSearchText } from "@/lib/searchNormalize";

// 每 AD_INTERVAL 張捐血卡片後插入一張廣告卡
const AD_INTERVAL = 10;
const AD_SLOT_FEED = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED;

/** 「本週」採滾動 7 天（今天起算 7 天內），而非日曆週 */
const WEEK_DAYS_AHEAD = 7;

type TabKey = "today" | "week" | "upcoming" | "past";

const TABS: { key: TabKey; label: string; dot: string }[] = [
  { key: "today", label: "今日活動", dot: "bg-green-500" },
  { key: "week", label: "本週捐血活動", dot: "bg-amber-500" },
  { key: "upcoming", label: "即將開始", dot: "bg-blue-500" },
  { key: "past", label: "已過期", dot: "bg-gray-400" },
];

/**
 * 跨日期累計裁切到 limit 張卡。
 *
 * 原本只有「今日」需要分批載入，且只有一個日期，所以直接對單日 slice 就夠。
 * 改成 tab 後每個分頁都可能橫跨多天（本週有數百場），必須跨日期累計計算，
 * 否則「每天各取 N 張」會一次塞進上千張卡。
 */
function limitEventsByDate<T>(
  eventsByDate: Record<string, T[]>,
  limit: number
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  let used = 0;
  for (const date of Object.keys(eventsByDate).sort()) {
    if (used >= limit) break;
    const take = eventsByDate[date].slice(0, limit - used);
    if (take.length > 0) {
      out[date] = take;
      used += take.length;
    }
  }
  return out;
}

function countEvents<T>(eventsByDate: Record<string, T[]>): number {
  return Object.values(eventsByDate).reduce((s, arr) => s + arr.length, 0);
}

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

/** 「7/28 二」這種短標籤，日期分頁列用 */
function shortDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAY[new Date(y, m - 1, d).getDay()];
  return `${m}/${d} ${wd}`;
}

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
  const [daysAhead, setDaysAhead] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [cardLimit, setCardLimit] = useState<number>(30);
  const listSentinelRef = useRef<HTMLDivElement>(null);
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

  /**
   * 分頁與 Hero 的日期範圍 chip 接成同一套狀態，避免兩個控制項各說各話。
   * 「7天」chip 與「本週」分頁是同一個範圍，所以互相對應；選「即將開始」則把範圍放到最寬。
   */
  const handleTabSelect = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "today") setDaysAhead(0);
    else if (tab === "week") setDaysAhead(WEEK_DAYS_AHEAD);
    else if (tab === "upcoming") setDaysAhead(0);
  }, []);

  const handleDaysAheadChange = useCallback((days: number) => {
    setDaysAhead(days);
    if (days === 0) setActiveTab("today");
    else if (days === WEEK_DAYS_AHEAD) setActiveTab("week");
    else setActiveTab("upcoming");
  }, []);

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
    const sentinel = listSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setCardLimit((p) => p + 30); },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab]);

  // 換分頁或改篩選條件時，卡片數量重新從第一批開始
  useEffect(() => {
    setCardLimit(30);
  }, [activeTab, selectedDate, searchKeyword, selectedTags, selectedCenter, daysAhead]);

  // 換分頁或改篩選條件時，日期選擇回到「全部」，避免停在已不存在的日期上
  useEffect(() => {
    setSelectedDate(null);
  }, [activeTab, searchKeyword, selectedTags, selectedCenter, daysAhead]);

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
      const normalizedKeyword = normalizeSearchText(searchKeyword);
      const keywordFilteredEvents = events.filter(
        (event) =>
          normalizeSearchText(event.organization).includes(normalizedKeyword) ||
          normalizeSearchText(event.location).includes(normalizedKeyword) ||
          normalizeSearchText(event.time).includes(normalizedKeyword)
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

  /** 本週＝今天起算 7 天內（含今天），跨越「今日」與「即將開始」兩組資料 */
  const weekEvents = useMemo(() => {
    const [y, m, d] = today.split("-").map(Number);
    const cutoff = new Date(y, m - 1, d + WEEK_DAYS_AHEAD);
    const cutoffStr = cutoff.toLocaleDateString("en-CA");
    return Object.fromEntries(
      [...Object.entries(todayEvents), ...Object.entries(upcomingEvents)]
        .filter(([date]) => date <= cutoffStr)
        .sort(([a], [b]) => a.localeCompare(b))
    );
  }, [todayEvents, upcomingEvents, today]);

  /**
   * 「即將開始」分頁的資料。Hero 上的日期範圍 chip（daysAhead）沒選時是 0，
   * 原本會讓 visibleUpcomingEvents 直接變成空物件——分頁化之後那會讓整個分頁開起來是空的，
   * 所以未選範圍時顯示全部未來活動，選了才收斂。
   * 注意不要改動 visibleUpcomingEvents 本身，它同時餵給「找附近」與精選贈品，語意不同。
   */
  const upcomingTabEvents = useMemo(
    () => (daysAhead === 0 ? upcomingEvents : visibleUpcomingEvents),
    [daysAhead, upcomingEvents, visibleUpcomingEvents]
  );

  const tabDataset: Record<TabKey, Record<string, DonationEvent[]>> = useMemo(
    () => ({
      today: todayEvents,
      week: weekEvents,
      upcoming: upcomingTabEvents,
      past: pastEvents,
    }),
    [todayEvents, weekEvents, upcomingTabEvents, pastEvents]
  );

  /** 分頁下方的範圍說明，讓「本週」到底算到哪一天不用猜 */
  const activeTabHint = useMemo(() => {
    const fmt = (iso: string) => {
      const [, m, d] = iso.split("-");
      return `${Number(m)}/${Number(d)}`;
    };
    if (activeTab === "today") return `${today}（今天）`;
    if (activeTab === "week") {
      const [y, m, d] = today.split("-").map(Number);
      const end = new Date(y, m - 1, d + WEEK_DAYS_AHEAD);
      return `${fmt(today)}–${fmt(end.toLocaleDateString("en-CA"))}，今天起算 ${WEEK_DAYS_AHEAD} 天內的活動`;
    }
    if (activeTab === "upcoming") {
      return daysAhead === 0
        ? "今天之後的所有活動（可用上方日期範圍縮小）"
        : `今天之後 ${daysAhead} 天內的活動`;
    }
    return "已經結束的活動";
  }, [activeTab, today, daysAhead]);

  const activeEvents = tabDataset[activeTab];

  /** 分頁內再依日期切一層：本週有 300+ 場橫跨 7 天，全部堆在一起太難找 */
  const activeDates = useMemo(
    () => Object.keys(activeEvents).sort(),
    [activeEvents]
  );

  const dateFilteredEvents = useMemo(() => {
    if (!selectedDate || !activeEvents[selectedDate]) return activeEvents;
    return { [selectedDate]: activeEvents[selectedDate] };
  }, [activeEvents, selectedDate]);

  const activeTotal = useMemo(
    () => countEvents(dateFilteredEvents),
    [dateFilteredEvents]
  );
  const visibleActiveEvents = useMemo(
    () => limitEventsByDate(dateFilteredEvents, cardLimit),
    [dateFilteredEvents, cardLimit]
  );
  const hasMoreCards = activeTotal > cardLimit;


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


  const renderEventGrid = (eventsByDate: Record<string, DonationEvent[]>) => {
    const dates = Object.keys(eventsByDate).sort();
    if (dates.length === 0) return null;

    return (
      <div className="mb-8 animate-fade-in-up">
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
        subTags: e.subTags,
      }))
      .filter((e) => e.score >= 2 && e.topTag)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) as { href?: string; location: string; score: number; topTag: string; subTags?: string[] }[];
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

    // 計算使用者到各血液中心的距離
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const dLat = (lat1 - lat2) * Math.PI / 180;
      const dLng = (lng1 - lng2) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    const centerDists = Object.fromEntries(
      Object.entries(CENTER_COORDS).map(([key, c]) => [key, haversine(userLocation.lat, userLocation.lng, c.lat, c.lng)])
    );
    const nearestCenter = Object.entries(centerDists).sort((a, b) => a[1] - b[1])[0];
    const nearestCenterKey = nearestCenter[0];

    // 今天選 0 時至少往後看 3 天，避免資料太少
    const lookAhead = Math.max(daysAhead ?? 0, 3);
    const [y, m, d] = today.split("-").map(Number);
    const cutoff = new Date(y, m - 1, d + lookAhead).toLocaleDateString("en-CA");
    const pool = [
      ...Object.values(todayEvents).flat(),
      ...Object.entries(upcomingEvents)
        .filter(([date]) => date <= cutoff)
        .flatMap(([, evts]) => evts),
    ];

    const nearby = pool
      .filter((e) => e.center === nearestCenterKey && e.subTags?.length)
      .map((e) => ({
        href: e.id ? `/activity/${e.activityDate}-${eventShortId(e.id)}` : undefined,
        location: `${e.activityDate.slice(5).replace("-", "/")} ${e.location}`,
        score: getEventCpScore(e.subTags),
        topTag: getTopSubTag(e.subTags),
        subTags: e.subTags,
        isFallback: false,
      }))
      .filter((e): e is typeof e & { topTag: string } => e.score >= 2 && e.topTag != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (nearby.length >= 3) return nearby;

    // PTT 活動沒有 center 區域，改用地點文字推斷最近的血液中心距離
    const PTT_REGION_KEYWORDS: Record<string, string[]> = {
      台北: ["台北", "新北", "基隆", "台北市", "新北市"],
      新竹: ["新竹", "桃園", "苗栗", "宜蘭", "新竹市", "桃園市"],
      台中: ["台中", "彰化", "南投", "雲林", "台中市", "彰化縣"],
      高雄: ["高雄", "台南", "嘉義", "屏東", "台東", "花蓮", "高雄市", "台南市"],
    };
    const getPttDist = (location: string): number => {
      for (const [center, keywords] of Object.entries(PTT_REGION_KEYWORDS)) {
        if (keywords.some((kw) => location.includes(kw))) return centerDists[center] ?? 9999;
      }
      return 9999;
    };

    // 附近資料不足時補上全台活動，依距離排序（近的優先），同距離再依分數排
    const nearbyHrefs = new Set(nearby.map((e) => e.href));
    const fallback = pool
      .filter((e) => e.subTags?.length && !(e.id && nearbyHrefs.has(`/activity/${e.activityDate}-${eventShortId(e.id)}`)))
      .map((e) => {
        const dist = e.center === "PTT"
          ? getPttDist(e.location ?? "")
          : (e.center ? centerDists[e.center] : undefined) ?? 9999;
        return {
          href: e.id ? `/activity/${e.activityDate}-${eventShortId(e.id)}` : undefined,
          location: `${e.activityDate.slice(5).replace("-", "/")} ${e.location}`,
          score: getEventCpScore(e.subTags),
          topTag: getTopSubTag(e.subTags),
          subTags: e.subTags,
          isFallback: true,
          centerDist: dist,
        };
      })
      .filter((e): e is typeof e & { topTag: string } => e.score >= 2 && e.topTag != null)
      .sort((a, b) => a.centerDist - b.centerDist || b.score - a.score)
      .slice(0, 5 - nearby.length);

    return [...nearby, ...fallback];
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
        onDaysAheadChange={handleDaysAheadChange}
        onTabSelect={handleTabSelect}
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
      <div id="upcoming-events" className="scroll-mt-44" />

      {/* 分頁切換：今日 / 本週 / 即將開始 / 已過期 */}
      <div
        role="tablist"
        aria-label="捐血活動時間範圍"
        className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-2 px-2 scrollbar-none"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          const count = countEvents(tabDataset[tab.key]);
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              onClick={() => handleTabSelect(tab.key)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${active ? "bg-white" : tab.dot}`}
              />
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                  active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 日期分頁：分頁內橫跨多天時才出現 */}
      {activeDates.length > 1 && (
        <div
          role="tablist"
          aria-label="依日期篩選"
          className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-2 px-2 scrollbar-none"
        >
          <button
            role="tab"
            aria-selected={selectedDate === null}
            onClick={() => setSelectedDate(null)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedDate === null
                ? "border-gray-800 bg-gray-100 text-gray-900"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            全部 {countEvents(activeEvents)}
          </button>
          {activeDates.map((date) => {
            const active = selectedDate === date;
            return (
              <button
                key={date}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedDate(date)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-gray-800 bg-gray-100 text-gray-900"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {shortDateLabel(date)}
                <span className="ml-1 font-normal text-gray-400">
                  {activeEvents[date].length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 主要內容區 */}
      <div ref={contentRef} className="space-y-8 pb-20">
        <div key={`${activeTab}-${selectedDate ?? "all"}`}>
          <p className="mb-3 text-xs text-gray-400">{activeTabHint}</p>
          {activeTotal > 0 ? (
            renderEventGrid(visibleActiveEvents)
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-600">
                這個範圍目前沒有符合條件的捐血活動
              </p>
              <p className="mt-1 text-xs text-gray-400">
                試著清除搜尋或篩選條件，或切換到其他時間範圍看看。
              </p>
              {activeTab !== "upcoming" && (
                <button
                  type="button"
                  onClick={() => handleTabSelect("upcoming")}
                  className="mt-4 inline-flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  看所有即將開始的活動
                </button>
              )}
            </div>
          )}
          {hasMoreCards && <div ref={listSentinelRef} className="h-px" />}
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
