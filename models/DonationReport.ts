// /models/DonationReport.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDonationReport extends Document {
  address: string;
  activityDate: string;
  description?: string;
  imgurUrl: string;
  tags: string[];
  status: "pending" | "approved" | "rejected";
}

export type IDonationReportInput = Pick<
  IDonationReport,
  "address" | "activityDate" | "description" | "imgurUrl" | "tags"
>;

const DonationReportSchema = new Schema<IDonationReport>(
  {
    address: { type: String, required: true },
    activityDate: { type: String, required: true },
    description: { type: String },
    imgurUrl: { type: String, required: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    collection: "donationReports",
  }
);

type IDonationReportModel = Model<IDonationReport>;

const DonationReportModel =
  (mongoose.models.DonationReport as IDonationReportModel) ||
  mongoose.model<IDonationReport, IDonationReportModel>(
    "DonationReport",
    DonationReportSchema
  );

export default DonationReportModel;
