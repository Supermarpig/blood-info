import { Metadata } from "next";
import Link from "@/components/Link";
import { ChevronRight, ArrowRight, Droplet, Info } from "lucide-react";
import { BASE_URL } from "@/lib/baseUrl";
import BloodTypeCalculator from "@/components/BloodTypeCalculator";
import {
  ABO_PHENOTYPES,
  crossPhenotypes,
  COMPATIBILITY,
  TAIWAN_DISTRIBUTION,
  type AboPhenotype,
} from "@/lib/bloodTypeGenetics";

const pageTitle = "血型遺傳表計算機｜父母血型對照子女血型，一次算出可能與不可能";
const pageDesc =
  "輸入父母血型，立即算出子女可能與不可能的血型。完整 ABO 血型遺傳對照表、Rh 陰性（熊貓血）怎麼來、各血型輸血相容性與台灣血型人口分布一次看懂。";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDesc,
  keywords: [
    "血型遺傳",
    "血型遺傳表",
    "父母血型 子女血型",
    "血型計算",
    "O型和A型生出什麼血型",
    "AB型父母",
    "Rh陰性",
    "熊貓血",
    "血型對照表",
    "血型分布",
    "輸血相容性",
  ],
  alternates: { canonical: `${BASE_URL}/blood-type` },
  openGraph: {
    title: pageTitle,
    description: pageDesc,
    url: `${BASE_URL}/blood-type`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${BASE_URL}/imgs/og-img.webp`,
        width: 1200,
        height: 630,
        alt: "血型遺傳表計算機",
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

/** 16 種父母組合的完整結果——server 端算好寫進 HTML，確保無 JS 也能被爬到 */
const ALL_COMBOS = ABO_PHENOTYPES.flatMap((f) =>
  ABO_PHENOTYPES.map((m) => ({ father: f, mother: m, result: crossPhenotypes(f, m) }))
);

const TYPE_DOT: Record<AboPhenotype, string> = {
  A: "#ef4444",
  B: "#3b82f6",
  O: "#10b981",
  AB: "#a855f7",
};

const FAQS = [
  {
    q: "父母都是 O 型，可以生出 A 型或 B 型小孩嗎？",
    a: "不行。O 型的基因型只有 OO，只能傳下 O 這個對偶基因，因此兩個 O 型的父母，子女必定是 O 型，不可能出現 A、B 或 AB 型。這是 ABO 遺傳中少數完全確定的組合之一。",
  },
  {
    q: "O 型和 A 型會生出什麼血型？",
    a: "可能是 A 型或 O 型，不可能是 B 型或 AB 型。關鍵在 A 型父母的基因型：若是 AA，子女全部為 A 型；若是帶隱性 O 的 AO，則子女約各有一半機率是 A 型或 O 型。",
  },
  {
    q: "AB 型的父母會生出 O 型小孩嗎？",
    a: "在標準 ABO 遺傳下不會。AB 型只能傳下 A 或 B，無法傳下 O，因此 AB 型與任何血型的組合都不會生出 O 型子女。極罕見的例外是「順式 AB」或孟買型等特殊血型，需由檢驗確認。",
  },
  {
    q: "父母都是 Rh 陽性，為什麼小孩是 Rh 陰性？",
    a: "因為 Rh 陽性可能是 DD，也可能是帶隱性 d 的 Dd。若父母都是 Dd，各自把 d 傳下去，子女就會是 dd，也就是 Rh 陰性。機率約為四分之一。這完全符合遺傳法則，不代表血緣有問題。",
  },
  {
    q: "血型可以用來判斷親子關係嗎？",
    a: "不能。血型只能「排除」某些不可能的組合，無法證明親子關係——因為符合條件的人口非常多。加上孟買型、嵌合體等罕見特殊血型會造成例外，親子關係的判定必須以 DNA 檢驗為準。",
  },
  {
    q: "血型會影響個性嗎？",
    a: "沒有科學證據支持。血型個性說源自日本，多次大規模研究都無法在血型與人格特質之間找到穩定關聯，普遍被視為一種巴納姆效應（描述模糊到人人都覺得準）。血型在醫學上真正重要的用途是輸血相容與孕產照護。",
  },
  {
    q: "台灣哪一種血型最多？",
    a: "台灣以 O 型最多，約占四成四；A 型與 B 型各約兩成多，AB 型最少，約只占 6%。也因為 O 型人口多、又是紅血球的萬用供血者，臨床用量最大，所以血庫最常出現 O 型告急。",
  },
];

function faqJsonLd() {
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
        name: "血型遺傳表計算機",
        item: `${BASE_URL}/blood-type`,
      },
    ],
  };
}

function appJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "血型遺傳表計算機",
    url: `${BASE_URL}/blood-type`,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    description: pageDesc,
    offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
  };
}

function Dot({ type }: { type: AboPhenotype }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: TYPE_DOT[type] }}
    />
  );
}

export default function BloodTypePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd()) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <nav className="mb-5 flex items-center gap-1 text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600">
            首頁
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-600">血型遺傳表計算機</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
            血型遺傳表計算機
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            選擇父母的血型，立即算出子女可能與不可能的血型。
            多數遺傳表只給一張是非對照，但 A 型與 B 型各有兩種基因型，
            同樣的父母血型會有不同結果——這裡把「一定可能」與「視基因型而定」分開標示，
            並附上各組合的實際機率。
          </p>
        </header>

        <section className="mb-8">
          <BloodTypeCalculator />
        </section>

        {/* 完整 16 組對照表（server render，確保可爬） */}
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-bold text-gray-900">
            ABO 血型遺傳完整對照表
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-600">
            16 種父母血型組合的子女可能血型一覽。實線代表一定可能，
            虛線代表只有在父母帶特定隱性基因時才會出現。
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-3 font-semibold">父 × 母</th>
                  <th className="px-4 py-3 font-semibold">子女可能血型</th>
                  <th className="px-4 py-3 font-semibold">不可能</th>
                </tr>
              </thead>
              <tbody>
                {ALL_COMBOS.map(({ father, mother, result }) => (
                  <tr
                    key={`${father}-${mother}`}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Dot type={father} />
                        {father}
                        <span className="text-gray-300">×</span>
                        <Dot type={mother} />
                        {mother}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1.5">
                        {result.always.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs font-bold text-gray-800"
                          >
                            {t}
                          </span>
                        ))}
                        {result.conditional.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-dashed border-gray-300 bg-white px-2 py-0.5 text-xs font-bold text-gray-500"
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {result.impossible.length ? result.impossible.join("、") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 血型分布 */}
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-bold text-gray-900">台灣各血型人口分布</h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-600">
            台灣以 O 型最多、AB 型最少。這個分布直接影響血庫供需——
            O 型人口多、又能輸給所有血型，臨床用量最大，因此最常出現庫存告急。
          </p>
          <div className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5">
            {(["O", "A", "B", "AB"] as AboPhenotype[]).map((t) => (
              <div key={t} className="flex items-center gap-3">
                <span className="flex w-12 shrink-0 items-center gap-1.5 text-sm font-bold text-gray-800">
                  <Dot type={t} />
                  {t}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(TAIWAN_DISTRIBUTION[t] / 44) * 100}%`,
                      backgroundColor: TYPE_DOT[t],
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-semibold text-gray-600">
                  {TAIWAN_DISTRIBUTION[t]}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 輸血相容 */}
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-bold text-gray-900">各血型輸血相容對照</h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-600">
            以下為紅血球的 ABO 相容關係。O 型是「萬用供血者」，AB 型則是「萬用受血者」。
            實際輸血仍須經過交叉配對與 Rh 比對，不能只看 ABO。
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["O", "A", "B", "AB"] as AboPhenotype[]).map((t) => (
              <div
                key={t}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                  <Droplet className="h-4 w-4" style={{ color: TYPE_DOT[t] }} />
                  {t} 型
                </p>
                <dl className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-gray-400">可捐給</dt>
                    <dd className="font-medium text-gray-700">
                      {COMPATIBILITY[t].canGiveTo.join("、")} 型
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-gray-400">可接受</dt>
                    <dd className="font-medium text-gray-700">
                      {COMPATIBILITY[t].canReceiveFrom.join("、")} 型
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* 導回捐血核心 */}
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">知道血型了，那你的血型現在缺不缺？</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            全台四大捐血中心每天公布各血型庫存。看看今天哪個血型告急、
            你的血型是不是正好被需要。
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/blood-shortage"
              className="flex items-center justify-center gap-1 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              查今天缺什麼血型
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/recent"
              className="flex items-center justify-center gap-1 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              找附近捐血活動
            </Link>
          </div>
        </section>

        {/* 衛教內容 */}
        <article className="space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-2 text-lg font-bold text-gray-900">
              血型是怎麼遺傳的？三個對偶基因決定一切
            </h2>
            <p>
              ABO 血型由三個對偶基因決定：<strong className="text-gray-800">A、B、O</strong>。
              每個人從父母各得到一個，組成自己的基因型。其中 A 與 B 對 O 是顯性，
              A 與 B 之間則是共顯性（兩個都表現出來）。
            </p>
            <p className="mt-3">
              所以外表看到的血型（表現型）不等於基因型：
              A 型的人可能是 AA，也可能是帶著隱性 O 的 AO；B 型可能是 BB 或 BO；
              AB 型只有 AB 一種；O 型只有 OO 一種。
            </p>
            <p className="mt-3">
              這就是為什麼兩個 A 型的父母有機會生出 O 型小孩——只要雙方都是 AO，
              各自把 O 傳下去，子女就是 OO。這完全符合遺傳法則，也是最常被誤會的情況之一。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-gray-900">
              Rh 陰性（熊貓血）是怎麼來的？
            </h2>
            <p>
              一般說的血型後面那個「陽性／陰性」指的是 Rh(D) 抗原。
              帶有 D 抗原是 Rh 陽性，沒有則是 Rh 陰性。台灣人約
              99.7% 都是 Rh 陽性，Rh 陰性僅約千分之三，因此俗稱
              <strong className="text-gray-800">熊貓血</strong>。
            </p>
            <p className="mt-3">
              Rh 陽性可能是 DD，也可能是帶隱性 d 的 Dd。當父母都是 Dd 時，
              各自把 d 傳下去，子女就會是 dd，也就是 Rh 陰性——
              這解釋了為什麼兩個 Rh 陽性的父母仍可能生出 Rh 陰性小孩。
            </p>
            <p className="mt-3">
              Rh 陰性在臨床上非常重要：需要輸血時只能接受 Rh 陰性的血，
              而台灣可供應的量極稀少；Rh 陰性的孕婦若懷了 Rh 陽性胎兒，
              也需要醫療上的特別追蹤。若你是 Rh 陰性，
              <Link
                href="/donate"
                className="font-medium text-gray-800 underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
              >
                定期捐血
              </Link>
              對這個族群的意義遠比一般血型更大。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-gray-900">
              血型會影響個性嗎？科學上的答案
            </h2>
            <p>
              血型個性說在台灣、日本流行了數十年，但至今
              <strong className="text-gray-800">沒有科學證據支持</strong>。
              多次針對上萬人的大規模研究，都無法在血型與人格特質之間找到穩定關聯。
            </p>
            <p className="mt-3">
              之所以會覺得「很準」，多半是巴納姆效應：描述寫得夠模糊，
              每個人都能對號入座；加上知道自己血型後會不自覺地往描述靠攏。
              血型真正的醫學價值在於輸血相容、器官移植配對與孕產照護——
              這些才是它被檢驗、被記錄的原因。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-gray-900">
              血型可以用來驗親子關係嗎？
            </h2>
            <p>
              不行。血型只能做「排除」——例如 AB 型父母不會生出 O 型子女，
              但它<strong className="text-gray-800">無法證明</strong>親子關係，
              因為符合條件的人口實在太多。
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-500">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <span>
                此外，孟買型（Bombay phenotype）、順式 AB、嵌合體等罕見特殊血型都會造成例外，
                看似「不可能」的組合實際上仍可能發生。任何親子關係的判定都必須以 DNA
                檢驗為準，切勿僅憑血型下結論。
              </span>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900">常見問題</h2>
            <div className="space-y-3">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-gray-800">
                    {f.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900">延伸閱讀</h2>
            <div className="space-y-2">
              {[
                {
                  href: "/myth-quiz",
                  title: "捐血迷思大挑戰",
                  desc: "10 題測出你破解了多少常見捐血迷思",
                },
                {
                  href: "/eligibility",
                  title: "我可以捐血嗎？資格快速測驗",
                  desc: "8 題測出你今天符不符合捐血資格",
                },
                {
                  href: "/news/2026-07-28-blood-test-report-guide",
                  title: "抽血報告怎麼看？血紅素、白血球、血小板紅字代表什麼",
                  desc: "看懂血液常規報告上的每一個數字",
                },
                {
                  href: "/news/2026-07-28-iron-deficiency-anemia-guide",
                  title: "缺鐵性貧血症狀有哪些？補鐵這樣吃才有效",
                  desc: "最常見的貧血類型，症狀、成因與正確補法",
                },
                {
                  href: "/news/2026-04-20-why-o-type-universal-donor",
                  title: "O 型血為什麼是萬能供血者？",
                  desc: "從 ABO 抗原看懂輸血相容的原理",
                },
                {
                  href: "/news/2026-05-05-taiwan-blood-bank-inventory-explained",
                  title: "台灣血庫庫存怎麼計算？備血天數與血荒警戒機制",
                  desc: "為什麼 O 型最常告急",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <span>
                    <span className="block text-sm font-semibold text-gray-800">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">{item.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              ))}
            </div>
          </section>

          <p className="border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-400">
            本頁依 ABO 與 Rh(D) 的標準孟德爾遺傳法則計算，適用於絕大多數情況，
            但不涵蓋孟買型等罕見特殊血型。內容僅供衛教參考，
            實際血型與醫療決策請以醫療院所檢驗結果及專業人員判斷為準。
          </p>
        </article>
      </div>
    </main>
  );
}
