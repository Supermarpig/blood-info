// /services/onsiteReportService.ts
import OnsiteReportModel, {
  IOnsiteReport,
  IOnsiteReportInput,
  Moderation,
} from "@/models/OnsiteReport";
import dbConnect from "@/lib/mongodb";

/** 建立一筆現場回報 */
export async function createOnsiteReport(
  data: IOnsiteReportInput
): Promise<IOnsiteReport> {
  await dbConnect();
  const doc = new OnsiteReportModel(data);
  await doc.save();
  return doc;
}

/**
 * 取得某活動「對外可見」的回報：所有 approved，
 * 外加發文者本人尚在 pending 的回報（用 submitterToken 比對）。
 */
export async function getVisibleReports(
  eventId: string,
  submitterToken?: string
): Promise<IOnsiteReport[]> {
  await dbConnect();
  const or: Record<string, unknown>[] = [{ moderation: "approved" }];
  if (submitterToken) {
    or.push({ moderation: "pending", submitterToken });
  }
  return OnsiteReportModel.find({ eventId, $or: or })
    .sort({ createdAt: -1 })
    .lean<IOnsiteReport[]>();
}

/** 後台：依審核狀態列出回報（預設待審） */
export async function listOnsiteReports(
  moderation?: Moderation
): Promise<IOnsiteReport[]> {
  await dbConnect();
  const query = moderation ? { moderation } : {};
  return OnsiteReportModel.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<IOnsiteReport[]>();
}

/** 後台：更新審核狀態 */
export async function setModeration(
  id: string,
  moderation: Moderation
): Promise<IOnsiteReport | null> {
  await dbConnect();
  return OnsiteReportModel.findByIdAndUpdate(
    id,
    { moderation },
    { new: true }
  ).lean<IOnsiteReport>();
}

/** 後台：刪除一筆回報 */
export async function deleteOnsiteReport(
  id: string
): Promise<IOnsiteReport | null> {
  await dbConnect();
  return OnsiteReportModel.findByIdAndDelete(id).lean<IOnsiteReport>();
}

/** 限流：同一 IP 在指定時間內的回報數 */
export async function countRecentByIp(
  ipHash: string,
  sinceMs: number
): Promise<number> {
  if (!ipHash) return 0;
  await dbConnect();
  return OnsiteReportModel.countDocuments({
    ipHash,
    createdAt: { $gte: new Date(Date.now() - sinceMs) },
  });
}

/** 後台統計：各審核狀態筆數 */
export async function countByModeration(): Promise<Record<Moderation, number>> {
  await dbConnect();
  const rows = await OnsiteReportModel.aggregate<{ _id: Moderation; n: number }>(
    [{ $group: { _id: "$moderation", n: { $sum: 1 } } }]
  );
  const out: Record<Moderation, number> = { approved: 0, pending: 0, rejected: 0 };
  for (const r of rows) if (r._id in out) out[r._id] = r.n;
  return out;
}
