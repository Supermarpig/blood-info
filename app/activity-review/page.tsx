// app/activity-review/page.tsx
import { Metadata } from "next";
import ImageApprovalList from "@/components/ImageApprovalList";
import { getAllBloodImgInfo } from "@/services/bloodService";

// 這頁在 render 時會連 MongoDB，標記 force-dynamic 避免 build 階段就嘗試連線。
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ActivityReviewPage() {
  const bloodImgInfos = await getAllBloodImgInfo();

  const formattedData = bloodImgInfos.map((item) => ({
    _id: (item._id as object).toString(), // 將 ObjectId 轉為字串
    id: item.id,
    organization: item.organization,
    imgUrl: item.imgUrl,
    activityDate: item.activityDate,
  }));

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">活動審核頁面</h1>
      <ImageApprovalList data={formattedData} />
    </div>
  );
}
