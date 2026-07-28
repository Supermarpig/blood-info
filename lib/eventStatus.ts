/**
 * 捐血活動的即時狀態（進行中／快結束／今日已結束／尚未開始）。
 *
 * 為什麼值得做：清單上每張卡都有時間，但「09:00~17:00」對決定要不要現在出門幾乎沒幫助——
 * 真正要知道的是「現在還開著嗎、還剩多久」。這也是各捐血中心官網都沒有的資訊。
 *
 * 注意：結果依賴「現在幾點」，所以**只能在 client 端 mount 後計算**。
 * 若在 render 期間直接算，SSR 與 hydration 兩次的結果會不同而造成 hydration mismatch，
 * 而且本站清單頁是靜態產生的（revalidate=false），server 端算出來的值會被凍結在 build 當下。
 */

export type EventStatusKind =
  | "ongoing" // 進行中
  | "ending-soon" // 進行中且快結束
  | "not-started" // 今天稍晚才開始
  | "finished" // 今天已結束
  | "past" // 活動日期已過
  | "upcoming"; // 未來日期，不特別標示

export interface EventStatus {
  kind: EventStatusKind;
  label: string;
}

/** 快結束的門檻（分鐘） */
const ENDING_SOON_MINUTES = 90;

/** 從「09:00~17:00」這類字串取出起訖分鐘數；取不到回傳 null */
function parseTimeRange(
  time: string
): { startMin: number; endMin: number } | null {
  const matches = [...time.matchAll(/(\d{1,2}):(\d{2})/g)];
  if (matches.length === 0) return null;
  const toMin = (m: RegExpMatchArray) => Number(m[1]) * 60 + Number(m[2]);
  const startMin = toMin(matches[0]);
  const endMin = matches.length > 1 ? toMin(matches[matches.length - 1]) : startMin;
  return { startMin, endMin };
}

function formatRemaining(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    return `剩 ${h} 小時`;
  }
  return `剩 ${Math.max(minutes, 1)} 分鐘`;
}

/**
 * @param activityDate 活動日期，格式 YYYY-MM-DD
 * @param time         時間字串，例如「09:00~17:00」
 * @param now          現在時間，預設 new Date()（測試可注入）
 */
export function getEventStatus(
  activityDate: string,
  time: string,
  now: Date = new Date()
): EventStatus {
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });

  if (activityDate < today) return { kind: "past", label: "已結束" };
  if (activityDate > today) return { kind: "upcoming", label: "" };

  const range = parseTimeRange(time);
  if (!range) return { kind: "upcoming", label: "" };

  // 用台北時區的當下時間換算成「今天的第幾分鐘」
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const [h, m] = parts.split(":").map(Number);
  const nowMin = h * 60 + m;

  if (nowMin < range.startMin) {
    const startLabel = `${String(Math.floor(range.startMin / 60)).padStart(2, "0")}:${String(
      range.startMin % 60
    ).padStart(2, "0")}`;
    return { kind: "not-started", label: `${startLabel} 開始` };
  }
  if (nowMin > range.endMin) return { kind: "finished", label: "今日已結束" };

  const remaining = range.endMin - nowMin;
  if (remaining <= ENDING_SOON_MINUTES) {
    return { kind: "ending-soon", label: formatRemaining(remaining) };
  }
  return { kind: "ongoing", label: "進行中" };
}
