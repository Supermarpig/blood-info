// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { debounce } from '@/utils';

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

  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <span key={index} className="bg-yellow-200 p-1 rounded-sm">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
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
    <div className="container mx-auto py-8">
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
                <Card key={`${donation.id}-${index}`} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {highlightText(donation.organization, searchKeyword)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">時間：</span>
                        {highlightText(donation.time, searchKeyword)}
                      </p>
                      <p>
                        <span className="font-semibold">地點：</span>
                        {highlightText(donation.location, searchKeyword)}
                      </p>
                      {donation.customNote && (
                        <p className="text-blue-600">
                          <span className="font-semibold">註記：</span>
                          {donation.customNote}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
