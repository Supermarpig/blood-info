"use client";

import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, MapPin, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNearbyLocations } from "@/hooks/useNearbyLocations";
import NearbyLocationsModal from "@/components/NearbyLocationsModal";
import Link from "next/link";
import { zhTW } from "date-fns/locale";
import Image from "next/image";

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

function getEventTags(event: DonationEvent): string[] {
  return event.tags || event.pttData?.tags || [];
}

export default function CalendarClient({ initialData }: { initialData: DonationData }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [giftLightbox, setGiftLightbox] = useState<{ imageUrl: string; organization: string } | null>(null);

  const data = initialData;

  const {
    isLoading: isNearbyLoading,
    error: nearbyError,
    nearbyLocations,
    findNearbyLocations,
    clearResults,
  } = useNearbyLocations();

  // All unique tags across all events
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
    return Object.keys(data).map((dateStr) => new Date(dateStr));
  }, [data]);

  // Dates that have events matching the active tag filter
  const datesWithFilteredGifts = useMemo(() => {
    if (!activeTagFilter) return [];
    return Object.entries(data)
      .filter(([, events]) =>
        events.some((e) => getEventTags(e).includes(activeTagFilter))
      )
      .map(([dateStr]) => new Date(dateStr));
  }, [data, activeTagFilter]);

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
    const dateStr = selectedDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Taipei",
    });
    return data[dateStr] || [];
  }, [selectedDate, data]);

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

      <p className="text-gray-600 mb-4">點擊日期查看該日附近的捐血活動</p>

      {/* 贈品篩選 */}
      {allTags.length > 0 && (
        <div className="mb-6">
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
          {activeTagFilter && (
            <p className="text-xs text-gray-400 mt-2">
              顏色日期 = 有「{activeTagFilter}」贈品，其他日期淡出
            </p>
          )}
        </div>
      )}

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
                <span>有捐血活動</span>
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
                      const hasImage =
                        event.pttData?.images &&
                        event.pttData.images.length > 0;

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
                            {hasImage && (
                              <button
                                onClick={() =>
                                  setGiftLightbox({
                                    imageUrl: event.pttData!.images[0],
                                    organization: event.organization,
                                  })
                                }
                                className="flex-shrink-0 text-xs text-gray-400 hover:text-orange-500 transition-colors whitespace-nowrap"
                              >
                                看贈品
                              </button>
                            )}
                          </div>

                          {tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    TAG_COLORS[tag] ||
                                    "bg-pink-100 text-pink-600"
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
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
                  <p>這天沒有捐血活動</p>
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
