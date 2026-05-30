export const CP_SCORES: Record<string, number> = {
  // 神級 (5)
  "食品－龍蝦": 5,
  "餐飲－牛排": 5,
  "電影票－IMAX": 5,
  // 超值 (4)
  "食品－烤雞": 4,
  "電影票－威秀": 4,
  "電影票－國賓": 4,
  "電影票－秀泰": 4,
  "電影票－美麗華": 4,
  "電影票－in89": 4,
  "電影票－喜滿客": 4,
  "電影票－京站": 4,
  "禮券－百貨": 4,
  // 推薦 (3)
  "食品－雞腿": 3,
  "禮券－金聯": 3,
  "禮券－全聯": 3,
  "禮券－家樂福": 3,
  "超商－7-11": 3,
  "超商－全家": 3,
  "超商－萊爾富": 3,
  "超商－OK": 3,
  "超商－全聯": 3,
  "超商－家樂福": 3,
  "餐飲－星巴克": 3,
  "餐飲－路易莎": 3,
  // 普通 (2)
  "超商－美廉社": 2,
  "餐飲－麥當勞": 2,
  "餐飲－肯德基": 2,
  "餐飲－摩斯": 2,
  "餐飲－咖啡": 2,
  "餐飲－便當": 2,
  "餐飲－早餐": 2,
  "食品－米": 2,
  "食品－蛋": 2,
  "食品－蛋糕": 2,
  "食品－麵包": 2,
  "生活用品－保溫杯": 2,
  "生活用品－雨傘": 2,
  // 基本 (1)
  "餐飲－飲料": 1,
  "食品－泡麵": 1,
  "食品－餅乾": 1,
  "食品－零食": 1,
  "生活用品－衛生紙": 1,
  "生活用品－毛巾": 1,
  "生活用品－購物袋": 1,
  "生活用品－餐具": 1,
};

export const CP_LABELS: Record<number, string> = {
  5: "神級",
  4: "超值",
  3: "推薦",
  2: "普通",
};

export function getEventCpScore(subTags?: string[]): number {
  if (!subTags?.length) return 0;
  return Math.max(...subTags.map((tag) => CP_SCORES[tag] ?? 1));
}

export function getTopSubTag(subTags?: string[]): string | null {
  if (!subTags?.length) return null;
  return subTags.reduce((best, tag) =>
    (CP_SCORES[tag] ?? 0) > (CP_SCORES[best] ?? 0) ? tag : best
  );
}
