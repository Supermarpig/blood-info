import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Gift } from "lucide-react";

export const metadata: Metadata = {
  title: "2026 捐血贈品查詢 | 今年捐血有什麼贈品？",
  description:
    "2026 年台灣捐血贈品完整整理：電影票、超商禮券、餐飲券、生活用品、食品等。查詢今日捐血活動，找到你想要的贈品！",
  keywords: [
    "2026捐血贈品",
    "2026捐血送什麼",
    "捐血贈品2026",
    "今年捐血送什麼",
    "捐血送電影票2026",
    "捐血送超商禮券2026",
    "捐血活動2026",
  ],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/2026`,
  },
  openGraph: {
    title: "2026 捐血贈品查詢 | 今年捐血有什麼贈品？",
    description:
      "2026 年台灣捐血贈品完整整理：電影票、超商禮券、餐飲券、生活用品、食品等。",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/2026`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/imgs/og-img.webp`,
        width: 1200,
        height: 630,
        alt: "2026 捐血贈品查詢",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 捐血贈品查詢 | 今年捐血有什麼贈品？",
    description:
      "2026 年台灣捐血贈品完整整理：電影票、超商禮券、餐飲券、生活用品、食品等。",
    images: [`${process.env.NEXT_PUBLIC_BASE_URL}/imgs/og-img.webp`],
  },
};

const GIFT_TYPES = [
  {
    slug: "movie-ticket",
    name: "電影票",
    emoji: "🎬",
    desc: "威秀、國賓影城等電影票，捐血後直接去看電影！",
  },
  {
    slug: "convenience-store",
    name: "超商禮券",
    emoji: "🏪",
    desc: "7-11、全家、萊爾富等超商禮券，最實用的捐血贈品。",
  },
  {
    slug: "voucher",
    name: "禮券",
    emoji: "🎁",
    desc: "百貨禮券、商品券，各式各樣的優惠好禮。",
  },
  {
    slug: "food-beverage",
    name: "餐飲券",
    emoji: "☕",
    desc: "飲料券、咖啡券、餐廳優惠券，捐血後補充能量。",
  },
  {
    slug: "daily-necessities",
    name: "生活用品",
    emoji: "🧴",
    desc: "衛生紙、洗衣精、沐浴乳等日用品，實用又划算。",
  },
  {
    slug: "food",
    name: "食品",
    emoji: "🍜",
    desc: "泡麵、餅乾、零食禮盒，捐血後帶點好吃的回家。",
  },
];

function generateJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "首頁", item: baseUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "2026 捐血贈品",
          item: `${baseUrl}/2026`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "2026 捐血贈品查詢",
      description:
        "2026 年台灣捐血贈品完整整理，包含電影票、超商禮券、餐飲券、生活用品、食品等各類贈品。",
      url: `${baseUrl}/2026`,
      dateModified: new Date().toISOString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "2026 年捐血送什麼贈品？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "2026 年各捐血活動的贈品種類豐富，常見包括：超商禮券（7-11、全家）、電影票（威秀、國賓）、餐飲兌換券、生活用品（衛生紙、洗衣精）、食品禮盒等。贈品由各主辦單位自行決定，不同場次贈品不同，建議透過 bloodtw.com 查詢各活動的最新贈品資訊再前往。",
          },
        },
        {
          "@type": "Question",
          name: "2026 捐血活動在哪裡查？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "可至 bloodtw.com 查詢全台今日捐血活動，資料每小時更新，支援依縣市、地區、贈品類型篩選，快速找到附近的捐血地點與贈品資訊。",
          },
        },
      ],
    },
  ];
}

export default function Year2026Page() {
  const jsonLd = generateJsonLd();

  return (
    <div className="container mx-auto p-8 max-w-3xl">
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
        <span className="text-gray-900 font-medium">2026 捐血贈品</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-red-100 p-2 rounded-full">
            <Gift className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            2026 捐血贈品查詢
          </h1>
        </div>
        <p className="text-gray-600">
          2026 年台灣各捐血活動贈品總整理。選擇你想要的贈品類型，查詢今日哪裡捐血有送！
        </p>
      </div>

      {/* Gift grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {GIFT_TYPES.map((gift) => (
          <Link
            key={gift.slug}
            href={`/gift/${gift.slug}`}
            className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-red-300 hover:shadow-sm transition-all"
          >
            <span className="text-3xl">{gift.emoji}</span>
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                捐血送{gift.name}
              </p>
              <p className="text-sm text-gray-500">{gift.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">常見問題</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="font-semibold text-gray-900 mb-2">
              2026 年捐血送什麼贈品？
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              2026 年各捐血活動的贈品種類豐富，常見包括：超商禮券（7-11、全家）、電影票（威秀、國賓）、餐飲兌換券、生活用品（衛生紙、洗衣精）、食品禮盒等。贈品由各主辦單位自行決定，不同場次贈品不同，建議查詢上方各類贈品頁面取得最新資訊。
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="font-semibold text-gray-900 mb-2">
              怎麼知道今天捐血送什麼？
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              點選上方任一贈品類型，即可看到目前正在進行的相關贈品活動列表，資料每小時更新。也可回到{" "}
              <Link href="/" className="text-red-500 hover:underline">
                首頁
              </Link>{" "}
              查詢今日全台捐血活動總覽。
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          查詢今日捐血活動
        </h2>
        <p className="text-gray-600 mb-4">
          找到附近的捐血地點，今天就去捐血！
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-full font-medium hover:bg-red-600 transition-colors"
        >
          查看今日活動
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
