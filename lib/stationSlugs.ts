/**
 * 固定捐血點名稱 → URL slug 對照表，給 /blood-center/[slug] 捐血點詳情頁用。
 *
 * 為什麼用人工對照表而不是自動產生：
 * - 站名是中文，自動轉拼音需要第三方套件（專案原則：不加套件）。
 * - 中文直接當 URL 段在 OpenNext/Cloudflare 的靜態資產路徑上有編碼風險。
 * - 名錄總量只有 50 個左右且變動極少，人工維護成本可忽略；slug 一經發布
 *   就是被 Google 索引的 URL，人工控制反而避免上游資料改字導致網址漂移。
 *
 * 維護規則：
 * - key 必須與 lib/bloodCenters.ts 反推出的站名（或 fixedStationsSupplement 的 name）完全一致。
 * - slug 一律小寫英數與連字號；發布後**不可再改**（改了就是製造 404）。
 * - 新站名出現在名錄但不在此表時，名錄照常顯示、只是不出詳情頁連結，
 *   不會壞頁面；補上對照即可自動長出新頁。
 */

export const STATION_SLUGS: Record<string, string> = {
  // 台北捐血中心轄區（台北／新北／基隆／宜蘭／花蓮，來自人工補充名錄）
  "關渡捐血室": "guandu",
  "南海捐血室": "nanhai",
  "市府捐血室": "shifu",
  "長春捐血室": "changchun",
  "忠孝捐血室": "zhongxiao",
  "板橋捐血站": "banqiao",
  "府中捐血室": "fuzhong",
  "三重捐血室": "sanchong",
  "新店捐血室": "xindian",
  "樹林捐血室": "shulin",
  "汐止捐血室": "xizhi",
  "基隆捐血站": "keelung",
  "宜蘭捐血站": "yilan",
  "花蓮捐血站": "hualien",

  // 新竹捐血中心轄區
  "西大捐血室": "xida",
  "東興捐血室": "dongxing",
  "竹南捐血室": "zhunan",
  "頭份捐血室": "toufen",
  "苗栗捐血站": "miaoli",
  "桃園捐血站": "taoyuan",
  "中壢捐血室": "zhongli",
  "龍岡捐血室": "longgang",
  "南門捐血室": "nanmen",

  // 台中捐血中心轄區
  "中港捐血室": "zhonggang",
  "豐原捐血室": "fengyuan",
  "大里捐血室": "dali",
  "海線捐血室": "haixian",
  "中正公園捐血室": "zhongzheng-park",
  "彰化捐血站": "changhua",
  "員林捐血室": "yuanlin",
  "南投捐血室": "nantou",
  "埔里捐血站": "puli",
  "雲林捐血站": "yunlin",

  // 高雄捐血中心轄區（含台南、屏東、台東、澎湖）
  "左營捐血室": "zuoying",
  "楠梓捐血室": "nanzi",
  "前金捐血室": "qianjin",
  "三民捐血室": "sanmin",
  "九如捐血室": "jiuru",
  "五甲捐血室": "wujia",
  "捷運鳳山捐血室": "mrt-fengshan",
  "岡山捐血室": "gangshan",
  "小東捐血室": "xiaodong",
  "永福捐血室": "yongfu",
  "北安捐血室": "beian",
  "新營捐血室": "xinying",
  "嘉義捐血站": "chiayi",
  "垂楊捐血室": "chuiyang",
  "屏東捐血站": "pingtung",
  "台東捐血站": "taitung",
  "馬公捐血站": "magong",
};

const SLUG_TO_NAME = new Map(
  Object.entries(STATION_SLUGS).map(([name, slug]) => [slug, name])
);

/** 站名查 slug；不在對照表就回 null（呼叫端不要輸出連結） */
export function getStationSlug(name: string): string | null {
  return STATION_SLUGS[name] ?? null;
}

/** slug 反查站名；未知 slug 回 null（頁面回 404） */
export function getStationName(slug: string): string | null {
  return SLUG_TO_NAME.get(slug) ?? null;
}
