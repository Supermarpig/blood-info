/**
 * City-level configuration for blood donation pages.
 * Each city filters events by center + location keywords.
 */

export interface CityConfig {
  slug: string;
  displayName: string;
  centerFilter: string; // matches event.center
  locationKeywords: string[]; // any of these must appear in event.location
  title: string;
  description: string;
  keywords: string[];
  intro: string;
  regionSlug: string; // parent region
}

export const CITIES: CityConfig[] = [
  // 台北捐血中心轄區
  {
    slug: "taipei",
    displayName: "台北市",
    centerFilter: "台北",
    locationKeywords: ["台北市", "臺北市", "台北內湖", "台北小巨蛋"],
    title: "台北市捐血活動 | 今日台北捐血車地點查詢",
    description:
      "查詢台北市今日捐血活動地點與時間。台北市捐血車、捐血站即時資訊，涵蓋信義區、大安區、中山區、松山區、內湖區等各區。",
    keywords: [
      "台北市捐血",
      "台北捐血活動",
      "台北捐血車",
      "台北捐血站",
      "台北今日捐血",
      "台北哪裡捐血",
    ],
    intro:
      "本頁即時整理台北市的捐血活動，包含台北市各區捐血車出車地點與固定捐血站開放時間。查詢今天台北市哪裡有捐血車、捐血贈品資訊，快速找到最近的台北捐血地點。",
    regionSlug: "north",
  },
  {
    slug: "new-taipei",
    displayName: "新北市",
    centerFilter: "台北",
    locationKeywords: ["新北市", "新北三重", "新北中和", "新北土城", "新北新埔", "新北新店", "新北新莊", "新北板橋", "新北林口"],
    title: "新北市捐血活動 | 今日新北捐血車地點查詢",
    description:
      "查詢新北市今日捐血活動地點與時間。新北市捐血車、捐血站即時資訊，涵蓋板橋、新莊、中和、新店、三重、林口等各區。",
    keywords: [
      "新北市捐血",
      "新北捐血活動",
      "新北捐血車",
      "新北捐血站",
      "板橋捐血",
      "新莊捐血",
      "新北捐血活動查詢",
    ],
    intro:
      "本頁即時整理新北市的捐血活動，包含板橋、新莊、中和、新店、三重、林口等各區捐血車出車地點與固定捐血站。查詢今天新北市哪裡有捐血車，快速找到最近的新北捐血地點。",
    regionSlug: "north",
  },
  {
    slug: "keelung",
    displayName: "基隆市",
    centerFilter: "台北",
    locationKeywords: ["基隆市", "基隆"],
    title: "基隆市捐血活動 | 今日基隆捐血車地點查詢",
    description:
      "查詢基隆市今日捐血活動地點與時間。基隆市捐血車、捐血站即時資訊。",
    keywords: ["基隆捐血", "基隆捐血活動", "基隆捐血車", "基隆捐血站"],
    intro:
      "本頁即時整理基隆市的捐血活動，包含基隆市各區捐血車出車地點與固定捐血站。查詢今天基隆哪裡有捐血車，快速找到最近的基隆捐血地點。",
    regionSlug: "north",
  },
  {
    slug: "yilan",
    displayName: "宜蘭縣",
    centerFilter: "台北",
    locationKeywords: ["宜蘭縣", "宜蘭市", "宜蘭"],
    title: "宜蘭縣捐血活動 | 今日宜蘭捐血車地點查詢",
    description:
      "查詢宜蘭縣今日捐血活動地點與時間。宜蘭縣捐血車、捐血站即時資訊，涵蓋宜蘭市、羅東鎮等地區。",
    keywords: ["宜蘭捐血", "宜蘭捐血活動", "宜蘭捐血車", "羅東捐血"],
    intro:
      "本頁即時整理宜蘭縣的捐血活動，包含宜蘭市、羅東鎮等地捐血車出車地點與固定捐血站。查詢今天宜蘭哪裡有捐血車，快速找到最近的宜蘭捐血地點。",
    regionSlug: "north",
  },
  {
    slug: "hualien",
    displayName: "花蓮縣",
    centerFilter: "台北",
    locationKeywords: ["花蓮縣", "花蓮市", "花蓮"],
    title: "花蓮縣捐血活動 | 今日花蓮捐血車地點查詢",
    description:
      "查詢花蓮縣今日捐血活動地點與時間。花蓮縣捐血車、捐血站即時資訊。",
    keywords: ["花蓮捐血", "花蓮捐血活動", "花蓮捐血車", "花蓮捐血站"],
    intro:
      "本頁即時整理花蓮縣的捐血活動，包含花蓮市、吉安鄉等地捐血車出車地點與固定捐血站。查詢今天花蓮哪裡有捐血車，快速找到最近的花蓮捐血地點。",
    regionSlug: "north",
  },
  // 新竹捐血中心轄區
  {
    slug: "taoyuan",
    displayName: "桃園市",
    centerFilter: "新竹",
    locationKeywords: ["桃園市", "桃園"],
    title: "桃園市捐血活動 | 今日桃園捐血車地點查詢",
    description:
      "查詢桃園市今日捐血活動地點與時間。桃園市捐血車、捐血站即時資訊，涵蓋桃園區、中壢區、平鎮區等各區。",
    keywords: ["桃園捐血", "桃園市捐血", "桃園捐血活動", "桃園捐血車", "中壢捐血"],
    intro:
      "本頁即時整理桃園市的捐血活動，包含桃園區、中壢區、平鎮區等各區捐血車出車地點與固定捐血站。查詢今天桃園哪裡有捐血車，快速找到最近的桃園捐血地點。",
    regionSlug: "hsinchu",
  },
  {
    slug: "hsinchu",
    displayName: "新竹市",
    centerFilter: "新竹",
    locationKeywords: ["新竹市", "新竹縣", "新竹"],
    title: "新竹市捐血活動 | 今日新竹捐血車地點查詢",
    description:
      "查詢新竹市今日捐血活動地點與時間。新竹市捐血車、捐血站即時資訊。",
    keywords: ["新竹捐血", "新竹市捐血", "新竹捐血活動", "新竹捐血車"],
    intro:
      "本頁即時整理新竹市的捐血活動，包含新竹市各區捐血車出車地點與固定捐血站。查詢今天新竹哪裡有捐血車，快速找到最近的新竹捐血地點。",
    regionSlug: "hsinchu",
  },
  // 台中捐血中心轄區
  {
    slug: "taichung",
    displayName: "台中市",
    centerFilter: "台中",
    locationKeywords: ["台中市", "臺中市", "台中"],
    title: "台中市捐血活動 | 今日台中捐血車地點查詢",
    description:
      "查詢台中市今日捐血活動地點與時間。台中市捐血車、捐血站即時資訊，涵蓋西屯區、北屯區、南屯區、豐原區等各區。",
    keywords: [
      "台中捐血",
      "台中市捐血",
      "台中捐血活動",
      "台中捐血車",
      "台中捐血站",
      "台中今日捐血",
    ],
    intro:
      "本頁即時整理台中市的捐血活動，包含西屯區、北屯區、南屯區、豐原區等各區捐血車出車地點與固定捐血站。查詢今天台中哪裡有捐血車，快速找到最近的台中捐血地點。",
    regionSlug: "central",
  },
  {
    slug: "changhua",
    displayName: "彰化縣",
    centerFilter: "台中",
    locationKeywords: ["彰化縣", "彰化"],
    title: "彰化縣捐血活動 | 今日彰化捐血車地點查詢",
    description:
      "查詢彰化縣今日捐血活動地點與時間。彰化縣捐血車、捐血站即時資訊。",
    keywords: ["彰化捐血", "彰化縣捐血", "彰化捐血活動", "彰化捐血車"],
    intro:
      "本頁即時整理彰化縣的捐血活動，包含彰化市、員林市等地捐血車出車地點與固定捐血站。查詢今天彰化哪裡有捐血車，快速找到最近的彰化捐血地點。",
    regionSlug: "central",
  },
  // 高雄捐血中心轄區
  {
    slug: "kaohsiung",
    displayName: "高雄市",
    centerFilter: "高雄",
    locationKeywords: ["高雄市", "高雄"],
    title: "高雄市捐血活動 | 今日高雄捐血車地點查詢",
    description:
      "查詢高雄市今日捐血活動地點與時間。高雄市捐血車、捐血站即時資訊，涵蓋三民區、苓雅區、左營區、鳳山區等各區。",
    keywords: [
      "高雄捐血",
      "高雄市捐血",
      "高雄捐血活動",
      "高雄捐血車",
      "高雄捐血站",
      "高雄今日捐血",
    ],
    intro:
      "本頁即時整理高雄市的捐血活動，包含三民區、苓雅區、左營區、鳳山區等各區捐血車出車地點與固定捐血站。查詢今天高雄哪裡有捐血車，快速找到最近的高雄捐血地點。",
    regionSlug: "south",
  },
  {
    slug: "tainan",
    displayName: "台南市",
    centerFilter: "高雄",
    locationKeywords: ["台南市", "臺南市", "台南"],
    title: "台南市捐血活動 | 今日台南捐血車地點查詢",
    description:
      "查詢台南市今日捐血活動地點與時間。台南市捐血車、捐血站即時資訊，涵蓋東區、北區、安南區、永康區等各區。",
    keywords: [
      "台南捐血",
      "台南市捐血",
      "台南捐血活動",
      "台南捐血車",
      "台南捐血站",
    ],
    intro:
      "本頁即時整理台南市的捐血活動，包含東區、北區、安南區、永康區等各區捐血車出車地點與固定捐血站。查詢今天台南哪裡有捐血車，快速找到最近的台南捐血地點。",
    regionSlug: "south",
  },
  {
    slug: "chiayi",
    displayName: "嘉義市",
    centerFilter: "高雄",
    locationKeywords: ["嘉義市", "嘉義縣", "嘉義"],
    title: "嘉義市捐血活動 | 今日嘉義捐血車地點查詢",
    description:
      "查詢嘉義市今日捐血活動地點與時間。嘉義市捐血車、捐血站即時資訊。",
    keywords: ["嘉義捐血", "嘉義市捐血", "嘉義捐血活動", "嘉義捐血車"],
    intro:
      "本頁即時整理嘉義市的捐血活動，包含嘉義市各區捐血車出車地點與固定捐血站。查詢今天嘉義哪裡有捐血車，快速找到最近的嘉義捐血地點。",
    regionSlug: "south",
  },
  {
    slug: "pingtung",
    displayName: "屏東縣",
    centerFilter: "高雄",
    locationKeywords: ["屏東縣", "屏東市", "屏東"],
    title: "屏東縣捐血活動 | 今日屏東捐血車地點查詢",
    description:
      "查詢屏東縣今日捐血活動地點與時間。屏東縣捐血車、捐血站即時資訊。",
    keywords: ["屏東捐血", "屏東縣捐血", "屏東捐血活動", "屏東捐血車"],
    intro:
      "本頁即時整理屏東縣的捐血活動，包含屏東市、東港鎮等地捐血車出車地點與固定捐血站。查詢今天屏東哪裡有捐血車，快速找到最近的屏東捐血地點。",
    regionSlug: "south",
  },
];

export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getAllCitySlugs(): string[] {
  return CITIES.map((c) => c.slug);
}
