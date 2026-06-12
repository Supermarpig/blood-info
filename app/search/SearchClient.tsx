"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronDown, ChevronUp, Search } from "lucide-react";
import CardInfo from "@/components/CardInfo";
import { normalizeSearchText } from "@/lib/searchNormalize";

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
  coordinates?: { lat: number; lng: number };
  pttData?: { rawLine: string; images: string[]; url: string; tags?: string[] };
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [keyword, setKeyword] = useState(initialQ);
  const [allData, setAllData] = useState<Record<string, DonationEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });

  useEffect(() => {
    fetch("/api/blood-donations")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) setAllData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Sync keyword changes to URL (client-only)
  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    const qs = params.toString();
    window.history.replaceState(null, "", `/search${qs ? `?${qs}` : ""}`);
  }, [keyword]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setKeyword(v), 300);
  };

  const { futureEvents, pastEvents } = useMemo(() => {
    const q = normalizeSearchText(keyword.trim());
    const future: Record<string, DonationEvent[]> = {};
    const past: Record<string, DonationEvent[]> = {};

    if (!q) return { futureEvents: future, pastEvents: past };

    Object.entries(allData).forEach(([date, events]) => {
      const matched = events.filter((e) => {
        const tags = [...(e.tags ?? []), ...(e.subTags ?? []), ...(e.pttData?.tags ?? [])].join(" ");
        return (
          normalizeSearchText(e.organization ?? "").includes(q) ||
          normalizeSearchText(e.location ?? "").includes(q) ||
          normalizeSearchText(e.rawContent ?? "").includes(q) ||
          normalizeSearchText(tags).includes(q)
        );
      });
      if (matched.length === 0) return;
      if (date >= today) {
        future[date] = matched;
      } else {
        past[date] = matched;
      }
    });

    return { futureEvents: future, pastEvents: past };
  }, [allData, keyword, today]);

  const futureCount = Object.values(futureEvents).reduce((a, b) => a + b.length, 0);
  const pastCount = Object.values(pastEvents).reduce((a, b) => a + b.length, 0);
  const totalCount = futureCount + pastCount;

  const renderGroup = (data: Record<string, DonationEvent[]>) =>
    Object.keys(data)
      .sort()
      .map((date) => (
        <div key={date} className="mb-6">
          <div className="sticky top-14 z-10 py-2 -mx-4 px-4 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 mb-2">
            <p className="text-sm font-bold text-gray-500">{date}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data[date].map((donation, i) => (
              <CardInfo
                key={`${donation.id}-${i}`}
                donation={donation}
                searchKeyword={keyword}
                className="h-full"
              />
            ))}
          </div>
        </div>
      ));

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">首頁</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">捐血活動搜尋</span>
      </nav>

      <h1 className="text-2xl font-bold mb-2">捐血活動搜尋</h1>
      <p className="text-gray-600 text-sm mb-6">輸入地點、主辦單位或關鍵字，搜尋近期全台捐血活動</p>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          value={inputValue}
          onChange={handleInput}
          placeholder="例如：台北車站、瑞穗、捐血車..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent bg-white shadow-sm"
          autoFocus
        />
      </div>

      {loading && (
        <p className="text-gray-500 text-sm text-center py-12">載入資料中...</p>
      )}

      {!loading && !keyword.trim() && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">請輸入關鍵字開始搜尋</p>
        </div>
      )}

      {!loading && keyword.trim() && totalCount === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">找不到「{keyword}」相關捐血活動</p>
          <p className="text-sm mt-2">試試其他關鍵字，例如地區名稱或主辦單位</p>
        </div>
      )}

      {!loading && keyword.trim() && totalCount > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            共找到 <span className="font-semibold text-gray-800">{totalCount}</span> 筆結果
          </p>

          {futureCount > 0 && renderGroup(futureEvents)}

          {pastCount > 0 && (
            <div className="border-t border-gray-100 pt-6 mt-2">
              <button
                onClick={() => setShowPast((p) => !p)}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {showPast ? (
                  <><ChevronUp className="w-4 h-4" />隱藏過去活動</>
                ) : (
                  <><ChevronDown className="w-4 h-4" />顯示過去活動（{pastCount} 筆）</>
                )}
              </button>
              {showPast && (
                <div className="mt-4 opacity-60 hover:opacity-100 transition-opacity">
                  {renderGroup(pastEvents)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
