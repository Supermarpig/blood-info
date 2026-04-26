import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const metadata: Metadata = {
  title: "隱私權政策 | 台灣捐血活動查詢",
  description:
    "台灣捐血活動查詢隱私權政策，說明本站如何收集、使用個人資料，以及 Google AdSense 廣告 Cookie 使用方式。",
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
  openGraph: {
    title: "隱私權政策 | 台灣捐血活動查詢",
    description: "台灣捐血活動查詢隱私權政策，說明本站資料收集與 Cookie 使用方式。",
    url: `${baseUrl}/privacy`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
  },
  robots: {
    index: true,
    follow: false,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "首頁", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "隱私權政策", item: `${baseUrl}/privacy` },
  ],
};

export default function PrivacyPage() {
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
        <span className="text-gray-900 font-medium">隱私權政策</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-red-100 p-2 rounded-full">
            <ShieldCheck className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">隱私權政策</h1>
        </div>
        <p className="text-sm text-gray-500">最後更新日期：2026 年 4 月 26 日</p>
      </div>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">一、前言</h2>
          <p>
            台灣捐血活動查詢（以下稱「本站」）重視您的隱私權。本隱私權政策說明本站如何收集、使用及保護您的個人資料。使用本站即表示您同意本政策之內容。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">二、資料收集</h2>
          <p className="mb-3">本站可能收集以下資訊：</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>瀏覽器類型、作業系統等裝置資訊</li>
            <li>訪問頁面、停留時間、點擊行為等使用記錄</li>
            <li>IP 位址（用於流量統計，不用於識別個人）</li>
            <li>您主動提供之位置資訊（用於「附近捐血」功能，不儲存於伺服器）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">三、Cookie 使用</h2>
          <p className="mb-3">
            本站使用 Cookie 及類似技術以提升使用體驗。Cookie 是儲存於您裝置上的小型文字檔案。本站使用以下類型的 Cookie：
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-1">功能性 Cookie</h3>
              <p className="text-sm text-gray-600">記憶您的偏好設定（如縣市篩選），提供更好的使用體驗。</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-1">分析性 Cookie（Google Analytics）</h3>
              <p className="text-sm text-gray-600">
                本站使用 Google Analytics 分析訪客行為，以改善網站內容。收集的資料為匿名統計資料，不包含可識別個人的資訊。詳情請參閱{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:underline"
                >
                  Google 隱私權政策
                </a>
                。
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-1">廣告 Cookie（Google AdSense）</h3>
              <p className="text-sm text-gray-600">
                本站使用 Google AdSense 顯示廣告。Google 可能依據您過去造訪本站或其他網站的行為，投放個人化廣告。您可前往{" "}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:underline"
                >
                  Google 廣告設定
                </a>{" "}
                管理個人化廣告偏好，或造訪{" "}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:underline"
                >
                  aboutads.info
                </a>{" "}
                退出廣告聯盟的個人化廣告。
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">四、第三方服務</h2>
          <p className="mb-3">本站使用以下第三方服務，各服務均有其獨立的隱私權政策：</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                Google Analytics
              </a>
              {" "}— 網站流量分析
            </li>
            <li>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                Google AdSense
              </a>
              {" "}— 廣告投放服務
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">五、資料安全</h2>
          <p className="text-gray-600">
            本站採用 HTTPS 加密傳輸保護您的資料安全。本站不主動收集、儲存或出售任何可識別個人身份的資訊。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">六、未成年人</h2>
          <p className="text-gray-600">
            本站內容適合一般大眾，不針對未滿 13 歲之兒童收集個人資料。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">七、政策變更</h2>
          <p className="text-gray-600">
            本站保留隨時修改本隱私權政策之權利。重大變更時將於本頁更新日期，請定期查閱。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">八、聯絡我們</h2>
          <p className="text-gray-600">
            如對本隱私權政策有任何疑問，請透過電子郵件聯繫：{" "}
            <a href="mailto:ken51717@gmail.com" className="text-red-600 hover:underline">
              ken51717@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
