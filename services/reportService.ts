// /services/reportService.ts
import DonationReportModel, {
  IDonationReport,
  IDonationReportInput,
} from "@/models/DonationReport";
import dbConnect from "@/lib/mongodb";

/**
 * 建立新的捐血地點通知
 */
export async function createDonationReport(
  data: IDonationReportInput
): Promise<IDonationReport> {
  await dbConnect();
  const newReport = new DonationReportModel(data);
  await newReport.save();
  return newReport;
}

/**
 * 獲取所有通知（預設獲取待處理的）
 */
export async function getAllReports(
  status?: "pending" | "approved" | "rejected"
): Promise<IDonationReport[]> {
  await dbConnect();
  const query = status ? { status } : {};
  return await DonationReportModel.find(query)
    .sort({ createdAt: -1 })
    .lean<IDonationReport[]>();
}
