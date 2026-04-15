import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SearchableDonationList from "@/components/SearchableDonationList";
import AddDonationEventModal from "@/components/AddDonationEventModal";
import { getCityBySlug, getAllCitySlugs, CityConfig } from "@/lib/cityConfig";

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

export async function generateStaticParams() {
  return getAllCitySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = getCityBySlug(slug);

  if (!city) {
    return { title: "找不到此城市" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return {
    title: city.title,
    description: city.description,
    keywords: city.keywords,
    alternates: {
      canonical: `${baseUrl}/city/${slug}`,
    },
    openGraph: {
      title: city.title,
      description: city.description,
      url: `${baseUrl}/city/${slug}`,
      siteName: "台灣捐血活動查詢",
      locale: "zh_TW",
      type: "website",
      images: [
        {
          url: `${baseUrl}/imgs/og-img.webp`,
          width: 1200,
          height: 630,
          alt: city.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: city.title,
      description: city.description,
      images: [`${baseUrl}/imgs/og-img.webp`],
    },
  };
}

function filterEventsByCity(
  data: Record<string, DonationEvent[]>,
  city: CityConfig
): Record<string, DonationEvent[]> {
  const filtered: Record<string, DonationEvent[]> = {};

  Object.entries(data).forEach(([date, events]) => {
    const matched = events.filter(
      (event) =>
        event.center === city.centerFilter &&
        city.locationKeywords.some((kw) => event.location.includes(kw))
    );

    if (matched.length > 0) {
      filtered[date] = matched;
    }
  });

  return filtered;
}

function generateJsonLd(city: CityConfig, eventCount: number) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: city.title,
      description: city.description,
      url: `${baseUrl}/city/${city.slug}`,
      dateModified: new Date().toISOString(),
      numberOfItems: eventCount,
      mainEntity: {
        "@type": "ItemList",
        name: `${city.displayName}捐血活動列表`,
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
            name: `${city.displayName}捐血活動`,
            item: `${baseUrl}/city/${city.slug}`,
          },
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: city.faqs.map((faq) => ({
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

export default async function CityPage({ params }: PageProps) {
  const { slug } = await params;
  const city = getCityBySlug(slug);

  if (!city) {
    notFound();
  }

  let data: Record<string, DonationEvent[]> = {};
  let error = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/blood-donations`, {
      next: { revalidate: 3600 },
    });
    const apiData = await response.json();
    if (apiData.success && apiData.data) {
      data = filterEventsByCity(apiData.data, city);
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

  const jsonLd = generateJsonLd(city, totalEvents);

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
        <Link
          href={`/region/${city.regionSlug}`}
          className="hover:text-gray-700 transition-colors"
        >
          {city.displayName.slice(0, -1)}區
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">
          {city.displayName}捐血活動
        </span>
      </nav>

      {/* Page header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold">{city.displayName}捐血活動</h1>
          <p className="text-gray-600 text-sm mt-1">{city.description}</p>
        </div>
        <AddDonationEventModal />
      </div>
      <p className="text-sm text-gray-500 mb-6">{city.intro}</p>

      <SearchableDonationList data={data} currentCitySlug={slug} />

      {/* City FAQ */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {city.displayName}捐血常見問題
        </h2>
        <div className="space-y-3">
          {city.faqs.map((faq, i) => (
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
