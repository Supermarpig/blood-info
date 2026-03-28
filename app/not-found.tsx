import Link from "next/link";
import { ChevronRight } from "lucide-react";
import NotFoundCanvas from "@/components/NotFoundCanvas";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-rose-50">

      {/* Canvas 粒子背景 */}
      <NotFoundCanvas />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">

        {/* 大數字 */}
        <div
          className="animate-fade-in-up select-none"
          style={{ animationDelay: "0s" }}
        >
          <span
            className="text-[9rem] sm:text-[12rem] font-black leading-none tracking-tighter"
            style={{
              background: "linear-gradient(135deg, #dc2626 0%, #be185d 60%, #fca5a5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </span>
        </div>

        {/* 標題 */}
        <h1
          className="text-2xl font-bold text-gray-900 mb-3 -mt-4 animate-fade-in-up"
          style={{ animationDelay: "0.15s" }}
        >
          找不到這個頁面
        </h1>

        {/* 說明 */}
        <p
          className="text-gray-400 mb-10 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: "0.25s" }}
        >
          你輸入的網址可能已經移動或不存在。<br />
          試試回首頁查詢今日捐血活動吧！
        </p>

        {/* 按鈕組 */}
        <div
          className="flex flex-col sm:flex-row gap-3 animate-fade-in-up w-full sm:w-auto"
          style={{ animationDelay: "0.35s" }}
        >
          <Link
            href="/"
            className="shimmer-btn inline-flex items-center justify-center gap-2 bg-red-500 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
          >
            回首頁查詢捐血活動
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-500 px-8 py-3.5 rounded-full font-medium hover:border-red-200 hover:text-red-500 transition-colors"
          >
            捐血常見問題
          </Link>
        </div>

        {/* 底部快捷城市 */}
        <div
          className="mt-12 animate-fade-in-up"
          style={{ animationDelay: "0.45s" }}
        >
          <p className="text-xs text-gray-300 mb-3 uppercase tracking-widest">快速查詢</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "台北", href: "/city/taipei" },
              { label: "新北", href: "/city/new-taipei" },
              { label: "台中", href: "/city/taichung" },
              { label: "高雄", href: "/city/kaohsiung" },
              { label: "台南", href: "/city/tainan" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 border border-gray-100 px-4 py-1.5 rounded-full hover:border-red-200 hover:text-red-500 transition-colors"
              >
                {link.label}捐血活動
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
