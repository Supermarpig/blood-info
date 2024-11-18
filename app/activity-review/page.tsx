// app/activity-review/page.tsx
import ImageApprovalList from '@/components/ImageApprovalList'

// 這個組件默認是伺服器組件，因為我們沒有使用 "use client"
export default async function ActivityReviewPage() {
  // 這裡使用 fetch 或其他方式在伺服器端獲取數據
  const data = [
    {
      _id: '6735ab9500a3857d653d913e',
      id: '5L2c5qWt5pmC6ZaT77yaOTozMH4xNjowMOOAguS4u+i+puWWruS9je+8muWPsOWMl+S4re…',
      organization: '台北中山雅樂軒酒店',
      imgUrl: 'https://pic.pimg.tw/natasha790708/1619457638-1986555235-g.jpg',
      activityDate: '2024-11-14',
      createdAt: '2024-11-14T07:49:41.785+00:00',
      updatedAt: '2024-11-14T07:49:41.785+00:00',
      __v: 0
    },
    {
      _id: '673b57a2c2126ea74714938d',
      id: '5L2c5qWt5pmC6ZaT77yaOTowMH4xNjowMOOAguS4u+i+puWWruS9je+8muahg+WckuWNgO…',
      organization: '桃園區德民獅',
      imgUrl: 'https://i.imgur.com/PIDHUUF.jpeg',
      createdAt: '2024-11-18T15:05:06.561+00:00',
      updatedAt: '2024-11-18T15:05:06.561+00:00',
      __v: 0
    }
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">活動審核頁面</h1>
      <ImageApprovalList data={data} />
    </div>
  )
}
