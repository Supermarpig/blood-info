"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNearbyLocations } from "@/hooks/useNearbyLocations";
import NearbyLocationsModal from "@/components/NearbyLocationsModal";
import Link from "next/link";
import { zhTW } from "date-fns/locale";

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

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [data, setData] = useState<DonationData>({});
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const {
    isLoading: isNearbyLoading,
    error: nearbyError,
    nearbyLocations,
    findNearbyLocations,
    clearResults,
  } = useNearbyLocations();

  // 載入捐血活動資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/blood-donations");
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch donation data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, []);

  // 將資料中的日期轉換為 Date 物件集合，用於標記有活動的日期
  const datesWithEvents = useMemo(() => {
    return Object.keys(data).map((dateStr) => new Date(dateStr));
  }, [data]);

  // 取得選中日期的活動
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Taipei",
    });
    return data[dateStr] || [];
  }, [selectedDate, data]);

  // 處理日期點擊
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // 查找附近捐血地點
  const handleFindNearby = async () => {
    if (selectedDateEvents.length === 0) return;
    setIsNearbyModalOpen(true);
    await findNearbyLocations(selectedDateEvents);
  };

  // 關閉附近地點 Modal
  const handleCloseNearbyModal = () => {
    setIsNearbyModalOpen(false);
    clearResults();
  };

  // 格式化選中的日期
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

      <p className="text-gray-600 mb-6">點擊日期查看該日附近的捐血活動地點</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 月曆 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {isDataLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={zhTW}
              className="mx-auto"
              modifiers={{
                hasEvents: datesWithEvents,
              }}
              modifiersClassNames={{
                hasEvents:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-red-500 after:rounded-full",
              }}
            />
          )}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>有捐血活動</span>
            </div>
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
                  <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                    {selectedDateEvents.slice(0, 5).map((event, index) => (
                      <div
                        key={event.id || index}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="font-medium text-gray-900 text-sm">
                          {event.organization}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {event.time} · {event.location}
                        </div>
                        {((event.tags || event.pttData?.tags)?.length ?? 0) >
                          0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {(event.tags || event.pttData?.tags || []).map(
                              (tag) => (
                                <span
                                  key={tag}
                                  className="bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedDateEvents.length > 5 && (
                      <p className="text-xs text-gray-400 text-center">
                        還有 {selectedDateEvents.length - 5} 場活動...
                      </p>
                    )}
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
