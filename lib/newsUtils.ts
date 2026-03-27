import fs from "fs";
import path from "path";

export interface NewsSection {
  id: string;
  heading: string;
  content: string;
}

export interface NewsSource {
  text: string;
  url: string;
}

export interface NewsArticle {
  slug: string;
  title: string;
  date: string;
  author?: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  sections: NewsSection[];
  sources: NewsSource[];
}

const NEWS_DIR = path.join(process.cwd(), "content/news");

export function getAllNews(): NewsArticle[] {
  if (!fs.existsSync(NEWS_DIR)) return [];

  const files = fs
    .readdirSync(NEWS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse(); // 最新的排前面

  return files.map((file) => {
    const content = fs.readFileSync(path.join(NEWS_DIR, file), "utf-8");
    return JSON.parse(content) as NewsArticle;
  });
}

export function getNewsBySlug(slug: string): NewsArticle | undefined {
  return getAllNews().find((a) => a.slug === slug);
}

export function getAllNewsSlugs(): string[] {
  return getAllNews().map((a) => a.slug);
}
