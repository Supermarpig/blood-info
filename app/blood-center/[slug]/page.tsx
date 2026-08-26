import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Link from "@/components/Link";
import {
  ChevronRight,
  MapPin,
  Clock,
  Phone,
  Building2,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  loadAllStationEvents,
  getAllFixedStations,
  parseStationLocation,
  type StationEvent,
} from "@/lib/bloodCenters";
import { getStationName, getStationSlug, STATION_SLUGS } from "@/lib/stationSlugs";
import {
  getCityBySlug,
  filterEventsByCity,
  type CityConfig,
} from "@/lib/cityConfig";
import { taiwanToday } from "@/lib/twDate";
import { BASE_URL } from "@/lib/baseUrl";

// 名錄與場次資料在 build 時從 /data 讀檔產生（Cloudflare Workers runtime 沒有 fs）
export const dynamic = "force-static";
// 合法 slug 全集就是 STATION_SLUGS 這張封閉表，未知 slug 直接由框架回 404：
// 不設 false 會進 worker on-demand render，唯讀 incremental cache 每次都留一條 error log。
export const dynamicParams = false;

/** 活動資料裡本頁會用到、但 StationEvent 沒宣告的欄位 */
interface StationDonationEvent extends StationEvent {
  organization?: string;
  tags?: string[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// generateMetadata 與頁面本體都要讀資料，用 React cache 讓同一次 build 只讀一次
const loadData = cache(() => loadAllStationEvents<StationDonationEvent>());
const loadStations = cache(async () => getAllFixedStations(await loadData()));

/**
 * 收集這個捐血點「今天起」的捐血場次。
 * 用 parseStationLocation 解析後比對站名，與名錄反推走同一套規則；
 * 資料檔內同一天可能有重複條目（同 id 重複 append），用 日期+時間+主辦 去重。
 */
async function upcomingSessions(stationName: string) {
  const data = await loadData();
  const today = taiwanToday();
  // 台北轄區的場次常以「地址(配合板橋站)」短寫站名（少了「捐血」二字），
  // 過不了 parseStationLocation 的正式站名規則，所以另比對「配合＋短寫」。
  // 只認緊鄰收尾括號的寫法，避免「宜蘭捐血站旁」這類地標描述誤判。
  const shortForm = new RegExp(`配合${stationName.replace("捐血", "")}[)）]`);
  const seen = new Set<string>();
  const rows: {
    date: string;
    time?: string;
    organization?: string;
    tags?: string[];
  }[] = [];

  for (const [date, events] of Object.entries(data)) {
    if (date < today) continue;
    for (const e of events ?? []) {
      if (!e?.location || e.center === "PTT") continue;
      const matchesStation =
        parseStationLocation(e.location)?.name === stationName ||
        shortForm.test(e.location.replace(/\s+/g, ""));
      if (!matchesStation) continue;
      const key = `${date}|${e.time ?? ""}|${e.organization ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        date,
        time: e.time,
        organization: e.organization,
        tags: e.tags,
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

/**
 * 無場次的站（多為台北轄區）改列該縣市近期的捐血車場次：
 * 沒有這塊時，這批頁相對城市頁只剩一張名片（CityFixedStations 卡片已有
 * 一樣的地址與時間），對 Google 是城市頁的子集，很可能不被索引。
 * 縣市場次是每頁不同、且隨每日資料更新的文字內容。
 */
async function upcomingCityEvents(city: CityConfig) {
  const data = filterEventsByCity(await loadData(), city);
  const today = taiwanToday();
  const seen = new Set<string>();
  const rows: {
    date: string;
    time?: string;
    location: string;
    organization?: string;
  }[] = [];

  for (const [date, events] of Object.entries(data)) {
    if (date < today) continue;
    for (const e of events ?? []) {
      if (!e?.location || e.center === "PTT") continue;
      const key = `${date}|${e.time ?? ""}|${e.location}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        date,
        time: e.time,
        location: e.location,
        organization: e.organization,
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows.slice(0, 5);
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 2026-08-26 → 8/26（週三）；日期字串是台灣日曆日，直接取 UTC 天序即可 */
function formatDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}（週${WEEKDAYS[new Date(date).getUTCDay()]}）`;
}

function mapUrl(
  address: string,
  coordinates: { lat: number; lng: number } | null
) {
  const q = coordinates
    ? `${coordinates.lat},${coordinates.lng}`
    : encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export async function generateStaticParams() {
  // 只為「目前名錄裡有、且對照表有 slug」的捐血點出頁；
  // 對照表有但名錄暫時反推不出來的不出頁（沒有地址與時間可渲染）。
  const stations = await loadStations();
  const known = new Set(stations.map((s) => s.name));
  return Object.entries(STATION_SLUGS)
    .filter(([name]) => known.has(name))
    .map(([, slug]) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = getStationName(slug);
  const station = name
    ? (await loadStations()).find((s) => s.name === name)
    : undefined;

  if (!name || !station) {
    return { title: "找不到此捐血點" };
  }

  const sessions = await upcomingSessions(name);
  // 依實際內容決定標題承諾：沒有場次就只承諾頁面真的有的欄位（地址／時間／電話）
  const title =
    sessions.length > 0
      ? `${name}服務時間、地址與近期捐血場次`
      : station.phone
        ? `${name}服務時間、地址與電話`
        : `${name}服務時間與地址查詢`;
  const description =
    `${name}地址：${station.address}，服務時間${station.hours ?? "以現場公告為準"}` +
    `${station.phone ? `，電話 ${station.phone}` : ""}。` +
    `查${station.city}其他固定捐血點與今日捐血車出車地點。`;
  const url = `${BASE_URL}/blood-center/${slug}`;

  return {
    // 與 /blood-center、城市頁同一套做法：用 absolute 跳過 layout 的品牌後綴，
    // 把 SERP 字數留給「站名＋服務時間＋地址」這組真正被搜尋的字。
    title: { absolute: title },
    description,
    keywords: [name, `${name}時間`, `${name}地址`, `${name}電話`, "固定捐血點"],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "台灣捐血活動查詢",
      locale: "zh_TW",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/imgs/og-img.webp`,
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
      images: [`${BASE_URL}/imgs/og-img.webp`],
    },
  };
}

export default async function StationPage({ params }: PageProps) {
  const { slug } = await params;
  const name = getStationName(slug);
  if (!name) notFound();

  const stations = await loadStations();
  const station = stations.find((s) => s.name === name);
  if (!station) notFound();

  const sessions = await upcomingSessions(name);
  const city = station.citySlug ? getCityBySlug(station.citySlug) : undefined;
  const cityEvents =
    sessions.length === 0 && city ? await upcomingCityEvents(city) : [];
  const sameCityStations = stations.filter(
    (s) => s.city === station.city && s.name !== station.name && getStationSlug(s.name)
  );

  const url = `${BASE_URL}/blood-center/${slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "首頁", item: BASE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "捐血中心與捐血站",
          item: `${BASE_URL}/blood-center`,
        },
        { "@type": "ListItem", position: 3, name: station.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: station.name,
      url,
      address: {
        "@type": "PostalAddress",
        streetAddress: station.address,
        addressCountry: "TW",
      },
      ...(station.phone ? { telephone: station.phone } : {}),
      ...(station.coordinates
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: station.coordinates.lat,
              longitude: station.coordinates.lng,
            },
          }
        : {}),
    },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        className="flex items-center gap-1 text-xs text-gray-400 mb-5"
        aria-label="麵包屑"
      >
        <Link href="/" className="hover:text-gray-600">
          首頁
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/blood-center" className="hover:text-gray-600">
          捐血中心與捐血站
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">{station.name}</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
        {station.name}
      </h1>
      <p className="text-sm text-gray-600 leading-relaxed mb-6">
        {station.name}是{station.city}的固定捐血點，服務時間內可直接前往捐血，
        不必配合捐血車班表。以下整理{station.name}的地址、服務時間
        {station.phone ? "、聯絡電話" : ""}
        {sessions.length > 0 ? "，以及近期在此舉辦的捐血場次" : ""}。
      </p>

      {/* 基本資料 */}
      <section className="rounded-xl border border-gray-100 bg-white px-5 py-4 mb-8">
        <h2 className="sr-only">{station.name}基本資料</h2>
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
            <dt className="shrink-0 text-gray-500">地址</dt>
            <dd>
              <a
                href={mapUrl(station.address, station.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-gray-900 underline underline-offset-2 decoration-gray-300"
              >
                {station.address}
              </a>
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
            <dt className="shrink-0 text-gray-500">服務時間</dt>
            <dd className="text-gray-800">
              {station.hours ?? "以現場公告為準"}
            </dd>
          </div>
          {station.phone && (
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
              <dt className="shrink-0 text-gray-500">電話</dt>
              <dd>
                {/* # 分機放進 tel: 會被當 URL fragment 丟掉，href 只撥主線，分機留在顯示文字 */}
                <a
                  href={`tel:${station.phone.split("#")[0].replace(/[^\d+]/g, "")}`}
                  className="text-gray-800 hover:text-gray-900 underline underline-offset-2 decoration-gray-300"
                >
                  {station.phone}
                </a>
              </dd>
            </div>
          )}
          {city && (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
              <dt className="shrink-0 text-gray-500">所在縣市</dt>
              <dd>
                <Link
                  href={`/city/${city.slug}`}
                  className="text-gray-800 hover:text-gray-900 underline underline-offset-2 decoration-gray-300"
                >
                  {city.displayName}捐血活動
                </Link>
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* 近期場次：只有資料裡真的有才渲染，不擺空區塊 */}
      {sessions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {station.name}近期捐血場次
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            未來 {sessions.length} 場已公告的捐血場次，含主辦單位與活動贈品資訊。
          </p>
          <ul className="space-y-2">
            {sessions.slice(0, 20).map((s) => (
              <li
                key={`${s.date}-${s.time ?? ""}-${s.organization ?? ""}`}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-gray-800">
                    {formatDate(s.date)}
                  </span>
                  {s.time && (
                    <span className="text-sm text-gray-600">{s.time}</span>
                  )}
                  {s.organization && s.organization !== station.name && (
                    <span className="text-xs text-gray-500">
                      {s.organization}
                    </span>
                  )}
                </div>
                {(s.tags?.length ?? 0) > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {s.tags!.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {sessions.length > 20 && (
            <p className="mt-2 text-xs text-gray-400">
              僅列出最近 20 場，更多場次請見
              {city ? `${city.displayName}捐血活動頁` : "各縣市捐血活動頁"}。
            </p>
          )}
        </section>
      )}

      {sessions.length === 0 && (
        <section className="mb-8">
          <p className="text-sm text-gray-600 leading-relaxed">
            {station.name}為常設捐血點，服務時間內皆可前往，一般不需預約。
            若想改搭配捐血車活動（通常有活動贈品），可查
            {city ? (
              <Link
                href={`/city/${city.slug}`}
                className="text-gray-900 underline underline-offset-2 mx-1"
              >
                {city.displayName}近期捐血活動
              </Link>
            ) : (
              <Link
                href="/"
                className="text-gray-900 underline underline-offset-2 mx-1"
              >
                今日捐血活動
              </Link>
            )}
            。
          </p>

          {city && cityEvents.length > 0 && (
            <div className="mt-5">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {city.displayName}近期捐血車場次
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                {station.name}所在的{city.displayName}近期還有這些捐血活動：
              </p>
              <ul className="space-y-2">
                {cityEvents.map((e) => (
                  <li
                    key={`${e.date}-${e.time ?? ""}-${e.location}`}
                    className="rounded-xl border border-gray-100 bg-white px-4 py-3"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatDate(e.date)}
                      </span>
                      {e.time && (
                        <span className="text-sm text-gray-600">{e.time}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {e.organization ? `${e.organization}｜` : ""}
                      {e.location}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                href={`/city/${city.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                看{city.displayName}完整捐血活動
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 同縣市其他固定捐血點 */}
      {sameCityStations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {station.city}其他固定捐血點
          </h2>
          <div className="flex flex-wrap gap-2">
            {sameCityStations.map((s) => (
              <Link
                key={s.name}
                href={`/blood-center/${getStationSlug(s.name)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
              >
                {s.name}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mb-8">
        <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          本頁資料由本站歷次捐血活動資料與台灣血液基金會公告彙整。
          服務時間可能因假日或作業調整而變動，前往前請以現場或台灣血液基金會公告為準。
        </p>
      </div>

      <Link
        href="/blood-center"
        className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
      >
        看全台捐血中心與捐血站一覽
        <ArrowRight className="w-4 h-4" />
      </Link>
    </main>
  );
}
