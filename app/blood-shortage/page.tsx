import { Metadata } from "next";
import Link from "@/components/Link";
import {
  Droplet,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Clock,
  HeartHandshake,
  ChevronRight,
  Share2,
} from "lucide-react";
import { BASE_URL } from "@/lib/baseUrl";
import { getRegionByCenter } from "@/lib/regionConfig";
import inventoryData from "@/data/bloodInventory.json";

interface BloodInventory {
  updatedAt: string;
  centers: { name: string; bloodTypes: Record<string, string> }[];
}

const inventory = inventoryData as BloodInventory;
const BLOOD_TYPES = ["A", "B", "O", "AB"] as const;

const STATUS = {
  urgent: { label: "急缺", dot: "#ef4444", badge: "bg-red-100 text-red-700", ring: "ring-red-200" },
  low: { label: "偏低", dot: "#f59e0b", badge: "bg-amber-100 text-amber-700", ring: "ring-amber-200" },
  normal: { label: "正常", dot: "#10b981", badge: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-200" },
  unknown: { label: "—", dot: "#d1d5db", badge: "bg-gray-100 text-gray-500", ring: "ring-gray-200" },
} as const;

type StatusKey = keyof typeof STATUS;

const totalCenters = inventory.centers.length;

function regionDisplay(centerName: string) {
  return getRegionByCenter(centerName)?.displayName ?? centerName;
}

function regionSlug(centerName: string) {
  return getRegionByCenter(centerName)?.slug;
}

// 某血型在哪些中心呈現指定狀態（回傳分區顯示名）
function centersWithStatus(type: string, status: string) {
  return inventory.centers
    .filter((c) => c.bloodTypes[type] === status)
    .map((c) => regionDisplay(c.name));
}

function phrase(centers: string[]) {
  if (centers.length === 0) return "";
  if (centers.length === totalCenters) return "全台";
  return centers.join("、");
}

const urgentTypes = BLOOD_TYPES.filter((t) =>
  inventory.centers.some((c) => c.bloodTypes[t] === "urgent")
);
const lowTypes = BLOOD_TYPES.filter(
  (t) =>
    !urgentTypes.includes(t) &&
    inventory.centers.some((c) => c.bloodTypes[t] === "low")
);

type AlertLevel = "urgent" | "low" | "stable";

const alertLevel: AlertLevel = urgentTypes.length
  ? "urgent"
  : lowTypes.length
  ? "low"
  : "stable";

// 依「全台」與「多區」分群，產出精簡好讀的標題與文案（避免逐型逐區列舉）
function buildSummary(): { headline: string; titleCore: string } {
  if (alertLevel === "stable") {
    return { headline: "全台血庫目前大致穩定", titleCore: "全台血庫即時查詢" };
  }
  const status = alertLevel === "urgent" ? "urgent" : "low";
  const label = status === "urgent" ? "急缺" : "偏低";
  const affected = status === "urgent" ? urgentTypes : lowTypes;
  const allTypes = affected.filter(
    (t) => centersWithStatus(t, status).length === totalCenters
  );
  const partialTypes = affected.filter((t) => !allTypes.includes(t));
  const parts: string[] = [];
  if (allTypes.length) parts.push(`全台 ${allTypes.join("、")} 型血${label}`);
  if (partialTypes.length) parts.push(`${partialTypes.join("、")} 型多區${label}`);
  const leadTypes = allTypes.length ? allTypes : partialTypes;
  const leadPrefix = allTypes.length ? "全台 " : "";
  return {
    headline: parts.join("，"),
    titleCore: `今日${leadPrefix}${leadTypes.join("、")} 型血${label}`,
  };
}

const { headline, titleCore } = buildSummary();

const pageTitle = `${titleCore}｜全台捐血中心血液庫存即時查詢`;
const descCta =
  alertLevel === "urgent"
    ? "急需您挽袖捐血，馬上找附近捐血活動立即支援。"
    : alertLevel === "low"
    ? "庫存已接近安全下限，歡迎您就近挽袖補充。"
    : "感謝持續捐血，仍歡迎挽袖維持安全庫存。";
const pageDesc = `即時查詢台北、新竹、台中、高雄捐血中心的 A、B、O、AB 血型庫存狀態。${inventory.updatedAt} 更新：${headline}。${descCta}`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDesc,
  keywords: [
    "血液庫存查詢",
    "缺血",
    "血庫存量",
    "今天缺什麼血型",
    "O型血急缺",
    "捐血中心庫存",
    "全台血液庫存",
    "血荒",
    "捐血急缺血型",
    "血液庫存即時",
  ],
  alternates: { canonical: `${BASE_URL}/blood-shortage` },
  openGraph: {
    title: pageTitle,
    description: pageDesc,
    url: `${BASE_URL}/blood-shortage`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      { url: `${BASE_URL}/imgs/og-img.webp`, width: 1200, height: 630, alt: "全台血液庫存即時查詢" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDesc,
    images: [`${BASE_URL}/imgs/og-img.webp`],
  },
};

const FAQS = [
  {
    q: "現在缺什麼血型？",
    a:
      alertLevel === "urgent"
        ? `根據台灣血液基金會 ${inventory.updatedAt} 的庫存資料，目前 ${headline}，屬於急需補充的狀態。其餘血型則為偏低或正常。建議 O 型及急缺血型的朋友優先挽袖。`
        : alertLevel === "low"
        ? `根據台灣血液基金會 ${inventory.updatedAt} 的庫存資料，目前沒有血型呈現「急缺」，但 ${headline}，已接近安全下限。若沒有持續捐血很快會轉為急缺，現在正需要您挽袖補充。`
        : `根據 ${inventory.updatedAt} 的庫存資料，目前全台血庫沒有血型呈現「急缺」，多數維持偏低到正常之間。即使如此，血液保存期有限，仍非常需要您持續定期捐血。`,
  },
  {
    q: "O 型血為什麼最常告急？",
    a: "O 型紅血球可以輸給所有血型，是緊急輸血與大量出血時的「萬用供血者」，臨床需求量最大；加上 O 型本身人口比例高、用量也高，供需一旦失衡就最先見底，因此最常出現急缺。",
  },
  {
    q: "血液庫存多久更新一次？",
    a: "本頁庫存資料來自台灣血液基金會各捐血中心公布的數據，約每小時更新一次，本頁會在資料更新後同步。最後更新時間為 " + inventory.updatedAt + "。",
  },
  {
    q: "血庫存量到什麼程度算安全？",
    a: "捐血中心通常以「可供應天數」評估，一般以維持約 7 天安全庫存為目標。低於安全水位會標示為偏低，再下降到隨時可能影響供血時則標示為急缺。看到偏低或急缺時，就是最需要捐血人挺身而出的時候。",
  },
  {
    q: "看到缺血，我可以怎麼幫忙？",
    a: "最直接的方式是確認自己符合捐血條件後，就近到捐血中心、捐血站或捐血車挽袖；如果暫時不能捐，也可以把這個庫存頁面分享給親友，或揪團一起去捐。多一個人捐血，就多救一條命。",
  },
];

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function breadcrumbJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "血液庫存即時查詢",
        item: `${BASE_URL}/blood-shortage`,
      },
    ],
  };
}

export default function BloodShortagePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd()) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        {/* 麵包屑 */}
        <nav className="mb-5 flex items-center gap-1 text-xs text-gray-400">
          <Link prefetch={false} href="/" className="hover:text-gray-600">
            首頁
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-600">血液庫存即時查詢</span>
        </nav>

        {/* 標題 */}
        <header className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{inventory.updatedAt} 更新</span>
          </div>
          <h1 className="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
            全台血液庫存即時查詢
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            即時掌握台北、新竹、台中、高雄四大捐血中心 A、B、O、AB
            四種血型的庫存狀態，看看今天哪裡缺血、哪種血型最需要你挽袖。
          </p>
        </header>

        {/* 庫存警示橫幅（三級） */}
        {alertLevel === "urgent" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 ring-1 ring-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-bold text-red-700">{headline}</p>
                <p className="mt-1 text-xs leading-relaxed text-red-600/90">
                  庫存已低於安全水位，急需符合資格的捐血人就近挽袖支援。
                </p>
              </div>
            </div>
          </div>
        )}
        {alertLevel === "low" && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-700">{headline}</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-600/90">
                  庫存已接近安全下限，若沒有持續捐血很快會轉為急缺，現在正需要您挽袖補充。
                </p>
              </div>
            </div>
          </div>
        )}
        {alertLevel === "stable" && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-emerald-700">{headline}</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-600/90">
                  感謝每一位捐血人。血液保存期有限，仍歡迎您持續定期捐血維持安全庫存。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 即時庫存看板：各中心卡片 */}
        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold text-gray-800">各捐血中心即時庫存</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {inventory.centers.map((center) => {
              const slug = regionSlug(center.name);
              const centerUrgent = BLOOD_TYPES.filter(
                (t) => center.bloodTypes[t] === "urgent"
              ).length;
              return (
                <div
                  key={center.name}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-800">
                        {regionDisplay(center.name)}
                        <span className="ml-1 text-xs font-normal text-gray-400">
                          {center.name}捐血中心
                        </span>
                      </span>
                    </div>
                    {centerUrgent > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                        {centerUrgent} 型急缺
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_TYPES.map((t) => {
                      const s = (center.bloodTypes[t] as StatusKey) || "unknown";
                      const cfg = STATUS[s] || STATUS.unknown;
                      return (
                        <div
                          key={t}
                          className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 py-2.5"
                        >
                          <span className="flex items-center gap-1 text-sm font-bold text-gray-700">
                            <Droplet className="h-3.5 w-3.5" style={{ color: cfg.dot }} />
                            {t}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {slug && (
                    <Link
                      prefetch={false}
                      href={`/region/${slug}`}
                      className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-gray-900 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                    >
                      查看{regionDisplay(center.name)}捐血活動
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-end gap-3 text-[11px] text-gray-400">
            {(["urgent", "low", "normal"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATUS[s].dot }}
                />
                {STATUS[s].label}
              </span>
            ))}
          </div>
        </section>

        {/* 哪些血型現在最需要你 */}
        {(urgentTypes.length > 0 || lowTypes.length > 0) && (
          <section className="mb-8">
            <h2 className="mb-3 text-base font-bold text-gray-800">哪些血型現在最需要你</h2>
            <div className="space-y-2">
              {urgentTypes.map((t) => {
                const centers = inventory.centers.filter(
                  (c) => c.bloodTypes[t] === "urgent"
                );
                return (
                  <div
                    key={t}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm"
                  >
                    <span className="flex items-center gap-1 font-bold text-red-700">
                      <Droplet className="h-4 w-4 text-red-500" />
                      {t} 型急缺
                    </span>
                    <span className="text-gray-500">
                      {phrase(centers.map((c) => regionDisplay(c.name)))}
                    </span>
                    <div className="ml-auto flex flex-wrap gap-1.5">
                      {centers.map((c) => {
                        const slug = regionSlug(c.name);
                        return slug ? (
                          <Link
                            key={c.name}
                            prefetch={false}
                            href={`/region/${slug}`}
                            className="flex items-center gap-0.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                          >
                            去{regionDisplay(c.name)}捐
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}
              {lowTypes.map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-2.5 text-sm"
                >
                  <Droplet className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-amber-700">{t} 型偏低</span>
                  <span className="text-xs text-gray-500">
                    {phrase(centersWithStatus(t, "low"))}庫存偏低，也歡迎挽袖補充。
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-800">想立刻幫忙補血？</p>
          <p className="mt-1 text-xs text-gray-500">
            先確認自己符合捐血條件，再找最近的捐血活動或捐血車。
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              prefetch={false}
              href="/recent"
              className="flex items-center justify-center gap-1 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              找附近捐血活動
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              prefetch={false}
              href="/eligibility"
              className="flex items-center justify-center gap-1 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              我能不能捐血？
            </Link>
          </div>
        </section>

        {/* 衛教內容 */}
        <article className="space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-2 text-base font-bold text-gray-800">血液庫存等級怎麼看？</h2>
            <p>
              捐血中心通常以「可供應天數」評估血液庫存，一般以維持約 7
              天的安全庫存為目標。本頁將狀態分為三級：
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                <span>
                  <strong className="text-gray-800">急缺</strong>
                  ：庫存明顯低於安全水位，隨時可能影響緊急用血，最需要捐血人立即支援。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>
                  <strong className="text-gray-800">偏低</strong>
                  ：庫存接近安全下限，若沒有持續捐血很快會轉為急缺。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  <strong className="text-gray-800">正常</strong>
                  ：庫存維持在安全水位，但血液保存期有限，仍需要固定捐血人持續補充。
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-gray-800">為什麼會缺血？</h2>
            <p>
              台灣的血液幾乎全靠民眾無償捐輸，供應量會隨季節與假期明顯波動。
              <strong className="text-gray-700">夏季高溫</strong>讓人不想出門、
              <strong className="text-gray-700">寒流</strong>降低捐血意願、
              <strong className="text-gray-700">農曆春節與連續假期</strong>則讓固定捐血的學生與上班族離開校園與辦公商圈，
              都會造成捐血人數驟減；但醫院的手術與急重症用血需求並不會跟著放假，供需一拉開就容易出現血荒。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-gray-800">O 型血為什麼最常告急？</h2>
            <p>
              O 型紅血球可以輸給所有血型，是緊急輸血、大量出血搶救時的「萬用供血者」，臨床需求量最大；
              加上 O 型在台灣人口比例本來就高、用量也高，只要供需稍微失衡，
              O 型往往是第一個見底的血型，因此在庫存看板上最常看到 O 型急缺。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-bold text-gray-800">看到缺血，我可以怎麼幫忙？</h2>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              <li>
                <Link prefetch={false} href="/eligibility" className="font-medium text-gray-800 underline decoration-gray-300 underline-offset-2 hover:text-gray-900">
                  先確認自己符合捐血條件
                </Link>
                ，再就近到捐血中心、捐血站或捐血車挽袖。
              </li>
              <li>
                <Link prefetch={false} href="/recent" className="font-medium text-gray-800 underline decoration-gray-300 underline-offset-2 hover:text-gray-900">
                  查詢附近的捐血活動
                </Link>
                ，順便看看有沒有
                <Link prefetch={false} href="/2026" className="font-medium text-gray-800 underline decoration-gray-300 underline-offset-2 hover:text-gray-900">
                  捐血贈品
                </Link>
                。
              </li>
              <li>暫時不能捐？把這個庫存頁面分享給親友，或揪團一起去捐，一個人就能帶動好幾袋血。</li>
            </ol>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-xs text-gray-500">
              <Share2 className="h-4 w-4 shrink-0 text-gray-400" />
              <span>把「{BASE_URL.replace(/^https?:\/\//, "")}/blood-shortage」分享出去，就是最快的缺血動員。</span>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-gray-800">常見問題</h2>
            <div className="space-y-3">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-gray-800">
                    {f.q}
                    <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <p className="border-t border-gray-200 pt-4 text-xs text-gray-400">
            資料來源：台灣血液基金會各捐血中心公布之血液庫存量，約每小時更新。最後更新時間
            {inventory.updatedAt}。本頁僅供參考，實際庫存與捐血需求請以各捐血中心公告為準。
          </p>
        </article>
      </div>
    </main>
  );
}
