import { MetadataRoute } from "next";
import { getAllRegionSlugs } from "@/lib/regionConfig";
import { getAllGiftSlugs } from "@/lib/giftConfig";
import { getAllCitySlugs } from "@/lib/cityConfig";
import { getAllNews } from "@/lib/newsUtils";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }

  const regionSlugs = getAllRegionSlugs();
  const giftSlugs = getAllGiftSlugs();
  const citySlugs = getAllCitySlugs();
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

  const newsPages: MetadataRoute.Sitemap = newsArticles.map((article) => ({
    url: `${baseUrl}/news/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "never",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
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
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...regionPages,
    ...cityPages,
    ...giftPages,
    ...newsPages,
  ];
}
