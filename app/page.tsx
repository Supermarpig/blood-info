// app/page.tsx
import SearchableDonationList from "@/components/SearchableDonationList";


export default async function BloodDonationPage() {
  let data;
  let error = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}/api/blood-donations`);
    data = await response.json();

    if (!data.success) {
      error = data.error || "發生錯誤";
    }
  } catch (err) {
    error = "無法獲取捐血活動資料";
    console.error(err);
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">捐血活動列表</h1>
      </div>

      <SearchableDonationList data={data.data} />
    </div>
  );
}
