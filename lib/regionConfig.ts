/**
 * Region configuration for blood donation location pages.
 * Each region corresponds to a blood donation center jurisdiction.
 */

export interface RegionFaq {
  question: string;
  answer: string;
}

export interface RegionConfig {
  slug: string;
  name: string;
  displayName: string; // 用於 UI 顯示的名稱
  title: string;
  description: string;
  keywords: string[];
  intro: string; // 頁面靜態介紹段落，用於 SEO
  faqs: RegionFaq[]; // 地區專屬 FAQ
  // Filter by center field (exact match)
  centerFilter: string;
}

export const REGIONS: RegionConfig[] = [
  {
    slug: "north",
    name: "台北",
    displayName: "北區",
    title: "北區捐血活動 | 台北、新北、基隆、宜蘭、花蓮捐血地點查詢",
    description: "台北捐血中心轄區最新捐血活動即時查詢，涵蓋台北市、新北市、基隆市、宜蘭縣、花蓮縣。查詢今天哪裡有捐血車、固定捐血站開放時間與捐血贈品，快速找到北區最近捐血地點！",
    keywords: [
      "台北捐血",
      "新北捐血",
      "新北捐血活動查詢",
      "台北捐血活動",
      "基隆捐血",
      "宜蘭捐血",
      "花蓮捐血",
      "北區捐血",
    ],
    centerFilter: "台北",
    intro:
      "本頁即時整理台北捐血中心轄區的捐血活動，涵蓋台北市、新北市、基隆市、宜蘭縣及花蓮縣。查詢今天哪裡有捐血車、捐血站開放時間與當期捐血贈品，快速找到附近北區捐血地點。",
    faqs: [
      {
        question: "台北哪裡有固定捐血站？",
        answer:
          "台北市設有台北捐血中心（中山北路二段一號）及各大醫院附設捐血室，提供固定時間的捐血服務。除固定地點外，每日也有多台捐血車在台北市各行政區、捷運站周邊及百貨賣場出車，可透過本頁查詢今日出車地點。",
      },
      {
        question: "今天新北市哪裡有捐血車？",
        answer:
          "新北市各區皆有捐血車定期出車，常見地點包括板橋、新莊、中和、新店、三重、林口等區的賣場、捷運站及社區活動中心。可直接在本頁活動列表查看今日新北捐血車的最新出車地點與時間。",
      },
      {
        question: "花蓮、宜蘭也有捐血車服務嗎？",
        answer:
          "有的，花蓮縣與宜蘭縣同屬台北捐血中心轄區，皆有定期安排捐血車出車。花蓮常見地點包括花蓮市遠東百貨、慈濟大學等；宜蘭常見地點包括宜蘭市公園附近及各大賣場。可透過本頁篩選查詢最新活動。",
      },
    ],
  },
  {
    slug: "hsinchu",
    name: "新竹",
    displayName: "桃竹苗",
    title: "桃竹苗捐血活動 | 桃園、新竹、苗栗捐血地點查詢",
    description:
      "新竹捐血中心轄區最新捐血活動即時查詢，涵蓋桃園市、新竹市、新竹縣、苗栗縣。查詢今天哪裡有捐血車、固定捐血站開放時間與捐血贈品，快速找到桃竹苗最近捐血地點！",
    keywords: ["新竹捐血", "桃園捐血", "苗栗捐血", "桃竹苗捐血", "新竹捐血車"],
    centerFilter: "新竹",
    intro:
      "本頁即時整理新竹捐血中心轄區的捐血活動，涵蓋桃園市、新竹市、新竹縣及苗栗縣。查詢今天哪裡有捐血車、捐血站開放時間與當期捐血贈品，快速找到附近桃竹苗捐血地點。",
    faqs: [
      {
        question: "桃園哪裡可以捐血？",
        answer:
          "桃園市各區皆有捐血車定期出車，常見地點包括桃園區、中壢區的大型賣場、火車站附近及社區活動中心。固定捐血室位於新竹捐血中心桃園服務站。可透過本頁查詢今日桃園捐血車的出車地點與時間。",
      },
      {
        question: "新竹捐血站在哪裡？",
        answer:
          "新竹捐血中心位於新竹市東區，提供固定時間的捐血服務。另有捐血車不定期在新竹市各大賣場、竹北市及新竹縣各鄉鎮出車。可透過本頁查詢今日新竹捐血活動的最新資訊。",
      },
      {
        question: "苗栗也有捐血車出車嗎？",
        answer:
          "是的，苗栗縣屬新竹捐血中心轄區，定期安排捐血車至苗栗市、頭份市等地出車。可透過本頁查詢苗栗地區的最新捐血活動時間與地點。",
      },
    ],
  },
  {
    slug: "central",
    name: "台中",
    displayName: "中區",
    title: "中區捐血活動 | 台中、彰化、南投捐血地點查詢",
    description:
      "台中捐血中心轄區最新捐血活動即時查詢，涵蓋台中市、彰化縣、南投縣。查詢今天哪裡有捐血車、固定捐血站開放時間與捐血贈品，快速找到中區最近捐血地點！",
    keywords: ["台中捐血", "彰化捐血", "南投捐血", "中區捐血", "台中捐血車"],
    centerFilter: "台中",
    intro:
      "本頁即時整理台中捐血中心轄區的捐血活動，涵蓋台中市、彰化縣及南投縣。查詢今天哪裡有捐血車、捐血站開放時間與當期捐血贈品，快速找到附近中區捐血地點。",
    faqs: [
      {
        question: "台中哪裡有固定捐血站？",
        answer:
          "台中捐血中心位於台中市西區，提供固定時間的捐血服務。另設有多個分站於各大醫院。捐血車則每日在台中市西屯、北屯、南屯、豐原等各區的大型賣場、捷運站及社區廣場出車，可透過本頁查詢今日台中捐血車出車地點。",
      },
      {
        question: "彰化、南投也有捐血車嗎？",
        answer:
          "是的，彰化縣與南投縣同屬台中捐血中心轄區，皆有定期安排捐血車出車。彰化常見地點包括彰化市、員林市的賣場與廣場；南投常見地點包括南投市及草屯鎮等地。可透過本頁查詢最新出車資訊。",
      },
      {
        question: "台中捐血車怎麼查詢今日地點？",
        answer:
          "直接在本頁活動列表即可查詢今日台中捐血車的出車地點、時間及當期贈品。資料每日更新，可搜尋特定行政區或機構名稱快速找到最近的捐血地點。",
      },
    ],
  },
  {
    slug: "south",
    name: "高雄",
    displayName: "南區",
    title: "南區捐血活動 | 高雄、台南、嘉義、屏東捐血地點查詢",
    description:
      "高雄捐血中心轄區最新捐血活動即時查詢，涵蓋高雄市、台南市、嘉義縣市、屏東縣。查詢今天哪裡有捐血車、固定捐血站開放時間與捐血贈品，快速找到南區最近捐血地點！",
    keywords: ["高雄捐血", "台南捐血", "嘉義捐血", "屏東捐血", "南區捐血"],
    centerFilter: "高雄",
    intro:
      "本頁即時整理高雄捐血中心轄區的捐血活動，涵蓋高雄市、台南市、嘉義縣市及屏東縣。查詢今天哪裡有捐血車、捐血站開放時間與當期捐血贈品，快速找到附近南區捐血地點。",
    faqs: [
      {
        question: "高雄哪裡有固定捐血站？",
        answer:
          "高雄捐血中心位於高雄市三民區，另設有鳳山、岡山等多個服務站提供固定捐血服務。捐血車則每日在高雄市各區的大型賣場、捷運站及社區廣場出車，可透過本頁查詢今日高雄捐血車出車地點與時間。",
      },
      {
        question: "台南、嘉義、屏東也有捐血車嗎？",
        answer:
          "是的，台南市、嘉義市、嘉義縣及屏東縣皆屬高雄捐血中心轄區，定期安排捐血車出車。台南常見地點包括東區、安南區等大型賣場；嘉義常見地點包括嘉義市東西區；屏東常見地點包括屏東市、東港等地。可透過本頁查詢最新活動資訊。",
      },
      {
        question: "高雄捐血贈品怎麼查？",
        answer:
          "每場高雄捐血活動的贈品資訊會顯示在本頁活動列表中。也可透過贈品分類頁面（如電影票、超商禮券等）篩選有特定贈品的捐血活動，再確認是否在高雄地區舉辦。",
      },
    ],
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
