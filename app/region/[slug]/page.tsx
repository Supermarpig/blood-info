import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SearchableDonationList from "@/components/SearchableDonationList";
import AddDonationEventModal from "@/components/AddDonationEventModal";
import {
  getRegionBySlug,
  getAllRegionSlugs,
  RegionConfig,
} from "@/lib/regionConfig";

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
      images: [
        {
          url: `${baseUrl}/imgs/og-img.webp`,
          width: 1200,
          height: 630,
          alt: region.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: region.title,
      description: region.description,
      images: [`${baseUrl}/imgs/og-img.webp`],
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
      return event.center === region.centerFilter;
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
          name: `${region.displayName}捐血活動`,
          item: `${baseUrl}/region/${region.slug}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: region.title,
      description: region.description,
      url: `${baseUrl}/region/${region.slug}`,
      dateModified: new Date().toISOString(),
      numberOfItems: eventCount,
      mainEntity: {
        "@type": "ItemList",
        name: `${region.displayName}捐血活動列表`,
        numberOfItems: eventCount,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: region.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];
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
      next: { revalidate: 86400 },
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

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          首頁
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">
          {region.displayName}捐血活動
        </span>
      </nav>

      {/* Page header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold">{region.displayName}捐血活動</h1>
          <p className="text-gray-600 text-sm mt-1">{region.description}</p>
        </div>
        <AddDonationEventModal />
      </div>
      <p className="text-sm text-gray-500 mb-6">{region.intro}</p>

      {/* Event list with region navigation */}
      <SearchableDonationList data={data} currentRegionSlug={slug} />

      {/* Region FAQ */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {region.displayName}捐血常見問題
        </h2>
        <div className="space-y-3">
          {region.faqs.map((faq, i) => (
            <details
              key={i}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-red-200 transition-colors"
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <span className="font-medium text-gray-900 pr-4 text-sm">
                  {faq.question}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-4 pb-4 pt-0">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
