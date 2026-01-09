/**
 * Region configuration for blood donation location pages.
 * Each region corresponds to a blood donation center jurisdiction.
 */

export interface RegionConfig {
  slug: string;
  name: string;
  displayName: string; // 用於 UI 顯示的名稱
  title: string;
  description: string;
  keywords: string[];
  // Filter by center field (exact match)
  centerFilter: string;
}

export const REGIONS: RegionConfig[] = [
  {
    slug: "north",
    name: "台北",
    displayName: "北區",
    title: "北區捐血活動 | 台北、新北、基隆、宜蘭、花蓮捐血地點查詢",
    description:
      "台北捐血中心轄區最新捐血活動。包含台北市、新北市、基隆市、宜蘭縣、花蓮縣捐血車與捐血室資訊。",
    keywords: [
      "台北捐血",
      "新北捐血",
      "基隆捐血",
      "宜蘭捐血",
      "花蓮捐血",
      "北區捐血",
    ],
    centerFilter: "台北",
  },
  {
    slug: "hsinchu",
    name: "新竹",
    displayName: "桃竹苗",
    title: "桃竹苗捐血活動 | 桃園、新竹、苗栗捐血地點查詢",
    description:
      "新竹捐血中心轄區最新捐血活動。包含桃園市、新竹市、新竹縣、苗栗縣捐血車與捐血室資訊。",
    keywords: ["新竹捐血", "桃園捐血", "苗栗捐血", "桃竹苗捐血", "新竹捐血車"],
    centerFilter: "新竹",
  },
  {
    slug: "central",
    name: "台中",
    displayName: "中區",
    title: "中區捐血活動 | 台中、彰化、南投捐血地點查詢",
    description:
      "台中捐血中心轄區最新捐血活動。包含台中市、彰化縣、南投縣捐血車與捐血室資訊。",
    keywords: ["台中捐血", "彰化捐血", "南投捐血", "中區捐血", "台中捐血車"],
    centerFilter: "台中",
  },
  {
    slug: "south",
    name: "高雄",
    displayName: "南區",
    title: "南區捐血活動 | 高雄、台南、嘉義、屏東捐血地點查詢",
    description:
      "高雄捐血中心轄區最新捐血活動。包含高雄市、台南市、嘉義縣市、屏東縣捐血車與捐血室資訊。",
    keywords: ["高雄捐血", "台南捐血", "嘉義捐血", "屏東捐血", "南區捐血"],
    centerFilter: "高雄",
  },
];

/**
 * Get region config by slug
 */
export function getRegionBySlug(slug: string): RegionConfig | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

/**
 * Get region config by center name
 */
export function getRegionByCenter(
  centerName: string
): RegionConfig | undefined {
  return REGIONS.find((r) => r.centerFilter === centerName);
}

/**
 * Get all region slugs for static params
 */
export function getAllRegionSlugs(): string[] {
  return REGIONS.map((r) => r.slug);
}
