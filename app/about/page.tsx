import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Heart, Mail } from "lucide-react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const metadata: Metadata = {
  title: "關於我們 | 台灣捐血活動查詢",
  description:
    "台灣捐血活動查詢是一個公益性質的非官方網站，整合台灣血液基金會公開資料，讓民眾快速找到附近捐血活動、捐血車地點與捐血贈品資訊。",
  alternates: {
    canonical: `${baseUrl}/about`,
  },
  openGraph: {
    title: "關於我們 | 台灣捐血活動查詢",
    description:
      "台灣捐血活動查詢是一個公益性質的非官方網站，整合台灣血液基金會公開資料，讓民眾快速找到附近捐血活動。",
    url: `${baseUrl}/about`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${baseUrl}/imgs/og-img.webp`,
        width: 1200,
        height: 630,
        alt: "台灣捐血活動查詢",
      },
    ],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "首頁", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "關於我們", item: `${baseUrl}/about` },
  ],
};

export default function AboutPage() {
  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          首頁
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">關於我們</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-red-100 p-2 rounded-full">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">關於我們</h1>
        </div>
        <p className="text-gray-600">台灣捐血活動查詢的誕生背景與服務說明</p>
      </div>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">網站介紹</h2>
          <p>
            「台灣捐血活動查詢」是一個由個人開發者維護的公益性質非官方網站。我們整合台灣血液基金會所公開的捐血活動資料，讓有心捐血的民眾能快速找到附近的捐血車地點、捐血站開放時間，以及當期捐血贈品資訊。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">服務範圍</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>全台捐血活動即時查詢（捐血車、捐血站）</li>
            <li>捐血贈品資訊整理（電影票、超商禮券、生活用品等）</li>
            <li>各縣市捐血活動篩選與地圖定位</li>
            <li>捐血衛教知識與常見問題解答</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">資料來源</h2>
          <p className="text-gray-600">
            本站資料來源為台灣血液基金會官方公告，屬公開資訊之整理與呈現，非台灣血液基金會官方網站。如需最新、最正確的捐血資訊，請以官方公告為準。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">廣告說明</h2>
          <p className="text-gray-600">
            本網站使用 Google AdSense 顯示廣告以維持網站運營。廣告內容由 Google 依據您的瀏覽行為自動投放，與本站立場無關。如需了解廣告個人化設定，請參閱我們的
            <Link href="/privacy" className="text-red-600 hover:underline mx-1">
              隱私權政策
            </Link>
            。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">聯絡我們</h2>
          <p className="text-gray-600 mb-3">
            如有資料錯誤回報、合作洽詢或其他意見，歡迎透過電子郵件與我們聯繫。
          </p>
          <a
            href="mailto:ken51717@gmail.com"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
          >
            <Mail className="w-4 h-4" />
            ken51717@gmail.com
          </a>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-12 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">開始查詢捐血活動</h2>
        <p className="text-gray-600 mb-4">一起為台灣血庫盡一份心力！</p>
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
