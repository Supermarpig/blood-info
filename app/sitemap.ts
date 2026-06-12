import { MetadataRoute } from "next";
import { promises as fs } from "fs";
import path from "path";
import { getAllRegionSlugs } from "@/lib/regionConfig";
import { getAllGiftSlugs } from "@/lib/giftConfig";
import { getAllCitySlugs } from "@/lib/cityConfig";
import { getAllOrgSlugs } from "@/lib/organizationConfig";
import { getAllNews } from "@/lib/newsUtils";
import { eventShortId } from "@/lib/eventId";

interface DonationEvent {
  id?: string;
}

// 收集「當月與未來」的活動詳情頁 URL。
// 與 activity/[id] 的 generateStaticParams 採同一 cutoff（當月起）：
// 這些頁面已預渲染、內容最新鮮，且每天有真實搜尋意圖（地點×贈品長尾）。
// 過去月份的活動頁仍可被內部連結爬到並 on-demand 索引，但不灌入 sitemap 以免稀釋品質。
async function getActivitySitemapEntries(
  baseUrl: string
): Promise<MetadataRoute.Sitemap> {
  const dataDir = path.join(process.cwd(), "data");
  const now = new Date();
  const cutoff = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  let files: string[];
  try {
    files = (await fs.readdir(dataDir)).filter((f) =>
      /^bloodInfo-\d{6}\.json$/.test(f)
    );
  } catch {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];
  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(dataDir, file), "utf-8");
      const data: Record<string, DonationEvent[]> = JSON.parse(content);
      for (const [date, events] of Object.entries(data)) {
        if (date < cutoff) continue;
        for (const event of events) {
          if (!event.id) continue;
          entries.push({
            url: `${baseUrl}/activity/${date}-${eventShortId(event.id)}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.6,
          });
        }
      }
    } catch {
      // 略過無法解析的資料檔
    }
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }

  const regionSlugs = getAllRegionSlugs();
  const giftSlugs = getAllGiftSlugs();
  const citySlugs = getAllCitySlugs();
  const orgSlugs = getAllOrgSlugs();
  const newsArticles = getAllNews();

  const regionPages: MetadataRoute.Sitemap = regionSlugs.map((slug) => ({
    url: `${baseUrl}/region/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const giftPages: MetadataRoute.Sitemap = giftSlugs.map((slug) => ({
    url: `${baseUrl}/gift/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = citySlugs.map((slug) => ({
    url: `${baseUrl}/city/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.75,
  }));

  const orgPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/organization`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    ...orgSlugs.map((slug) => ({
      url: `${baseUrl}/organization/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
  ];

  const newsPages: MetadataRoute.Sitemap = newsArticles.map((article) => ({
    url: `${baseUrl}/news/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "never",
    priority: 0.8,
  }));

  const activityPages = await getActivitySitemapEntries(baseUrl);

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/2026`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/recent`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/calendar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/news`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/record`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/eligibility`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/donate`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...regionPages,
    ...cityPages,
    ...orgPages,
    ...giftPages,
    ...newsPages,
    ...activityPages,
  ];
}
