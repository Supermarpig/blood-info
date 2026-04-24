// app/page.tsx
import Link from "next/link";
import SearchableDonationList from "@/components/SearchableDonationList";
import AddDonationEventModal from "@/components/AddDonationEventModal";
import HealthFloatingButton from "@/components/HealthFloatingButton";
import FaqSection from "@/components/FaqSection";
import InternalLinks from "@/components/InternalLinks";
import { FAQ_DATA } from "@/data/faq";

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

// 簡單的時間解析，預設格式 "09:00~17:00" 或 "09:00-17:00"
function parseTime(
  dateStr: string,
  timeStr: string
): { startDate: string; endDate: string } {
  // 移除所有空格
  const cleanTime = timeStr.replace(/\s/g, "");
  // 嘗試分割
  const parts = cleanTime.split(/[~-]/);

  let startH = "09:00";
  let endH = "17:00";

  if (parts.length >= 1) {
    const match = parts[0].match(/(\d{1,2}:\d{2})/);
    if (match) startH = match[1];
  }
  if (parts.length >= 2) {
    const match = parts[1].match(/(\d{1,2}:\d{2})/);
    if (match) endH = match[1];
  }

  // 補零
  if (startH.length === 4) startH = "0" + startH;
  if (endH.length === 4) endH = "0" + endH;

  return {
    startDate: `${dateStr}T${startH}:00+08:00`,
    endDate: `${dateStr}T${endH}:00+08:00`,
  };
}

export default async function BloodDonationPage() {
  let data: Record<string, DonationEvent[]> = {};
  let error = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    // Add no-store to ensure we get fresh data from the API
    const response = await fetch(`${baseUrl}/api/blood-donations`, {
      next: { revalidate: 3600 },
    });
    const apiData = await response.json();
    if (apiData.success && apiData.data) {
      data = apiData.data;
    } else {
      error = apiData.error || "發生錯誤";
    }
  } catch (err) {
    console.error(err);
    error = "無法獲取捐血活動資料😍😍😍";
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // 生成 JSON-LD
  // 1. WebSite Schema
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "台灣捐血活動查詢",
    url: `${siteUrl}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  // BreadcrumbList Schema for homepage
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首頁",
        item: siteUrl,
      },
    ],
  };

  // 2. Organization Schema - 提升品牌識別與信任度

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "台灣捐血活動查詢",
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    description: "彙整全台灣最新捐血活動、地點、時間與贈品資訊的公益資訊平台。",
    areaServed: {
      "@type": "Country",
      name: "Taiwan",
    },
    knowsLanguage: "zh-TW",
  };

  // FAQPage Schema
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  // 3. Event Schema (取今日與未來日期，限制數量以免 payload 太大)
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Taipei",
  });

  // 取得未來 7 天的日期 key
  const upcomingDates = Object.keys(data)
    .filter((date) => date >= today)
    .sort()
    .slice(0, 14); // 取兩週

  const upcomingEvents: DonationEvent[] = [];
  upcomingDates.forEach((date) => {
    if (data[date]) {
      upcomingEvents.push(...data[date]);
    }
  });

  // 限制總 event 數量 (例如最多 20 個，優先顯示近期的)
  const displayEvents = upcomingEvents.slice(0, 20);

  const eventsJsonLd = displayEvents.map((event) => {
    const { startDate, endDate } = parseTime(event.activityDate, event.time);
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: `捐血活動 - ${event.organization}`,
      startDate,
      endDate,
      dateModified: new Date().toISOString(),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: event.location,
        address: {
          "@type": "PostalAddress",
          addressRegion: event.center || "台灣", // 使用 center 作為地區，如 "台北"
          addressCountry: "TW",
          streetAddress: event.location,
        },
      },
      image:
        event.pttData?.images?.[0] ||
        `${siteUrl}/imgs/og-img.jpg`,
      description: `地點：${event.location}。時間：${event.time}。${
        event.pttData?.rawLine || event.customNote || ""
      }`,
      organizer: {
        "@type": "Organization",
        name: event.organization,
        url: "https://www.blood.org.tw",
      },
      performer: {
        "@type": "Organization",
        name: event.organization,
        url: "https://www.blood.org.tw",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TWD",
        availability: "https://schema.org/InStock",
        description: "免費捐血",
        validFrom: startDate,
        url: siteUrl,
      },
    };
  });

  return (
    <div className="container mx-auto p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {eventsJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }}
        />
      )}

      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="dropGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#be185d" />
              </linearGradient>
            </defs>
            <path
              d="M16 3 C16 3, 5 14.5, 5 20.5 C5 26.5 9.9 30 16 30 C22.1 30 27 26.5 27 20.5 C27 14.5 16 3 16 3 Z"
              fill="url(#dropGrad)"
            />
            <path
              d="M11 22 C11 22 10 19 12 17"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
          <h1 className="text-xl font-bold text-gray-800">
            捐血活動查詢｜今天哪裡有捐血車
          </h1>
        </div>
        <AddDonationEventModal />
      </div>
      <p className="text-sm text-gray-500 mb-6">
        今天哪裡有捐血車？即時查詢全台捐血活動地點、捐血站開放時間與捐血贈品資訊。支援台北、新北、台中、台南、高雄等各縣市，快速找到附近捐血地點！
      </p>

      <section className="mb-8 rounded-lg border border-gray-100 bg-gray-50/60 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          今天哪裡有捐血車？一頁搞懂捐血活動查詢方式
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-2">
          本站整合台灣血液基金會公告的每日捐血活動資料，讓你快速知道「今天哪裡有捐血車、哪裡有捐血活動」。資料涵蓋台北、新北、台中、台南、高雄、桃園、新竹、苗栗、彰化、嘉義、屏東、基隆、宜蘭、花蓮等全台縣市，每小時更新最新捐血車出車地點與捐血站開放時間。
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          你可以透過上方搜尋欄輸入地區或地點關鍵字、或點選縣市篩選當日活動；也可以從
          <Link href="/gift/movie-ticket" className="text-red-600 hover:underline mx-1">捐血贈品查詢</Link>
          頁面直接篩選電影票、超商禮券、生活用品等贈品活動，找到最適合自己的捐血行程。所有資料都來自官方公開資訊並標註活動時間與主辦單位，點進活動即可查看完整地址、地圖與贈品細節。
        </p>
      </section>

      <SearchableDonationList data={data} />
      <InternalLinks />
      <FaqSection />
      <HealthFloatingButton />
    </div>
  );
}
