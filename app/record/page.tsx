import { Metadata } from "next";
import RecordClient from "./RecordClient";
import { BASE_URL } from "@/lib/baseUrl";

const baseUrl = BASE_URL;

export const metadata: Metadata = {
  title: "捐血紀錄本｜記錄每次捐血、計算下次可捐日期",
  description:
    "免費捐血紀錄工具。記錄每次捐血日期與類型，自動計算下次可捐血日期，累積捐血次數統計，資料存於您的裝置，保護隱私。",
  keywords: [
    "捐血紀錄",
    "捐血紀錄本",
    "下次可捐血日期",
    "捐血次數",
    "捐血追蹤",
  ],
  alternates: {
    canonical: `${baseUrl}/record`,
  },
  openGraph: {
    title: "捐血紀錄本｜記錄每次捐血、計算下次可捐日期",
    description:
      "免費捐血紀錄工具。記錄捐血日期與類型，自動計算下次可捐日期。",
    url: `${baseUrl}/record`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "捐血紀錄本",
  description: "記錄每次捐血日期與類型，自動計算下次可捐血日期",
  url: `${baseUrl}/record`,
};

export default function RecordPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecordClient />
    </>
  );
}
