import { Metadata } from "next";
import Link from "@/components/Link";
import { ChevronRight, ArrowRight, Check, X } from "lucide-react";
import { BASE_URL } from "@/lib/baseUrl";
import { MYTH_QUESTIONS } from "@/lib/mythQuizData";
import MythQuizClient from "@/components/MythQuizClient";

const pageTitle = "捐血迷思大挑戰｜10 題測出你破解了多少捐血迷思";
const pageDesc =
  "捐血會變虛弱？刺青這輩子不能捐血？月經不能捐血？10 題真假挑戰，依現行台灣血液基金會捐血者健康標準，一次破解最常見的捐血迷思。";
const pageUrl = `${BASE_URL}/myth-quiz`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDesc,
  keywords: [
    "捐血迷思",
    "捐血迷思測驗",
    "捐血會變虛弱嗎",
    "捐血安全嗎",
    "捐血刺青",
    "生理期可以捐血嗎",
    "捐血资格",
    "捐血常見問題",
    "捐血知識測驗",
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    title: pageTitle,
    description: pageDesc,
    url: pageUrl,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [{ url: `${BASE_URL}/imgs/og-img.webp`, width: 1200, height: 630, alt: pageTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDesc,
    images: [`${BASE_URL}/imgs/og-img.webp`],
  },
};

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MYTH_QUESTIONS.map((q) => ({
      "@type": "Question",
      name: `「${q.statement}」是真的還是假的？`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${q.isTrue ? "這是真的。" : "這是假的。"}${q.explanation}`,
      },
    })),
  };
}

function breadcrumbJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "捐血迷思大挑戰", item: pageUrl },
    ],
  };
}

function appJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "捐血迷思大挑戰",
    url: pageUrl,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    description: pageDesc,
    offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
  };
}

export default function MythQuizPage() {
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
          <span className="text-gray-600">捐血迷思大挑戰</span>
        </nav>

        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
            捐血迷思大挑戰
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
            關於捐血的說法，一半是真的、一半是以訛傳訛。10 題快速挑戰，
            照現行台灣血液基金會標準，測出你破解了多少迷思。
          </p>
        </header>

        <section className="mb-10">
          <MythQuizClient pageUrl={pageUrl} />
        </section>

        {/* 完整題庫（server render，確保無 JS 也能被爬到） */}
        <article className="space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-4 text-lg font-bold text-gray-900">10 個常見捐血說法，真的還是假的？</h2>
            <div className="space-y-3">
              {MYTH_QUESTIONS.map((q) => (
                <details
                  key={q.id}
                  className="group rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-gray-800">
                    <span className="flex items-center gap-2">
                      {q.isTrue ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-rose-400" />
                      )}
                      {q.statement}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    <strong className="text-gray-800">{q.isTrue ? "真的。" : "假的。"}</strong>
                    {q.explanation}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* 導回捐血核心 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-800">破解迷思之後，來看看自己符不符合資格</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              8 題快速測驗，馬上知道你今天能不能捐血。
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/eligibility"
                className="flex items-center justify-center gap-1 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                測我可以捐血嗎
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/blood-shortage"
                className="flex items-center justify-center gap-1 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                查今天缺什麼血型
              </Link>
            </div>
          </section>

          <p className="border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-400">
            本測驗內容依現行《捐血者健康標準》（衛生福利部公告）與台灣血液基金會公開資訊整理，僅供衛教參考。
            實際捐血資格與健康判斷請以捐血現場醫護人員或血液基金會服務專線 0800-024-995 為準。
          </p>
        </article>
      </div>
    </main>
  );
}
