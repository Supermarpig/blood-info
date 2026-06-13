"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";
import CardInfo from "@/components/CardInfo";
import { normalizeSearchText } from "@/lib/searchNormalize";
import { fetchDonations } from "@/lib/staticData";

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

interface SearchModalProps {
  children: React.ReactNode; // trigger
}

export default function SearchModal({ children }: SearchModalProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [allData, setAllData] = useState<Record<string, DonationEvent[]>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });

  // Load data once when modal first opens
  useEffect(() => {
    if (!open || dataLoaded) return;
    fetchDonations<DonationEvent>()
      .then((data) => setAllData(data))
      .catch(() => {})
      .finally(() => setDataLoaded(true));
  }, [open, dataLoaded]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setInputValue("");
      setKeyword("");
      setShowPast(false);
    }
  }, [open]);

  // ESC already handled by Radix Dialog
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setKeyword(v), 250);
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
      if (!matched.length) return;
      if (date >= today) future[date] = matched;
      else past[date] = matched;
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
        <div key={date} className="mb-4">
          <p className="text-xs font-bold text-gray-400 mb-2 px-1">{date}</p>
          <div className="grid gap-3 sm:grid-cols-2">
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
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-modal bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />

        {/* Panel — slides in from top */}
        <DialogPrimitive.Content
          className="fixed left-0 right-0 top-0 z-modal flex flex-col bg-white shadow-2xl rounded-b-2xl max-h-[90vh] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top duration-300"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">搜尋捐血活動</DialogPrimitive.Title>

          {/* Search input bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={inputValue}
              onChange={handleInput}
              placeholder="搜尋地點、主辦單位、關鍵字..."
              className="flex-1 text-base bg-transparent outline-none placeholder:text-gray-400"
            />
            <DialogPrimitive.Close className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </DialogPrimitive.Close>
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1 px-4 py-4">
            {!dataLoaded && (
              <p className="text-sm text-gray-400 text-center py-8">載入資料中...</p>
            )}

            {dataLoaded && !keyword.trim() && (
              <p className="text-sm text-gray-400 text-center py-8">輸入關鍵字開始搜尋</p>
            )}

            {dataLoaded && keyword.trim() && totalCount === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                找不到「{keyword}」相關捐血活動
              </p>
            )}

            {dataLoaded && keyword.trim() && totalCount > 0 && (
              <>
                <p className="text-xs text-gray-400 mb-4">
                  共 <span className="font-semibold text-gray-600">{totalCount}</span> 筆結果
                </p>
                {futureCount > 0 && renderGroup(futureEvents)}
                {pastCount > 0 && (
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <button
                      onClick={() => setShowPast((p) => !p)}
                      className="w-full flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 py-2 text-sm transition-colors"
                    >
                      {showPast
                        ? <><ChevronUp className="w-4 h-4" />隱藏過去活動</>
                        : <><ChevronDown className="w-4 h-4" />顯示過去活動（{pastCount} 筆）</>
                      }
                    </button>
                    {showPast && (
                      <div className="mt-3 opacity-60 hover:opacity-100 transition-opacity">
                        {renderGroup(pastEvents)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
