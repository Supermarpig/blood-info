/**
 * Region configuration for blood donation location pages.
 * Each region has SEO-optimized metadata and filter logic.
 */

export interface RegionConfig {
  slug: string;
  name: string;
  title: string;
  description: string;
  keywords: string[];
  // Filter by center field (exact match)
  centerFilter?: string;
  // Filter by location address (contains)
  locationKeywords?: string[];
}

export const REGIONS: RegionConfig[] = [
  {
    slug: "taipei",
    name: "台北",
    title: "台北捐血活動 | 大台北地區捐血車、捐血室地點查詢",
    description:
      "台北市、新北市最新捐血活動資訊。查詢今日捐血車、捐血室地點與贈品，包含板橋、新莊、三重等地區。",
    keywords: ["台北捐血", "新北捐血", "台北捐血車", "板橋捐血", "新莊捐血"],
    centerFilter: "台北",
  },
  {
    slug: "hsinchu",
    name: "新竹",
    title: "新竹捐血活動 | 桃園、新竹、苗栗捐血地點查詢",
    description:
      "新竹捐血中心轄區最新捐血活動。包含桃園市、新竹市、新竹縣、苗栗縣捐血車與捐血室資訊。",
    keywords: ["新竹捐血", "桃園捐血", "苗栗捐血", "新竹捐血車"],
    centerFilter: "新竹",
  },
  {
    slug: "taichung",
    name: "台中",
    title: "台中捐血活動 | 中部地區捐血車、捐血室地點查詢",
    description:
      "台中捐血中心轄區最新捐血活動。包含台中市、彰化縣、南投縣、雲林縣捐血車與捐血室資訊。",
    keywords: ["台中捐血", "彰化捐血", "南投捐血", "台中捐血車"],
    centerFilter: "台中",
  },
  {
    slug: "kaohsiung",
    name: "高雄",
    title: "高雄捐血活動 | 南部地區捐血車、捐血室地點查詢",
    description:
      "高雄捐血中心轄區最新捐血活動。包含高雄市、屏東縣、台東縣捐血車與捐血室資訊。",
    keywords: ["高雄捐血", "屏東捐血", "高雄捐血車", "鳳山捐血"],
    centerFilter: "高雄",
    // Exclude Tainan (handled separately)
    locationKeywords: ["高雄", "屏東", "臺東", "台東"],
  },
  {
    slug: "tainan",
    name: "台南",
    title: "台南捐血活動 | 台南市、嘉義捐血地點查詢",
    description:
      "台南市、嘉義縣市最新捐血活動資訊。查詢新營、永康、嘉義市捐血車與捐血室地點。",
    keywords: ["台南捐血", "嘉義捐血", "新營捐血", "永康捐血"],
    centerFilter: "高雄",
    locationKeywords: ["臺南", "台南", "嘉義"],
  },
  {
    slug: "yilan",
    name: "宜蘭",
    title: "宜蘭捐血活動 | 宜蘭縣捐血車、捐血室地點查詢",
    description:
      "宜蘭縣最新捐血活動資訊。查詢宜蘭市、羅東、蘇澳等地區捐血車與捐血室地點。",
    keywords: ["宜蘭捐血", "羅東捐血", "宜蘭捐血車"],
    centerFilter: "台北",
    locationKeywords: ["宜蘭"],
  },
  {
    slug: "hualien",
    name: "花蓮",
    title: "花蓮捐血活動 | 花蓮縣捐血車、捐血室地點查詢",
    description:
      "花蓮縣最新捐血活動資訊。查詢花蓮市捐血站與捐血車地點與贈品資訊。",
    keywords: ["花蓮捐血", "花蓮捐血車", "花蓮捐血站"],
    centerFilter: "台北",
    locationKeywords: ["花蓮"],
  },
];

/**
 * Get region config by slug
 */
export function getRegionBySlug(slug: string): RegionConfig | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

/**
 * Get all region slugs for static params
 */
export function getAllRegionSlugs(): string[] {
  return REGIONS.map((r) => r.slug);
}
