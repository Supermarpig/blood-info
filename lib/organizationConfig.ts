export interface OrgConfig {
  slug: string;
  displayName: string;
  /** 只要 event.organization 包含任一關鍵字即符合 */
  keywords: string[];
  category: "lions" | "charity" | "company" | "temple" | "blood-center";
  title: string;
  description: string;
  intro: string;
}

export const ORGANIZATIONS: OrgConfig[] = [
  // ── 獅子會（Lions Club） ─────────────────────────────────────────
  {
    slug: "lions-club",
    displayName: "獅子會",
    keywords: ["獅子會"],
    category: "lions",
    title: "獅子會捐血活動查詢｜全台國際獅子會近期捐血車地點",
    description:
      "查詢全台國際獅子會主辦的捐血活動，包含桃園、台中、南投、花蓮等各分區獅子會近期捐血車出車時間與地點。獅子會是台灣最活躍的捐血推廣團體之一，每月舉辦數十場熱血行動。",
    intro:
      "本頁彙整全台各地獅子會分會主辦的捐血活動，每場均顯示出車地點、開放時間與主辦單位。若您是獅子會成員或想追蹤所在地獅子會的捐血日程，可直接在下方查詢。",
  },
  {
    slug: "fuwei-lions",
    displayName: "富偉獅子會",
    keywords: ["富偉獅子會"],
    category: "lions",
    title: "富偉獅子會捐血活動｜近期捐血車出車時間與地點",
    description:
      "富偉獅子會（南投）捐血活動查詢，為南投地區最積極推動捐血的獅子會分會之一，每年主辦逾百場捐血活動，遍及南投縣各鄉鎮。",
    intro:
      "富偉獅子會長年深耕南投縣捐血推廣，是全台主辦捐血場次最多的獅子會分會之一。本頁即時更新富偉獅子會近期出車地點與開放時間。",
  },
  {
    slug: "taoyuan-ciwen-lions",
    displayName: "桃園市慈文獅子會",
    keywords: ["桃園市慈文獅子會"],
    category: "lions",
    title: "桃園市慈文獅子會捐血活動｜近期捐血車查詢",
    description:
      "桃園市慈文獅子會主辦捐血活動查詢，慈文獅子會長年在桃園市各區推廣捐血，每年舉辦數十場捐血車活動，是桃園地區最具代表性的獅子會捐血推廣單位。",
    intro:
      "桃園市慈文獅子會積極推動桃園地區捐血，本頁即時整理該會近期主辦的捐血活動，方便會員與熱血市民快速查詢出車時間。",
  },
  {
    slug: "taoyuan-lantian-lions",
    displayName: "桃園市藍天獅子會",
    keywords: ["桃園市藍天獅子會"],
    category: "lions",
    title: "桃園市藍天獅子會捐血活動｜近期捐血車查詢",
    description:
      "桃園市藍天獅子會捐血活動查詢，藍天獅子會長期在桃園市舉辦熱血推廣活動，出車頻率高、地點遍及桃園各行政區。",
    intro:
      "桃園市藍天獅子會是桃園主要捐血推廣分會之一，本頁即時更新該會近期捐血活動資訊。",
  },
  {
    slug: "taoyuan-shouxu-lions",
    displayName: "桃園市首席獅子會",
    keywords: ["桃園市首席獅子會"],
    category: "lions",
    title: "桃園市首席獅子會捐血活動｜近期捐血車查詢",
    description:
      "桃園市首席獅子會主辦捐血活動查詢，首席獅子會在桃園市積極推廣捐血，每年活動場次穩定，是桃園獅子會中捐血最踴躍的分會之一。",
    intro:
      "桃園市首席獅子會持續推動桃園地區捐血，本頁提供該會近期捐血車出車地點與時間查詢。",
  },
  {
    slug: "taoyuan-chenggong-lions",
    displayName: "桃園市成功獅子會",
    keywords: ["桃園市成功獅子會"],
    category: "lions",
    title: "桃園市成功獅子會捐血活動｜近期捐血車查詢",
    description:
      "桃園市成功獅子會捐血活動查詢，成功獅子會長年在桃園地區推廣捐血，出車地點遍及桃園各區。",
    intro:
      "桃園市成功獅子會持續服務桃園市民，本頁即時更新該會近期捐血活動。",
  },
  {
    slug: "taichung-wufu-lions",
    displayName: "台中五福獅子會",
    keywords: ["台中五福獅子會"],
    category: "lions",
    title: "台中五福獅子會捐血活動｜近期捐血車查詢",
    description:
      "台中五福獅子會捐血活動查詢，五福獅子會為台中地區捐血推廣的重要力量，每年在台中市各區舉辦多場捐血活動。",
    intro:
      "台中五福獅子會積極推動台中地區捐血，本頁整理該會近期主辦的捐血車活動資訊。",
  },
  {
    slug: "dafang-lions",
    displayName: "大方獅子會",
    keywords: ["大方獅子會"],
    category: "lions",
    title: "大方獅子會捐血活動｜近期捐血車查詢",
    description:
      "大方獅子會捐血活動查詢，大方獅子會每年舉辦多場捐血推廣活動，是中部地區活躍的獅子會分會。",
    intro:
      "大方獅子會持續推動捐血公益，本頁即時更新該會近期捐血活動地點與時間。",
  },
  {
    slug: "hualien-lions",
    displayName: "花蓮獅子會",
    keywords: ["花蓮縣第一獅子會", "花蓮龍吟獅子會", "花蓮晶英獅子會"],
    category: "lions",
    title: "花蓮獅子會捐血活動｜近期捐血車查詢",
    description:
      "花蓮縣各獅子會分會（花蓮縣第一獅子會、花蓮龍吟獅子會、花蓮晶英獅子會）捐血活動查詢，花蓮獅子會每年在花蓮縣各地推廣捐血，推動東部熱血行動。",
    intro:
      "花蓮縣各獅子會分會積極推廣花蓮地區捐血，本頁整理花蓮各獅子會近期主辦的捐血活動。",
  },
  {
    slug: "lions-300e2",
    displayName: "國際獅子會300E2區",
    keywords: ["300E2區捐血委員會", "300E2區一心獅子會", "國際獅子會300E2"],
    category: "lions",
    title: "國際獅子會300E2區捐血活動｜近期捐血車查詢",
    description:
      "國際獅子會300E2區捐血委員會主辦捐血活動查詢，300E2區長期推動新竹、苗栗地區捐血，每年活動場次穩定且踴躍。",
    intro:
      "國際獅子會300E2區捐血委員會在新竹苗栗地區積極推廣捐血，本頁即時整理該區近期捐血活動。",
  },
  {
    slug: "hsinchu-guanghui-lions",
    displayName: "新竹市光輝獅子會",
    keywords: ["新竹市光輝獅子會"],
    category: "lions",
    title: "新竹市光輝獅子會捐血活動｜近期捐血車查詢",
    description:
      "新竹市光輝獅子會捐血活動查詢，光輝獅子會長年在新竹市推廣捐血，每年舉辦多場捐血車活動。",
    intro:
      "新竹市光輝獅子會持續為新竹地區捐血推廣服務，本頁提供近期捐血車出車資訊。",
  },
  {
    slug: "chunyu-lions",
    displayName: "春雨獅子會",
    keywords: ["春雨獅子會"],
    category: "lions",
    title: "春雨獅子會捐血活動｜近期捐血車查詢",
    description:
      "春雨獅子會捐血活動查詢，春雨獅子會每年舉辦多場捐血推廣活動，是中南部地區活躍的獅子會分會。",
    intro:
      "春雨獅子會持續推動捐血公益，本頁即時整理近期捐血活動地點與時間。",
  },

  // ── 慈善團體 ─────────────────────────────────────────────────────
  {
    slug: "zinan-gong",
    displayName: "紫南宮",
    keywords: ["紫南宮"],
    category: "temple",
    title: "紫南宮捐血活動查詢｜南投社寮紫南宮近期捐血時間",
    description:
      "南投縣竹山鎮社寮紫南宮捐血活動查詢，紫南宮長年結合進香活動舉辦大型捐血活動，每次出車均吸引大批信眾共襄盛舉，是台灣廟宇辦捐血最具規模的代表之一。",
    intro:
      "紫南宮（土地公廟）位於南投縣竹山鎮，以積極推動捐血公益聞名，每年定期舉辦多場捐血活動，吸引南投及全台民眾前往捐血。本頁即時更新紫南宮近期捐血時間與地點。",
  },
  {
    slug: "xizhi-blood-donors",
    displayName: "汐止捐血人協會",
    keywords: ["汐止捐血人協會"],
    category: "charity",
    title: "汐止捐血人協會捐血活動查詢｜近期捐血時間",
    description:
      "汐止捐血人協會主辦捐血活動查詢，協會長年推動新北市汐止區捐血，每年舉辦多場捐血車活動，是汐止地區最重要的捐血推廣民間團體。",
    intro:
      "汐止捐血人協會深耕汐止地區捐血推廣，本頁整理協會近期主辦的捐血活動時間與地點。",
  },
  {
    slug: "zhonghua-blood-donors",
    displayName: "中華捐血人協會",
    keywords: ["中華捐血人協會"],
    category: "charity",
    title: "中華捐血人協會捐血活動查詢｜近期捐血時間",
    description:
      "中華捐血人協會主辦捐血活動查詢，中華捐血人協會是全國性捐血推廣民間組織，每年在各縣市舉辦多場捐血活動。",
    intro:
      "中華捐血人協會積極在全台推廣捐血，本頁整理該協會近期主辦的捐血活動資訊。",
  },

  // ── 企業贊助 ─────────────────────────────────────────────────────
  {
    slug: "sizzler",
    displayName: "西堤牛排",
    keywords: ["西堤牛排"],
    category: "company",
    title: "西堤牛排捐血活動查詢｜捐血贈西堤餐券優惠",
    description:
      "西堤牛排主辦捐血活動查詢，捐血送西堤餐券是最受歡迎的捐血贈品之一，本頁即時更新西堤牛排贊助的捐血活動時間與地點。",
    intro:
      "西堤牛排長年贊助捐血活動，以餐券做為捐血回饋，吸引大批民眾踴躍捐血。本頁整理西堤牛排相關捐血活動的最新資訊。",
  },
  {
    slug: "post-taichung",
    displayName: "中華郵政臺中郵局",
    keywords: ["中華郵政股份有限公司臺中郵局", "中華郵政股份有限公司台中郵局"],
    category: "company",
    title: "中華郵政臺中郵局捐血活動查詢｜近期捐血時間",
    description:
      "中華郵政臺中郵局主辦捐血活動查詢，臺中郵局每年定期舉辦員工及社區捐血活動，是台中地區主要的企業捐血推廣單位。",
    intro:
      "中華郵政臺中郵局積極推動台中地區捐血公益，本頁整理近期主辦的捐血活動資訊。",
  },
  {
    slug: "post-kaohsiung",
    displayName: "高雄郵局",
    keywords: ["高雄郵局"],
    category: "company",
    title: "高雄郵局捐血活動查詢｜近期捐血時間",
    description:
      "高雄郵局主辦捐血活動查詢，高雄郵局每年定期舉辦捐血活動，是高雄地區主要的企業捐血推廣單位之一。",
    intro:
      "高雄郵局積極推動南部地區捐血公益，本頁整理近期主辦的捐血活動資訊。",
  },
];

export function getAllOrgSlugs(): string[] {
  return ORGANIZATIONS.map((o) => o.slug);
}

export function getOrgBySlug(slug: string): OrgConfig | undefined {
  return ORGANIZATIONS.find((o) => o.slug === slug);
}

export function getLionsOrgs(): OrgConfig[] {
  return ORGANIZATIONS.filter((o) => o.category === "lions");
}
