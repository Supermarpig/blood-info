import Link from "@/components/Link";
import { Gift, ChevronRight } from "lucide-react";
import { GIFTS, getGiftByTagId, GiftConfig } from "@/lib/giftConfig";
import { eventShortId } from "@/lib/eventId";

interface GiftEvent {
  id?: string;
  organization: string;
  location: string;
  tags?: string[];
  pttData?: { tags?: string[] };
}

/**
 * 「本月{城市}捐血贈品」區塊。
 * 用城市頁既有的活動資料，撈出有贈品 tag 的場次、依分類聚合，
 * 並內鏈到 /gift/[slug]。目的：把「{城市}捐血活動贈品」這類
 * 高成長查詢的關鍵字與內容注入已經有排名的城市頁，而非另開薄頁。
 */
export default function CityGiftHighlight({
  cityName,
  data,
}: {
  cityName: string;
  data: Record<string, GiftEvent[]>;
}) {
  const giftEvents: { date: string; ev: GiftEvent; giftTags: string[] }[] = [];
  const typeCount = new Map<string, number>(); // tagId -> 場次數

  for (const [date, events] of Object.entries(data)) {
    for (const ev of events) {
      const tags = (ev.tags || ev.pttData?.tags || []).filter((t) =>
        getGiftByTagId(t)
      );
      if (tags.length === 0) continue;
      giftEvents.push({ date, ev, giftTags: tags });
      for (const t of tags) typeCount.set(t, (typeCount.get(t) || 0) + 1);
    }
  }

  const presentTypes: GiftConfig[] = [...typeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tagId]) => getGiftByTagId(tagId)!)
    .filter(Boolean);

  const hasLive = giftEvents.length > 0;
  const chipGifts = presentTypes.length > 0 ? presentTypes : GIFTS;
  const typeSummary = presentTypes.map((g) => g.name).join("、");

  giftEvents.sort((a, b) => a.date.localeCompare(b.date));
  const shown = giftEvents.slice(0, 8);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
        <Gift className="w-5 h-5 text-red-500" />
        本月{cityName}捐血贈品
      </h2>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        {hasLive
          ? `${cityName}近期有 ${giftEvents.length} 場捐血活動加碼贈品，包含 ${typeSummary} 等好禮。捐血做公益的同時，也能把握每一場${cityName}捐血贈品優惠，下方依分類查詢出車地點與時間。`
          : `想知道${cityName}捐血有什麼贈品？捐血贈品依各捐血中心與活動而異，常見有電影票、禮券、超商禮券、餐飲券、食品與生活用品。點選下方分類，查詢全台最新捐血送贈品的出車地點。`}
      </p>

      {/* 贈品分類 chips → /gift/[slug] */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chipGifts.map((g) => {
          const count = typeCount.get(g.tagId);
          return (
            <Link
              key={g.slug}
              href={`/gift/${g.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 border border-red-100 rounded-full text-sm text-red-600 hover:bg-red-100 transition-colors"
            >
              捐血送{g.name}
              {count ? (
                <span className="text-xs font-semibold text-red-400">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* 本月有贈品的場次 */}
      {hasLive && (
        <ul className="space-y-2">
          {shown.map(({ date, ev, giftTags }, i) => {
            const href = ev.id
              ? `/activity/${date}-${eventShortId(ev.id)}`
              : undefined;
            const inner = (
              <>
                <span className="text-xs text-gray-400 shrink-0 w-12 tabular-nums">
                  {date.slice(5)}
                </span>
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {ev.location || ev.organization}
                </span>
                <span className="text-xs font-medium text-red-500 shrink-0">
                  {giftTags.join("、")}
                </span>
                {href && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                )}
              </>
            );
            return (
              <li key={i}>
                {href ? (
                  <Link
                    href={href}
                    className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-100 rounded-lg hover:border-red-200 transition-colors"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-100 rounded-lg">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
