import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Building2, ExternalLink, Gift } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  reportData?: {
    images: string[];
    issueUrl: string;
  };
  isUserReport?: boolean;
}

interface CardInfoProps {
  donation: DonationEvent;
  searchKeyword: string;
  className?: string;
}

const highlightText = (text: string, keyword: string) => {
  if (!keyword) return text;
  const parts = text.split(new RegExp(`(${keyword})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <span
            key={index}
            className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 font-medium"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function CardInfo({
  donation,
  searchKeyword,
  className = "",
}: CardInfoProps) {
  const [isPttDialogOpen, setIsPttDialogOpen] = useState(false);

  // 中心顯示名稱對應
  const centerDisplayNames: Record<string, string> = {
    台北: "北區",
    新竹: "桃竹苗",
    台中: "中區",
    高雄: "南區",
  };

  // 根據中心決定顏色標籤
  const getCenterColor = (center?: string) => {
    switch (center) {
      case "台北":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "新竹":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "台中":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "高雄":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "使用者回報":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 hover:shadow-md border-gray-200 flex flex-col ${className}`}
    >
      <CardContent className="p-0 flex-grow flex flex-col">
        <div className="flex flex-col h-full">
          {/* 頭部：時間與中心標籤 */}
          <div className="flex items-stretch border-b border-gray-100">
            <div className="flex-none bg-slate-50 px-4 py-3 flex items-center justify-center border-r border-gray-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-bold text-slate-700 whitespace-nowrap">
                  {highlightText(donation.time, searchKeyword)}
                </span>
              </div>
            </div>
            <div className="flex-grow p-3 flex items-center justify-between bg-white relative">
              {donation.center && (
                <span
                  className={`text-xs px-2 py-1 rounded-full border font-medium ${getCenterColor(
                    donation.center
                  )}`}
                >
                  {centerDisplayNames[donation.center] || donation.center}
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* PTT 或使用者回報 Dialog */}
                {(donation.pttData || donation.reportData) && (
                  <Dialog
                    open={isPttDialogOpen}
                    onOpenChange={setIsPttDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <button
                        className={`p-1.5 ${
                          donation.isUserReport
                            ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                            : "text-pink-500 hover:text-pink-600 hover:bg-pink-50"
                        } rounded-full transition-colors relative`}
                        title={
                          donation.isUserReport
                            ? "查看使用者回報詳情"
                            : "查看活動詳情與贈品"
                        }
                      >
                        <Gift className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                              donation.isUserReport
                                ? "bg-emerald-400"
                                : "bg-pink-400"
                            } opacity-75`}
                          ></span>
                          <span
                            className={`relative inline-flex rounded-full h-3 w-3 ${
                              donation.isUserReport
                                ? "bg-emerald-500"
                                : "bg-pink-500"
                            }`}
                          ></span>
                        </span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[80vh] p-0 gap-0 overflow-hidden flex flex-col rounded-xl">
                      {/* 關閉按鈕 */}
                      <button
                        onClick={() => setIsPttDialogOpen(false)}
                        className="absolute right-3 top-3 z-20 p-1.5 rounded-full bg-white/90 hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                        aria-label="關閉"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>

                      <DialogHeader className="p-4 pb-2 border-b flex-none bg-white">
                        <DialogTitle className="flex items-center gap-2 text-gray-800 pr-8">
                          <span
                            className={`${
                              donation.isUserReport
                                ? "bg-emerald-100"
                                : "bg-pink-100"
                            } p-1.5 rounded-full`}
                          >
                            <Gift
                              className={`w-5 h-5 ${
                                donation.isUserReport
                                  ? "text-emerald-500"
                                  : "text-pink-500"
                              }`}
                            />
                          </span>
                          {donation.isUserReport
                            ? "使用者回報詳情"
                            : "活動與贈品詳情"}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="overflow-y-auto p-4 flex-grow">
                        {/* 圖片區域 - 支援 pttData 和 reportData */}
                        {(() => {
                          const images =
                            donation.pttData?.images ||
                            donation.reportData?.images ||
                            [];
                          return images.length > 0 ? (
                            <div className="space-y-4 mb-6">
                              {images.map((imgUrl, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imgUrl}
                                    alt={`活動圖片 ${idx + 1}`}
                                    className="w-full h-auto object-contain"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-xl mb-6">
                              <p className="text-gray-400">目前沒有圖片資訊</p>
                            </div>
                          );
                        })()}

                        {/* 來源資訊 - 根據類型顯示不同內容 */}
                        {donation.pttData && (
                          <div className="bg-slate-50 rounded-lg p-2 px-3 border border-slate-100 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">原始回報</span>
                              <a
                                href={donation.pttData.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                              >
                                <span>PTT 原文</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-slate-600 text-xs mt-1">
                              {donation.pttData.rawLine}
                            </p>
                          </div>
                        )}
                        {donation.reportData && (
                          <div className="bg-emerald-50 rounded-lg p-2 px-3 border border-emerald-100 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-600">
                                📍 使用者回報
                              </span>
                              <a
                                href={donation.reportData.issueUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                              >
                                <span>查看 Issue</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-emerald-700 text-xs mt-1">
                              感謝您的回報！此資訊由熱心使用者提供。
                            </p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>

          {/* 主要內容：地點與機構 */}
          <div className="p-4 space-y-3 bg-white flex-grow">
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 flex items-start gap-2">
                <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>
                  {highlightText(donation.organization, searchKeyword)}
                </span>
              </h3>
            </div>

            <div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  donation.location
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <MapPin className="w-5 h-5 text-red-500 group-hover:text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-base font-medium group-hover:underline decoration-blue-400 underline-offset-2">
                  {highlightText(donation.location, searchKeyword)}
                </span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5" />
              </a>
            </div>

            {donation.customNote && (
              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100 mt-2">
                <span className="font-semibold block text-xs uppercase tracking-wider text-amber-500 mb-0.5">
                  Note
                </span>
                {donation.customNote}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
