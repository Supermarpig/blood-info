import { Metadata } from "next";
import { BASE_URL } from "@/lib/baseUrl";
import EligibilityClient from "./EligibilityClient";

const pageTitle = "我可以捐血嗎？捐血資格快速測驗";
const pageDesc =
  "8 題快速測驗，馬上知道你今天是否符合捐血資格。依據台灣血液基金會標準，測試年齡、體重、健康狀況、刺青、用藥等條件，完全免費。";
const pageUrl = `${BASE_URL}/eligibility`;

export const metadata: Metadata = {
  title: `${pageTitle} | 台灣捐血活動查詢`,
  description: pageDesc,
  keywords: [
    "我可以捐血嗎",
    "捐血資格",
    "捐血條件",
    "捐血年齡限制",
    "捐血體重",
    "捐血資格測驗",
    "捐血資格查詢",
    "捐血健康條件",
    "刺青可以捐血嗎",
    "生理期捐血",
    "吃藥可以捐血嗎",
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    title: pageTitle,
    description: "8 題互動測驗，馬上知道你是否符合捐血資格",
    url: pageUrl,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [{ url: `${BASE_URL}/imgs/og-img.webp`, width: 1200, height: 630, alt: pageTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: "8 題互動測驗，馬上知道你是否符合捐血資格",
    images: [`${BASE_URL}/imgs/og-img.webp`],
  },
};

function appJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: pageTitle,
    url: pageUrl,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    description: pageDesc,
    offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
  };
}

function breadcrumbJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "捐血資格快速測驗", item: pageUrl },
    ],
  };
}

export default function EligibilityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd()) }}
      />
      <EligibilityClient pageUrl={pageUrl} />
    </>
  );
}
