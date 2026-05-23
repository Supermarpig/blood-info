"use client";

import { useEffect, useState } from "react";
import {
  Megaphone,
  MapPin,
  Gift,
  X,
  ArrowRight,
} from "lucide-react";

interface Announcement {
  enabled: boolean;
  title: string;
  message: string;
  spots: string[];
  gifts: string[];
  ctaText: string;
  ctaUrl: string;
  updatedAt: string;
}

function hasContent(d: Announcement) {
  return (
    d.enabled &&
    (!!d.title || !!d.message || d.spots.length > 0 || d.gifts.length > 0)
  );
}

export default function AnnouncementTab() {
  const [data, setData] = useState<Announcement | null>(null);
  const [render, setRender] = useState(false); // modal 是否在 DOM
  const [closing, setClosing] = useState(false); // 是否正在播放收合動畫
  const [dot, setDot] = useState(false); // tab 上未讀紅點

  useEffect(() => {
    let active = true;
    fetch("/api/announcement")
      .then((r) => r.json())
      .then((res) => {
        if (!active || !res?.success || !res.data) return;
        const d = res.data as Announcement;
        if (!hasContent(d)) return;
        setData(d);

        const seen =
          typeof window !== "undefined" &&
          window.localStorage.getItem(`ann_seen_${d.updatedAt}`);
        if (!seen) {
          setDot(true);
          setRender(true); // 首次造訪自動彈出（進場動畫自動播放）
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const markSeen = () => {
    if (data?.updatedAt && typeof window !== "undefined") {
      window.localStorage.setItem(`ann_seen_${data.updatedAt}`, "1");
    }
    setDot(false);
  };

  const openModal = () => {
    setClosing(false);
    setRender(true);
  };

  const closeModal = () => {
    setClosing(true); // 觸發「順時針旋轉撞牆卡進 tab」收合動畫
    markSeen();
    setTimeout(() => {
      setRender(false);
      setClosing(false);
    }, 720);
  };

  if (!data || !hasContent(data)) return null;

  return (
    <>
      {/* 浮動 Tab — 疊在「健康補給」上方 */}
      <button
        onClick={openModal}
        aria-label="開啟本週公告"
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
        <span className="text-xs font-bold tracking-widest">本週公告</span>
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
                <h2 className="text-lg font-bold">
                  {data.title || "本週捐血推薦 🩸"}
                </h2>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {data.message && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {data.message}
                </p>
              )}

              {data.spots.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <MapPin className="h-4 w-4 text-red-500" />
                    本週推薦地點
                  </p>
                  <ul className="space-y-1.5">
                    {data.spots.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-gray-700"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.gifts.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <Gift className="h-4 w-4 text-pink-500" />
                    本週主打贈品
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.gifts.map((g, i) => (
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
                {data.ctaText && data.ctaUrl ? (
                  <a
                    href={data.ctaUrl}
                    onClick={markSeen}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    {data.ctaText}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={closeModal}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    data.ctaText && data.ctaUrl
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
