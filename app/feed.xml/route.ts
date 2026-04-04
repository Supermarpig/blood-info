import { getAllNews } from "@/lib/newsUtils";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.bloodtw.com";
  const articles = getAllNews().slice(0, 20);

  const items = articles
    .map((article) => {
      const pubDate = new Date(article.date).toUTCString();
      const link = `${baseUrl}/news/${article.slug}`;
      const description = article.summary
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const title = article.title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>台灣捐血活動查詢 | bloodtw.com</title>
    <link>${baseUrl}</link>
    <description>台灣最即時的捐血活動查詢平台，提供捐血車地點、捐血贈品、捐血知識等最新資訊。</description>
    <language>zh-TW</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
