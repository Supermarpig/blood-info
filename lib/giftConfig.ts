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
  intro: string; // 頁面靜態介紹段落，用於 SEO
}

export const GIFTS: GiftConfig[] = [
  {
    slug: "movie-ticket",
    name: "電影票",
    tagId: "電影票",
    title: "捐血送電影票 | 今日哪裡捐血有電影票？威秀、國賓活動查詢",
    description:
      "全台捐血送電影票活動即時查詢，包含威秀影城、國賓影城等知名影廳電影票贈品。今天哪裡捐血有電影票？查詢最新出車地點與時間，捐血做公益同時把握每一場好禮！",
    keywords: ["捐血送電影票", "捐血電影票", "威秀捐血", "捐血贈品電影票"],
    intro:
      "本頁整理全台捐血送電影票的活動資訊，包含威秀影城、國賓影城等電影票贈品。想捐血又想看電影？查詢今日哪裡捐血有電影票，把握每一場優惠活動！",
  },
  {
    slug: "voucher",
    name: "禮券",
    tagId: "禮券",
    title: "捐血送禮券 | 今日哪裡捐血有禮券？百貨、商品券活動查詢",
    description:
      "全台捐血送禮券活動即時查詢，涵蓋百貨公司禮券、商品券、消費禮券等多種贈品。今天哪裡捐血有禮券？查詢最新出車地點與時間，一邊做公益一邊領好禮！",
    keywords: ["捐血送禮券", "捐血禮券", "捐血贈品禮券", "禮券捐血"],
    intro:
      "本頁整理全台捐血送禮券的活動資訊，涵蓋百貨禮券、商品券等多種禮券贈品。查詢今日哪裡捐血有禮券，一邊做公益一邊領好禮！",
  },
  {
    slug: "convenience-store",
    name: "超商",
    tagId: "超商",
    title: "捐血送超商禮券 | 今日哪裡捐血有超商禮券？7-11、全家活動查詢",
    description:
      "全台捐血送超商禮券活動即時查詢，包含 7-ELEVEN、全家、萊爾富等超商禮券贈品。今天哪裡捐血有超商禮券？查詢最新出車地點，捐血後立即使用最實用的日常好禮！",
    keywords: ["捐血送超商", "捐血7-11", "捐血全家", "超商禮券捐血"],
    intro:
      "本頁整理全台捐血送超商禮券的活動資訊，包含 7-11、全家、萊爾富等超商禮券贈品。超商禮券是最實用的捐血贈品之一，查詢今日哪裡捐血有超商禮券！",
  },
  {
    slug: "food-beverage",
    name: "餐飲",
    tagId: "餐飲",
    title: "捐血送餐飲券 | 今日哪裡捐血有飲料、咖啡券？活動查詢",
    description:
      "全台捐血送餐飲券活動即時查詢，包含飲料兌換券、咖啡券、餐廳優惠券等多種餐飲贈品。今天哪裡捐血有餐飲優惠？查詢最新出車地點，捐血後直接享用美食！",
    keywords: ["捐血送飲料", "捐血送咖啡", "餐飲券捐血", "捐血餐飲優惠"],
    intro:
      "本頁整理全台捐血送餐飲券的活動資訊，包含飲料券、咖啡券、餐廳優惠券等多種餐飲贈品。查詢今日哪裡捐血有餐飲優惠，捐血後直接享用！",
  },
  {
    slug: "daily-necessities",
    name: "生活用品",
    tagId: "生活用品",
    title: "捐血送生活用品 | 今日哪裡捐血有衛生紙、洗衣精？活動查詢",
    description:
      "全台捐血送生活用品活動即時查詢，包含衛生紙、洗衣精、沐浴乳等實用日用品贈品。今天哪裡捐血有生活用品？查詢最新出車地點，做公益也能補充家中日常所需！",
    keywords: ["捐血送生活用品", "捐血贈品", "捐血日用品", "生活用品捐血"],
    intro:
      "本頁整理全台捐血送生活用品的活動資訊，包含衛生紙、洗衣精、沐浴乳等實用日用品贈品。查詢今日哪裡捐血有生活用品，做好事也能補充家中日常所需！",
  },
  {
    slug: "food",
    name: "食品",
    tagId: "食品",
    title: "捐血送食品 | 今日哪裡捐血有泡麵、零食？活動查詢",
    description:
      "全台捐血送食品活動即時查詢，包含泡麵、餅乾、零食、飲品等各式食品贈品。今天哪裡捐血有食品贈品？查詢最新出車地點，捐血做公益後帶點好吃的回家！",
    keywords: ["捐血送食品", "捐血送零食", "捐血食品", "食品捐血"],
    intro:
      "本頁整理全台捐血送食品的活動資訊，包含泡麵、餅乾、零食、飲品等各式食品贈品。查詢今日哪裡捐血有食品贈品，做公益同時帶點好吃的回家！",
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
