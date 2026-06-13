import Link from "@/components/Link";
import { ChevronRight } from "lucide-react";

// 全站指向「捐血懶人包」支柱頁的內鏈卡片。
// 集中各長尾頁的權重到這篇文章，衝「捐血」大詞排名。
export const GUIDE_SLUG = "2026-05-10-blood-donation-complete-guide";

export default function GuideCallout({ className = "" }: { className?: string }) {
  return (
    <Link
      href={`/news/${GUIDE_SLUG}`}
      className={`group flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-pink-50 px-5 py-4 hover:border-red-300 transition-colors ${className}`}
    >
      <div>
        <p className="text-sm font-semibold text-gray-900">
          第一次捐血？先看捐血懶人包
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          捐血條件、流程、好處與贈品一次看懂
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-red-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
