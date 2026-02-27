import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

if (!baseUrl) {
  throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
}

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  verification: {
    google: "ytS-Ix7BNYWixGg1JlgYTQIZLNjHvtcsHm9E1QdBUHc",
  },
  title: {
    default: "今日捐血活動查詢 | 附近捐血站、捐血地點與贈品資訊",
    template: "%s | 台灣捐血活動查詢",
  },
  description:
    "查詢今日全台捐血活動、捐血中心、捐血站與附近捐血地點。提供捐血車時間表、捐血贈品查詢，快速找到最近的捐血站！",
  keywords: [
    "捐血活動查詢",
    "今日捐血活動",
    "附近捐血",
    "捐血地點",
    "捐血站",
    "捐血中心",
    "捐血贈品查詢",
    "捐血車",
    "捐血活動",
    "捐血贈品",
  ],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "今日捐血活動查詢 | 附近捐血站、捐血地點與贈品資訊",
    description:
      "查詢今日全台捐血活動、捐血中心、捐血站與附近捐血地點。提供捐血車時間表、捐血贈品查詢，快速找到最近的捐血站！",
    url: baseUrl,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${baseUrl}/imgs/og-img.webp`,
        width: 1200,
        height: 630,
        alt: "台灣捐血資訊整理小網站的封面圖片",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "今日捐血活動查詢 | 附近捐血站、捐血地點與贈品資訊",
    description:
      "查詢今日全台捐血活動、捐血中心、捐血站與附近捐血地點。提供捐血車時間表、捐血贈品查詢，快速找到最近的捐血站！",
    images: [`${baseUrl}/imgs/og-img.webp`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
