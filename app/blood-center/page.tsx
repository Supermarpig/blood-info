import { Metadata } from "next";
import Link from "@/components/Link";
import { ChevronRight, MapPin, Clock, Phone, Building2, Info, ArrowRight } from "lucide-react";
import { BASE_URL } from "@/lib/baseUrl";
import { REGIONS } from "@/lib/regionConfig";
import {
  loadAllStationEvents,
  getAllFixedStations,
  groupStationsByCity,
} from "@/lib/bloodCenters";
import { getStationSlug } from "@/lib/stationSlugs";

// 名錄資料在 build 時從 /data 讀檔產生（Cloudflare Workers runtime 沒有 fs）
export const dynamic = "force-static";

const pageTitle = "全台捐血中心與捐血站一覽｜地址與服務時間";
const pageDesc =
  "全台固定捐血中心、捐血站與捐血室名錄，依縣市分組整理地址與服務時間，並可直接查詢各縣市今日捐血車出車地點與捐血贈品。";

export const metadata: Metadata = {
  // 用 absolute 跳過 layout 的 "%s | 台灣捐血活動查詢" 模板：
  // 加上後綴後會變成 31 字、超過 SERP 顯示上限被截斷，
  // 而這頁專攻「捐血中心」這個詞，字元要留給關鍵字不是品牌名。
  title: { absolute: pageTitle },
  description: pageDesc,
  keywords: [
    "捐血中心",
    "捐血站",
    "捐血室",
    "捐血中心地址",
    "捐血站地址",
    "捐血中心服務時間",
    "捐血查詢",
    "固定捐血點",
    "附近捐血中心",
  ],
  alternates: { canonical: `${BASE_URL}/blood-center` },
  openGraph: {
    title: pageTitle,
    description: pageDesc,
    url: `${BASE_URL}/blood-center`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${BASE_URL}/imgs/og-img.webp`,
        width: 1200,
        height: 630,
        alt: "全台捐血中心與捐血站一覽",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDesc,
    images: [`${BASE_URL}/imgs/og-img.webp`],
  },
};

function mapUrl(address: string, coordinates: { lat: number; lng: number } | null) {
  const q = coordinates
    ? `${coordinates.lat},${coordinates.lng}`
    : encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default async function BloodCenterPage() {
  const events = await loadAllStationEvents();
  const stations = getAllFixedStations(events);
  const groups = groupStationsByCity(stations);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1 text-xs text-gray-400 mb-5" aria-label="麵包屑">
        <Link href="/" className="hover:text-gray-600">
          首頁
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">捐血中心與捐血站</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
        全台捐血中心與捐血站一覽
      </h1>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">
        本頁整理全台 {stations.length} 處固定捐血點（捐血站與捐血室），依縣市分組列出地址與服務時間。
        固定捐血點平日都可前往捐血，不必等捐血車。若要查今天哪裡有捐血車出車，請看
        <Link href="/" className="text-gray-900 underline underline-offset-2 mx-1">
          今日捐血活動查詢
        </Link>
        。
      </p>
      <p className="text-sm text-gray-600 leading-relaxed mb-6">
        許多人搜尋「捐血中心」其實是想找離自己最近、可以直接走進去捐血的地方——那通常是下面這些
        <strong className="font-semibold text-gray-800">捐血站或捐血室</strong>。
        捐血中心則是負責調度轄區內捐血車與固定捐血點的單位，可依
        <Link href="#regions" className="text-gray-900 underline underline-offset-2 mx-1">
          轄區查詢
        </Link>
        近期活動。
      </p>

      <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mb-8">
        <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          名錄由本站歷次捐血活動資料彙整而成，涵蓋近期有活動紀錄的固定捐血點，並非官方完整清單。
          服務時間取自活動資料中最常出現的時段，實際開放時間請以現場或台灣血液基金會公告為準。
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.city}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                {group.city}
                <span className="text-xs font-normal text-gray-400">
                  {group.stations.length} 處
                </span>
              </h2>
              {group.citySlug && (
                <Link
                  href={`/city/${group.citySlug}`}
                  className="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-0.5"
                >
                  {group.city}捐血活動
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {group.stations.map((station) => (
                <li
                  key={station.name}
                  className="rounded-xl border border-gray-100 bg-white px-4 py-3"
                >
                  <h3 className="text-sm font-semibold text-gray-800 mb-1.5">
                    {getStationSlug(station.name) ? (
                      <Link
                        href={`/blood-center/${getStationSlug(station.name)}`}
                        className="hover:text-red-600 underline underline-offset-2 decoration-gray-300"
                      >
                        {station.name}
                      </Link>
                    ) : (
                      station.name
                    )}
                  </h3>
                  <p className="flex items-start gap-1.5 text-xs text-gray-500 mb-1">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-gray-400" />
                    <a
                      href={mapUrl(station.address, station.coordinates)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gray-900 underline underline-offset-2 decoration-gray-300"
                    >
                      {station.address}
                    </a>
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3 shrink-0 text-gray-400" />
                    {station.hours ?? "以現場公告為準"}
                  </p>
                  {station.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                      <a
                        href={`tel:${station.phone.replace(/[^\d+#]/g, "")}`}
                        className="hover:text-gray-900 underline underline-offset-2 decoration-gray-300"
                      >
                        {station.phone}
                      </a>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section id="regions" className="mt-10 pt-8 border-t border-gray-100 scroll-mt-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">依捐血中心轄區查詢</h2>
        <p className="text-sm text-gray-600 mb-4">
          各捐血中心負責調度轄區內的捐血車與固定捐血點，可依轄區查看近期捐血活動。
        </p>
        <div className="grid grid-cols-2 gap-2">
          {REGIONS.map((region) => (
            <Link
              key={region.slug}
              href={`/region/${region.slug}`}
              className="flex flex-col rounded-xl border border-gray-100 bg-white px-4 py-3 hover:border-gray-300 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-800">
                {region.displayName}捐血活動
              </span>
              <span className="text-xs text-gray-400 mt-0.5">{region.name}捐血中心轄區</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          查今天哪裡有捐血車
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  );
}
