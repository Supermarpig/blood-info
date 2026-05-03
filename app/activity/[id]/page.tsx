export const revalidate = 3600;

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { ChevronLeft, Clock, MapPin, Building2, ExternalLink, Gift, Heart, Droplets, Utensils, Moon, Ban, CreditCard } from "lucide-react";
import { getGiftByTagId } from "@/lib/giftConfig";
import { CITIES } from "@/lib/cityConfig";
import ShareButton from "./ShareButton";
import { ActivityImages } from "./ActivityImages";

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

const eventShortId = (id: string) => {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash) + id.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(36).padStart(6, "0");
};

async function getDayData(id: string): Promise<{ event: DonationEvent | null; dayEvents: DonationEvent[] }> {
  const match = id.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (!match) return { event: null, dayEvents: [] };

  const [, date, shortId] = match;
  const [year, month] = date.split("-");
  const filePath = path.join(process.cwd(), "data", `bloodInfo-${year}${month}.json`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const data: Record<string, DonationEvent[]> = JSON.parse(content);
    const dayEvents = data[date] ?? [];
    const event = dayEvents.find((e) => e.id && eventShortId(e.id) === shortId) ?? null;
    return { event, dayEvents };
  } catch {
    return { event: null, dayEvents: [] };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { event } = await getDayData(id);
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
      images: [
        {
          url: `${baseUrl}/imgs/og-img.webp`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/imgs/og-img.webp`],
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
  const { event, dayEvents } = await getDayData(id);

  if (!event) notFound();

  const eventTags = event.tags || event.pttData?.tags || [];
  const giftLinks = eventTags.map((tag) => getGiftByTagId(tag)).filter(Boolean);

  const matchedCity = CITIES.find(
    (c) =>
      c.centerFilter === event.center &&
      c.locationKeywords.some((kw) => event.location.includes(kw))
  );

  const relatedEvents = dayEvents
    .filter((e) => e.id && e.id !== event.id && e.center === event.center)
    .slice(0, 5);

  const images = event.pttData?.images || event.reportData?.images || [];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const pageUrl = `${baseUrl}/activity/${id}`;

  const breadcrumbItems: Array<{ "@type": string; position: number; name: string; item: string }> = [
    { "@type": "ListItem", position: 1, name: "首頁", item: baseUrl! },
  ];
  if (matchedCity) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: `${matchedCity.displayName}捐血活動`,
      item: `${baseUrl}/city/${matchedCity.slug}`,
    });
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: event.organization,
      item: pageUrl,
    });
  } else {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: event.organization,
      item: pageUrl,
    });
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: `${event.organization} 捐血活動`,
      startDate: `${event.activityDate}T${event.time.split("~")[0]}:00`,
      endDate: `${event.activityDate}T${event.time.split("~")[1]}:00`,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: event.organization,
        address: { "@type": "PostalAddress", streetAddress: event.location },
      },
      url: pageUrl,
      organizer: {
        "@type": "Organization",
        name: event.organization,
        url: "https://www.blood.org.tw",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 返回 */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="flex items-center gap-1 hover:text-gray-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            返回首頁
          </Link>
          {matchedCity && (
            <>
              <span className="text-gray-300">/</span>
              <Link href={`/city/${matchedCity.slug}`} className="hover:text-gray-800 transition-colors">
                {matchedCity.displayName}
              </Link>
              <span className="text-gray-300">/</span>
              <Link href={`/region/${matchedCity.regionSlug}`} className="hover:text-gray-800 transition-colors">
                附近捐血室
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
          <ActivityImages images={images} organization={event.organization} />

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

        {/* 捐血小提醒 */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-red-50 to-pink-50 border-b border-pink-100 flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-red-500" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">捐血前注意事項</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {([
              { Icon: Droplets,  bg: "bg-blue-100",   text: "text-blue-500",   label: "多補充水分", desc: "捐血前 1 小時補水" },
              { Icon: Utensils,  bg: "bg-amber-100",  text: "text-amber-500",  label: "避免空腹",   desc: "餐後 1 小時再前往" },
              { Icon: Moon,      bg: "bg-indigo-100", text: "text-indigo-500", label: "睡眠充足",   desc: "前晚至少 6 小時" },
              { Icon: Ban,       bg: "bg-red-100",    text: "text-red-500",    label: "禁酒 48 小時", desc: "同時避免阿斯匹靈" },
              { Icon: CreditCard,bg: "bg-green-100",  text: "text-green-600",  label: "攜帶證件",   desc: "健保卡或身分證" },
              { Icon: Heart,     bg: "bg-pink-100",   text: "text-pink-500",   label: "年齡 17–65 歲", desc: "體重需達 50 公斤" },
            ] as const).map(({ Icon, bg, text, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon className={`w-4 h-4 ${text}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 同日同地區其他活動 */}
        {relatedEvents.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">
              {event.activityDate} 同地區其他捐血活動
            </h2>
            <div className="space-y-2">
              {relatedEvents.map((e) => {
                const path = `/activity/${e.activityDate}-${eventShortId(e.id!)}`;
                return (
                  <Link
                    key={e.id}
                    href={path}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-pink-200 hover:bg-pink-50 transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">{e.time}</span>
                    <span className="text-sm font-medium text-gray-800 truncate flex-1">{e.organization}</span>
                    <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
            {matchedCity && (
              <Link
                href={`/city/${matchedCity.slug}`}
                className="mt-2 flex items-center justify-center gap-1 text-xs text-pink-500 hover:text-pink-600 py-2"
              >
                查看{matchedCity.displayName}所有活動
                <ChevronLeft className="w-3 h-3 rotate-180" />
              </Link>
            )}
          </div>
        )}

        {/* 分享 */}
        <ShareButton event={event} giftNames={giftLinks.map((g) => g!.name)} pageUrl={pageUrl} />
      </div>
    </div>
  );
}
