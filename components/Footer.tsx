import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} 台灣捐血活動查詢
          </p>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/news" className="hover:text-gray-800 transition-colors">
              捐血新聞
            </Link>
            <Link href="/about" className="hover:text-gray-800 transition-colors">
              關於我們
            </Link>
            <Link href="/privacy" className="hover:text-gray-800 transition-colors">
              隱私權政策
            </Link>
            <Link href="/faq" className="hover:text-gray-800 transition-colors">
              常見問題
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
