/**
 * 「現場熱度」的單一來源：最近一直有人回報＝火（熱門），冷清＝水（平靜）。
 *
 * 活動頁的回報表單（OnsiteReport）與首頁的「最新現場真相」跑馬燈
 * （RecentOnsiteReports）共用同一套配色 / 計分，讓火↔水的視覺語言一致。
 *
 * 計分採「最近度加權」而非單純則數：剛回報的權重高、舊的趨近 0，
 * 所以「火」真正代表*現在很熱門*，而不是一則很久以前的回報。
 */

import { Flame, Droplets, type LucideIcon } from "lucide-react";

export type HeatTier = "calm" | "warm" | "hot";

export const HEAT: Record<
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
    /** 粒子層：火＝柴火餘燼（柔邊光點，飄升＋搖曳＋明滅）、水＝緩緩上浮的圓水泡 */
    particle: {
      shape: "ember" | "bubble"; // ember＝柴火火星、bubble＝圓水泡
      colors: string[]; // 隨機取用的粒子顏色
      dur: [number, number]; // 上升一輪的秒數範圍（越熱越快）
      opacity: number; // 峰值不透明度
      size: [number, number]; // 基準尺寸 px 範圍
      /** 火堆本體：下緣一條不規律明滅的暖光帶，餘燼從這冒出（只有火有） */
      bed?: string;
    };
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
    particle: {
      shape: "bubble",
      colors: ["#7dd3fc", "#38bdf8", "#a5f3fc"],
      dur: [6, 10],
      opacity: 0.5,
      size: [3, 6],
    },
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
    particle: {
      shape: "ember",
      colors: ["#fcd34d", "#fb923c", "#fbbf24"],
      dur: [3.5, 6],
      opacity: 0.55,
      size: [3, 6],
      bed: "linear-gradient(to top, rgba(251,146,60,0.40), rgba(245,158,11,0.20) 45%, transparent 78%)",
    },
  },
  hot: {
    aura: "linear-gradient(115deg, #fb923c, #f43f5e, #f59e0b, #ef4444, #fb923c)",
    borderOpacity: 1,
    glowOpacity: 0.8,
    flow: 3.4,
    breath: 1.7,
    icon: Flame,
    iconClass: "text-rose-500",
    badge: "bg-rose-50 text-rose-600 border-rose-100",
    label: "熱門",
    particle: {
      shape: "ember",
      colors: ["#fb923c", "#f97316", "#fbbf24", "#ef4444"],
      dur: [2.4, 4.2],
      opacity: 0.85,
      size: [3, 6],
      bed: "linear-gradient(to top, rgba(239,68,68,0.50), rgba(251,146,60,0.38) 32%, rgba(251,191,36,0.20) 62%, transparent 84%)",
    },
  },
};

/** 由回報的時間戳推算現場熱度（只需要 createdAt） */
export function computeHeat(reports: { createdAt: string }[]): {
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
