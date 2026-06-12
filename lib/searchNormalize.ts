/**
 * 搜尋用文字正規化：統一「台/臺」並轉小寫，
 * 讓使用者輸入「台中」也能搜到資料中的「臺中市」。
 */
export const normalizeSearchText = (text: string): string =>
  text.toLowerCase().replace(/臺/g, "台");

const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 把關鍵字轉成 highlight 用的 RegExp：
 * 「台/臺」互通，其餘字元跳脫後做不分大小寫比對。
 */
export const buildKeywordRegex = (keyword: string): RegExp => {
  const pattern = keyword
    .split("")
    .map((ch) => (ch === "台" || ch === "臺" ? "[台臺]" : escapeRegExp(ch)))
    .join("");
  return new RegExp(`(${pattern})`, "gi");
};
