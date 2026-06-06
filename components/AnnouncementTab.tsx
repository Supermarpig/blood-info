"use client";

import { useEffect, useMemo, useState } from "react";
import { Megaphone, MapPin, Gift, X, ArrowRight } from "lucide-react";

interface Announcement {
  enabled: boolean;
  title: string;
  message: string;
  spots: string[];
  gifts: string[];
  ctaText: string;
  ctaUrl: string;
  autoRecommend: boolean;
  updatedAt: string;
}

interface DonationEvent {
  id?: string;
  location: string;
  activityDate: string;
  tags?: string[];
  subTags?: string[];
  pttData?: { tags?: string[] };
}

interface AutoRec {
  location: string;
  gifts: string[];
  href: string | null;
}

// 與 CardInfo / activity 頁一致的短 id 雜湊，用來組活動詳情連結
function eventShortId(id: string): string {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) + hash + id.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(36).padStart(6, "0");
}

function announcementHasContent(d: Announcement) {
  return (
    d.enabled &&
    (!!d.title || !!d.message || d.spots.length > 0 || d.gifts.length > 0)
  );
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

/** 從今日捐血活動自動挑「有贈品」的一間 */
function pickAutoRec(
  data: Record<string, DonationEvent[]>
): AutoRec | null {
  const events = data[todayStr()] ?? [];
  const withGifts = events
    .map((e) => ({
      e,
      gifts: e.subTags?.length
        ? e.subTags.map((t) => t.split("－")[1] ?? t)
        : e.tags?.length
        ? e.tags
        : e.pttData?.tags || [],
    }))
    .filter((x) => x.gifts.length > 0);
  if (withGifts.length === 0) return null;

  // 贈品最多的優先，較吸引人
  withGifts.sort((a, b) => b.gifts.length - a.gifts.length);
  const best = withGifts[0];
  const href = best.e.id
    ? `/activity/${best.e.activityDate}-${eventShortId(best.e.id)}`
    : null;
  return { location: best.e.location, gifts: best.gifts, href };
}

export default function AnnouncementTab({
  todayEvents = [],
  initialAnn,
}: {
  todayEvents?: DonationEvent[];
  initialAnn?: Announcement;
}) {
  const [ann, setAnn] = useState<Announcement | null>(initialAnn ?? null);
  const [autoRec, setAutoRec] = useState<AutoRec | null>(null);
  const [ready, setReady] = useState(!!initialAnn);

  const [render, setRender] = useState(false); // modal 是否在 DOM
  const [closing, setClosing] = useState(false); // 是否正在播放收合動畫
  const [dot, setDot] = useState(false); // tab 上未讀紅點

  useEffect(() => {
    setAutoRec(pickAutoRec({ [todayStr()]: todayEvents }));
  }, [todayEvents]);

  useEffect(() => {
    if (initialAnn) return; // skip fetch when server pre-rendered
    let active = true;
    fetch("/api/announcement")
      .then((r) => r.json())
      .catch(() => null)
      .then((annRes) => {
        if (!active) return;
        setAnn(annRes?.success ? (annRes.data as Announcement) : null);
        setReady(true);
      });
    return () => { active = false; };
  }, [initialAnn]);

  // 後台優先；後台沒填的欄位用自動推薦補上。autoRecommend 關閉時不自動推薦。
  const adminActive = !!ann && announcementHasContent(ann);
  const autoAllowed = ann ? ann.autoRecommend !== false : true;
  const effectiveAuto = autoAllowed ? autoRec : null;
  const display = useMemo(() => {
    if (!adminActive && !effectiveAuto) return null;
    const adminCta = !!(ann?.ctaText && ann?.ctaUrl);
    const usingAutoSpot = !(ann?.spots && ann.spots.length > 0) && !!effectiveAuto;
    return {
      title: ann?.title || "今日捐血推薦 🩸",
      message: ann?.message || "",
      spots:
        ann?.spots && ann.spots.length > 0
          ? ann.spots
          : effectiveAuto
            ? [effectiveAuto.location]
            : [],
      gifts:
        ann?.gifts && ann.gifts.length > 0
          ? ann.gifts
          : effectiveAuto
            ? effectiveAuto.gifts
            : [],
      // 後台有設 CTA 就用後台的；否則用自動推薦那場活動的連結
      ctaText: adminCta ? ann!.ctaText : effectiveAuto?.href ? "查看這場活動" : "",
      ctaUrl: adminCta ? ann!.ctaUrl : effectiveAuto?.href || "",
      // 自動推薦的地點可點進活動頁
      spotHref: usingAutoSpot ? effectiveAuto!.href : null,
      isAuto: !adminActive, // 純自動推薦（後台未啟用）
    };
  }, [adminActive, ann, effectiveAuto]);

  // 版本鍵：後台公告依 updatedAt；純自動推薦依當天日期（每天重跳一次）
  const seenKey =
    adminActive && ann?.updatedAt
      ? `ann_seen_ann_${ann.updatedAt}`
      : `ann_seen_auto_${todayStr()}`;

  // 首次（未看過此版本）自動彈出
  useEffect(() => {
    if (!ready || !display) return;
    const seen =
      typeof window !== "undefined" && window.localStorage.getItem(seenKey);
    if (!seen) {
      setDot(true);
      setRender(true);
    }
  }, [ready, display, seenKey]);

  const markSeen = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(seenKey, "1");
    }
    setDot(false);
  };

  const openModal = () => {
    setClosing(false);
    setRender(true);
  };

  const closeModal = () => {
    setClosing(true);
    markSeen();
    setTimeout(() => {
      setRender(false);
      setClosing(false);
    }, 720);
  };

  if (!display) return null;

  return (
    <>
      {/* 浮動 Tab — 疊在「健康補給」上方 */}
      <button
        onClick={openModal}
        aria-label="開啟今日推薦"
        className="fixed right-0 z-30 flex -translate-y-1/2 items-center gap-1 rounded-l-xl bg-gradient-to-b from-amber-400 to-orange-500 px-1.5 py-3 text-white shadow-lg transition-all duration-300 hover:px-2.5 hover:shadow-xl"
        style={{ top: "calc(50% - 104px)", writingMode: "vertical-rl" }}
      >
        {dot && (
          <span className="absolute -left-1 -top-1">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-red-400 opacity-80" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
          </span>
        )}
        <Megaphone className="h-3.5 w-3.5" />
        <span className="text-xs font-bold tracking-widest">今日推薦</span>
      </button>

      {/* 公告 Modal：從右側 tab 飛出 / 收回 */}
      {render && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={closeModal}
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
              closing ? "opacity-0" : "opacity-100"
            }`}
          />
          <div
            className={`relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ${
              closing ? "animate-announce-dock" : "animate-announce-in"
            }`}
          >
            <div className="relative bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-5 text-white">
              <button
                type="button"
                onClick={closeModal}
                aria-label="關閉"
                className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                <h2 className="text-lg font-bold">{display.title}</h2>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {display.message && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {display.message}
                </p>
              )}

              {display.spots.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <MapPin className="h-4 w-4 text-red-500" />
                    {display.isAuto ? "今日推薦地點" : "本週推薦地點"}
                  </p>
                  <ul className="space-y-1.5">
                    {display.spots.map((s, i) =>
                      display.spotHref ? (
                        <li key={i}>
                          <a
                            href={display.spotHref}
                            onClick={markSeen}
                            className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-amber-100"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            <span className="flex-1">{s}</span>
                            <ArrowRight className="h-4 w-4 text-amber-500" />
                          </a>
                        </li>
                      ) : (
                        <li
                          key={i}
                          className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-gray-700"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {s}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {display.gifts.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <Gift className="h-4 w-4 text-pink-500" />
                    {display.isAuto ? "現場贈品" : "本週主打贈品"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {display.gifts.map((g, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {display.ctaText && display.ctaUrl ? (
                  <a
                    href={display.ctaUrl}
                    onClick={markSeen}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    {display.ctaText}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={closeModal}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    display.ctaText && display.ctaUrl
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "flex-1 bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  知道了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
