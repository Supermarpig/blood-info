"use client";

/**
 * 「現場真相回報」元件——放在活動詳情頁。
 *
 * 護城河的引擎：① 即時抓取並「展示」其他捐血人的現場回報（看到自己的貢獻被
 * 顯示 → 願意再回報 → 數據飛輪），② 把回報門檻壓到幾顆 chip + 一張照片。
 * 公告 vs 現場的對照，是官方網站永遠不會有、抄襲者也無法靠爬蟲補回的資料。
 *
 * 動畫用 GSAP（與全站一致的 useGSAP）：回報項目進場 stagger、展開表單欄位
 * 依序滑入、送出後自己的回報高亮一下。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Camera,
  Loader2,
  Check,
  ChevronDown,
  X,
  User,
  Gift,
  Users,
  CalendarCheck,
  Flame,
  Droplets,
  type LucideIcon,
} from "lucide-react";
import Confetti from "@/components/Confetti";
import {
  GIFT_MATCH_LABELS,
  CROWD_LABELS,
  STATUS_LABELS,
  GIFT_MATCH_KEYS,
  CROWD_KEYS,
  STATUS_KEYS,
  type GiftMatch,
  type Crowd,
  type EventStatus,
  type PublicOnsiteReport,
} from "@/lib/onsiteReport";

gsap.registerPlugin(useGSAP);

interface Props {
  eventId: string;
  announcedGifts: string[];
}

/**
 * 「現場熱度」隱喻：最近一直有人回報＝火（熱門），冷清＝水（平靜）。
 * 用最近度加權算分（剛回報的權重高、舊的趨近 0），再分三段對應外層卡片光暈。
 */
type HeatTier = "calm" | "warm" | "hot";

const HEAT: Record<
  HeatTier,
  {
    /** 流動漸層（同時用於彩色邊框與後方柔光；首末色相同以無縫循環） */
    aura: string;
    borderOpacity: number; // 彩色邊框的不透明度（清楚看得到）
    glowOpacity: number; // 後方柔光的峰值不透明度
    flow: number; // 漸層流動一輪的秒數（越熱越快）
    breath: number; // 柔光呼吸一輪的秒數
    icon: LucideIcon;
    iconClass: string;
    badge: string;
    label: string;
  }
> = {
  calm: {
    aura: "linear-gradient(115deg, #38bdf8, #22d3ee, #2dd4bf, #22d3ee, #38bdf8)",
    borderOpacity: 0.7,
    glowOpacity: 0.35,
    flow: 12,
    breath: 4.5,
    icon: Droplets,
    iconClass: "text-sky-500",
    badge: "bg-sky-50 text-sky-600 border-sky-100",
    label: "平靜",
  },
  warm: {
    aura: "linear-gradient(115deg, #fbbf24, #fb923c, #f59e0b, #fb923c, #fbbf24)",
    borderOpacity: 0.85,
    glowOpacity: 0.45,
    flow: 8,
    breath: 3.2,
    icon: Flame,
    iconClass: "text-amber-500",
    badge: "bg-amber-50 text-amber-600 border-amber-100",
    label: "熱絡",
  },
  hot: {
    aura: "linear-gradient(115deg, #fb923c, #f43f5e, #f59e0b, #ef4444, #fb923c)",
    borderOpacity: 1,
    glowOpacity: 0.65,
    flow: 4.5,
    breath: 2,
    icon: Flame,
    iconClass: "text-rose-500",
    badge: "bg-rose-50 text-rose-600 border-rose-100",
    label: "熱門",
  },
};

function computeHeat(reports: PublicOnsiteReport[]): {
  tier: HeatTier;
  score: number;
} {
  const now = Date.now();
  let score = 0;
  for (const r of reports) {
    const ageH = (now - new Date(r.createdAt).getTime()) / 3600000;
    if (Number.isNaN(ageH)) score += 1;
    else if (ageH < 3) score += 3;
    else if (ageH < 24) score += 2;
    else if (ageH < 24 * 7) score += 1;
    else score += 0.4;
  }
  const tier: HeatTier = score >= 6 ? "hot" : score >= 2 ? "warm" : "calm";
  return { tier, score };
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

function Chip({
  active,
  onClick,
  dot,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border transition-all duration-150 active:scale-[0.97] ${
        active
          ? "bg-gray-900 text-white border-gray-900 font-medium shadow-sm"
          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot} ${
            active ? "ring-2 ring-white/25" : ""
          }`}
        />
      )}
      {children}
    </button>
  );
}

/** 問題標題：前綴一個小 lucide 圖示建立視覺層次（灰階，無 emoji） */
function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2.5">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
      {children}
    </p>
  );
}

function ReportItem({ r }: { r: PublicOnsiteReport }) {
  const gm = r.giftMatch
    ? GIFT_MATCH_LABELS[r.giftMatch as Exclude<GiftMatch, "">]
    : null;
  const initial = r.nickname?.trim()?.[0]?.toUpperCase() || "";
  return (
    <div className="onsite-item flex gap-3 py-4 border-t border-gray-100 first:border-t-0 first:pt-1 rounded-lg">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-500">
        {initial || <User className="w-4 h-4 text-gray-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">
            {r.nickname || "匿名捐血人"}
          </span>
          <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
          {r.pending && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600">
              審核中
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {gm && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${gm.tone}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${gm.dot}`} />
              {gm.label}
            </span>
          )}
          {r.crowd && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  CROWD_LABELS[r.crowd as Exclude<Crowd, "">].dot
                }`}
              />
              {CROWD_LABELS[r.crowd as Exclude<Crowd, "">].label}
            </span>
          )}
          {r.status && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  STATUS_LABELS[r.status as Exclude<EventStatus, "">].dot
                }`}
              />
              {STATUS_LABELS[r.status as Exclude<EventStatus, "">].label}
            </span>
          )}
        </div>
        {r.actualGift && (
          <p className="text-sm text-gray-700 mt-2">
            <span className="text-gray-400">實際拿到</span>　{r.actualGift}
          </p>
        )}
        {r.note && (
          <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap break-words leading-relaxed">
            {r.note}
          </p>
        )}
        {r.photoUrl && (
          <a
            href={r.photoUrl}
            target="_blank"
            rel="noreferrer"
            className="block mt-2.5 w-24 h-24 relative rounded-xl overflow-hidden border border-gray-200"
          >
            <Image
              src={r.photoUrl}
              alt="現場照片"
              fill
              sizes="96px"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </a>
        )}
      </div>
    </div>
  );
}

export default function OnsiteReport({ eventId, announcedGifts }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef("");
  const [reports, setReports] = useState<PublicOnsiteReport[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [addedCount, setAddedCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");
  const [error, setError] = useState("");
  const [confettiKey, setConfettiKey] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const [giftMatch, setGiftMatch] = useState<GiftMatch>("");
  const [actualGift, setActualGift] = useState("");
  const [crowd, setCrowd] = useState<Crowd>("");
  const [status, setStatus] = useState<EventStatus>("");
  const [note, setNote] = useState("");
  const [nickname, setNickname] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 現場熱度 → 決定外層卡片光暈的顏色與流速（火＝熱門、水＝平靜）
  const heat = useMemo(() => computeHeat(reports), [reports]);
  const cfg = HEAT[heat.tier];
  const HeatIcon = cfg.icon;

  useEffect(() => {
    let alive = true;
    // viewer token：審核前讓本人仍看得到自己的 pending 回報
    let token = "";
    try {
      token = localStorage.getItem("onsite_token") || "";
      if (!token) {
        token =
          (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
          Math.random().toString(36).slice(2);
        localStorage.setItem("onsite_token", token);
      }
    } catch {
      /* localStorage 不可用時退化為匿名 */
    }
    tokenRef.current = token;

    fetch(
      `/api/onsite-reports?eventId=${encodeURIComponent(
        eventId
      )}&token=${encodeURIComponent(token)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.reports)) {
          setReports(d.reports);
          setLoadedAt(Date.now());
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [eventId]);

  // 現場熱度光暈：漸層沿卡片外緣流動 + 呼吸明滅，圖示隨火/水律動
  useGSAP(
    () => {
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const border = rootRef.current?.querySelector<HTMLElement>(".heat-border");
      const glow = rootRef.current?.querySelector<HTMLElement>(".heat-glow");
      const icon = rootRef.current?.querySelector<HTMLElement>(".heat-icon");

      // 邊框與柔光：漸層沿卡片外緣流動
      [border, glow].forEach((el) => {
        if (!el) return;
        if (reduce) {
          gsap.set(el, { backgroundPosition: "50% 50%" });
        } else {
          gsap.fromTo(
            el,
            { backgroundPosition: "0% 50%" },
            { backgroundPosition: "200% 50%", duration: cfg.flow, ease: "none", repeat: -1 }
          );
        }
      });
      // 柔光額外呼吸明滅
      if (glow && !reduce) {
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

      if (icon && !reduce) {
        if (heat.tier === "hot") {
          // 火：快速跳動，原點偏下像火苗
          gsap.to(icon, {
            scale: 1.18,
            duration: 0.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            transformOrigin: "50% 85%",
          });
        } else if (heat.tier === "calm") {
          // 水：緩慢起伏
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
    { dependencies: [heat.tier], scope: rootRef }
  );

  // 初次載入：回報項目依序進場
  useGSAP(
    () => {
      if (!loadedAt) return;
      gsap.from(".onsite-item", {
        y: 12,
        opacity: 0,
        duration: 0.4,
        stagger: 0.07,
        ease: "power2.out",
      });
    },
    { dependencies: [loadedAt], scope: panelRef }
  );

  // 展開回報表單：欄位依序滑入
  useGSAP(
    () => {
      if (!open) return;
      gsap.from(".onsite-form-row", {
        y: 10,
        opacity: 0,
        duration: 0.32,
        stagger: 0.05,
        ease: "power2.out",
      });
    },
    { dependencies: [open], scope: panelRef }
  );

  // 送出後：自己的回報插到最上面，淡綠高亮一下
  useGSAP(
    () => {
      if (!addedCount) return;
      const first = panelRef.current?.querySelector(".onsite-item");
      if (!first) return;
      gsap.from(first, { y: -10, opacity: 0, duration: 0.4, ease: "power2.out" });
      gsap.fromTo(
        first,
        { backgroundColor: "rgba(16,185,129,0.10)" },
        { backgroundColor: "rgba(16,185,129,0)", duration: 1.4, ease: "power1.out" }
      );
    },
    { dependencies: [addedCount], scope: panelRef }
  );

  // 彩帶播完自動卸載，避免最後一幀凍結在畫面上（連續送出會用 confettiKey 重觸發）
  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(false), 2700);
    return () => clearTimeout(t);
  }, [celebrate, confettiKey]);

  const toggle = <T extends string>(
    cur: T,
    val: T,
    set: (v: T) => void,
    empty: T
  ) => set(cur === val ? empty : val);

  const handlePhoto = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      setError("");
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload-image-public", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (res.ok && data.url) setPhotoUrl(data.url);
        else setError(data.error || "照片上傳失敗");
      } catch {
        setError("照片上傳失敗");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const canSubmit =
    !submitting &&
    (giftMatch || crowd || status || actualGift.trim() || note.trim() || photoUrl);

  async function submit() {
    if (!canSubmit) {
      setError("請至少回報一項現場狀況");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onsite-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          giftMatch,
          actualGift: actualGift.trim(),
          crowd,
          status,
          note: note.trim(),
          nickname: nickname.trim(),
          photoUrl,
          submitterToken: tokenRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "提交失敗，請稍後再試");
        return;
      }
      const pending = data.moderation === "pending";
      // 樂觀更新：立刻把自己的回報插到最上面，看見貢獻被展示
      setReports((prev) => [
        {
          giftMatch,
          actualGift: actualGift.trim(),
          crowd,
          status,
          note: note.trim(),
          nickname: nickname.trim(),
          photoUrl,
          createdAt: new Date().toISOString(),
          pending,
        },
        ...prev,
      ]);
      setAddedCount((c) => c + 1);
      setDoneMsg(
        data.message ||
          (pending ? "已送出，審核後對外公開。" : "感謝回報，已即時顯示。")
      );
      // 撒彩帶慶祝貢獻（沿用站上的 Confetti，bump key 重新觸發）
      setCelebrate(true);
      setConfettiKey((k) => k + 1);
      setOpen(false);
      setGiftMatch("");
      setActualGift("");
      setCrowd("");
      setStatus("");
      setNote("");
      setNickname("");
      setPhotoUrl("");
    } catch {
      setError("提交失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={rootRef} className="relative mt-4">
      {/* 後方柔光：blur 擴散，火＝熱門、水＝平靜，會呼吸明滅 */}
      <div
        aria-hidden
        className="heat-glow pointer-events-none absolute -inset-2 rounded-[28px] blur-2xl z-0"
        style={{
          backgroundImage: cfg.aura,
          backgroundSize: "200% 200%",
          opacity: cfg.glowOpacity,
        }}
      />
      {/* 流動的彩色邊框：繞著卡片外緣跑（越熱越快） */}
      <div
        aria-hidden
        className="heat-border pointer-events-none absolute -inset-[2px] rounded-[18px] z-0"
        style={{
          backgroundImage: cfg.aura,
          backgroundSize: "200% 200%",
          opacity: cfg.borderOpacity,
        }}
      />
      <div
        ref={panelRef}
        className="relative z-10 bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden"
      >
        <Confetti key={confettiKey} isActive={celebrate} duration={2500} />
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
          <h2 className="text-sm font-semibold text-gray-800">現場真相</h2>
          <span className="text-xs text-gray-400">捐血人實際回報</span>
          {reports.length > 0 && (
            <span
              className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold rounded-full border px-2 py-0.5 ${cfg.badge}`}
              title={`${cfg.label}（${reports.length} 則回報）`}
            >
              <HeatIcon
                className={`heat-icon w-3.5 h-3.5 ${cfg.iconClass}`}
                strokeWidth={2.2}
              />
              {reports.length}
            </span>
          )}
        </div>

      <div className="p-5">
        {announcedGifts.length > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            官方公告贈品：
            <span className="text-gray-500">{announcedGifts.join("、")}</span>
          </p>
        )}

        {reports.length > 0 ? (
          <div>
            {reports.map((r, i) => (
              <ReportItem key={`${r.createdAt}-${i}`} r={r} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 leading-relaxed">
            還沒有人回報這場的現場狀況，你會是第一個幫到後面捐血人的人。
          </p>
        )}

        {doneMsg && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 mt-4">
            <Check className="w-4 h-4" />
            {doneMsg}
          </div>
        )}

        {!open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setDoneMsg("");
            }}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:scale-[0.99] transition-all"
          >
            我去過這場，回報現場狀況
            <ChevronDown className="w-4 h-4 text-gray-300" />
          </button>
        ) : (
          <div className="mt-4 space-y-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="onsite-form-row">
              <FieldLabel icon={Gift}>現場贈品跟公告一樣嗎？</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {GIFT_MATCH_KEYS.map((k) => (
                  <Chip
                    key={k}
                    active={giftMatch === k}
                    dot={GIFT_MATCH_LABELS[k].dot}
                    onClick={() => toggle(giftMatch, k, setGiftMatch, "")}
                  >
                    {GIFT_MATCH_LABELS[k].label}
                  </Chip>
                ))}
              </div>
            </div>

            <input
              value={actualGift}
              onChange={(e) => setActualGift(e.target.value)}
              maxLength={60}
              placeholder="實際拿到什麼？例如：7-11 100元禮券、泡麵"
              className="onsite-form-row w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-shadow"
            />

            <div className="onsite-form-row">
              <FieldLabel icon={Users}>現場要排隊嗎？</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CROWD_KEYS.map((k) => (
                  <Chip
                    key={k}
                    active={crowd === k}
                    dot={CROWD_LABELS[k].dot}
                    onClick={() => toggle(crowd, k, setCrowd, "")}
                  >
                    {CROWD_LABELS[k].label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="onsite-form-row">
              <FieldLabel icon={CalendarCheck}>活動有正常舉辦嗎？</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {STATUS_KEYS.map((k) => (
                  <Chip
                    key={k}
                    active={status === k}
                    dot={STATUS_LABELS[k].dot}
                    onClick={() => toggle(status, k, setStatus, "")}
                  >
                    {STATUS_LABELS[k].label}
                  </Chip>
                ))}
              </div>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="補充說明（選填）：停車、護理師、排隊動線……"
              className="onsite-form-row w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-shadow resize-none"
            />

            <div className="onsite-form-row flex items-center gap-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="暱稱（選填）"
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-shadow"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 disabled:opacity-50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                現場照
              </button>
            </div>

            {photoUrl && (
              <div className="onsite-form-row relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                <Image
                  src={photoUrl}
                  alt="預覽"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}

            {error && <p className="onsite-form-row text-sm text-red-500">{error}</p>}

            <div className="onsite-form-row flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                送出回報
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
            </div>
            <p className="onsite-form-row text-xs text-gray-400 text-center">
              回報即代表同意公開顯示，請勿填寫個資。
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
