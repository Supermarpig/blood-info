// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { debounce } from "@/utils";
import CardInfo from "@/components/cardInfo";
import BackToTopButton from "@/components/BackToTopButton";

interface DonationEvent {
  id?: string;
  time: string;
  organization: string;
  location: string;
  rawContent: string;
  customNote?: string;
}

export default function BloodDonationPage() {
  const [donationsByDate, setDonationsByDate] = useState<
    Record<string, DonationEvent[]>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false); // 用來控制是否顯示過去的活動

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch("/api/blood-donations");
      const data = await response.json();

      if (data.success) {
        const parsedData = Object.fromEntries(
          Object.entries(data.data).map(([date, events]) => [
            date,
            events,
          ])
        ) as Record<string, DonationEvent[]>;
        setDonationsByDate(parsedData);
      } else {
        setError(data.error || "發生錯誤");
      }
    } catch (error) {
      setError("無法取得捐血活動資料");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = debounce((value: string) => {
    setSearchKeyword(value);
  }, 300);

  const today = new Date().toISOString().split("T")[0];
  const pastEvents: Record<string, DonationEvent[]> = {};
  const todayEvents: Record<string, DonationEvent[]> = {};
  const upcomingEvents: Record<string, DonationEvent[]> = {};

  Object.entries(donationsByDate).forEach(([date, events]) => {
    if (date < today) {
      pastEvents[date] = events;
    } else if (date === today) {
      todayEvents[date] = events;
    } else {
      upcomingEvents[date] = events;
    }
  });

  const filterEvents = (events: DonationEvent[]) =>
    events.filter(
      (event) =>
        event.organization.includes(searchKeyword) ||
        event.location.includes(searchKeyword) ||
        event.time.includes(searchKeyword)
    );

  const filterAndRenderEventsByDate = (
    eventsByDate: Record<string, DonationEvent[]>,
    backgroundColor: string
  ) =>
    Object.entries(eventsByDate)
      .map(([date, events]) => {
        const filteredEvents = filterEvents(events);
        if (filteredEvents.length === 0) return null;
        return (
          <div key={date}>
            <div className="sticky top-0 bg-white z-10 shadow-md">
              <h2 className="text-lg font-medium mb-2 p-2">{date}</h2>
            </div>
            <div
              className={`mb-4 bg-${backgroundColor} p-4 rounded-md shadow-md`}
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((donation, index) => (
                  <CardInfo
                    key={`${donation.id}-${index}`}
                    donation={donation}
                    searchKeyword={searchKeyword}
                    className="transition-transform transform hover:scale-105"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })
      .filter((element) => element !== null);

  const togglePastEvents = () => {
    setShowPastEvents(!showPastEvents);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">捐血活動列表</h1>
      </div>

      <div className="mb-6">
        <Input
          placeholder="搜尋活動 (機構名稱、地點)"
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">今日活動</h2>
        {filterAndRenderEventsByDate(todayEvents, "yellow-100")}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">即將開始的活動</h2>
        {filterAndRenderEventsByDate(upcomingEvents, "green-100")}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-4">已過期的活動</h2>
          <button
            onClick={togglePastEvents}
            className="text-green-700 flex items-center"
          >
            {showPastEvents ? (
              <>
                <ChevronUp className="h-5 w-5 mr-2" />
                <span>隱藏</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5 mr-2" />
                <span>顯示</span>
              </>
            )}
          </button>
        </div>
        {showPastEvents && filterAndRenderEventsByDate(pastEvents, "gray-100")}
      </div>

      <BackToTopButton />
    </div>
  );
}
