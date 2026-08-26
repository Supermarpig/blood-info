/**
 * 從既有的捐血活動資料裡，萃取出「固定捐血點」（捐血中心／捐血站／捐血室）名錄。
 *
 * 為什麼要有這支：GSC 實測「捐血中心」單一查詢就有 9,340 曝光，但站上沒有任何一頁
 * 在講固定捐血點，Google 只好拿首頁墊檔排在 7.6 名、CTR 僅 0.9%。這支把 /data 裡
 * 已經有的地址資料整理成名錄，讓 /blood-center 有真正對題的內容可以排。
 *
 * 資料來源限制（重要，不要在頁面上宣稱超出這個範圍的事）：
 * - 只涵蓋「近期有出現在活動資料裡」的固定捐血點，不是官方完整清單。
 * - center 欄位只有四種轄區（台北／新竹／台中／高雄），與台灣血液基金會官方的
 *   捐血中心劃分不一致，所以**不要宣稱捐血中心的總數或隸屬關係**。
 * - time 約有 15% 缺漏，缺漏時必須顯示「以現場公告為準」，不得推測。
 */

import { promises as fs } from "fs";
import path from "path";
import { CITIES, filterEventsByCity, type CityConfig } from "@/lib/cityConfig";
import {
  SUPPLEMENTAL_STATIONS,
  type SupplementalStation,
} from "@/lib/fixedStationsSupplement";

export interface StationEvent {
  location: string;
  time?: string;
  center?: string;
  coordinates?: { lat: number; lng: number } | null;
}

export interface FixedStation {
  /** 捐血點名稱，例：豐原捐血室（已去除內部代碼與括號） */
  name: string;
  /** 地址，例：臺中市豐原區北陽路2號 */
  address: string;
  /** 正規化後的縣市，例：台中市 */
  city: string;
  /** 對應 lib/cityConfig.ts 的 slug；找不到就是 null（頁面不要輸出連結） */
  citySlug: string | null;
  /** 轄區（台北／新竹／台中／高雄） */
  center: string | null;
  /** 出現最頻繁的服務時間；沒有資料就是 null */
  hours: string | null;
  coordinates: { lat: number; lng: number } | null;
  /** 這個點在資料裡出現過幾場，用來排序（常出現＝比較穩定的固定點） */
  sessionCount: number;
  /** 只有人工補充的名錄才有（官方公告的電話）；反推出來的沒有 */
  phone?: string;
}

/**
 * location 欄位的實際格式比想像髒，實測 87 個不重複字串裡有這些變體：
 *   地址(名稱)      臺中市豐原區北陽路2號(豐原捐血室)
 *   名稱(地址)      中壢捐血室(中壢區中央東路88號16樓)      ← 佔了快一半
 *   雙重括號        高雄市楠梓區高楠公路1837號((S71楠梓捐血室))
 *   巢狀括號        中正公園捐血室(中國附醫復健大樓(學士路91號)正對面)
 *   尾巴雜訊        雲林捐血站(斗六市漢口路187號) ～因颱風來襲延後辦理
 *   底線備註        苗栗縣苗栗市為公路282號(苗栗捐血站_現場另備有3台車)
 *   內含 tab        新竹市北區文雅街6號(西大捐血室\t)
 *   不是捐血點      宜蘭縣宜蘭市擺厘路16-7號(宜蘭捐血站旁)   ← 「旁」是地標，要排除
 * 所以改用括號配對掃描，不用單一正則硬解。
 */

/** 判斷一段文字本身就是捐血點名稱（必須以捐血中心／站／室結尾，「捐血站旁」不算） */
const IS_STATION_NAME = /捐血(?:中心|站|室)$/;

/** 名稱裡的內部代碼（D09、S75、S71…）與底線備註，對使用者沒有意義 */
const INTERNAL_CODE = /^[A-Za-z]{1,2}\d{1,3}/;

/** 從一串雜訊裡抓出結尾的正式名稱，例：新營民治議事廳對面玻璃屋D18新營捐血室 → 新營捐血室 */
const TRAILING_NAME = /([一-鿿]{2,5}捐血(?:中心|站|室))$/;

/** 地址至少要看得出是地址，否則寧可丟掉 */
const LOOKS_LIKE_ADDRESS = /[路街道巷弄段號]|[縣市區鎮鄉]/;

/**
 * 取出**所有**括號配對群組（處理巢狀），回傳每組的 before / inside。
 * 要全部而不是只取第一組，因為有這種資料：
 *   臺南市新營區中正路23-1號(新營民治議事廳對面玻璃屋)(D18新營捐血室)
 * 第一組是地標描述，第二組才是捐血點名稱。
 */
function splitParenGroups(s: string): { before: string; inside: string }[] {
  const groups: { before: string; inside: string }[] = [];
  let i = 0;
  while (i < s.length) {
    const open = s.slice(i).search(/[（(]/);
    if (open === -1) break;
    const start = i + open;

    let depth = 0;
    let end = -1;
    for (let j = start; j < s.length; j++) {
      const ch = s[j];
      if (ch === "(" || ch === "（") depth++;
      else if (ch === ")" || ch === "）") {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end === -1) break; // 括號沒收尾，剩下的不再解析

    groups.push({ before: s.slice(0, start), inside: s.slice(start + 1, end) });
    i = end + 1;
  }
  return groups;
}

/** 去掉代碼、底線備註、殘留括號，取出乾淨名稱 */
function cleanStationName(raw: string): string | null {
  let name = raw
    .split("_")[0]
    .replace(INTERNAL_CODE, "")
    // 資料裡偶爾把敘述句直接塞進來，例「配合南海捐血室」，去掉開頭的連接詞
    .replace(/^(?:配合|協辦|假|於|在|地點)/, "")
    .trim();
  // 名稱裡若還混著描述文字，抓結尾的正式名稱
  const trailing = name.match(TRAILING_NAME);
  if (trailing) name = trailing[1];
  name = name.replace(/[（()）]/g, "").trim();
  if (!name || !IS_STATION_NAME.test(name)) return null;
  return name;
}

/** 臺→台 之類的寫法差異，統一成搜尋量較大的寫法 */
function normalizeCityName(raw: string): string {
  return raw.replace(/^臺/, "台");
}

/**
 * 從地址開頭取縣市，例：臺中市豐原區北陽路2號 → 台中市
 *
 * 注意：只在地址真的以縣市開頭時才可信。像「頭份市仁愛路…」開頭的是鄉鎮市不是縣市，
 * 會取到「頭份市」這種不能拿來分組的值，所以呼叫端要優先用 cityConfig 反查的結果。
 */
export function extractCityName(address: string): string | null {
  const m = address.match(/^(.{2,3}?[縣市])/);
  return m ? normalizeCityName(m[1]) : null;
}

/**
 * 修掉資料裡重複的縣市前綴，例：
 * 桃園市桃園區桃園市文康街61號 → 桃園市桃園區文康街61號
 */
function normalizeAddress(address: string): string {
  return address.replace(/^(.{2,3}?[縣市])(.{0,4}?[區鄉鎮市])?\1/, "$1$2");
}

/**
 * 解析單一 location 字串成 { 名稱, 地址 }。
 * 兩種格式都吃：「地址(名稱)」與「名稱(地址)」。無法可靠判定的一律回 null
 * ——寧可漏掉，也不要在名錄上生出殘缺或錯誤的條目。
 */
export function parseStationLocation(
  location: string
): { name: string; address: string } | null {
  // 去掉所有空白（含資料裡混進來的 tab），並把 ((X)) 這種雙重括號收成 (X)
  const s = location
    .replace(/\s+/g, "")
    .replace(/[（(]{2}([^（()）]*)[)）]{2}/g, "($1)");

  for (const { before, inside } of splitParenGroups(s)) {
    // 形式一：名稱(地址) —— 例 中壢捐血室(中壢區中央東路88號16樓)
    const nameFromBefore = cleanStationName(before);
    if (nameFromBefore && LOOKS_LIKE_ADDRESS.test(inside)) {
      return {
        name: nameFromBefore,
        address: inside.replace(/[（(].*$/, "").trim() || inside,
      };
    }

    // 形式二：地址(名稱) —— 例 臺中市豐原區北陽路2號(豐原捐血室)
    // before 可能已經吃進前一組括號（地標描述），只留地址的部分
    const nameFromInside = cleanStationName(inside);
    if (nameFromInside) {
      const address = before.replace(/[（(].*$/, "").trim();
      if (LOOKS_LIKE_ADDRESS.test(address)) {
        return { name: nameFromInside, address };
      }
    }
  }

  return null;
}

/**
 * 同一個捐血室的多種地址寫法要挑最好的一個。
 * 判準：有縣市開頭的優先（才推得出所屬縣市），同級再取較長的（資訊較完整）。
 * 例：「中壢區中央東路88號16樓」← 輸給 →「桃園市中壢區中央東路88號16樓」
 */
function isBetterAddress(candidate: string, current: string): boolean {
  const hasCity = (a: string) => /^.{2,3}?[縣市]/.test(a);
  if (hasCity(candidate) !== hasCity(current)) return hasCity(candidate);
  return candidate.length > current.length;
}

/** 只拿縣市層級的設定來分組，行政區頁不參與（不然板橋會自成一組） */
function topLevelCities(): CityConfig[] {
  return CITIES.filter((c) => c.level !== "district");
}

/** 用 cityConfig 既有的 locationKeywords 反查 slug，維持與城市頁同一套判斷 */
export function findCitySlug(address: string, center: string | null): string | null {
  const candidates = topLevelCities().filter((c) =>
    c.locationKeywords.some((kw) => address.includes(kw))
  );
  if (candidates.length === 0) return null;
  // 同名關鍵字可能命中多個（例：新竹市／新竹縣），有 center 就用 center 收斂
  const byCenter = candidates.find((c) => c.centerFilter === center);
  return (byCenter ?? candidates[0]).slug;
}

/** 取出現次數最多的服務時間；全部缺漏就回 null（頁面顯示「以現場公告為準」） */
function pickHours(times: string[]): string | null {
  const counts = new Map<string, number>();
  for (const t of times) {
    const v = t.trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * 從 { 日期: 活動[] } 萃取固定捐血點名錄。
 * 同一個 location 會被合併成一筆，並累計出現次數。
 */
export function extractFixedStations(
  data: Record<string, StationEvent[]>
): FixedStation[] {
  const acc = new Map<
    string,
    {
      name: string;
      address: string;
      center: string | null;
      times: string[];
      coordinates: { lat: number; lng: number } | null;
      sessionCount: number;
    }
  >();

  for (const events of Object.values(data)) {
    for (const event of events ?? []) {
      if (!event?.location) continue;
      // PTT 是網友回報，沒有可信的固定點資訊，排除
      if (event.center === "PTT") continue;

      const parsed = parseStationLocation(event.location);
      if (!parsed) continue;

      // 用「名稱」去重，不是名稱+地址：同一個捐血室在資料裡有多種地址寫法
      // （中壢捐血室有 4 種、埔里捐血站有 3 種），分開存會讓名錄出現重複條目。
      const key = parsed.name;
      const prev = acc.get(key);
      if (prev) {
        prev.sessionCount += 1;
        if (event.time) prev.times.push(event.time);
        if (!prev.coordinates && event.coordinates) prev.coordinates = event.coordinates;
        if (!prev.center && event.center) prev.center = event.center;
        if (isBetterAddress(parsed.address, prev.address)) prev.address = parsed.address;
      } else {
        acc.set(key, {
          name: parsed.name,
          address: parsed.address,
          center: event.center ?? null,
          times: event.time ? [event.time] : [],
          coordinates: event.coordinates ?? null,
          sessionCount: 1,
        });
      }
    }
  }

  const stations: FixedStation[] = [];
  for (const v of acc.values()) {
    const address = normalizeAddress(v.address);
    const citySlug = findCitySlug(address, v.center);

    // 縣市優先用 cityConfig 反查的結果：直接取地址開頭會把「頭份市仁愛路…」
    // 判成「頭份市」，那是鄉鎮市不是縣市，會生出錯誤的分組。
    const city =
      (citySlug ? CITIES.find((c) => c.slug === citySlug)?.displayName : null) ??
      extractCityName(address);
    if (!city) continue; // 兩種方式都取不到縣市就不收，避免無法分組的孤兒

    stations.push({
      name: v.name,
      address,
      city,
      citySlug,
      center: v.center,
      hours: pickHours(v.times),
      coordinates: v.coordinates,
      sessionCount: v.sessionCount,
    });
  }

  stations.sort(
    (a, b) => b.sessionCount - a.sessionCount || a.name.localeCompare(b.name, "zh-TW")
  );
  return stations;
}

/**
 * 讀 /data 下**所有**月份檔，合併成 { 日期: 活動[] }。
 *
 * 為什麼不用 getDonations()：那支只讀當月與次月，但名錄頁要的是「有哪些固定捐血點」，
 * 一個捐血室不會因為這兩個月剛好沒被爬到就不存在。實測只讀近 4 個月只找得到 41 個，
 * 讀全部 16 個月才有 87 個。
 *
 * 僅供 build 期靜態產生使用（與 app/sitemap.ts 同樣直接用 fs 讀 /data）。
 */
export async function loadAllStationEvents<
  T extends StationEvent = StationEvent
>(): Promise<Record<string, T[]>> {
  const dataDir = path.join(process.cwd(), "data");
  let files: string[];
  try {
    files = (await fs.readdir(dataDir)).filter((f) => /^bloodInfo-\d{6}\.json$/.test(f));
  } catch {
    return {};
  }

  const merged: Record<string, T[]> = {};
  for (const file of files.sort()) {
    try {
      const raw = await fs.readFile(path.join(dataDir, file), "utf-8");
      const month: Record<string, T[]> = JSON.parse(raw);
      for (const [date, events] of Object.entries(month)) {
        merged[date] = merged[date] ? [...merged[date], ...events] : events;
      }
    } catch {
      // 略過壞掉的資料檔，不要讓整頁 build 失敗
    }
  }
  return merged;
}

/** 人工補充名錄轉成 FixedStation；sessionCount 給 0（沒有場次可數，排序時落在反推的後面） */
function toFixedStation(s: SupplementalStation): FixedStation {
  return {
    name: s.name,
    address: s.address,
    city: s.city,
    citySlug: findCitySlug(s.address, null),
    center: null,
    hours: s.hours,
    coordinates: null,
    sessionCount: 0,
    phone: s.phone,
  };
}

/**
 * 合併反推名錄與人工補充名錄，同名時**以人工補充為準**
 *（那份抄自官方頁，地址與服務時間都比反推的完整，還多了電話）。
 */
function mergeWithSupplement(
  base: FixedStation[],
  supplement: FixedStation[]
): FixedStation[] {
  const byName = new Map(base.map((s) => [s.name, s]));
  for (const s of supplement) byName.set(s.name, s);
  return [...byName.values()].sort(
    (a, b) => b.sessionCount - a.sessionCount || a.name.localeCompare(b.name, "zh-TW")
  );
}

/** 全站固定捐血點名錄（反推 + 人工補充），給 /blood-center 用 */
export function getAllFixedStations(
  data: Record<string, StationEvent[]>
): FixedStation[] {
  return mergeWithSupplement(
    extractFixedStations(data),
    SUPPLEMENTAL_STATIONS.map(toFixedStation)
  );
}

/**
 * 取某個縣市／行政區頁該顯示的固定捐血點。
 *
 * 反推的部分刻意複用 filterEventsByCity 而不是自己比對 station.citySlug：
 * - citySlug 只反查得到縣市層級，板橋／中壢／左營這些行政區頁會全部落空，
 *   但 GSC 顯示「板橋捐血站」單一查詢就有 469 曝光，正是最需要這塊內容的頁。
 * - 城市頁的活動列表本來就用這支篩，兩邊同一套規則才不會出現
 *   「活動列在板橋頁、捐血室卻沒列」的前後不一致。
 *
 * 人工補充的部分則直接用地址比對 locationKeywords——它們不是活動，沒有 center 欄位可篩，
 * 而且官方地址一定帶完整的縣市＋行政區，比對得比反推的還準。
 */
export function getStationsForCity(
  data: Record<string, StationEvent[]>,
  city: CityConfig
): FixedStation[] {
  const supplement = SUPPLEMENTAL_STATIONS.filter((s) =>
    city.locationKeywords.some((kw) => s.address.includes(kw))
  ).map(toFixedStation);

  return mergeWithSupplement(
    extractFixedStations(filterEventsByCity(data, city)),
    supplement
  );
}

export interface CityGroup {
  city: string;
  citySlug: string | null;
  stations: FixedStation[];
}

/** 依縣市分組，組內依出現次數排序；空組不會產生 */
export function groupStationsByCity(stations: FixedStation[]): CityGroup[] {
  const map = new Map<string, FixedStation[]>();
  for (const s of stations) {
    const list = map.get(s.city);
    if (list) list.push(s);
    else map.set(s.city, [s]);
  }

  return [...map.entries()]
    .map(([city, list]) => ({
      city,
      citySlug: list.find((s) => s.citySlug)?.citySlug ?? null,
      stations: list,
    }))
    .filter((g) => g.stations.length > 0)
    .sort((a, b) => b.stations.length - a.stations.length || a.city.localeCompare(b.city, "zh-TW"));
}
