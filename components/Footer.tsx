import Link from "@/components/Link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} 台灣捐血活動查詢
          </p>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link prefetch={false} href="/search" className="hover:text-gray-800 transition-colors">
              搜尋活動
            </Link>
            <Link prefetch={false} href="/blood-shortage" className="hover:text-gray-800 transition-colors">
              血液庫存
            </Link>
            <Link prefetch={false} href="/record" className="hover:text-gray-800 transition-colors">
              紀錄本
            </Link>
            <Link prefetch={false} href="/news" className="hover:text-gray-800 transition-colors">
              捐血新聞
            </Link>
            <Link prefetch={false} href="/about" className="hover:text-gray-800 transition-colors">
              關於我們
            </Link>
            <Link prefetch={false} href="/privacy" className="hover:text-gray-800 transition-colors">
              隱私權政策
            </Link>
            <Link prefetch={false} href="/faq" className="hover:text-gray-800 transition-colors">
              常見問題
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
