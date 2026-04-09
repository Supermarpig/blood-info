import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getNewsBySlug, getAllNewsSlugs } from "@/lib/newsUtils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllNewsSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsBySlug(slug);

  if (!article) return { title: "找不到文章" };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: `${baseUrl}/news/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: `${baseUrl}/news/${slug}`,
      images: [{ url: article.imageUrl, alt: article.imageAlt }],
      type: "article",
      publishedTime: article.date,
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getNewsBySlug(slug);

  if (!article) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const author = article.author ?? "血荒資訊編輯部";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.date,
    dateModified: article.date,
    image: article.imageUrl,
    url: `${baseUrl}/news/${article.slug}`,
    author: {
      "@type": "Organization",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "台灣捐血活動查詢",
      url: baseUrl,
    },
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          首頁
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/news" className="hover:text-gray-700 transition-colors">
          最新消息
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium line-clamp-1">{article.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
        <span>{article.date}</span>
        <span>·</span>
        <span>{author}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">{article.title}</h1>
      <p className="text-gray-500 text-sm mb-6">{article.summary}</p>

      {/* Featured Image */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden bg-gray-100 mb-8">
        <Image
          src={article.imageUrl}
          alt={article.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 672px) 100vw, 672px"
          priority
        />
      </div>

      {/* Table of Contents */}
      <nav className="bg-gray-50 rounded-lg p-4 mb-8">
        <p className="text-sm font-semibold text-gray-700 mb-2">目錄</p>
        <ol className="list-decimal list-inside space-y-1">
          {article.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm text-red-600 hover:underline"
              >
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Article Body */}
      <article className="space-y-8">
        {article.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {section.heading}
            </h2>
            <p className="text-gray-700 leading-relaxed">{section.content}</p>
          </section>
        ))}
      </article>

      {/* Sources */}
      {article.sources.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-2">資料來源</p>
          <ul className="space-y-1">
            {article.sources.map((source, i) => (
              <li key={i}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:underline"
                >
                  {source.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Author Bio */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 text-sm font-bold">編</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{author}</p>
            <p className="text-xs text-gray-500 mt-1">
              關注台灣捐血資訊的志願編輯團隊，文章資料來源為台灣血液基金會官方資料與衛福部公告，致力提供正確、即時的捐血衛教內容。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
