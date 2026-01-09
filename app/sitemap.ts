import { MetadataRoute } from "next";
import { getAllRegionSlugs } from "@/lib/regionConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }

  const regionSlugs = getAllRegionSlugs();

  // Generate sitemap entries for all region pages
  const regionPages: MetadataRoute.Sitemap = regionSlugs.map((slug) => ({
    url: `${baseUrl}/region/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    // Region pages
    ...regionPages,
  ];
}
