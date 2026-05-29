import { Metadata } from "next";
import EligibilityClient from "./EligibilityClient";

export const metadata: Metadata = {
  title: "我可以捐血嗎？捐血資格快速測驗 | 台灣捐血活動查詢",
  description:
    "8 題快速測驗，馬上知道你今天是否符合捐血資格。依據台灣血液基金會標準，測試年齡、體重、健康狀況、刺青、用藥等條件，完全免費。",
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
  openGraph: {
    title: "我可以捐血嗎？捐血資格快速測驗",
    description: "8 題互動測驗，馬上知道你是否符合捐血資格",
  },
};

export default function EligibilityPage() {
  return <EligibilityClient />;
}
