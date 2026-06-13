import Link from "@/components/Link";
import { REGIONS } from "@/lib/regionConfig";
import { GIFTS } from "@/lib/giftConfig";
import { CITIES } from "@/lib/cityConfig";
import { getLionsOrgs } from "@/lib/organizationConfig";


const REGION_CITIES: Record<string, string> = {
  north: "台北・新北・基隆",
  hsinchu: "桃園・新竹・苗栗",
  central: "台中・彰化・南投",
  south: "高雄・台南・嘉義",
};

export default function InternalLinks() {
  const lionsOrgs = getLionsOrgs();

  return (
    <nav className="mt-8 space-y-5" aria-label="各地區與贈品種類捐血查詢">
      {/* 地區 */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          各地區捐血活動
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {REGIONS.map((r) => (
            <Link
              prefetch={false}
              key={r.slug}
              href={`/region/${r.slug}`}
              className="flex flex-col bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-red-200 hover:bg-red-50/50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-800">
                {r.displayName}捐血活動
              </span>
              <span className="text-xs text-gray-400 mt-0.5">
                {REGION_CITIES[r.slug]}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 縣市 */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          各縣市捐血活動
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {CITIES.filter((c) => c.level !== "district").map((c) => (
            <Link
              prefetch={false}
              key={c.slug}
              href={`/city/${c.slug}`}
              className="flex items-center bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-red-200 hover:bg-red-50/50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-700">
                {c.displayName}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 熱門行政區 */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          熱門行政區捐血
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {CITIES.filter((c) => c.level === "district").map((c) => (
            <Link
              prefetch={false}
              key={c.slug}
              href={`/city/${c.slug}`}
              className="flex items-center bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-red-200 hover:bg-red-50/50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-700">
                {c.displayName}捐血
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 主辦單位（獅子會） */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          依主辦單位查詢
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <Link
            prefetch={false}
            href="/organization/lions-club"
            className="flex items-center bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-red-200 hover:bg-red-50/50 transition-colors"
          >
            <span className="text-xs font-medium text-gray-700">獅子會捐血</span>
          </Link>
          {lionsOrgs.filter((o) => o.slug !== "lions-club").map((o) => (
            <Link
              prefetch={false}
              key={o.slug}
              href={`/organization/${o.slug}`}
              className="flex items-center bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-red-200 hover:bg-red-50/50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-700">{o.displayName}</span>
            </Link>
          ))}
          <Link
            prefetch={false}
            href="/organization"
            className="flex items-center bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-red-200 hover:bg-red-50/50 transition-colors"
          >
            <span className="text-xs font-medium text-gray-500">全部主辦單位 →</span>
          </Link>
        </div>
      </div>

      {/* 新聞與衛教 */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          捐血新聞與衛教
        </h2>
        <Link
          prefetch={false}
          href="/news/2026-05-10-blood-donation-complete-guide"
          className="flex flex-col bg-white border border-red-100 rounded-xl px-4 py-3 mb-2 hover:border-red-300 hover:bg-red-50/50 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-800">
            捐血懶人包：條件、流程、好處與贈品一次看懂
          </span>
          <span className="text-xs text-gray-400 mt-0.5">
            第一次捐血必看 — 從捐血資格到今日捐血活動查詢
          </span>
        </Link>
        <Link
          prefetch={false}
          href="/news"
          className="inline-flex items-center bg-white border border-gray-100 rounded-xl px-4 py-2.5 hover:border-red-200 hover:bg-red-50/50 transition-colors"
        >
          <span className="text-xs font-medium text-gray-700">查看所有捐血新聞與衛教文章</span>
        </Link>
      </div>

      {/* 贈品 */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          依贈品查詢捐血
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {GIFTS.map((g) => (
            <Link
              prefetch={false}
              key={g.slug}
              href={`/gift/${g.slug}`}
              className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-amber-200 hover:bg-amber-50/50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-700">
                捐血送{g.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
