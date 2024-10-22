// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { debounce, parseEventDate } from '@/utils';
import CardInfo from '@/components/cardInfo';

interface DonationEvent {
  id?: string;
  time: string;
  organization: string;
  location: string;
  rawContent: string;
  customNote?: string;
}

export default function BloodDonationPage() {
  const [donationsByDate, setDonationsByDate] = useState<Record<string, DonationEvent[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('/api/blood-donations');
      const data = await response.json();

      if (data.success) {
        const parsedData = Object.fromEntries(
          Object.entries(data.data).map(([date, events]) => [
            parseEventDate(date),
            events,
          ])
        ) as Record<string, DonationEvent[]>;

        setDonationsByDate(parsedData);
      } else {
        setError(data.error || '發生錯誤');
      }
    } catch (error) {
      setError('無法取得捐血活動資料');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };


  // const refreshData = async (): Promise<void> => {
  //   try {
  //     await fetch('/api/blood-donations', { method: 'DELETE' });
  //     await fetchDonations();
  //   } catch (error) {
  //     setError('無法重新整理資料');
  //     console.log(error);
  //   }
  // };

  const handleSearchChange = debounce((value: string) => {
    setSearchKeyword(value);
  }, 300);

  // 分類活動為過去、今天、以及未來活動
  const today = new Date().toISOString().split('T')[0];
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

  // 過濾符合搜尋關鍵字的活動
  const filterEvents = (events: DonationEvent[]) =>
    events.filter(
      (event) =>
        event.organization.includes(searchKeyword) ||
        event.location.includes(searchKeyword) ||
        event.time.includes(searchKeyword)
    );

  const filterAndRenderEventsByDate = (eventsByDate: Record<string, DonationEvent[]>) =>
    Object.entries(eventsByDate)
      .map(([date, events]) => {
        const filteredEvents = filterEvents(events);
        if (filteredEvents.length === 0) return null;
        return (
          <div key={date} className="mb-4">
            <div className="sticky top-0 bg-white z-10">
              <h2 className="text-lg font-medium mb-2 py-2">{date}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((donation, index) => (
                <CardInfo
                  key={`${donation.id}-${index}`}
                  donation={donation}
                  searchKeyword={searchKeyword}
                />
              ))}
            </div>
          </div>
        );
      })
      .filter((element) => element !== null);

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
        {/* <Button onClick={refreshData}>重新整理</Button> */}
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
        {filterAndRenderEventsByDate(todayEvents)}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">即將開始的活動</h2>
        {filterAndRenderEventsByDate(upcomingEvents)}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">已過期的活動</h2>
        {filterAndRenderEventsByDate(pastEvents)}
      </div>
    </div>
  );
}