import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, MapPin, Building2, ExternalLink, Gift } from "lucide-react";
import { getGiftByTagId } from "@/lib/giftConfig";
import { CITIES } from "@/lib/cityConfig";
import ShareButton from "./ShareButton";

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
  reportData?: { images: string[]; issueUrl: string };
  isUserReport?: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return b64 + pad;
}

async function getEvent(id: string): Promise<DonationEvent | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/blood-donations`, {
    next: { revalidate: 3600 },
  });
  const json = await res.json();
  if (!json.success || !json.data) return null;

  const standardBase64 = fromBase64Url(id);
  const allEvents: DonationEvent[] = Object.values(json.data).flat() as DonationEvent[];
  return allEvents.find((e) => e.id === standardBase64) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "找不到此活動" };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const title = `${event.organization} 捐血活動 ${event.activityDate}`;
  const description = `${event.activityDate} ${event.time}，地點：${event.location}`;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/activity/${id}` },
      openGraph: {
      title,
      description,
      url: `${baseUrl}/activity/${id}`,
      siteName: "台灣捐血活動查詢",
      locale: "zh_TW",
      type: "article",
    },
  };
}

const centerDisplayNames: Record<string, string> = {
  台北: "北區",
  新竹: "桃竹苗",
  台中: "中區",
  高雄: "南區",
};

const centerColors: Record<string, string> = {
  台北: "bg-blue-100 text-blue-700 border-blue-200",
  新竹: "bg-cyan-100 text-cyan-700 border-cyan-200",
  台中: "bg-orange-100 text-orange-700 border-orange-200",
  高雄: "bg-rose-100 text-rose-700 border-rose-200",
};

export default async function ActivityPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  const eventTags = event.tags || event.pttData?.tags || [];
  const giftLinks = eventTags.map((tag) => getGiftByTagId(tag)).filter(Boolean);

  const matchedCity = CITIES.find(
    (c) =>
      c.centerFilter === event.center &&
      c.locationKeywords.some((kw) => event.location.includes(kw))
  );

  const images = event.pttData?.images || event.reportData?.images || [];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const pageUrl = `${baseUrl}/activity/${id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${event.organization} 捐血活動`,
    startDate: `${event.activityDate}T${event.time.split("~")[0]}:00`,
    endDate: `${event.activityDate}T${event.time.split("~")[1]}:00`,
    location: {
      "@type": "Place",
      name: event.organization,
      address: { "@type": "PostalAddress", streetAddress: event.location },
    },
    url: pageUrl,
    organizer: { "@type": "Organization", name: event.organization },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 返回 */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="flex items-center gap-1 hover:text-gray-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            返回首頁
          </Link>
          {matchedCity && (
            <>
              <span className="text-gray-300">/</span>
              <Link
                href={`/city/${matchedCity.slug}`}
                className="hover:text-gray-800 transition-colors"
              >
                {matchedCity.displayName}
              </Link>
            </>
          )}
        </nav>

        {/* 主卡片 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-stretch border-b border-gray-100">
            <div className="flex-none bg-slate-50 px-5 py-4 flex items-center border-r border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-700 tabular-nums">{event.time}</span>
              </div>
            </div>
            <div className="flex-grow px-4 py-4 flex items-center justify-between">
              {event.center && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                    centerColors[event.center] ?? "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {centerDisplayNames[event.center] ?? event.center}
                </span>
              )}
              <span className="ml-auto text-sm text-gray-400">{event.activityDate}</span>
            </div>
          </div>

          {/* 內容 */}
          <div className="p-5 space-y-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-start gap-2">
              <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              {event.organization}
            </h1>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="font-medium group-hover:underline underline-offset-2 decoration-blue-400">
                {event.location}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </a>

            {event.customNote && (
              <div className="text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100">
                <span className="block text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">Note</span>
                {event.customNote}
              </div>
            )}

            {/* 贈品 */}
            {giftLinks.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
                  <Gift className="w-3.5 h-3.5" />
                  捐血贈品
                </p>
                <div className="flex flex-wrap gap-2">
                  {giftLinks.map((gift) => (
                    <Link
                      key={gift!.slug}
                      href={`/gift/${gift!.slug}`}
                      className="text-sm px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full border border-pink-100 hover:bg-pink-100 transition-colors font-medium"
                    >
                      {gift!.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 圖片 */}
          {images.length > 0 && (
            <div className="border-t border-gray-100 p-5 space-y-3">
              {images.map((src, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${event.organization} 活動圖片 ${i + 1}`}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 來源 */}
          {(event.pttData || event.reportData) && (
            <div className="border-t border-gray-100 px-5 py-3">
              {event.pttData && (
                <a
                  href={event.pttData.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink className="w-3 h-3" />
                  查看 PTT 原文
                </a>
              )}
              {event.reportData && (
                <a
                  href={event.reportData.issueUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700"
                >
                  <ExternalLink className="w-3 h-3" />
                  查看使用者回報
                </a>
              )}
            </div>
          )}
        </div>

        {/* 分享 */}
        <ShareButton event={event} giftNames={giftLinks.map((g) => g!.name)} pageUrl={pageUrl} />
      </div>
    </div>
  );
}
