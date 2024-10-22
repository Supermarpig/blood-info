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

export const metadata: Metadata = {
  title: "台灣捐血資訊整理小網站",
  description: "一點點資訊整理",
  openGraph: {
    title: "台灣捐血資訊整理小網站",
    description: "一點點資訊整理，讓更多人了解捐血資訊的重要性",
    url: "https://blood-info.vercel.app/", // 替換為您的網站 URL
    type: "website",
    images: [
      {
        url: "/imgs/og-img.jpg", // 替換為您要顯示的圖像 URL
        width: 1200,
        height: 630,
        alt: "台灣捐血資訊整理小網站的封面圖片",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
