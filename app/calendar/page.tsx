import { Metadata } from "next";
import CalendarClient from "./CalendarClient";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "捐血活動月曆 | 每日捐血時間表與地點查詢",
  description:
    "以月曆方式瀏覽全台每日捐血活動時間表。快速查看今日、明日捐血車與捐血站地點，找到最方便的捐血時間。",
  keywords: [
    "捐血月曆",
    "捐血活動時間表",
    "今日捐血活動",
    "捐血日曆",
    "每日捐血",
    "捐血時間",
    "捐血車時刻表",
  ],
  alternates: {
    canonical: `${baseUrl}/calendar`,
  },
  openGraph: {
    title: "捐血活動月曆 | 每日捐血時間表與地點查詢",
    description:
      "以月曆方式瀏覽全台每日捐血活動時間表。快速查看今日、明日捐血車與捐血站地點。",
    url: `${baseUrl}/calendar`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${baseUrl}/imgs/og-img.webp`,
        width: 1200,
        height: 630,
        alt: "捐血活動月曆",
      },
    ],
  },
};

interface DonationEvent {
  id?: string;
  time: string;
  organization: string;
  location: string;
  rawContent: string;
  customNote?: string;
  activityDate: string;
  center?: string;
  detailUrl?: string;
  tags?: string[];
  coordinates?: { lat: number; lng: number };
  pttData?: { rawLine: string; images: string[]; url: string; tags?: string[] };
}

export default async function CalendarPage() {
  let data: Record<string, DonationEvent[]> = {};

  try {
    const response = await fetch(`${baseUrl}/api/blood-donations`, {
      next: { revalidate: 3600 },
    });
    const result = await response.json();
    if (result.success && result.data) {
      data = result.data;
    }
  } catch {
    // render with empty data; client still works
  }

  return <CalendarClient initialData={data} />;
}
