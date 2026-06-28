import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getNewsBySlug, getAllNewsSlugs, getAllNews } from "@/lib/newsUtils";
import AdCard from "@/components/AdCard";
import { GUIDE_SLUG } from "@/components/GuideCallout";
import { BASE_URL, SITE_HOST } from "@/lib/baseUrl";

const AD_SLOT_NEWS = process.env.NEXT_PUBLIC_ADSENSE_SLOT_NEWS;
const AD_SLOT_SIDEBAR = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR;

// 自動把內文中出現的網址轉成可點擊連結：站內網址走 client-side 導航，站外網址開新分頁
function renderContent(content: string) {
  const parts = content.split(/(https?:\/\/[\w./?#=&%~:@+-]+|www\.[\w./?#=&%~:@+-]+)/g);
  return parts.map((part, i) => {
    if (!/^(https?:\/\/|www\.)/.test(part)) return part;

    const href = part.startsWith("http") ? part : `https://${part}`;
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      return part;
    }

    const isInternal = SITE_HOST !== "" && url.host.replace(/^www\./, "") === SITE_HOST;

    return isInternal ? (
      <Link
        key={i}
        href={`${url.pathname}${url.search}${url.hash}`}
        className="text-red-600 hover:underline"
      >
        {part}
      </Link>
    ) : (
      <a
        key={i}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-600 hover:underline"
      >
        {part}
      </a>
    );
  });
}

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

  const baseUrl = BASE_URL;

  const keywords = article.sections.map((s) => s.heading);

  // 原創品牌化 OG 圖（取代重複的罐頭 stock，利於 Google Discover）
  const ogImage = `${baseUrl}/api/og/news/${slug}`;

  return {
    title: article.title,
    description: article.summary,
    keywords,
    alternates: {
      canonical: `${baseUrl}/news/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: `${baseUrl}/news/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
      type: "article",
      publishedTime: article.date,
      authors: [article.author ?? "血荒資訊編輯部"],
      tags: keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [ogImage],
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getNewsBySlug(slug);

  if (!article) notFound();

  const baseUrl = BASE_URL;

  const author = article.author ?? "血荒資訊編輯部";

  // 把「捐血懶人包」支柱頁釘在延伸閱讀首位，讓全站文章都回連它、集中權重衝「捐血」大詞。
  const others = getAllNews().filter((a) => a.slug !== article.slug);
  const pillar = others.find((a) => a.slug === GUIDE_SLUG);
  const relatedArticles = pillar
    ? [pillar, ...others.filter((a) => a.slug !== GUIDE_SLUG).slice(0, 2)]
    : others.slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.date,
    dateModified: article.date,
    image: `${baseUrl}/api/og/news/${article.slug}`,
    url: `${baseUrl}/news/${article.slug}`,
    author: {
      "@type": "Organization",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "台灣捐血活動查詢",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/icons/icon-512.png`,
        width: 512,
        height: 512,
      },
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".article-summary", "h2"],
    },
    isBasedOn: {
      "@type": "WebSite",
      name: "台灣血液基金會",
      url: "https://www.blood.org.tw",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "最新消息", item: `${baseUrl}/news` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${baseUrl}/news/${article.slug}` },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="flex gap-6 items-start">
        {/* 左側欄廣告 — xl 以上才顯示 */}
        <aside className="hidden xl:block w-[160px] flex-shrink-0">
          <div className="sticky top-24">
            <AdCard slot={AD_SLOT_SIDEBAR} variant="sidebar" />
          </div>
        </aside>

        {/* 主內容 */}
        <div className="flex-1 min-w-0 max-w-2xl mx-auto">
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
            {article.sections.flatMap((section, index) => {
              const midPoint = Math.floor((article.sections.length - 1) / 2);
              const sectionEl = (
                <section key={section.id} id={section.id}>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">
                    {section.heading}
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {renderContent(section.content)}
                  </p>
                </section>
              );
              if (index === midPoint) {
                return [sectionEl, <AdCard key="mid-ad" slot={AD_SLOT_NEWS} variant="inline" />];
              }
              return [sectionEl];
            })}
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

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-100">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                延伸閱讀
              </h2>
              <div className="flex flex-col gap-3">
                {relatedArticles.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/news/${a.slug}`}
                    className="group flex gap-3 rounded-xl border border-gray-100 p-3 hover:border-red-200 hover:bg-red-50 transition-colors"
                  >
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={a.imageUrl}
                        alt={a.imageAlt}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">{a.date}</p>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                        {a.title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 self-center" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-10 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-8 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              準備好捐血了嗎？
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              查詢今日全台捐血活動地點、開放時間與贈品資訊。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
              >
                查詢今日捐血活動
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/news"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full text-sm font-medium hover:border-red-300 hover:text-red-600 transition-colors"
              >
                更多捐血資訊
              </Link>
            </div>
          </div>
        </div>

        {/* 右側欄廣告 — xl 以上才顯示 */}
        <aside className="hidden xl:block w-[160px] flex-shrink-0">
          <div className="sticky top-24">
            <AdCard slot={AD_SLOT_SIDEBAR} variant="sidebar" />
          </div>
        </aside>
      </div>
    </div>
  );
}
