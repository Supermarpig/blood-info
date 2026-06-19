"use client";

/**
 * 跨活動的「最新現場真相」聚合 feed——放在首頁 / gift / city。
 * 目的：把分散在各活動頁的 UGC 現場回報集中曝光，製造社會證明、把人導進活動頁，
 * 讓回報飛輪轉更快。資料來自 /api/onsite-reports/recent（已含活動名稱、60s 快取）。
 *
 * 兩種版型：
 *  - variant="marquee"：橫向跑馬燈，佔位小、會動吸睛，適合擺首頁高處
 *  - variant="grid"（預設）：兩欄卡片，適合 gift / city 頁內容區
 *
 * 走 client 抓取：因為這些頁面是靜態的（home revalidate=false），server 端渲染會把
 * 「最新」凍結在 build；client 抓取可保持永遠最新，且不增加 build 對 Mongo 的依賴。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MapPin, ChevronRight } from "lucide-react";
import Link from "@/components/Link";
import {
  GIFT_MATCH_LABELS,
  CROWD_LABELS,
  STATUS_LABELS,
  type GiftMatch,
  type Crowd,
  type EventStatus,
} from "@/lib/onsiteReport";
import { HEAT, computeHeat, type HeatTier } from "@/lib/onsiteHeat";
import HeatParticles from "@/components/HeatParticles";

gsap.registerPlugin(useGSAP);

interface RecentReport {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  center: string;
  giftMatch: string;
  actualGift: string;
  crowd: string;
  status: string;
  note: string;
  nickname: string;
  photoUrl: string;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  return new Date(iso).toLocaleDateString("zh-TW");
}

function Badges({ r }: { r: RecentReport }) {
  const gm = r.giftMatch
    ? GIFT_MATCH_LABELS[r.giftMatch as Exclude<GiftMatch, "">]
    : null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {gm && (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${gm.tone}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${gm.dot}`} />
          {gm.label}
        </span>
      )}
      {r.crowd && (
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
          {CROWD_LABELS[r.crowd as Exclude<Crowd, "">].label}
        </span>
      )}
      {!gm && r.status && (
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
          {STATUS_LABELS[r.status as Exclude<EventStatus, "">].label}
        </span>
      )}
    </div>
  );
}

function SectionHeader({ tier }: { tier?: HeatTier }) {
  const cfg = tier ? HEAT[tier] : null;
  const HeatIcon = cfg?.icon;
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
      <h2 className="text-sm font-semibold text-gray-800">最新現場真相</h2>
      <span className="text-xs text-gray-400">捐血人到現場的實際回報</span>
      {cfg && HeatIcon && (
        <span
          className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}
          title={cfg.label}
        >
          <HeatIcon
            className={`heat-icon h-3.5 w-3.5 ${cfg.iconClass}`}
            strokeWidth={2.2}
          />
          {cfg.label}
        </span>
      )}
    </div>
  );
}

export default function RecentOnsiteReports({
  limit = 6,
  variant = "grid",
  className = "",
}: {
  limit?: number;
  variant?: "grid" | "marquee";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reports, setReports] = useState<RecentReport[] | null>(null);

  // 整條 feed 的現場熱度：火＝最近一直有人回報、水＝冷清
  const heat = useMemo(
    () => (reports?.length ? computeHeat(reports) : null),
    [reports]
  );

  useEffect(() => {
    let alive = true;
    fetch(`/api/onsite-reports/recent?limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setReports(Array.isArray(d.reports) ? d.reports : []);
      })
      .catch(() => {
        if (alive) setReports([]);
      });
    return () => {
      alive = false;
    };
  }, [limit]);

  // grid：卡片依序進場
  useGSAP(
    () => {
      if (variant !== "grid" || !reports?.length) return;
      gsap.from(".recent-onsite-card", {
        y: 14,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power2.out",
      });
    },
    { dependencies: [reports, variant], scope: ref }
  );

  // 熱度：後方柔光漸層流動 + 呼吸，標題徽章圖示隨火/水律動
  useGSAP(
    () => {
      if (!heat) return;
      const reduce = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const cfg = HEAT[heat.tier];
      const glow = ref.current?.querySelector<HTMLElement>(".heat-glow");
      const icon = ref.current?.querySelector<HTMLElement>(".heat-icon");

      if (glow) {
        if (reduce) {
          gsap.set(glow, { backgroundPosition: "50% 50%" });
        } else {
          gsap.fromTo(
            glow,
            { backgroundPosition: "0% 50%" },
            { backgroundPosition: "200% 50%", duration: cfg.flow, ease: "none", repeat: -1 }
          );
          gsap.fromTo(
            glow,
            { opacity: cfg.glowOpacity * 0.5 },
            {
              opacity: cfg.glowOpacity,
              duration: cfg.breath,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            }
          );
        }
      }
      if (icon && !reduce) {
        if (heat.tier === "hot") {
          gsap.to(icon, {
            scale: 1.18,
            duration: 0.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            transformOrigin: "50% 85%",
          });
        } else if (heat.tier === "calm") {
          gsap.to(icon, {
            y: -1.5,
            scale: 1.06,
            duration: 2.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
      }
    },
    { dependencies: [heat?.tier], scope: ref }
  );

  // marquee：自動推進「捲動容器」的 scrollLeft（內容複製一份，捲到一輪寬度就歸零→無縫）。
  // 這比 transform 動畫更穩：容器本身能手動橫向滑，iOS Safari 一定可用；
  // 開了「減少動態」就只剩手滑、不自動捲，但永遠不會卡住。
  const startAuto = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const loopW = el.scrollWidth / 2; // 內容複製一份，一輪寬 = 一半
    if (loopW < el.clientWidth) return; // 內容塞得下就不需要捲
    tweenRef.current?.kill();
    let start = el.scrollLeft;
    if (start >= loopW) {
      start -= loopW; // 從複製區回到對應的原始位置，續捲不跳
      el.scrollLeft = start;
    }
    const proxy = { v: start };
    tweenRef.current = gsap.to(proxy, {
      v: loopW,
      duration: (loopW - start) / 50, // 約 50px/秒
      ease: "none",
      onUpdate: () => {
        const e = scrollerRef.current;
        if (e) e.scrollLeft = proxy.v;
      },
      onComplete: () => {
        const e = scrollerRef.current;
        if (e) e.scrollLeft = 0; // 到一輪寬＝視覺等同 0，瞬間歸零無縫
        startAuto();
      },
    });
  }, []);

  const pauseAuto = useCallback(() => {
    tweenRef.current?.kill();
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => startAuto(), 1800);
  }, [startAuto]);

  useEffect(() => {
    if (variant !== "marquee" || !reports?.length) return;
    const t = setTimeout(startAuto, 150); // 等版面與字體就緒再量寬度
    return () => {
      clearTimeout(t);
      tweenRef.current?.kill();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [variant, reports, startAuto]);

  // 還沒載入或沒有任何回報 → 不顯示整個區塊（避免空box / 版面跳動）
  if (!reports || reports.length === 0) return null;

  if (variant === "marquee") {
    const loop = [...reports, ...reports];
    const cfg = HEAT[heat!.tier];
    return (
      <section ref={ref} className={className}>
        <SectionHeader tier={heat!.tier} />
        <div className="relative">
          {/* 後方柔光：火＝熱門、水＝平靜，會流動與呼吸 */}
          <div
            aria-hidden
            className="heat-glow pointer-events-none absolute -inset-2 rounded-[28px] blur-2xl z-0"
            style={{
              backgroundImage: cfg.aura,
              backgroundSize: "200% 200%",
              opacity: cfg.glowOpacity,
            }}
          />
          <div
            ref={scrollerRef}
            onMouseEnter={pauseAuto}
            onMouseLeave={scheduleResume}
            onTouchStart={pauseAuto}
            onTouchEnd={scheduleResume}
            className="relative z-10 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
          >
            <div className="flex w-max gap-3">
              {loop.map((r, i) => (
              <Link
                key={`${r.eventId}-${i}`}
                href={`/activity/${r.eventId}`}
                aria-hidden={i >= reports.length}
                className="group flex w-60 flex-shrink-0 flex-col gap-1.5 rounded-2xl border border-gray-200/60 bg-white p-3.5 shadow-sm hover:border-gray-300 transition-colors"
              >
                <Badges r={r} />
                {(r.actualGift || r.note) && (
                  <p className="text-sm text-gray-700 line-clamp-1">
                    {r.actualGift || r.note}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{r.eventTitle}</span>
                  <span className="ml-auto flex-shrink-0">
                    {timeAgo(r.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
            </div>
          </div>
          {/* 熱度粒子層：疊在跑馬燈上方，火星上竄 / 水泡上浮 */}
          <HeatParticles
            tier={heat!.tier}
            count={24}
            className="z-20 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
          />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className={`mt-10 ${className}`}>
      <SectionHeader tier={heat?.tier} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reports.map((r, i) => (
          <Link
            key={`${r.eventId}-${i}`}
            href={`/activity/${r.eventId}`}
            className="recent-onsite-card group flex gap-3 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm hover:border-gray-300 transition-colors"
          >
            {r.photoUrl && (
              <span
                className="block h-16 w-16 flex-shrink-0 rounded-lg border border-gray-200 bg-cover bg-center"
                style={{ backgroundImage: `url(${r.photoUrl})` }}
                aria-hidden
              />
            )}
            <div className="min-w-0 flex-1">
              <Badges r={r} />
              {(r.actualGift || r.note) && (
                <p className="mt-1.5 text-sm text-gray-700 line-clamp-2">
                  {r.actualGift || r.note}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{r.eventTitle}</span>
                <span className="flex-shrink-0">· {timeAgo(r.createdAt)}</span>
                <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-gray-300 group-hover:text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
