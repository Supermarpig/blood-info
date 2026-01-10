// app/page.tsx
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
      cache: "no-store",
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
      image: event.pttData?.images?.[0] || undefined,
      description: `地點：${event.location}。時間：${event.time}。${
        event.pttData?.rawLine || event.customNote || ""
      }`,
      organizer: {
        "@type": "Organization",
        name: event.organization,
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TWD",
        availability: "https://schema.org/InStock",
        description: "免費捐血",
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
      {eventsJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="捐血活動查詢" className="w-8 h-8 rounded" />
          <h1 className="text-xl font-bold text-gray-800">捐血活動查詢</h1>
        </div>
        <AddDonationEventModal />
      </div>

      <SearchableDonationList data={data} />
    </div>
  );
}
