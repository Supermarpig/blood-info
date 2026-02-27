import { Metadata } from "next";
import CalendarClient from "./CalendarClient";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

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
  },
};

export default function CalendarPage() {
  return <CalendarClient />;
}
