/**
 * 回報地址的共用規則。
 *
 * 由來：公開回報表單原本只有一個自由輸入的「地址」欄位，門檻是 2 個字，
 * 結果大量回報只寫「台北」「台中」——這種回報標不到地圖上，也回答不了
 * 「到底哪裡有捐血車」，等於沒有回報。
 *
 * 這份規則同時被表單（components/AddDonationEventModal.tsx）與
 * /api/reports 使用：只擋前端的話，舊快取的 JS 或直接打 API 還是進得來。
 */

/** 縣市下拉選單的選項，由北到南排（使用者找自己的縣市時比筆畫序快）。 */
export const TAIWAN_CITIES = [
  "基隆市",
  "台北市",
  "新北市",
  "桃園市",
  "新竹市",
  "新竹縣",
  "苗栗縣",
  "台中市",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義市",
  "嘉義縣",
  "台南市",
  "高雄市",
  "屏東縣",
  "宜蘭縣",
  "花蓮縣",
  "台東縣",
  "澎湖縣",
  "金門縣",
  "連江縣",
] as const;

/** 「臺」「台」與空白一律正規化，比對才不會因為寫法不同漏判。 */
function normalize(value: string): string {
  return value.replace(/臺/g, "台").replace(/\s+/g, "");
}

/** 只有縣市名（含省略「市／縣」的寫法）的集合，例如「台北」「台北市」「新北」。 */
const CITY_ONLY_TOKENS = new Set(
  TAIWAN_CITIES.flatMap((city) => {
    const normalized = normalize(city);
    return [normalized, normalized.replace(/[市縣]$/, "")];
  })
);

/**
 * 地址裡至少要出現一個「找得到路」的線索：行政區、路名門牌，或講得出名字的地標。
 * 寧可放寬也不要把真的有效的回報擋掉——「板橋國小」「西勢廣興宮」都算數。
 */
const PLACE_HINTS = [
  // 行政區
  "區", "鄉", "鎮",
  // 路名門牌
  "路", "街", "巷", "弄", "號", "大道",
  // 地標
  "宮", "廟", "寺", "堂", "教會", "國小", "國中", "高中", "高工", "高商", "大學",
  "學校", "中心", "公所", "醫院", "診所", "衛生所", "廣場", "公園", "車站", "捷運",
  "市場", "里民", "會館", "大樓", "百貨", "商場", "園區", "分局", "消防", "農會",
  "郵局", "圖書館", "體育館", "停車場", "捐血", "公司", "工廠", "營區", "教堂",
];

export type AddressIssueCode = "empty" | "too-short" | "city-only" | "no-place-hint";

/**
 * 檢查「縣市之後的那段地址」。通過回 null，否則回可以直接顯示給使用者的訊息。
 * 訊息一律附上正確示範，因為使用者需要的是「該怎麼寫」而不是「你寫錯了」。
 */
export function checkAddressDetail(
  raw: string
): { code: AddressIssueCode; message: string } | null {
  const value = normalize(raw || "");

  if (!value) {
    return { code: "empty", message: "請填寫地址或地點名稱" };
  }
  if (CITY_ONLY_TOKENS.has(value)) {
    return {
      code: "city-only",
      message: "這只是縣市名，請補上區和路名，例如：板橋區中山路一段152號",
    };
  }
  if (value.length < 4) {
    return {
      code: "too-short",
      message: "請再寫詳細一點（至少 4 個字），例如：板橋區中山路一段152號",
    };
  }
  if (!PLACE_HINTS.some((hint) => value.includes(hint))) {
    return {
      code: "no-place-hint",
      message: "看不出是哪裡，請寫到路名門牌或地標名，例如：板橋區中山路一段152號、板橋國小",
    };
  }
  return null;
}

/**
 * 把縣市與詳細地址組成送出的完整地址。
 * 使用者常會選了縣市又自己再打一次，所以開頭重複的縣市要吃掉，
 * 否則會產生「新北市新北市板橋區…」這種地址（geocode 會直接失敗）。
 */
export function composeAddress(city: string, detail: string): string {
  const cleanCity = (city || "").trim();
  const cleanDetail = (detail || "").trim();
  if (!cleanCity) return cleanDetail;

  const normalizedCity = normalize(cleanCity);
  const shortCity = normalizedCity.replace(/[市縣]$/, "");
  const normalizedDetail = normalize(cleanDetail);

  for (const prefix of [normalizedCity, shortCity]) {
    if (normalizedDetail.startsWith(prefix)) {
      // 使用者已經自己打了縣市，尊重他寫的那份（含「臺」的寫法）
      return cleanDetail;
    }
  }
  return `${cleanCity}${cleanDetail}`;
}

/**
 * 反向操作：把完整地址拆成 { 縣市, 其餘 }。
 * 給「反向地理編碼帶回的地址」與「已知捐血地點清單」共用——兩者都是完整地址，
 * 但表單是縣市下拉 + 詳細地址兩欄，得先拆開才能填進去。
 * 找不到縣市時 city 回空字串，讓使用者自己選。
 */
export function splitCityFromAddress(address: string): {
  city: string;
  detail: string;
} {
  // Google 會回「100台灣台北市…」這種前綴（郵遞區號、國名，順序不固定），先剝乾淨
  let clean = (address || "").trim();
  let previous = "";
  while (clean !== previous) {
    previous = clean;
    clean = clean.replace(/^\d{3,6}/, "").replace(/^(台灣|臺灣)/, "").trim();
  }

  // 只做「臺→台」的 1:1 置換來比對，長度不變，才能安全地用 slice 切
  const comparable = clean.replace(/臺/g, "台");

  // 先比對完整縣市名，再比對省略「市／縣」的簡稱。
  // 順序不能顛倒：「新竹縣竹北市…」若先用簡稱比，會先撞到「新竹市」。
  for (const city of TAIWAN_CITIES) {
    if (comparable.startsWith(city)) {
      return { city, detail: clean.slice(city.length).trim() };
    }
  }
  for (const city of TAIWAN_CITIES) {
    const short = city.replace(/[市縣]$/, "");
    if (comparable.startsWith(short)) {
      return { city, detail: clean.slice(short.length).trim() };
    }
  }
  return { city: "", detail: clean };
}

/**
 * 伺服端用：檢查送進來的完整地址夠不夠具體（表單以外的來源也會走這裡）。
 * 通過回 null，否則回錯誤訊息。
 */
export function checkFullAddress(raw: string): string | null {
  const value = (raw || "").trim();
  if (!value) return "請填寫地址";
  const normalized = normalize(value);

  if (CITY_ONLY_TOKENS.has(normalized)) {
    return "地址只有縣市名，請補上區和路名，例如：新北市板橋區中山路一段152號";
  }
  if (normalized.length < 6) {
    return "地址太簡短，請寫到區與路名，例如：新北市板橋區中山路一段152號";
  }
  if (!PLACE_HINTS.some((hint) => normalized.includes(hint))) {
    return "地址看不出是哪裡，請寫到路名門牌或地標名，例如：新北市板橋區中山路一段152號";
  }
  return null;
}
