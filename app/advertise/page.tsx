import { Metadata } from "next";
import Link from "@/components/Link";
import {
  ChevronRight,
  Mail,
  TrendingUp,
  Users,
  Smartphone,
  Search,
  MapPin,
  FileText,
} from "lucide-react";
import { BASE_URL } from "@/lib/baseUrl";

const baseUrl = BASE_URL;

const CONTACT_EMAIL = "cody.yu@bloodtw.com";

// 數據來源：Google Search Console（搜尋曝光／點擊、關鍵字名次）與 Google AdSense（頁面瀏覽量）。
// 統計區間為最近 28 天，隨每月實際數字更新。
// 刻意把「搜尋曝光」與「網站瀏覽量」分開列：前者是 SERP 上被看到的次數，
// 後者才是廣告版位真正會被載入的次數。兩者差 5 倍以上，混在一起講對廣告主是不實陳述。
const STATS_PERIOD = "2026 年 8 月（最近 28 天）";

const metrics = [
  {
    icon: Search,
    label: "搜尋曝光",
    value: "193,698",
    unit: "次／月",
    note: "Google 搜尋結果中被看到的次數",
    dot: "bg-red-400",
  },
  {
    icon: Users,
    label: "進站人次",
    value: "20,213",
    unit: "次／月",
    note: "平均 722／天，週五尖峰逾 1,100",
    dot: "bg-amber-400",
  },
  {
    icon: FileText,
    label: "頁面瀏覽量",
    value: "約 35,000",
    unit: "次／月",
    note: "廣告版位實際載入的次數",
    dot: "bg-emerald-400",
  },
  {
    icon: Smartphone,
    label: "行動裝置佔比",
    value: "80.2",
    unit: "%",
    note: "使用者多在外出途中查詢",
    dot: "bg-sky-400",
  },
];

const rankings = [
  { keyword: "捐血活動", position: "2.8", impressions: "5,314" },
  { keyword: "捐血活動查詢", position: "2.2", impressions: "1,050" },
  { keyword: "捐血", position: "4.0", impressions: "13,037" },
  { keyword: "捐血車", position: "5.4", impressions: "1,208" },
  { keyword: "捐血贈品", position: "5.6", impressions: "416" },
];

const placements = [
  {
    name: "首頁橫幅",
    price: "NT$8,000",
    unit: "／月",
    desc: "全站流量最大的單一頁面，佔總曝光 41%。版位在活動列表上方，進站即見。",
    highlight: true,
  },
  {
    name: "全站側欄",
    price: "NT$5,000",
    unit: "／月",
    desc: "出現在衛教文章、活動詳情與新聞列表頁的側欄，停留時間長、可視率高。",
    highlight: false,
  },
  {
    name: "指定城市頁",
    price: "NT$3,000",
    unit: "／月起",
    desc: "鎖定單一縣市（共 49 個城市頁）。適合地區型診所、藥局與在地品牌。",
    highlight: false,
  },
  {
    name: "專文合作",
    price: "NT$15,000",
    unit: "／篇",
    desc: "撰寫並長期保留一篇專題文章，含站內連結。依《廣告刊登原則》明確標示合作關係。",
    highlight: false,
  },
];

const audience = [
  "年齡 16–65 歲，以 20–45 歲為主力",
  "健康意識高，主動關心血紅素、鐵質與體檢數值",
  "查詢動機集中在週末出行與贈品，決策快",
  "全站 66 篇衛教內容帶來持續的健康資訊需求",
];

export const metadata: Metadata = {
  title: { absolute: "廣告合作與贊助｜台灣捐血活動查詢" },
  description:
    "台灣捐血活動查詢每月約 2 萬人次造訪、19 萬次搜尋曝光，「捐血活動」關鍵字排名前 3。提供首頁橫幅、全站側欄、城市頁與專文合作等版位，歡迎品牌洽詢。",
  alternates: {
    canonical: `${baseUrl}/advertise`,
  },
  openGraph: {
    title: "廣告合作與贊助｜台灣捐血活動查詢",
    description:
      "每月約 2 萬人次造訪、19 萬次搜尋曝光，「捐血活動」關鍵字排名前 3。提供首頁橫幅、全站側欄、城市頁與專文合作等版位。",
    url: `${baseUrl}/advertise`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${baseUrl}/imgs/og-img.webp`,
        width: 1200,
        height: 630,
        alt: "台灣捐血活動查詢廣告合作",
      },
    ],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "首頁", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "廣告合作", item: `${baseUrl}/advertise` },
  ],
};

export default function AdvertisePage() {
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "廣告合作洽詢｜台灣捐血活動查詢"
  )}&body=${encodeURIComponent(
    ["品牌／單位名稱：", "聯絡人與職稱：", "希望的版位：", "預計檔期：", "想達成的目標：", "", "（歡迎補充任何需求，我會在 2 個工作天內回覆。）"].join("\n")
  )}`;

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          首頁
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">廣告合作</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">廣告合作與贊助</h1>
        <p className="text-gray-600 leading-relaxed">
          台灣捐血活動查詢是全台最完整的捐血活動整合平台，每天有超過 700
          位民眾透過我們找到附近的捐血車與捐血站。我們接受品牌贊助與廣告合作，收入用於維持伺服器、資料爬取與內容更新。
        </p>
      </header>

      {/* 數據 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">網站數據</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          統計區間 {STATS_PERIOD}，數據來自 Google Search Console 與 Google AdSense。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="border border-gray-200 rounded-xl p-5 bg-white"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                <m.icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{m.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 tabular-nums">
                  {m.value}
                </span>
                <span className="text-sm text-gray-500">{m.unit}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{m.note}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          「搜尋曝光」指網站在 Google
          搜尋結果中被顯示的次數，屬品牌能見度指標；「頁面瀏覽量」才是廣告版位實際載入的次數。兩者定義不同，請分開評估。
        </p>
      </section>

      {/* 關鍵字 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">主要關鍵字排名</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          在台灣捐血相關的核心搜尋詞上，本站長期位居前段。
        </p>

        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="text-left font-medium px-5 py-3">關鍵字</th>
                <th className="text-right font-medium px-5 py-3">Google 平均排名</th>
                <th className="text-right font-medium px-5 py-3">月曝光</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankings.map((r) => (
                <tr key={r.keyword}>
                  <td className="px-5 py-3 text-gray-900">{r.keyword}</td>
                  <td className="px-5 py-3 text-right text-gray-700 tabular-nums">
                    第 {r.position} 名
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700 tabular-nums">
                    {r.impressions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 受眾 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">受眾輪廓</h2>
        </div>
        <ul className="space-y-3">
          {audience.map((a) => (
            <li key={a} className="flex items-start gap-3 text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
              <span className="leading-relaxed">{a}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500 mt-4 leading-relaxed">
          特別適合保健食品（鐵劑、B 群）、健康檢查、連鎖藥局、診所與地方型服務品牌。
        </p>
      </section>

      {/* 版位 */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">版位與價格</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          以下為建議定價，可依檔期長度與組合調整。長約另有優惠。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {placements.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl p-5 border ${
                p.highlight
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="font-bold text-gray-900">{p.name}</h3>
                {p.highlight && (
                  <span className="text-xs text-gray-500 shrink-0">最高曝光</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-xl font-bold text-gray-900 tabular-nums">
                  {p.price}
                </span>
                <span className="text-sm text-gray-500">{p.unit}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 刊登原則 */}
      <section className="mb-12">
        <h2 className="text-lg font-bold text-gray-900 mb-4">廣告刊登原則</h2>
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            本站為公益性質的非官方資訊平台，與台灣血液基金會無隸屬關係。為維持使用者信任，所有合作皆遵守以下原則：
          </p>
          <ul className="space-y-2">
            {[
              "所有付費內容明確標示「贊助」或「廣告」，不偽裝成編輯內容。",
              "不接受誇大療效、未經核准的醫療或保健宣稱。",
              "不接受任何要求修改捐血衛教事實或醫學資訊的合作。",
              "捐血活動資料與衛教內容的編輯判斷，不受廣告主影響。",
            ].map((rule) => (
              <li key={rule} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 聯絡 */}
      <section className="border border-gray-200 rounded-2xl p-8 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900 mb-2">洽詢合作</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          歡迎來信說明需求與預算，我會在 2 個工作天內回覆，並提供完整的流量報告與版位截圖。
        </p>
        <a
          href={mailto}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          <Mail className="w-4 h-4" />
          來信洽詢
        </a>
        <p className="text-sm text-gray-500 mt-4">
          或直接寄至{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </div>
  );
}
