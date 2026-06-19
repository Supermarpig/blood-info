// /models/OnsiteReport.ts
//
// 「現場真相回報」的型別定義。儲存層為 Cloudflare D1（SQLite，Workers 原生）。
// 不再使用 mongoose——MongoDB 的長連線 driver 在 Cloudflare Workers 上會因背景
// 監控計時器（心跳 / SRV 輪詢）在請求結束後仍嘗試做 I/O，被 runtime 殺掉而拋出
// 無法 catch 的 1101 例外。實際讀寫見 services/onsiteReportService.ts。
//
// 注意命名：`status` 是「活動是否正常舉辦」的領域資料（與 lib/onsiteReport 一致），
// `moderation` 才是審核狀態（approved/pending/rejected）。兩者不同，勿混用。

export type Moderation = "approved" | "pending" | "rejected";

export interface IOnsiteReport {
  id: number;
  eventId: string;
  giftMatch: string;
  actualGift: string;
  crowd: string;
  status: string; // 活動是否正常舉辦（domain，非審核狀態）
  note: string;
  nickname: string;
  photoUrl: string;
  moderation: Moderation;
  /** 發文者的瀏覽權杖：審核前讓本人仍看得到自己的 pending 回報（存於瀏覽器 localStorage） */
  submitterToken: string;
  /** 來源 IP 的雜湊（不存原始 IP），供限流/濫用追蹤 */
  ipHash: string;
  /** ISO 8601 UTC 字串（字典序即時間序，方便比較與排序） */
  createdAt: string;
  updatedAt: string;
}

export type IOnsiteReportInput = Pick<
  IOnsiteReport,
  | "eventId"
  | "giftMatch"
  | "actualGift"
  | "crowd"
  | "status"
  | "note"
  | "nickname"
  | "photoUrl"
  | "moderation"
  | "submitterToken"
  | "ipHash"
>;
