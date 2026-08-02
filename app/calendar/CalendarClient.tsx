"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarDays,
  MapPin,
  Gift,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNearbyLocations } from "@/hooks/useNearbyLocations";
import NearbyLocationsModal from "@/components/NearbyLocationsModal";
import Link from "@/components/Link";
import { zhTW } from "date-fns/locale";
import Image from "next/image";
import {
  getTopLevelCities,
  getCityBySlug,
  filterEventsByCity,
} from "@/lib/cityConfig";
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

type DonationData = Record<string, DonationEvent[]>;
type ViewMode = "calendar" | "list";

const TAG_COLORS: Record<string, string> = {
  超商: "bg-blue-100 text-blue-700",
  禮券: "bg-yellow-100 text-yellow-700",
  食品: "bg-green-100 text-green-700",
  餐飲: "bg-orange-100 text-orange-700",
  生活用品: "bg-purple-100 text-purple-700",
  電影票: "bg-pink-100 text-pink-700",
};

// 月曆日期的顏色，需要完整 class string 讓 Tailwind JIT 能偵測到
const TAG_CALENDAR_MODIFIER: Record<string, string> = {
  超商:
    "!text-blue-600 font-bold relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-blue-500 after:rounded-full",
  禮券:
    "!text-yellow-600 font-bold relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-yellow-400 after:rounded-full",
  食品:
    "!text-green-600 font-bold relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-green-500 after:rounded-full",
  餐飲:
    "!text-orange-500 font-bold relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-orange-400 after:rounded-full",
  生活用品:
    "!text-purple-600 font-bold relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-purple-500 after:rounded-full",
  電影票:
    "!text-pink-600 font-bold relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-pink-500 after:rounded-full",
};

// selected 日期的背景/文字色（注入 CSS variable 覆蓋預設黑底）
const TAG_SELECTED_VARS: Record<string, { bg: string; text: string }> = {
  超商:    { bg: "rgb(191 219 254)", text: "rgb(30 64 175)" },
  禮券:    { bg: "rgb(254 240 138)", text: "rgb(133 77 14)" },
  食品:    { bg: "rgb(187 247 208)", text: "rgb(22 101 52)" },
  餐飲:    { bg: "rgb(254 215 170)", text: "rgb(154 52 18)" },
  生活用品: { bg: "rgb(233 213 255)", text: "rgb(107 33 168)" },
  電影票:  { bg: "rgb(251 207 232)", text: "rgb(157 23 77)" },
};

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function getEventTags(event: DonationEvent): string[] {
  return event.tags || event.pttData?.tags || [];
}

/** 依捐血中心轄區排序的縣市清單（不含行政區長尾頁） */
const FILTER_CITIES = (() => {
  const order = new Map(REGIONS.map((r, i) => [r.slug, i]));
  return getTopLevelCities()
    .slice()
    .sort(
      (a, b) =>
        (order.get(a.regionSlug) ?? 99) - (order.get(b.regionSlug) ?? 99)
    );
})();

/** 台北時區的 YYYY-MM-DD */
function twDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

/** "2026-09" → Date(2026, 8, 1)，給 DayPicker 當顯示月份用 */
function monthKeyToDate(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function dateToMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${y} 年 ${m} 月`;
}

/** 用 UTC 解析日期字串，避免瀏覽器時區把日期推移一天 */
function parseDateKey(key: string): { month: number; day: number; weekday: string } {
  const [y, m, d] = key.split("-").map(Number);
  return {
    month: m,
    day: d,
    weekday: WEEKDAY_LABELS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()],
  };
}

export default function CalendarClient({ initialData }: { initialData: DonationData }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [giftLightbox, setGiftLightbox] = useState<{ imageUrl: string; organization: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const data = initialData;

  // 可切換的月份：資料涵蓋的月份 ∪ 本月 ∪ 下個月（下個月常常還沒公布，但要能翻過去看到說明）
  const monthOptions = useMemo(() => {
    const now = new Date();
    const thisMonth = dateToMonthKey(now);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const months = new Set(Object.keys(data).map((d) => d.slice(0, 7)));
    months.add(thisMonth);
    months.add(dateToMonthKey(next));
    return Array.from(months).sort();
  }, [data]);

  const [monthKey, setMonthKey] = useState(() => dateToMonthKey(new Date()));

  // 從網址還原狀態（在 mount 後做，避免 SSR/CSR 不一致）
  useEffect(() => {
    setTodayKey(twDateKey(new Date()));

    const params = new URLSearchParams(window.location.search);
    const city = params.get("city");
    if (city && getCityBySlug(city)) setCitySlug(city);

    const view = params.get("view");
    if (view === "list" || view === "calendar") setViewMode(view);

    const month = params.get("month");
    if (month && /^\d{4}-\d{2}$/.test(month)) setMonthKey(month);

    const tag = params.get("tag");
    if (tag) setActiveTagFilter(tag);

    setHydrated(true);
  }, []);

  // 把篩選條件寫回網址，讓「花蓮九月」這種畫面可以直接分享
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (citySlug) params.set("city", citySlug);
    if (viewMode !== "calendar") params.set("view", viewMode);
    if (monthKey !== dateToMonthKey(new Date())) params.set("month", monthKey);
    if (activeTagFilter) params.set("tag", activeTagFilter);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, [hydrated, citySlug, viewMode, monthKey, activeTagFilter]);

  const {
    isLoading: isNearbyLoading,
    error: nearbyError,
    nearbyLocations,
    findNearbyLocations,
    clearResults,
  } = useNearbyLocations();

  const selectedCity = citySlug ? getCityBySlug(citySlug) : undefined;

  // 先套地區篩選，後面所有計算都以這份資料為準
  const cityData = useMemo(() => {
    if (!selectedCity) return data;
    return filterEventsByCity(data, selectedCity);
  }, [data, selectedCity]);

  // All unique tags across all events（用全量資料，切地區時 chip 不會跳動）
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    Object.values(data).forEach((events) => {
      events.forEach((event) => {
        getEventTags(event).forEach((tag) => tags.add(tag));
      });
    });
    return Array.from(tags).sort();
  }, [data]);

  // All dates with any events
  const datesWithEvents = useMemo(() => {
    return Object.keys(cityData).map((dateStr) => new Date(dateStr));
  }, [cityData]);

  // Dates that have events matching the active tag filter
  const datesWithFilteredGifts = useMemo(() => {
    if (!activeTagFilter) return [];
    return Object.entries(cityData)
      .filter(([, events]) =>
        events.some((e) => getEventTags(e).includes(activeTagFilter))
      )
      .map(([dateStr]) => new Date(dateStr));
  }, [cityData, activeTagFilter]);

  // Dates with events but NO matching gift (fade these out when filter is active)
  const datesWithNoGiftMatch = useMemo(() => {
    if (!activeTagFilter) return [];
    const giftDateStrings = new Set(
      datesWithFilteredGifts.map((d) => d.toDateString())
    );
    return datesWithEvents.filter(
      (d) => !giftDateStrings.has(d.toDateString())
    );
  }, [activeTagFilter, datesWithEvents, datesWithFilteredGifts]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return cityData[twDateKey(selectedDate)] || [];
  }, [selectedDate, cityData]);

  // Events for selected date, filtered by active tag (tag-matched ones first)
  const displayedEvents = useMemo(() => {
    if (!activeTagFilter) return selectedDateEvents;
    const matched = selectedDateEvents.filter((e) =>
      getEventTags(e).includes(activeTagFilter)
    );
    const others = selectedDateEvents.filter(
      (e) => !getEventTags(e).includes(activeTagFilter)
    );
    return [...matched, ...others];
  }, [selectedDateEvents, activeTagFilter]);

  // 清單模式：當月、依日期排序，一天一組
  const monthEntries = useMemo(() => {
    return Object.entries(cityData)
      .filter(([date]) => date.startsWith(monthKey))
      .map(([date, events]) => {
        const shown = activeTagFilter
          ? events.filter((e) => getEventTags(e).includes(activeTagFilter))
          : events;
        return [
          date,
          shown.slice().sort((a, b) => a.time.localeCompare(b.time)),
        ] as const;
      })
      .filter(([, events]) => events.length > 0)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [cityData, monthKey, activeTagFilter]);

  const monthTotal = monthEntries.reduce((n, [, events]) => n + events.length, 0);

  // 該月份「全台」有沒有資料 —— 用來區分「沒活動」與「還沒公布」
  const monthHasAnyData = useMemo(
    () => Object.keys(data).some((d) => d.startsWith(monthKey)),
    [data, monthKey]
  );

  const monthIndex = monthOptions.indexOf(monthKey);
  const prevMonth = monthIndex > 0 ? monthOptions[monthIndex - 1] : null;
  const nextMonth =
    monthIndex >= 0 && monthIndex < monthOptions.length - 1
      ? monthOptions[monthIndex + 1]
      : null;

  const scopeLabel = selectedCity ? selectedCity.displayName : "全台";

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleFindNearby = async () => {
    if (selectedDateEvents.length === 0) return;
    setIsNearbyModalOpen(true);
    await findNearbyLocations(selectedDateEvents);
  };

  const handleCloseNearbyModal = () => {
    setIsNearbyModalOpen(false);
    clearResults();
  };

  const formattedSelectedDate = selectedDate?.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const renderGiftButton = (event: DonationEvent) => {
    const images = event.pttData?.images;
    if (!images || images.length === 0) return null;
    return (
      <button
        onClick={() =>
          setGiftLightbox({
            imageUrl: images[0],
            organization: event.organization,
          })
        }
        className="flex-shrink-0 text-xs text-gray-400 hover:text-orange-500 transition-colors whitespace-nowrap"
      >
        看贈品
      </button>
    );
  };

  const renderTags = (tags: string[]) =>
    tags.length > 0 ? (
      <div className="flex gap-1 mt-1.5 flex-wrap">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
              TAG_COLORS[tag] || "bg-pink-100 text-pink-600"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
    ) : null;

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl font-bold">捐血活動月曆</h1>
        </div>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          ← 返回列表
        </Link>
      </div>

      <p className="text-gray-600 mb-4">
        選地區、選月份，用清單一次讀完整個月的捐血活動；或切回月曆點日期查看單日場次。
      </p>

      {/* 地區篩選 */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500 font-medium">找地區</span>
        </div>
        {/* 手機橫向捲動避免 18 顆 chip 把畫面推下去，桌機直接換行攤開 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <button
            onClick={() => setCitySlug(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              !citySlug
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            全部地區
          </button>
          {FILTER_CITIES.map((city) => {
            const isActive = citySlug === city.slug;
            return (
              <button
                key={city.slug}
                onClick={() => setCitySlug(isActive ? null : city.slug)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {city.displayName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 贈品篩選 */}
      {allTags.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500 font-medium">找特定贈品</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isActive = activeTagFilter === tag;
              const colorClass = TAG_COLORS[tag] || "bg-gray-100 text-gray-700";
              return (
                <button
                  key={tag}
                  onClick={() =>
                    setActiveTagFilter(isActive ? null : tag)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    isActive
                      ? `${colorClass} border-current shadow-sm scale-105`
                      : `${colorClass} opacity-60 border-transparent hover:opacity-100`
                  }`}
                >
                  {tag}
                  {isActive && (
                    <span className="ml-1 opacity-70">✕</span>
                  )}
                </button>
              );
            })}
          </div>
          {activeTagFilter && viewMode === "calendar" && (
            <p className="text-xs text-gray-400 mt-2">
              顏色日期 = 有「{activeTagFilter}」贈品，其他日期淡出
            </p>
          )}
        </div>
      )}

      {/* 檢視模式 + 月份切換 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pt-4 border-t border-gray-100">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {([
            { key: "calendar" as const, label: "月曆", Icon: CalendarDays },
            { key: "list" as const, label: "清單", Icon: List },
          ]).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === key
                  ? "bg-white text-gray-900 shadow-sm font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => prevMonth && setMonthKey(prevMonth)}
            disabled={!prevMonth}
            aria-label="上個月"
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-900 tabular-nums min-w-[7rem] text-center">
            {formatMonthLabel(monthKey)}
          </span>
          <button
            onClick={() => nextMonth && setMonthKey(nextMonth)}
            disabled={!nextMonth}
            aria-label="下個月"
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500 pl-1">
            {scopeLabel}共 <span className="font-semibold text-gray-900">{monthTotal}</span> 場
          </span>
        </div>
      </div>

      {viewMode === "list" ? (
        /* 清單（議程）模式 */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {monthEntries.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {monthEntries.map(([date, events]) => {
                const { month, day, weekday } = parseDateKey(date);
                return (
                  <div key={date}>
                    <div className="sticky top-0 z-10 flex items-center gap-2 bg-gray-50/95 backdrop-blur px-4 py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {month}/{day}
                      </span>
                      <span className="text-xs text-gray-500">週{weekday}</span>
                      {date === todayKey && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-medium">
                          今天
                        </span>
                      )}
                      <span className="ml-auto text-xs text-gray-400">
                        {events.length} 場
                      </span>
                    </div>
                    {events.map((event, index) => (
                      <div
                        key={event.id || `${date}-${index}`}
                        className="flex flex-col sm:flex-row sm:gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors"
                      >
                        <div className="text-xs text-gray-500 tabular-nums sm:w-24 sm:shrink-0 sm:pt-0.5">
                          {event.time}
                        </div>
                        <div className="min-w-0 flex-1 mt-1 sm:mt-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {event.organization}
                            </div>
                            {renderGiftButton(event)}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {event.location}
                          </div>
                          {renderTags(getEventTags(event))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <CalendarDays className="w-12 h-12 mb-3 text-gray-300" />
              {!monthHasAnyData ? (
                <>
                  <p className="text-gray-500">
                    {formatMonthLabel(monthKey)}的活動尚未公布
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    捐血中心通常在月中之後才陸續公布下個月場次，可先看本月。
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-500">
                    {scopeLabel}在{formatMonthLabel(monthKey)}
                    {activeTagFilter ? `沒有「${activeTagFilter}」贈品的活動` : "沒有捐血活動"}
                  </p>
                  <div className="flex gap-2 mt-3">
                    {citySlug && (
                      <button
                        onClick={() => setCitySlug(null)}
                        className="text-sm text-gray-600 underline underline-offset-4 hover:text-gray-900"
                      >
                        看全台活動
                      </button>
                    )}
                    {activeTagFilter && (
                      <button
                        onClick={() => setActiveTagFilter(null)}
                        className="text-sm text-gray-600 underline underline-offset-4 hover:text-gray-900"
                      >
                        清除贈品篩選
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 月曆 */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            style={
              activeTagFilter && TAG_SELECTED_VARS[activeTagFilter]
                ? ({
                    "--cal-selected-bg": TAG_SELECTED_VARS[activeTagFilter].bg,
                    "--cal-selected-text": TAG_SELECTED_VARS[activeTagFilter].text,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={monthKeyToDate(monthKey)}
              onMonthChange={(date) => setMonthKey(dateToMonthKey(date))}
              startMonth={monthKeyToDate(monthOptions[0])}
              endMonth={monthKeyToDate(monthOptions[monthOptions.length - 1])}
              locale={zhTW}
              className=""
              modifiers={{
                hasEvents: activeTagFilter ? [] : datesWithEvents,
                hasGifts: datesWithFilteredGifts,
                hasNoGift: datesWithNoGiftMatch,
              }}
              modifiersClassNames={{
                hasEvents:
                  "relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-red-500 after:rounded-full",
                hasGifts:
                  activeTagFilter
                    ? (TAG_CALENDAR_MODIFIER[activeTagFilter] ??
                      "!text-orange-500 font-bold relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-orange-400 after:rounded-full")
                    : "",
                hasNoGift: "opacity-20",
              }}
            />
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
              {!activeTagFilter && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>{scopeLabel}有捐血活動</span>
                </div>
              )}
              {activeTagFilter && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${TAG_COLORS[activeTagFilter]?.split(" ")[0] ?? "bg-orange-400"}`}
                  ></span>
                  <span>有「{activeTagFilter}」贈品</span>
                </div>
              )}
            </div>
            {monthTotal > 0 && (
              <p className="mt-3 text-center text-xs text-gray-400">
                想一次讀完整個月？切換到上方的「清單」。
              </p>
            )}
          </div>

          {/* 選中日期的活動 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {selectedDate ? (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  {formattedSelectedDate}
                </h2>

                {selectedDateEvents.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-6 max-h-[480px] overflow-y-auto pr-1">
                      {displayedEvents.map((event, index) => {
                        const tags = getEventTags(event);
                        const isFiltered =
                          activeTagFilter && tags.includes(activeTagFilter);
                        const eventKey = event.id || index.toString();

                        return (
                          <div
                            key={eventKey}
                            className={`p-3 rounded-lg border transition-all ${
                              isFiltered
                                ? "bg-orange-50 border-orange-200"
                                : "bg-gray-50 border-transparent"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm">
                                  {event.organization}
                                  {isFiltered && (
                                    <span className="ml-1.5 text-orange-500 text-xs">
                                      ★ 有贈品
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 truncate">
                                  {event.time} · {event.location}
                                </div>
                              </div>
                              {renderGiftButton(event)}
                            </div>

                            {renderTags(tags)}
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      onClick={handleFindNearby}
                      className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white"
                    >
                      <MapPin className="w-4 h-4" />
                      查看附近的捐血地點
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
                    <p>{scopeLabel}這天沒有捐血活動</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
                <p>請點擊月曆上的日期</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 贈品圖片 Lightbox */}
      <Dialog open={!!giftLightbox} onOpenChange={(open) => !open && setGiftLightbox(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-base text-gray-800 flex items-center gap-2">
              <Gift className="w-4 h-4 text-orange-400" />
              {giftLightbox?.organization} 贈品
            </DialogTitle>
          </DialogHeader>
          {giftLightbox && (
            <div className="px-5 pb-5">
              <Image
                src={giftLightbox.imageUrl}
                alt={`${giftLightbox.organization} 贈品`}
                width={600}
                height={500}
                className="w-full rounded-xl object-contain max-h-[70vh]"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

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
