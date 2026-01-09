import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, HelpCircle } from "lucide-react";

// FAQ 資料
const FAQ_DATA = [
  {
    question: "捐血有什麼好處？",
    answer:
      "捐血不僅能幫助有需要的病患，對捐血者本身也有好處：1) 免費健康檢查：每次捐血都會進行血液檢測，可以了解自己的健康狀況。2) 促進新陳代謝：捐血後身體會產生新的血液細胞，有助於維持血液健康。3) 潛在心血管益處：定期捐血可能有助於降低鐵質過高的風險。4) 心理滿足感：幫助他人能帶來正面的心理效益。",
  },
  {
    question: "多久可以捐一次血？",
    answer:
      "根據台灣血液基金會規定：全血捐血（250ml 或 500ml）男性每 2 個月可捐一次，女性每 3 個月可捐一次。分離術捐血（血小板、血漿）則每 2 週可捐一次，每年最多 24 次。建議依照個人身體狀況調整捐血頻率。",
  },
  {
    question: "捐血前要注意什麼？",
    answer:
      "捐血前請注意以下事項：1) 睡眠充足：前一晚至少睡滿 6 小時。2) 飲食正常：捐血前請吃過東西，避免空腹捐血。3) 避免油膩食物：捐血前一天避免攝取過多油脂。4) 多喝水：捐血前後多補充水分。5) 攜帶證件：記得帶身分證或健保卡。6) 穿寬鬆衣物：方便捲起袖子。",
  },
  {
    question: "什麼情況不能捐血？",
    answer:
      "以下情況暫時不宜捐血：1) 感冒或身體不適。2) 24 小時內飲酒。3) 3 天內拔牙或接受小手術。4) 1 年內刺青或穿洞。5) 懷孕或哺乳中。6) 服用特定藥物。7) 最近接種疫苗（依疫苗種類有不同等待期）。8) 曾前往特定疫區旅遊。詳細規定請參考台灣血液基金會官網。",
  },
  {
    question: "捐血會痛嗎？",
    answer:
      "捐血時會有短暫的針刺感，類似一般抽血的感覺，大約只有 1-2 秒。整個捐血過程約 10-15 分鐘（全血），大多數人都能輕鬆完成。如果對針頭特別恐懼，可以告訴護理人員，他們會給予適當的協助。",
  },
  {
    question: "捐血後要注意什麼？",
    answer:
      "捐血後請注意：1) 在休息區休息 10-15 分鐘後再離開。2) 多喝水補充流失的水分。3) 24 小時內避免劇烈運動。4) 若有頭暈現象，請躺下休息。5) 針孔處加壓止血至少 5 分鐘，當天避免提重物。6) 不要揉搓針孔處以免瘀青。",
  },
  {
    question: "第一次捐血要準備什麼？",
    answer:
      "第一次捐血需要：1) 年滿 17 歲（65 歲以下）。2) 體重男性 50 公斤以上，女性 45 公斤以上。3) 攜帶身分證或健保卡。4) 確認自己符合捐血條件。5) 保持放鬆心情。現場會先填寫健康問卷、量血壓、測血紅素，通過後即可捐血。",
  },
  {
    question: "捐血送的贈品可以自己選嗎？",
    answer:
      "捐血贈品由各捐血活動主辦單位自行準備，贈品種類和數量依活動而異，通常無法自行選擇。常見贈品包括：電影票、超商禮券、生活用品、食品等。建議可以先查詢本網站，了解各活動的贈品資訊後再前往。",
  },
];

export const metadata: Metadata = {
  title: "捐血常見問題 FAQ | 台灣捐血活動查詢",
  description:
    "捐血常見問題解答：多久可以捐一次血？捐血有什麼好處？捐血前後注意事項等，完整捐血 FAQ 一次了解。",
  keywords: [
    "捐血FAQ",
    "捐血常見問題",
    "多久可以捐血",
    "捐血注意事項",
    "第一次捐血",
    "捐血好處",
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
