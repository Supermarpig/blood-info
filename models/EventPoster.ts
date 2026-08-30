// /models/EventPoster.ts
//
// 「活動海報投稿」的型別定義。儲存層為 Cloudflare D1（見 migrations/0002）。
// 與現場回報（models/OnsiteReport.ts）分開：那是「我去過，現場長這樣」，
// 這是「這場活動的海報長這樣」——後者不需要去過現場，主辦單位自己就能提供。

export type Moderation = "approved" | "pending" | "rejected";

export interface IEventPoster {
  id: number;
  eventId: string;
  imageUrl: string;
  /** 送出當下的活動描述（機構/地點/日期），只給後台辨識用 */
  eventLabel: string;
  moderation: Moderation;
  /** 投稿者的瀏覽權杖：審核前讓本人看得到自己那張（存於瀏覽器 localStorage） */
  submitterToken: string;
  /** 來源 IP 的雜湊（不存原始 IP） */
  ipHash: string;
  /** ISO 8601 UTC 字串 */
  createdAt: string;
  updatedAt: string;
}

export type IEventPosterInput = Pick<
  IEventPoster,
  "eventId" | "imageUrl" | "eventLabel" | "moderation" | "submitterToken" | "ipHash"
>;
