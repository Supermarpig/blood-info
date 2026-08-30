"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ExternalLink, Gift, ChevronRight, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import Link from "@/components/Link";
import { useRouter } from "next/navigation";
import { normalizeSearchText, buildKeywordRegex } from "@/lib/searchNormalize";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getGiftByTagId } from "@/lib/giftConfig";
import { CITIES } from "@/lib/cityConfig";
import ShareModal from "@/components/ShareModal";
import { cva } from "class-variance-authority";
import { getEventStatus, type EventStatus } from "@/lib/eventStatus";

/** 狀態徽章：整面清單唯一會隨時間變化的東西，也是每張卡的視覺落點 */
const statusBadge = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
  {
    variants: {
      kind: {
        ongoing: "bg-emerald-50 text-emerald-700",
        "ending-soon": "bg-red-50 text-red-600",
        "not-started": "bg-gray-100 text-gray-500",
        finished: "bg-gray-100 text-gray-400",
        past: "bg-gray-100 text-gray-400",
        upcoming: "hidden",
      },
    },
  }
);

const statusDot = cva("h-1.5 w-1.5 rounded-full", {
  variants: {
    kind: {
      ongoing: "bg-emerald-500",
      "ending-soon": "bg-red-500 motion-safe:animate-pulse",
      "not-started": "bg-gray-400",
      finished: "bg-gray-300",
      past: "bg-gray-300",
      upcoming: "hidden",
    },
  },
});

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
  const parts = text.split(buildKeywordRegex(keyword));
  const normalizedKeyword = normalizeSearchText(keyword);
  return (
    <>
      {parts.map((part, index) =>
        normalizeSearchText(part) === normalizedKeyword ? (
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
  const router = useRouter();
  const [isPttDialogOpen, setIsPttDialogOpen] = useState(false);
  const [showShareHint, setShowShareHint] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();
  const chevronRef = useRef<SVGSVGElement>(null);

  /**
   * 狀態必須等 mount 後才算：它依賴「現在幾點」，
   * 在 render 期間算會造成 hydration mismatch，而且清單頁是靜態產生的，
   * server 端的值會被凍在 build 當下。每分鐘更新一次讓「剩 N 分鐘」不會停住。
   */
  const [status, setStatus] = useState<EventStatus | null>(null);
  useEffect(() => {
    const update = () =>
      setStatus(getEventStatus(donation.activityDate, donation.time));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [donation.activityDate, donation.time]);

  // 觸控裝置沒有 hover，改在卡片進入畫面時播一次箭頭動畫（CSS 以 hover: none 篩選）
  useEffect(() => {
    const el = chevronRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setShowShareHint(true), 1200);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setShowShareHint(false);
  };

  const eventTags = donation.tags || donation.pttData?.tags || [];
  const giftLinks = eventTags.map((tag) => getGiftByTagId(tag)).filter(Boolean);

  const matchedCity = CITIES.find(
    (c) =>
      c.centerFilter === donation.center &&
      c.locationKeywords.some((kw) => donation.location.includes(kw))
  );
  const eventShortId = (id: string) => {
    let hash = 5381;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) + hash) + id.charCodeAt(i);
      hash = hash >>> 0;
    }
    return hash.toString(36).padStart(6, "0");
  };

  const detailPath = donation.id
    ? `/activity/${donation.activityDate}-${eventShortId(donation.id)}`
    : null;

  const shareUrl = detailPath
    ? `https://www.bloodtw.com${detailPath}`
    : matchedCity
    ? `https://www.bloodtw.com/city/${matchedCity.slug}`
    : "https://www.bloodtw.com";

  // 中心顯示名稱對應
  const centerDisplayNames: Record<string, string> = {
    台北: "北區",
    新竹: "桃竹苗",
    台中: "中區",
    高雄: "南區",
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    donation.location
  )}`;

  /** 贈品名稱：有 subTags 用細項，否則用大類 */
  const giftChips: { key: string; label: string; href?: string }[] =
    donation.subTags && donation.subTags.length > 0
      ? [
          ...donation.subTags.map((subTag) => {
            const gift = getGiftByTagId(subTag.split("－")[0]);
            return {
              key: subTag,
              label: subTag,
              href: gift ? `/gift/${gift.slug}` : undefined,
            };
          }),
          ...giftLinks
            .filter(
              (g) =>
                !(donation.subTags || []).some((st) =>
                  st.startsWith(g!.tagId + "－")
                )
            )
            .map((g) => ({
              key: g!.slug,
              label: g!.name,
              href: `/gift/${g!.slug}`,
            })),
        ]
      : giftLinks.map((g) => ({
          key: g!.slug,
          label: g!.name,
          href: `/gift/${g!.slug}`,
        }));

  // 整卡可點：點到卡片內的連結或按鈕時，交給原本的行為
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!detailPath) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    router.push(detailPath);
  };

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden border-gray-200 transition-[transform,box-shadow,border-color] duration-200 motion-reduce:transition-none",
        detailPath &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md motion-reduce:hover:translate-y-0",
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardContent className="flex flex-grow flex-col p-0">
        <div className="flex h-full flex-col">
          {/* 中繼資料列：時間為主、即時狀態為錨點、分區為輔 */}
          <div className="flex items-center gap-2 px-4 pt-3.5">
            <span className="text-sm font-bold tabular-nums text-gray-900">
              {highlightText(donation.time, searchKeyword)}
            </span>
            {status && status.kind !== "upcoming" && (
              <span className={statusBadge({ kind: status.kind })}>
                <span className={statusDot({ kind: status.kind })} />
                {status.label}
              </span>
            )}

            <div className="-mr-1.5 ml-auto flex items-center gap-0.5">
              {/* 導航改成圖示：原本每張卡都印一行「在 Google 地圖開啟」，整面重複反而最搶眼 */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="在 Google 地圖開啟"
                aria-label={`在 Google 地圖開啟 ${donation.location}`}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>

              {/*
                回報入口：清單頁才是絕大多數人待的地方，回報表單卻只在詳情頁，
                等於沒人找得到。這裡直接帶去詳情頁並自動展開表單（?report=1）——
                地點、日期都已經在網址裡，回報者一個字都不用打。
              */}
              {detailPath && (
                <Link
                  href={`${detailPath}?report=1`}
                  title="回報現場狀況、上傳照片"
                  aria-label={`回報 ${donation.location} 的現場狀況或上傳照片`}
                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <Camera className="h-4 w-4" />
                </Link>
              )}
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
                        <Gift className="h-4 w-4" />
                        {/* 一張清單同時有 30 張卡，常駐 ping 動畫會變成整面雜訊；改成靜態小點 */}
                        <span
                          className={cn(
                            "absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full",
                            donation.isUserReport ? "bg-emerald-500" : "bg-pink-500"
                          )}
                        />
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
                                    alt={`捐血活動：${
                                      donation.organization
                                    } - 圖片 ${idx + 1}`}
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
                              {/* TODO: admin only
                              <a
                                href={donation.reportData.issueUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                              >
                                <span>查看 Issue</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              */}
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

                {/* 分享按鈕 */}
                <ShareModal
                  organization={donation.organization}
                  activityDate={donation.activityDate}
                  time={donation.time}
                  location={donation.location}
                  giftNames={giftLinks.map((g) => g!.name)}
                  shareUrl={shareUrl}
                  showHint={showShareHint}
                />
              </div>
            </div>

          {/*
            主要內容。刻意把「地點」提為標題、「機構」降為副標：
            機構名（例如「國泰人壽汐止通訊處」）幾乎不影響去不去，
            真正決定的是「在哪、我到得了嗎」。標題連到站內活動頁，
            Google 地圖降級成明確的次要動作，才不會讓卡片上最醒目的連結是「離開本站」。
          */}
          <div className="flex flex-grow flex-col px-4 pb-3.5 pt-2">
            <div className="flex items-start gap-2">
              <MapPin className="mt-[3px] h-4 w-4 flex-none text-gray-400" />
              <div className="min-w-0 flex-1">
                {detailPath ? (
                  <Link
                    prefetch={false}
                    href={detailPath}
                    className="block text-[15px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-pink-700"
                  >
                    {highlightText(donation.location, searchKeyword)}
                  </Link>
                ) : (
                  <span className="block text-[15px] font-bold leading-snug text-gray-900">
                    {highlightText(donation.location, searchKeyword)}
                  </span>
                )}
                {/* 分區只用文字，不再加色點——狀態徽章已經有一個點，每張卡兩個點會變雜訊 */}
                <p className="mt-1 truncate text-xs leading-relaxed text-gray-500">
                  {donation.center && (
                    <>
                      <span className="text-gray-400">
                        {centerDisplayNames[donation.center] || donation.center}
                      </span>
                      <span className="mx-1.5 text-gray-300">·</span>
                    </>
                  )}
                  {highlightText(donation.organization, searchKeyword)}
                </p>
              </div>
              {detailPath && (
                <ChevronRight
                  ref={chevronRef}
                  className="animate-chevron-nudge mt-0.5 h-4 w-4 flex-none text-gray-300 transition-colors group-hover:text-pink-500"
                />
              )}
            </div>

            {donation.customNote && (
              <p className="mt-2.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs leading-relaxed text-amber-700">
                {donation.customNote}
              </p>
            )}
          </div>

          {/*
            贈品帶——這張卡唯一的飽和色，也是整面清單裡唯一會跳出來的東西。
            贈品是本站點擊率最高的資訊，只有帶贈品的場次會長出這一條，
            所以往下滑時「哪幾場值得去」一眼就掃得到。
          */}
          {giftChips.length > 0 && (
            <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-pink-100 bg-pink-50/70 px-4 py-2.5">
              <Gift className="h-3.5 w-3.5 flex-none text-pink-500" />
              {giftChips.map((chip) =>
                chip.href ? (
                  <Link
                    key={chip.key}
                    href={chip.href}
                    className="text-xs font-semibold text-pink-700 underline decoration-pink-200 underline-offset-2 transition-colors hover:decoration-pink-500"
                  >
                    {chip.label}
                  </Link>
                ) : (
                  <span
                    key={chip.key}
                    className="text-xs font-semibold text-pink-700"
                  >
                    {chip.label}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
