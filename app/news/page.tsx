import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Newspaper } from "lucide-react";
import { getAllNews } from "@/lib/newsUtils";

export const metadata: Metadata = {
  title: "捐血最新消息 | 台灣捐血活動查詢",
  description:
    "台灣捐血最新新聞與公告：血庫庫存動態、捐血活動特別主題、捐血政策更新等，掌握最新捐血資訊。",
  keywords: ["捐血新聞", "捐血公告", "血庫庫存", "捐血活動消息", "台灣捐血最新"],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/news`,
  },
  openGraph: {
    title: "捐血最新消息 | 台灣捐血活動查詢",
    description:
      "台灣捐血最新新聞與公告：血庫庫存動態、捐血活動特別主題、捐血政策更新等，掌握最新捐血資訊。",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/news`,
    siteName: "台灣捐血活動查詢",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/imgs/og-img.webp`,
        width: 1200,
        height: 630,
        alt: "捐血最新消息",
      },
    ],
  },
};

export default function NewsPage() {
  const articles = getAllNews();

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          首頁
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">最新消息</span>
      </nav>

      <div className="flex items-center gap-2 mb-2">
        <Newspaper className="w-6 h-6 text-red-500" />
        <h1 className="text-2xl font-bold">捐血最新消息</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        整理台灣捐血相關新聞、血庫動態與活動公告，讓你掌握最新捐血資訊。
      </p>

      {articles.length === 0 ? (
        <p className="text-gray-400">目前尚無文章。</p>
      ) : (
        <div className="flex flex-col gap-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/news/${article.slug}`}
              className="group flex gap-4 rounded-xl border border-gray-100 p-4 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={article.imageUrl}
                  alt={article.imageAlt}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{article.date}</p>
                <h2 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {article.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
