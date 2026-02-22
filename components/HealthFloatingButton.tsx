"use client";

import { useState } from "react";
import { Heart, Droplets, Apple, Pill, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HealthTip {
  icon: React.ReactNode;
  title: string;
  description: string;
  affiliateUrl?: string;
  affiliateLabel?: string;
}

// TODO: 將 affiliateUrl 替換為蝦皮連結
const HEALTH_TIPS: HealthTip[] = [
  {
    icon: <Pill className="w-4 h-4 text-red-500" />,
    title: "補鐵是關鍵",
    description:
      "捐血後身體會流失鐵質，建議補充鐵劑或含鐵食物（如紅肉、菠菜、黑芝麻），幫助身體快速恢復造血能力。",
    // affiliateUrl: "https://example.com/iron",
    affiliateLabel: "看看鐵劑推薦",
  },
  {
    icon: <Droplets className="w-4 h-4 text-orange-500" />,
    title: "B群 + 葉酸助造血",
    description:
      "維他命 B12 和葉酸是紅血球生成的必要營養素，捐血後適量補充可加速血液恢復。",
    // affiliateUrl: "https://example.com/vitamin-b",
    affiliateLabel: "看看B群推薦",
  },
  {
    icon: <Apple className="w-4 h-4 text-green-500" />,
    title: "維他命C 幫助吸收",
    description:
      "維他命 C 能促進鐵質吸收，捐血後多吃芭樂、奇異果、柑橘類水果，效果加倍。",
    // affiliateUrl: "https://example.com/vitamin-c",
    affiliateLabel: "看看維他命C推薦",
  },
  {
    icon: <Heart className="w-4 h-4 text-pink-500" />,
    title: "雞精補元氣",
    description:
      "捐血後來一瓶雞精或滴雞精，快速補充蛋白質與胺基酸，恢復體力。",
    // affiliateUrl: "https://example.com/chicken-essence",
    affiliateLabel: "看看雞精推薦",
  },
];

export default function HealthFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const hasAnyLink = HEALTH_TIPS.some((tip) => tip.affiliateUrl);

  return (
    <>
      {/* 浮動 Tab — 固定在右側邊緣 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 bg-gradient-to-b from-red-500 to-rose-500 text-white px-1.5 py-3 rounded-l-xl shadow-lg hover:shadow-xl hover:px-2.5 transition-all duration-300 writing-vertical"
        style={{ writingMode: "vertical-rl" }}
      >
        <Heart className="w-3.5 h-3.5" />
        <span className="text-xs font-bold tracking-widest">健康補給</span>
      </button>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b flex-none bg-gradient-to-r from-red-50 to-rose-50">
            <DialogTitle className="flex items-center gap-2.5 text-gray-800">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-500" />
              </div>
              捐血後健康補給指南
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1 ml-10">
              捐完血後，這樣吃恢復最快
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto p-4 flex-grow space-y-3">
            {HEALTH_TIPS.map((tip, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      {tip.icon}
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">
                      {tip.title}
                    </h3>
                  </div>
                  {tip.affiliateUrl && (
                    <a
                      href={tip.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0"
                    >
                      {tip.affiliateLabel}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>

          {/* 底部 */}
          <div className="p-3 border-t bg-gray-50/50 text-center">
            <p className="text-[10px] text-gray-400">
              {hasAnyLink
                ? "含推薦連結，您的點擊將幫助我們維護網站 ❤️"
                : "內容僅供參考，詳細請諮詢醫師"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
