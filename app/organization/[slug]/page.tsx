import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { ChevronRight } from "lucide-react";
import SearchableDonationList from "@/components/SearchableDonationList";
import AdCard from "@/components/AdCard";
import {
  getOrgBySlug,
  getAllOrgSlugs,
  getLionsOrgs,
  OrgConfig,
} from "@/lib/organizationConfig";
import { getDonations } from "@/lib/getDonations";
import { BASE_URL } from "@/lib/baseUrl";

const AD_SLOT_CITY = process.env.NEXT_PUBLIC_ADSENSE_SLOT_CITY;

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
  coordinates?: { lat: number; lng: number };
  pttData?: { rawLine: string; images: string[]; url: string; tags?: string[] };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllOrgSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const org = getOrgBySlug(slug);
  if (!org) return { title: "找不到此單位" };

  const baseUrl = BASE_URL;
  return {
    title: org.title,
    description: org.description,
    alternates: { canonical: `${baseUrl}/organization/${slug}` },
    openGraph: {
      title: org.title,
      description: org.description,
      url: `${baseUrl}/organization/${slug}`,
      siteName: "台灣捐血活動查詢",
      locale: "zh_TW",
      type: "website",
      images: [{ url: `${baseUrl}/imgs/og-img.webp`, width: 1200, height: 630, alt: org.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: org.title,
      description: org.description,
      images: [`${baseUrl}/imgs/og-img.webp`],
    },
  };
}

function filterEventsByOrg(
  data: Record<string, DonationEvent[]>,
  org: OrgConfig
): Record<string, DonationEvent[]> {
  const filtered: Record<string, DonationEvent[]> = {};
  for (const [date, events] of Object.entries(data)) {
    const matched = events.filter((e) =>
      org.keywords.some((kw) => e.organization.includes(kw))
    );
    if (matched.length > 0) filtered[date] = matched;
  }
  return filtered;
}

function generateJsonLd(org: OrgConfig, eventCount: number) {
  const baseUrl = BASE_URL;
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "首頁", item: baseUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: `${org.displayName}捐血活動`,
          item: `${baseUrl}/organization/${org.slug}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: org.title,
      description: org.description,
      url: `${baseUrl}/organization/${org.slug}`,
      dateModified: new Date().toISOString(),
      numberOfItems: eventCount,
    },
  ];
}

export default async function OrganizationPage({ params }: PageProps) {
  const { slug } = await params;
  const org = getOrgBySlug(slug);
  if (!org) notFound();

  let data: Record<string, DonationEvent[]> = {};
  let error: string | null = null;

  try {
    const allData = await getDonations<DonationEvent>();
    data = filterEventsByOrg(allData, org);
  } catch {
    error = "無法獲取捐血活動資料";
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const totalEvents = Object.values(data).reduce((acc, ev) => acc + ev.length, 0);
  const jsonLd = generateJsonLd(org, totalEvents);
  const lionsOrgs = getLionsOrgs().filter((o) => o.slug !== slug);

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
          <Link href="/organization" className="hover:text-gray-700 transition-colors">
            主辦單位
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{org.displayName}</span>
        </nav>

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{org.displayName}捐血活動</h1>
          <p className="text-gray-600 text-sm mt-1">{org.description}</p>
        </div>
        <p className="text-sm text-gray-500 mb-6">{org.intro}</p>

        <SearchableDonationList data={data} />

        <AdCard slot={AD_SLOT_CITY} variant="inline" className="mt-8" />

        {/* 其他獅子會分會 cross-links */}
        {org.category === "lions" && lionsOrgs.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              其他獅子會捐血活動
            </h2>
            <div className="flex flex-wrap gap-2">
              {lionsOrgs.map((o) => (
                <Link
                  key={o.slug}
                  href={`/organization/${o.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  {o.displayName}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 返回查詢 */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            ← 查詢全台捐血活動
          </Link>
        </div>
      </div>
    </>
  );
}
