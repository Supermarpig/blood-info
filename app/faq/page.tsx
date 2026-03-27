import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, HelpCircle, ListOrdered } from "lucide-react";
import { FAQ_DATA } from "@/data/faq";

const HOW_TO_STEPS = [
  {
    name: "確認捐血資格",
    text: "年齡 17–65 歲、體重男女均需 50 公斤以上，近期健康狀況良好，無感冒、發燒等症狀。",
  },
  {
    name: "攜帶有效證件",
    text: "帶身分證（或健保卡）前往捐血中心或捐血車。第一次捐血必須攜帶身分證。",
  },
  {
    name: "填寫健康問卷",
    text: "抵達後填寫捐血前健康問卷，誠實回答近期健康狀況、用藥記錄與生活習慣。",
  },
  {
    name: "接受初步檢查",
    text: "醫護人員量血壓、測血色素（Hb），確認數值符合捐血標準（血色素男性 13.5 g/dL、女性 12.5 g/dL 以上）。",
  },
  {
    name: "進行捐血",
    text: "全血捐血約 8–10 分鐘，捐血量為 250 mL 或 500 mL。過程中放鬆、保持平穩呼吸。",
  },
  {
    name: "休息補充水分",
    text: "捐血後在休息區休息至少 15 分鐘，補充提供的點心與飲料，確認無不適後再離開。",
  },
];


export const metadata: Metadata = {
  title: "捐血常見問題 FAQ | 台灣捐血活動查詢",
  description:
    "捐血常見問題解答：多久可以捐一次血？捐血有什麼好處？捐血前後注意事項等，完整捐血 FAQ 一次了解。",
  keywords: [
    "捐血FAQ",
    "捐血常見問題",
    "今天哪裡有捐血車",
    "多久可以捐血",
    "捐血注意事項",
    "第一次捐血",
    "捐血好處",
    "2026捐血贈品",
    "台北哪裡捐血",
    "新北哪裡捐血",
    "捐血車捐血站差別",
    "捐血需要預約嗎",
  ],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/faq`,
  },
  openGraph: {
    title: "捐血常見問題 FAQ | 台灣捐血活動查詢",
    description: "捐血常見問題解答，完整捐血 FAQ 一次了解。",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/faq`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
  },
};

function generateHowToJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "捐血流程：第一次捐血怎麼做？",
    description:
      "詳細說明捐血的完整步驟，從確認資格、攜帶證件、填寫問卷，到捐血後休息，一次了解。",
    totalTime: "PT30M",
    step: HOW_TO_STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${baseUrl}/faq#how-to-step-${i + 1}`,
    })),
  };
}

/**
 * Generate FAQ Schema for Google Rich Results
 */
function generateFaqJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "首頁",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "常見問題",
          item: `${baseUrl}/faq`,
        },
      ],
    },
  };
}

export default function FAQPage() {
  const faqJsonLd = generateFaqJsonLd();
  const howToJsonLd = generateHowToJsonLd();

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          首頁
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">常見問題</span>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-red-100 p-2 rounded-full">
            <HelpCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">捐血流程與常見問題</h1>
        </div>
        <p className="text-gray-600">捐血步驟說明與常見疑問解答，第一次捐血也能輕鬆上手。</p>
      </div>

      {/* HowTo: 捐血流程 */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <ListOrdered className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">捐血流程</h2>
        </div>
        <ol className="space-y-3">
          {HOW_TO_STEPS.map((step, i) => (
            <li
              key={i}
              id={`how-to-step-${i + 1}`}
              className="flex gap-4 bg-white border border-gray-200 rounded-xl p-4"
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-gray-900 mb-0.5">{step.name}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {FAQ_DATA.map((item, index) => (
          <details
            key={index}
            className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-red-200 transition-colors"
          >
            <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
              <h2 className="font-semibold text-gray-900 pr-4">
                {item.question}
              </h2>
              <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
            </summary>
            <div className="px-5 pb-5 pt-0">
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          準備好捐血了嗎？
        </h2>
        <p className="text-gray-600 mb-4">
          查詢附近的捐血活動，開始你的捐血之旅！
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-full font-medium hover:bg-red-600 transition-colors"
        >
          尋找捐血活動
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
