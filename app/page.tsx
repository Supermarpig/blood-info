// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { debounce } from '@/utils';
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
        setDonationsByDate(data.data);
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

  const refreshData = async (): Promise<void> => {
    try {
      await fetch('/api/blood-donations', { method: 'DELETE' });
      await fetchDonations();
    } catch (error) {
      setError('無法重新整理資料');
      console.log(error);
    }
  };

  const handleSearchChange = debounce((value: string) => {
    setSearchKeyword(value);
  }, 300);


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

  // 過濾符合搜尋關鍵字的活動
  const filteredDonationsByDate: Record<string, DonationEvent[]> = Object.fromEntries(
    Object.entries(donationsByDate)
      .map(([date, events]) => [
        date,
        events.filter(
          (event) =>
            event.organization.includes(searchKeyword) ||
            event.location.includes(searchKeyword) ||
            event.time.includes(searchKeyword)
        ),
      ])
      .filter(([, events]) => events.length > 0)
  );

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">捐血活動列表</h1>
        <Button onClick={refreshData}>重新整理</Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="搜尋活動 (機構名稱、地點、時間)"
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      {Object.entries(filteredDonationsByDate).map(([date, events]) => (
        <div key={date} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{date}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((donation, index) =>
              donation.id ? (
                <CardInfo
                  key={`${donation.id}-${index}`}
                  donation={donation}
                  searchKeyword={searchKeyword}
                />
              ) : null
            )}
          </div>
        </div>
      ))}
    </div>
  );
}