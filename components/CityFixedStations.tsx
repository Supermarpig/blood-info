import Link from "@/components/Link";
import { MapPin, Clock, Phone, ArrowRight } from "lucide-react";
import type { FixedStation } from "@/lib/bloodCenters";

/**
 * 城市頁的「固定捐血點」區塊：捐血中心／捐血站／捐血室的地址與服務時間。
 *
 * 為什麼要有這塊（GSC 2026-07-06~08-02 實測）：
 * 「捐血中心／捐血站／捐血室」意圖群全站 25,988 曝光，只換到 452 點擊，CTR 1.7%
 *（全站平均 11%）。落點幾乎都是城市頁——但城市頁標題寫「台北捐血中心與今日捐血車」，
 * 內容給的卻只有活動列表，沒有任何一個固定捐血點的地址。標題有承諾、內容沒兌現，
 * 所以排在 7~8 名而且沒人點。這塊把 /blood-center 已經整理好的名錄下放到各城市頁。
 *
 * 這群查詢的另一個價值：它們不挑星期。站上流量是週五六破千、週日一掉到 500 的週期波，
 * 因為主力是「這週末去哪捐血」；找固定捐血點的人平日照樣在找，正好補谷底。
 */

/** 台北市→台北、板橋區→板橋：搜尋語言用的是不帶行政層級的短名 */
function shortName(displayName: string): string {
  const short = displayName.replace(/[市縣區]$/, "");
  return short.length >= 2 ? short : displayName;
}

function mapUrl(address: string, coordinates: { lat: number; lng: number } | null) {
  const q = coordinates
    ? `${coordinates.lat},${coordinates.lng}`
    : encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

interface Props {
  displayName: string;
  stations: FixedStation[];
}

export default function CityFixedStations({ displayName, stations }: Props) {
  if (stations.length === 0) return null;

  const name = shortName(displayName);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-gray-800 mb-2">
        {name}捐血中心、捐血站與捐血室地址
      </h2>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        {name}目前有 {stations.length} 處固定捐血點，平日就能直接前往捐血，不必等捐血車。
        以下列出各{name}捐血站與捐血室的地址與常見服務時間，點地址可直接開啟導航。
      </p>

      <ul className="grid gap-2 sm:grid-cols-2">
        {stations.map((station) => (
          <li
            key={station.name}
            className="rounded-xl border border-gray-100 bg-white px-4 py-3"
          >
            <h3 className="text-sm font-semibold text-gray-800 mb-1.5">
              {station.name}
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

      <p className="mt-3 text-xs text-gray-400 leading-relaxed">
        名錄由本站歷次捐血活動資料彙整，涵蓋近期有活動紀錄的固定捐血點，並非官方完整清單；
        服務時間取自活動資料中最常出現的時段，實際開放時間請以現場或台灣血液基金會公告為準。
      </p>

      <Link
        prefetch={false}
        href="/blood-center"
        className="mt-3 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        看全台捐血中心與捐血站一覽
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </section>
  );
}
