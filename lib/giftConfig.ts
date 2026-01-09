/**
 * Gift configuration for blood donation gift filter pages.
 * Each gift type has SEO-optimized metadata.
 */

export interface GiftConfig {
  slug: string;
  name: string;
  tagId: string; // 對應 data 中的 tag ID
  title: string;
  description: string;
  keywords: string[];
}

export const GIFTS: GiftConfig[] = [
  {
    slug: "movie-ticket",
    name: "電影票",
    tagId: "電影票",
    title: "電影票捐血活動 | 捐血送電影票地點查詢",
    description:
      "全台捐血送電影票活動一覽。查詢今日哪裡捐血有電影票、威秀影城、國賓影城等贈品資訊。",
    keywords: ["捐血送電影票", "捐血電影票", "威秀捐血", "捐血贈品電影票"],
  },
  {
    slug: "voucher",
    name: "禮券",
    tagId: "禮券",
    title: "禮券捐血活動 | 捐血送禮券地點查詢",
    description:
      "全台捐血送禮券活動一覽。查詢今日哪裡捐血有禮券、百貨禮券、商品券等贈品資訊。",
    keywords: ["捐血送禮券", "捐血禮券", "捐血贈品禮券", "禮券捐血"],
  },
  {
    slug: "convenience-store",
    name: "超商",
    tagId: "超商",
    title: "超商禮券捐血活動 | 捐血送超商禮券地點查詢",
    description:
      "全台捐血送超商禮券活動一覽。查詢今日哪裡捐血有 7-11、全家、萊爾富等超商禮券。",
    keywords: ["捐血送超商", "捐血7-11", "捐血全家", "超商禮券捐血"],
  },
  {
    slug: "food-beverage",
    name: "餐飲",
    tagId: "餐飲",
    title: "餐飲優惠捐血活動 | 捐血送餐飲券地點查詢",
    description:
      "全台捐血送餐飲券活動一覽。查詢今日哪裡捐血有飲料、咖啡、餐廳優惠券等贈品。",
    keywords: ["捐血送飲料", "捐血送咖啡", "餐飲券捐血", "捐血餐飲優惠"],
  },
  {
    slug: "daily-necessities",
    name: "生活用品",
    tagId: "生活用品",
    title: "生活用品捐血活動 | 捐血送生活用品地點查詢",
    description:
      "全台捐血送生活用品活動一覽。查詢今日哪裡捐血有衛生紙、洗衣精等日用品贈品。",
    keywords: ["捐血送生活用品", "捐血贈品", "捐血日用品", "生活用品捐血"],
  },
  {
    slug: "food",
    name: "食品",
    tagId: "食品",
    title: "食品捐血活動 | 捐血送食品地點查詢",
    description:
      "全台捐血送食品活動一覽。查詢今日哪裡捐血有泡麵、餅乾、零食等食品贈品。",
    keywords: ["捐血送食品", "捐血送零食", "捐血食品", "食品捐血"],
  },
];

/**
 * Get gift config by slug
 */
export function getGiftBySlug(slug: string): GiftConfig | undefined {
  return GIFTS.find((g) => g.slug === slug);
}

/**
 * Get gift config by tag ID
 */
export function getGiftByTagId(tagId: string): GiftConfig | undefined {
  return GIFTS.find((g) => g.tagId === tagId);
}

/**
 * Get all gift slugs for static params
 */
export function getAllGiftSlugs(): string[] {
  return GIFTS.map((g) => g.slug);
}
