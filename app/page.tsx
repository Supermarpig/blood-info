// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [noteInput, setNoteInput] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blood-donations');
      const data = await response.json();

      console.log(data, "=============data😍😍😍");

      if (data.success) {
        setDonationsByDate(data.data);
      } else {
        setError(data.error || '發生錯誤');
      }
    } catch (error) {
      setError('無法取得捐血活動資料');
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  // const addNote = async (id: string) => {
  //   if (!id) return; // 確保id有效
  //   try {
  //     const response = await fetch('/api/blood-donations', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         id,
  //         customNote: noteInput[id],
  //       }),
  //     });

  //     const data = await response.json();
  //     if (data.success) {
  //       setDonationsByDate(data.data);
  //       setNoteInput({ ...noteInput, [id]: '' }); // 清空輸入框
  //     }
  //   } catch (error) {
  //     setError('無法新增註記');
  //     console.log(error)
  //   }
  // };

  const refreshData = async () => {
    try {
      await fetch('/api/blood-donations', { method: 'DELETE' });
      await fetchDonations();
    } catch (error) {
      setError('無法重新整理資料');
      console.log(error)
    }
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">捐血活動列表</h1>
        <Button onClick={refreshData}>重新整理</Button>
      </div>

      {Object.entries(donationsByDate).map(([date, events]) => (
        <div key={date} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{date}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((donation, index) => (
              donation.id && (
                <Card key={`${donation.id}-${index}`} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {donation.organization}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><span className="font-semibold">時間：</span>{donation.time}</p>
                      <p><span className="font-semibold">地點：</span>{donation.location}</p>
                      {donation.customNote && (
                        <p className="text-blue-600">
                          <span className="font-semibold">註記：</span>{donation.customNote}
                        </p>
                      )}
                      {/* <div className="flex gap-2 mt-4">
                        <Input
                          placeholder="新增註記"
                          value={noteInput[donation.id] || ''}
                          onChange={(e) => setNoteInput({
                            ...noteInput,
                            [donation.id]: e.target.value
                          })}
                        />
                        <Button
                          onClick={() => addNote(donation.id)}
                          disabled={!noteInput[donation.id]}
                        >
                          新增
                        </Button>
                      </div> */}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
