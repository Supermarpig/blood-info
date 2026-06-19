// /models/OnsiteReport.ts
//
// 「現場真相回報」的 Mongoose 模型。儲存層從 GitHub Issues 改為 MongoDB：
// 依 eventId 建索引可快速讀取、可分頁、無速率限制、不污染 issue tracker。
//
// 注意命名：`status` 是「活動是否正常舉辦」的領域資料（與 lib/onsiteReport 一致），
// `moderation` 才是審核狀態（approved/pending/rejected）。兩者不同，勿混用。
import mongoose, { Schema, Document, Model } from "mongoose";

export type Moderation = "approved" | "pending" | "rejected";

export interface IOnsiteReport extends Document {
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
  createdAt: Date;
  updatedAt: Date;
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

const OnsiteReportSchema = new Schema<IOnsiteReport>(
  {
    eventId: { type: String, required: true, index: true },
    giftMatch: { type: String, default: "" },
    actualGift: { type: String, default: "" },
    crowd: { type: String, default: "" },
    status: { type: String, default: "" },
    note: { type: String, default: "" },
    nickname: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    moderation: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
      index: true,
    },
    submitterToken: { type: String, default: "" },
    ipHash: { type: String, default: "", index: true },
  },
  {
    timestamps: true,
    collection: "onsiteReports",
  }
);

type IOnsiteReportModel = Model<IOnsiteReport>;

const OnsiteReportModel =
  (mongoose.models.OnsiteReport as IOnsiteReportModel) ||
  mongoose.model<IOnsiteReport, IOnsiteReportModel>(
    "OnsiteReport",
    OnsiteReportSchema
  );

export default OnsiteReportModel;
