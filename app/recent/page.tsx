import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SearchableDonationList from "@/components/SearchableDonationList";
import AddDonationEventModal from "@/components/AddDonationEventModal";

interface DonationEvent {
  id?: string;
  time: string;
  organization: string;
  location: string;
  rawContent: string;
  customNote?: string;
  activityDate: string;
  center?: string;
  detailUrl?: string;
  tags?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  pttData?: {
    rawLine: string;
    images: string[];
    url: string;
    tags?: string[];
  };
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const metadata: Metadata = {
  title: "近期捐血活動｜未來 7 天全台捐血行程查詢",
  description:
    "查詢近期捐血活動！整理全台未來 7 天捐血車出車地點、捐血站開放時間與贈品資訊，今天哪裡有捐血活動一頁掌握。",
  keywords: [
    "近期捐血活動",
    "近期捐血活動查詢",
    "近7天捐血活動",
    "捐血活動查詢",
    "今天哪裡有捐血活動",
    "本週捐血活動",
    "捐血車行程",
  ],
  alternates: {
    canonical: `${baseUrl}/recent`,
  },
  openGraph: {
    title: "近期捐血活動｜未來 7 天全台捐血行程查詢",
    description:
      "查詢近期捐血活動！整理全台未來 7 天捐血車出車地點、捐血站開放時間與贈品資訊，今天哪裡有捐血活動一頁掌握。",
    url: `${baseUrl}/recent`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${baseUrl}/imgs/og-img.webp`,
        width: 1200,
        height: 630,
        alt: "近期捐血活動查詢",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "近期捐血活動｜未來 7 天全台捐血行程查詢",
    description:
      "查詢近期捐血活動！整理全台未來 7 天捐血車出車地點、捐血站開放時間與贈品資訊，今天哪裡有捐血活動一頁掌握。",
    images: [`${baseUrl}/imgs/og-img.webp`],
  },
};

function filterUpcomingDays(
  data: Record<string, DonationEvent[]>,
  days: number
): Record<string, DonationEvent[]> {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Taipei",
  });
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  const limitStr = limit.toLocaleDateString("en-CA", {
    timeZone: "Asia/Taipei",
  });

  const filtered: Record<string, DonationEvent[]> = {};
  Object.entries(data).forEach(([date, events]) => {
    if (date >= today && date <= limitStr) {
      filtered[date] = events;
    }
  });
  return filtered;
}

function generateJsonLd(eventCount: number) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "首頁",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "近期捐血活動",
          item: `${baseUrl}/recent`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "近期捐血活動｜未來 7 天全台捐血行程查詢",
      description:
        "查詢近期捐血活動！整理全台未來 7 天捐血車出車地點、捐血站開放時間與贈品資訊。",
      url: `${baseUrl}/recent`,
      dateModified: new Date().toISOString(),
      numberOfItems: eventCount,
      mainEntity: {
        "@type": "ItemList",
        name: "近期捐血活動列表",
        numberOfItems: eventCount,
      },
    },
  ];
}

export default async function RecentPage() {
  let data: Record<string, DonationEvent[]> = {};
  let error = null;

  try {
    const apiBase = baseUrl || "http://localhost:3000";
    const response = await fetch(`${apiBase}/api/blood-donations`, {
      next: { revalidate: 86400 },
    });
    const apiData = await response.json();
    if (apiData.success && apiData.data) {
      data = filterUpcomingDays(apiData.data, 7);
    } else {
      error = apiData.error || "發生錯誤";
    }
  } catch (err) {
    console.error(err);
    error = "無法獲取捐血活動資料";
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const totalEvents = Object.values(data).reduce(
    (acc, events) => acc + events.length,
    0
  );

  const jsonLd = generateJsonLd(totalEvents);

  return (
    <div className="container mx-auto p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          首頁
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">近期捐血活動</span>
      </nav>

      {/* Page header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold">近期捐血活動</h1>
          <p className="text-gray-600 text-sm mt-1">
            未來 7 天全台捐血車出車地點與贈品資訊，每日自動更新
          </p>
        </div>
        <AddDonationEventModal />
      </div>

      <p className="text-sm text-gray-500 mb-6">
        整理近期捐血活動行程，涵蓋台北、新北、台中、高雄、台南、新竹、桃園等全台各地捐血車與固定捐血站資訊。查詢今天哪裡有捐血活動，出門前先確認最新出車地點與當期贈品。
      </p>

      <SearchableDonationList data={data} />

      {/* Internal links to city pages */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          依縣市查詢捐血活動
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "台北", slug: "taipei" },
            { name: "新北", slug: "new-taipei" },
            { name: "台中", slug: "taichung" },
            { name: "高雄", slug: "kaohsiung" },
            { name: "台南", slug: "tainan" },
            { name: "桃園", slug: "taoyuan" },
            { name: "新竹", slug: "hsinchu" },
          ].map((city) => (
            <Link
              key={city.slug}
              href={`/city/${city.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              {city.name}捐血活動
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
