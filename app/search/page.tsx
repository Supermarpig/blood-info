import { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "./SearchClient";
import { BASE_URL } from "@/lib/baseUrl";

const baseUrl = BASE_URL;

export const metadata: Metadata = {
  title: "捐血活動搜尋｜全台捐血行程關鍵字查詢",
  description:
    "輸入地點、主辦單位或關鍵字，快速搜尋全台捐血活動。涵蓋捐血車出車地點、捐血站資訊與當期贈品。",
  keywords: [
    "捐血活動搜尋",
    "捐血查詢",
    "捐血地點搜尋",
    "全台捐血活動",
    "捐血車搜尋",
  ],
  alternates: {
    canonical: `${baseUrl}/search`,
  },
  openGraph: {
    title: "捐血活動搜尋｜全台捐血行程關鍵字查詢",
    description:
      "輸入地點、主辦單位或關鍵字，快速搜尋全台捐血活動。",
    url: `${baseUrl}/search`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "捐血活動搜尋",
  description: "輸入關鍵字搜尋全台捐血活動地點與行程",
  url: `${baseUrl}/search`,
};

export default function SearchPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-6xl"><p className="text-gray-400 text-sm">載入中...</p></div>}>
        <SearchClient />
      </Suspense>
    </>
  );
}
