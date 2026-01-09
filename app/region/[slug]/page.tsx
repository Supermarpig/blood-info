import { Metadata } from "next";
import { notFound } from "next/navigation";
import SearchableDonationList from "@/components/SearchableDonationList";
import RegionNavigation from "@/components/RegionNavigation";
import {
  getRegionBySlug,
  getAllRegionSlugs,
  RegionConfig,
} from "@/lib/regionConfig";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
 * Generate static params for all regions
 */
export async function generateStaticParams() {
  return getAllRegionSlugs().map((slug) => ({ slug }));
}

/**
 * Generate metadata for each region page
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const region = getRegionBySlug(slug);

  if (!region) {
    return {
      title: "找不到此地區",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return {
    title: region.title,
    description: region.description,
    keywords: region.keywords,
    alternates: {
      canonical: `${baseUrl}/region/${slug}`,
    },
    openGraph: {
      title: region.title,
      description: region.description,
      url: `${baseUrl}/region/${slug}`,
      siteName: "台灣捐血活動查詢",
      locale: "zh_TW",
      type: "website",
    },
  };
}

/**
 * Filter events by region configuration
 */
function filterEventsByRegion(
  data: Record<string, DonationEvent[]>,
  region: RegionConfig
): Record<string, DonationEvent[]> {
  const filtered: Record<string, DonationEvent[]> = {};

  Object.entries(data).forEach(([date, events]) => {
    const matchedEvents = events.filter((event) => {
      // First check center filter
      if (region.centerFilter && event.center !== region.centerFilter) {
        return false;
      }

      // If locationKeywords is specified, also filter by location
      if (region.locationKeywords && region.locationKeywords.length > 0) {
        return region.locationKeywords.some((keyword) =>
          event.location.includes(keyword)
        );
      }

      return true;
    });

    if (matchedEvents.length > 0) {
      filtered[date] = matchedEvents;
    }
  });

  return filtered;
}

/**
 * Generate JSON-LD for the region page
 */
function generateJsonLd(region: RegionConfig, eventCount: number) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: region.title,
    description: region.description,
    url: `${baseUrl}/region/${region.slug}`,
    numberOfItems: eventCount,
    mainEntity: {
      "@type": "ItemList",
      name: `${region.name}捐血活動列表`,
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
          name: `${region.name}捐血活動`,
          item: `${baseUrl}/region/${region.slug}`,
        },
      ],
    },
  };
}

export default async function RegionPage({ params }: PageProps) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);

  if (!region) {
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
      data = filterEventsByRegion(apiData.data, region);
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

  const jsonLd = generateJsonLd(region, totalEvents);

  return (
    <div className="container mx-auto p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb navigation */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回全部活動
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{region.name}捐血活動</h1>
        <p className="text-gray-600 text-sm">{region.description}</p>
      </div>

      {/* Region navigation */}
      <RegionNavigation currentSlug={slug} />

      {/* Event list */}
      <SearchableDonationList data={data} />
    </div>
  );
}
