import { MetadataRoute } from "next";
import { getAllRegionSlugs } from "@/lib/regionConfig";
import { getAllGiftSlugs } from "@/lib/giftConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }

  const regionSlugs = getAllRegionSlugs();
  const giftSlugs = getAllGiftSlugs();

  // Generate sitemap entries for all region pages
  const regionPages: MetadataRoute.Sitemap = regionSlugs.map((slug) => ({
    url: `${baseUrl}/region/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Generate sitemap entries for all gift pages
  const giftPages: MetadataRoute.Sitemap = giftSlugs.map((slug) => ({
    url: `${baseUrl}/gift/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    // FAQ page
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    // Calendar page
    {
      url: `${baseUrl}/calendar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    // Region pages
    ...regionPages,
    // Gift pages
    ...giftPages,
  ];
}
