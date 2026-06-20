import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { ChevronRight, Gift } from "lucide-react";
import SearchableDonationList from "@/components/SearchableDonationList";
import AddDonationEventModal from "@/components/AddDonationEventModal";
import RecentOnsiteReports from "@/components/RecentOnsiteReports";
import { GIFTS, getGiftBySlug, getAllGiftSlugs, GiftConfig } from "@/lib/giftConfig";
import { getDonations } from "@/lib/getDonations";
import AdCard from "@/components/AdCard";
import { BASE_URL } from "@/lib/baseUrl";

const AD_SLOT_GIFT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_GIFT;

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
  subTags?: string[];
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

  const baseUrl = BASE_URL;

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
      images: [
        {
          url: `${baseUrl}/imgs/og-img.webp`,
          width: 1200,
          height: 630,
          alt: gift.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: gift.title,
      description: gift.description,
      images: [`${baseUrl}/imgs/og-img.webp`],
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
  const baseUrl = BASE_URL;

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
          name: `捐血送${gift.name}`,
          item: `${baseUrl}/gift/${gift.slug}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: gift.title,
      description: gift.description,
      url: `${baseUrl}/gift/${gift.slug}`,
      dateModified: new Date().toISOString(),
      numberOfItems: eventCount,
      mainEntity: {
        "@type": "ItemList",
        name: `捐血送${gift.name}活動列表`,
        numberOfItems: eventCount,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: gift.faqs.map((faq) => ({
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
    const allData = await getDonations<DonationEvent>();
    data = filterEventsByGift(allData, gift);
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto p-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          首頁
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">捐血送{gift.name}</span>
      </nav>

      {/* Page header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold">捐血送{gift.name}活動</h1>
          <p className="text-gray-600 text-sm mt-1">{gift.description}</p>
        </div>
        <AddDonationEventModal />
      </div>
      <p className="text-sm text-gray-500 mb-6">{gift.intro}</p>

      {/* Event list */}
      <SearchableDonationList data={data} staticFilterLabel={gift.name} />

      <AdCard slot={AD_SLOT_GIFT} variant="inline" className="mt-8" />

      {/* 常態說明：讓 live 場次少時頁面仍有內容可排名 */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          關於捐血送{gift.name}
        </h2>
        <ul className="space-y-2.5">
          {gift.highlights.map((point, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
              <Gift className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 常見問題（對應 FAQPage 結構化資料） */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          捐血送{gift.name}常見問題
        </h2>
        <div className="space-y-3">
          {gift.faqs.map((faq, i) => (
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

      <RecentOnsiteReports limit={4} />

      {/* 其他贈品分類交叉內鏈 */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          其他捐血贈品查詢
        </h2>
        <div className="flex flex-wrap gap-2">
          {GIFTS.filter((g) => g.slug !== gift.slug).map((g) => (
            <Link
              key={g.slug}
              href={`/gift/${g.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              捐血送{g.name}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
    </>
  );
}
