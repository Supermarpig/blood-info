/**
 * 「現場真相回報」的單一資料來源（型別 + 標籤字典 + body 建構/解析）。
 *
 * 這是平台的護城河資料：捐血者「到了現場」才知道的實況——公告說送 A，
 * 現場其實是 B；要不要排隊；捐血車有沒有真的來。官方網站結構上不會做、
 * 而且這種資料會過期，抄爬歷史也沒用，只有靠活躍社群即時回報才累積得出來。
 *
 * 儲存層沿用既有的 GitHub Issues（label: onsite-report），與 donation-report /
 * wishlist 同一套機制，後台可沿用相同模式審核。
 */

export type GiftMatch = "" | "same" | "better" | "less" | "none";
export type Crowd = "" | "none" | "some" | "long";
export type EventStatus = "" | "normal" | "noshow";

export interface OnsiteReport {
  /** 對應活動詳情頁的代碼：{activityDate}-{eventShortId}，把回報釘到特定活動 */
  eventId: string;
  /** 現場贈品 vs 公告 */
  giftMatch: GiftMatch;
  /** 實際拿到什麼（自由文字） */
  actualGift: string;
  /** 現場排隊狀況 */
  crowd: Crowd;
  /** 活動有沒有正常舉辦 */
  status: EventStatus;
  /** 補充說明 */
  note: string;
  /** 暱稱（選填） */
  nickname: string;
  /** 現場照片（Cloudinary URL，選填，是「真相」最有力的證據） */
  photoUrl: string;
}

export const GIFT_MATCH_LABELS: Record<
  Exclude<GiftMatch, "">,
  { label: string; tone: string; dot: string }
> = {
  same: { label: "跟公告一樣", tone: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  better: { label: "比公告更好", tone: "text-pink-700 bg-pink-50 border-pink-200", dot: "bg-pink-500" },
  less: { label: "比公告縮水", tone: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  none: { label: "沒拿到贈品", tone: "text-gray-600 bg-gray-50 border-gray-200", dot: "bg-gray-400" },
};

export const CROWD_LABELS: Record<
  Exclude<Crowd, "">,
  { label: string }
> = {
  none: { label: "不用排隊" },
  some: { label: "稍微等一下" },
  long: { label: "要等很久" },
};

export const STATUS_LABELS: Record<
  Exclude<EventStatus, "">,
  { label: string }
> = {
  normal: { label: "正常舉辦" },
  noshow: { label: "沒看到或取消" },
};

export const GIFT_MATCH_KEYS = ["same", "better", "less", "none"] as const;
export const CROWD_KEYS = ["none", "some", "long"] as const;
export const STATUS_KEYS = ["normal", "noshow"] as const;

/** 一筆對外輸出的回報（GET 回傳給前端，已剝除任何敏感欄位） */
export interface PublicOnsiteReport
  extends Omit<OnsiteReport, "eventId"> {
  createdAt: string;
  /** 為 true 表示這是發文者本人尚在審核中的回報（只有本人看得到） */
  pending?: boolean;
}

// ── 混合審核政策（單一來源，route 與後台共用）────────────────────────

/** 結構化選項：點了任一 chip（贈品落差 / 排隊 / 活動狀態） */
function hasChip(r: Pick<OnsiteReport, "giftMatch" | "crowd" | "status">): boolean {
  return !!(r.giftMatch || r.crowd || r.status);
}

/** 自由文字：實際贈品或補充說明 */
function hasText(r: Pick<OnsiteReport, "actualGift" | "note">): boolean {
  return !!(r.actualGift.trim() || r.note.trim());
}

/**
 * 內容門檻：至少要有一個 chip 或一段文字才算數。
 * 「只有一張圖、什麼都沒填」會被擋下（這正是常見的洗版型態）。
 */
export function hasMeaningfulContent(r: OnsiteReport): boolean {
  return hasChip(r) || hasText(r);
}

/**
 * 是否需要人工審核（混合策略）：
 *  - 只點 chip 的結構化回報 → 風險低，自動公開（approved）
 *  - 含照片或自由文字 → 進待審（pending），審過才對外公開
 */
export function needsReview(r: OnsiteReport): boolean {
  return !!(r.photoUrl || hasText(r));
}
