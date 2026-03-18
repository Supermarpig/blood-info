import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, HelpCircle } from "lucide-react";
import { FAQ_DATA } from "@/data/faq";

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
  const jsonLd = generateFaqJsonLd();

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
          <h1 className="text-2xl font-bold text-gray-900">捐血常見問題</h1>
        </div>
        <p className="text-gray-600">關於捐血的各種疑問，這裡都有解答。</p>
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
