import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SearchableDonationList from "@/components/SearchableDonationList";
import AddDonationEventModal from "@/components/AddDonationEventModal";
import { getGiftBySlug, getAllGiftSlugs, GiftConfig } from "@/lib/giftConfig";

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

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate static params for all gift types
 */
export async function generateStaticParams() {
  return getAllGiftSlugs().map((slug) => ({ slug }));
}

/**
 * Generate metadata for each gift page
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const gift = getGiftBySlug(slug);

  if (!gift) {
    return {
      title: "找不到此贈品類型",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return {
    title: gift.title,
    description: gift.description,
    keywords: gift.keywords,
    alternates: {
      canonical: `${baseUrl}/gift/${slug}`,
    },
    openGraph: {
      title: gift.title,
      description: gift.description,
      url: `${baseUrl}/gift/${slug}`,
      siteName: "台灣捐血活動查詢",
      locale: "zh_TW",
      type: "website",
    },
  };
}

/**
 * Filter events by gift tag
 */
function filterEventsByGift(
  data: Record<string, DonationEvent[]>,
  gift: GiftConfig
): Record<string, DonationEvent[]> {
  const filtered: Record<string, DonationEvent[]> = {};

  Object.entries(data).forEach(([date, events]) => {
    const matchedEvents = events.filter((event) => {
      const eventTags = event.tags || event.pttData?.tags || [];
      return eventTags.includes(gift.tagId);
    });

    if (matchedEvents.length > 0) {
      filtered[date] = matchedEvents;
    }
  });

  return filtered;
}

/**
 * Generate JSON-LD for the gift page
 */
function generateJsonLd(gift: GiftConfig, eventCount: number) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: gift.title,
    description: gift.description,
    url: `${baseUrl}/gift/${gift.slug}`,
    numberOfItems: eventCount,
    mainEntity: {
      "@type": "ItemList",
      name: `捐血送${gift.name}活動列表`,
      numberOfItems: eventCount,
    },
    breadcrumb: {
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
          name: `捐血送${gift.name}`,
          item: `${baseUrl}/gift/${gift.slug}`,
        },
      ],
    },
  };
}

export default async function GiftPage({ params }: PageProps) {
  const { slug } = await params;
  const gift = getGiftBySlug(slug);

  if (!gift) {
    notFound();
  }

  // Fetch data from API
  let data: Record<string, DonationEvent[]> = {};
  let error = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/blood-donations`, {
      cache: "no-store",
    });
    const apiData = await response.json();
    if (apiData.success && apiData.data) {
      data = filterEventsByGift(apiData.data, gift);
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

  // Count total events
  const totalEvents = Object.values(data).reduce(
    (acc, events) => acc + events.length,
    0
  );

  const jsonLd = generateJsonLd(gift, totalEvents);

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
        <span className="text-gray-900 font-medium">捐血送{gift.name}</span>
      </nav>

      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">捐血送{gift.name}活動</h1>
          <p className="text-gray-600 text-sm mt-1">{gift.description}</p>
        </div>
        <AddDonationEventModal />
      </div>

      {/* Event list */}
      <SearchableDonationList data={data} />
    </div>
  );
}
