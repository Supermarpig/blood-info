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
    default: "台灣捐血活動查詢 | 快速尋找附近的捐血點與贈品資訊",
    template: "%s | 台灣捐血活動查詢",
  },
  description:
    "彙整全台灣最新捐血活動、地點、時間與贈品資訊。提供地圖模式與條件篩選，讓您輕鬆找到最適合的捐血站，一起熱血救人！",
  keywords: [
    "捐血",
    "捐血活動",
    "捐血贈品",
    "捐血地點",
    "捐血車",
    "捐血中心",
    "台灣捐血",
    "公益",
    "志工",
    "血液基金會",
  ],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "台灣捐血活動查詢 | 快速尋找附近的捐血點與贈品資訊",
    description:
      "彙整全台灣最新捐血活動、地點、時間與贈品資訊。提供地圖模式與條件篩選，讓您輕鬆找到最適合的捐血站，一起熱血救人！",
    url: baseUrl,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${baseUrl}/imgs/og-img.jpg`,
        width: 1200,
        height: 630,
        alt: "台灣捐血資訊整理小網站的封面圖片",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "台灣捐血活動查詢 | 快速尋找附近的捐血點與贈品資訊",
    description:
      "彙整全台灣最新捐血活動、地點、時間與贈品資訊。提供地圖模式與條件篩選，讓您輕鬆找到最適合的捐血站，一起熱血救人！",
    images: [`${baseUrl}/imgs/og-img.jpg`],
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
