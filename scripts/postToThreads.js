// scripts/postToThreads.js
//
// 每天早上（daily-update workflow 內，緊接在 updateData.js 之後執行）從當日剛爬到的
// 捐血活動資料中挑一則，發到 Threads（@blood._.tw）。
//
// 主策略「今日推薦捐血地點（好康贈品）」：
// - 從今天的活動裡挑「有贈品分類(tags) 且有 PTT 活動海報圖(pttData.images)」的場次，
//   依贈品稀有度／吸引力排序（電影票 > 禮券 > 超商 > 餐飲 > 生活用品 > 食品），挑最好康的一場。
// - 直接用那張真實活動海報當配圖（Threads 會去抓該公開圖片網址），文案帶地點、贈品、
//   以及對應贈品頁 /gift/<slug> 的網址。
//
// 退場備援：今天若沒有「有贈品又有海報」的場次，就退回原本的「轄區輪替 + 自製 banner」，
// 確保每天都有東西可發、不會空手。
//
// 設計重點：
// - 直接讀當次 checkout 剛產生的 /data/bloodInfo-*.json，不等 PR merge、不等站台重新部署。
// - 缺 THREADS_USER_ID / THREADS_ACCESS_TOKEN 時直接跳過，不讓 daily-update workflow 變紅字。
//
// 手動測試：node scripts/postToThreads.js
// 需要環境變數：THREADS_USER_ID、THREADS_ACCESS_TOKEN，選填 NEXT_PUBLIC_BASE_URL（預設正式站）

import { promises as fs } from "fs";
import path from "path";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://www.bloodtw.com").replace(/\/+$/, "");
const THREADS_USER_ID = process.env.THREADS_USER_ID;
const THREADS_ACCESS_TOKEN = process.env.THREADS_ACCESS_TOKEN;
const GRAPH_BASE = "https://graph.threads.net/v1.0";

// 對應 lib/regionConfig.ts 的四個轄區（捐血中心 = data 裡 event.center 的值）。備援用。
const REGIONS = [
  { slug: "north", displayName: "北區", centerFilter: "台北", areaNote: "台北、新北、基隆、宜蘭、花蓮" },
  { slug: "hsinchu", displayName: "桃竹苗", centerFilter: "新竹", areaNote: "桃園、新竹、苗栗" },
  { slug: "central", displayName: "中區", centerFilter: "台中", areaNote: "台中、彰化、南投" },
  { slug: "south", displayName: "南區", centerFilter: "高雄", areaNote: "高雄、台南、嘉義、屏東" },
];

// 贈品吸引力排序（粗分類，備援用，越前面越好康）。
const GIFT_RANK = ["電影票", "禮券", "超商", "餐飲", "生活用品", "食品"];

// CP 值細項評分。⚠️ 必須與 lib/cpScore.ts 的 CP_SCORES 完全一致——這是網頁「今日最強」
// 的判斷標準，Threads 要挑到跟網頁同一場，就得用同一份分數。
const CP_SCORES = {
  "食品－龍蝦": 5, "餐飲－牛排": 5, "電影票－IMAX": 5,
  "食品－烤雞": 4, "電影票－威秀": 4, "電影票－國賓": 4, "電影票－秀泰": 4,
  "電影票－美麗華": 4, "電影票－in89": 4, "電影票－喜滿客": 4, "電影票－京站": 4,
  "禮券－百貨": 4,
  "食品－雞腿": 3, "禮券－金聯": 3, "禮券－全聯": 3, "禮券－家樂福": 3,
  "超商－7-11": 3, "超商－全家": 3, "超商－萊爾富": 3, "超商－OK": 3,
  "超商－全聯": 3, "超商－家樂福": 3, "餐飲－星巴克": 3, "餐飲－路易莎": 3,
  "超商－美廉社": 2, "餐飲－麥當勞": 2, "餐飲－肯德基": 2, "餐飲－摩斯": 2,
  "餐飲－咖啡": 2, "餐飲－便當": 2, "餐飲－早餐": 2, "食品－米": 2, "食品－蛋": 2,
  "食品－蛋糕": 2, "食品－麵包": 2, "生活用品－保溫杯": 2, "生活用品－雨傘": 2,
  "餐飲－飲料": 1, "食品－泡麵": 1, "食品－餅乾": 1, "食品－零食": 1,
  "生活用品－衛生紙": 1, "生活用品－毛巾": 1, "生活用品－購物袋": 1, "生活用品－餐具": 1,
};

/** 一場活動的 CP 分數＝所有 subTags 取最高分（對齊 lib/cpScore.ts 的 getEventCpScore）。 */
function cpScore(subTags) {
  if (!subTags || !subTags.length) return 0;
  return Math.max(...subTags.map((t) => CP_SCORES[t] ?? 1));
}

// 每日輪替的開場白（避免天天同一句），用「一年第幾天 % 長度」挑，相鄰兩天一定不同。
const HOOKS = [
  "今日推薦捐血地點",
  "今天發現一個超讚的捐血地點 😍",
  "今天捐血有好康！！！",
  "挖到寶了，今天這個捐血點很可以 👀",
  "今日精選捐血地點，報你知",
  "想捐血的看過來，今天推這一場 👇",
  "今天這場捐血，贈品誠意滿滿 🎁",
  "熱血推薦｜今天就捐這一場",
  "今天捐血，順便把好禮帶回家",
  "今日捐血好去處",
  "今天遇到一個佛心捐血場 😇",
  "捐血也有小確幸，今天推這場",
  "今日血液補給站，推這裡",
  "今天這個捐血點，值得專程跑一趟",
  "好康捐血情報｜今天這場別錯過",
  "今天捐血送的贈品有點狂 🔥",
  "今日熱血打卡點推薦",
  "想做好事又想拿好禮？今天看這場",
  "今日捐血亮點場來了",
  "今天這場捐血，CP 值超高 👍",
  "捐一袋熱血，好禮帶著走！今日推薦",
  "今日暖心捐血地點",
  "今天挖到的寶藏捐血點 💎",
  "今日必衝捐血場",
  "今天捐血，禮物比你想的還好 🎁",
  "熱血補給｜今日就推這一站",
  "今天這場捐血，值得記下來 📌",
  "今日捐血好禮場",
  "今天就近捐一袋，順手拿好康",
  "今日精選，這場捐血真的可以",
];

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

// 貼文 CTA 導到首頁聚合頁（全台今日好康 + 附近 + 即時血量），這是單張海報給不了的價值。
const SITE_CTA_URL = `${BASE_URL}/?ref=threads`;

/** 取得台灣時區（UTC+8，無日光節約）的今天日期字串與相關欄位。 */
function getTaipeiToday() {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000); // 用 UTC+8 位移取得台灣當地時間欄位
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const weekday = WEEKDAY_LABELS[now.getUTCDay()];

  const startOfYear = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - startOfYear) / 86400000) + 1;

  return { year, month, dateStr, weekday, dayOfYear };
}

async function loadTodayEvents(year, month, dateStr) {
  const file = path.join(process.cwd(), "data", `bloodInfo-${year}${String(month).padStart(2, "0")}.json`);
  let raw;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch {
    return [];
  }
  const monthData = JSON.parse(raw);
  return monthData[dateStr] || [];
}

/** 一場活動的「最佳贈品名次」（數字越小越好康）；沒有已知贈品回傳 Infinity。 */
function bestGiftIndex(event) {
  const idxs = (event.tags || [])
    .map((t) => GIFT_RANK.indexOf(t))
    .filter((i) => i >= 0);
  return idxs.length ? Math.min(...idxs) : Infinity;
}

/**
 * 排序用的名次資訊；沒有任何可辨識贈品的場次回 null。
 * primary 0 = 有 CP 細項評分（對齊網頁「今日最強」），1 = 只有粗分類。
 */
function giftRankOf(event) {
  const score = cpScore(event.subTags);
  if (score > 0) return { primary: 0, score, tie: event.subTags?.length || 0 };
  if ((event.tags || []).some((t) => GIFT_RANK.includes(t))) {
    // 取負值，讓底下一律用「score 由大到小」排，不必為兩層寫兩種比較
    return { primary: 1, score: -bestGiftIndex(event), tie: event.tags?.length || 0 };
  }
  return null;
}

/**
 * 挑出今天最好康、且有海報圖的前 max 場（給輪播用；挑不到回空陣列）。
 *
 * 兩個刻意的去重：
 * - 同一地點／同一張海報只留一場，否則輪播會出現三張幾乎一樣的圖。
 * - **第一輪限定「一個縣市只取一場」**，補不滿才放寬。一次貼三張同一個城市的海報，
 *   對其他縣市的讀者等於零；分散縣市才讓更多人找得到自己附近的那一場。
 */
function pickGiftEvents(events, max = 3) {
  const ranked = events
    .filter((e) => e.pttData && Array.isArray(e.pttData.images) && e.pttData.images.length > 0)
    .map((e) => ({ e, r: giftRankOf(e) }))
    .filter((x) => x.r)
    .sort((a, b) => a.r.primary - b.r.primary || b.r.score - a.r.score || b.r.tie - a.r.tie);

  const picked = [];
  const seenPlace = new Set();
  const seenImage = new Set();
  const seenCity = new Set();

  const tryAdd = ({ e }, requireNewCity) => {
    if (picked.length >= max) return;
    const placeKey = `${e.organization}|${e.location}`;
    const image = e.pttData.images[0];
    const city = shortPlace(e.location)?.city || null;
    if (seenPlace.has(placeKey) || seenImage.has(image)) return;
    if (requireNewCity && city && seenCity.has(city)) return;
    picked.push(e);
    seenPlace.add(placeKey);
    seenImage.add(image);
    if (city) seenCity.add(city);
  };

  for (const x of ranked) tryAdd(x, true);
  for (const x of ranked) tryAdd(x, false);
  return picked;
}

/** 單張版沿用同一組排序，保證輪播的第一張跟單圖會挑到同一場。 */
function pickGiftEvent(events) {
  return pickGiftEvents(events, 1)[0] || null;
}

/** 確認圖片網址目前抓得到（Threads 會去抓，抓不到就整篇失敗，所以先驗證）。 */
async function isImageReachable(url) {
  try {
    let res = await fetch(url, { method: "HEAD" });
    // 有些 CDN 不支援 HEAD，改用 GET 再確認一次
    if (!res.ok) res = await fetch(url, { method: "GET" });
    const type = res.headers.get("content-type") || "";
    return res.ok && type.startsWith("image/");
  } catch {
    return false;
  }
}

const CITY_TOKENS = [
  "台北", "臺北", "新北", "基隆", "桃園", "新竹", "苗栗", "台中", "臺中", "彰化",
  "南投", "雲林", "嘉義", "台南", "臺南", "高雄", "屏東", "宜蘭", "花蓮", "台東",
  "臺東", "澎湖", "金門", "連江",
];

/**
 * 「彰化縣和美鎮西美路115號(和美鎮龍華慈惠堂)」→ { city: "彰化", label: "彰化和美" }。
 * 貼文配的是活動海報，完整地址海報上就有；文案再打一次只是把版面填滿。
 * 解析不出來時回 null，呼叫端降級用機構名。
 */
function shortPlace(location) {
  if (!location) return null;
  const raw = location.replace(/臺/g, "台");
  const city = CITY_TOKENS.map((t) => t.replace(/臺/g, "台")).find((t) => raw.includes(t));
  if (!city) return null;

  const rest = raw.slice(raw.indexOf(city) + city.length).replace(/^[縣市]/, "");
  const district = rest.match(/^([一-龥]{1,3}[鄉鎮市區])/)?.[1];
  if (!district) return { city, label: city };

  const base = district.slice(0, -1);
  // 「彰化縣彰化市」直接接會變成「彰化彰化」，這種同名的只保留一次
  if (base === city) return { city, label: district };
  // 「和美鎮」→「和美」；但「東區」去掉後只剩一個字會很怪，這種就整個留著
  return { city, label: `${city}${base.length >= 2 ? base : district}` };
}

/**
 * 認不出縣市時的地點降級。用 location 本身而不是 organization——
 * organization 是主辦單位（「高雄市蓮潭8號慈善會」），拿它當地點會誤導。
 * 來源資料偶爾是「、1/15、1/22、1/29(四)竹北號捐血車」這種殘骸，
 * 所以要求必須是中文開頭的短字串，不合格就回 null，讓骨架整行不印。
 */
function fallbackPlace(location) {
  const stripped = (location || "").replace(/[（(].*?[）)]/g, "").replace(/[。．.\s]+$/, "").trim();
  if (!/^[一-龥]/.test(stripped)) return null;
  return stripped.length >= 2 && stripped.length <= 12 ? stripped : null;
}

/** 「09:30~16:00」→「下午4點」。整點與半點才轉換，其餘回 null（避免講錯時間）。 */
function friendlyEnd(time) {
  const m = (time || "").match(/(\d{1,2}):(\d{2})\s*$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23) return null;
  // 12 點要講「中午」——12:30 寫成「下午12點半」是錯的
  const period = h < 12 ? "上午" : h === 12 ? "中午" : h < 18 ? "下午" : "晚上";
  const h12 = h > 12 ? h - 12 : h;
  if (min === 0) return `${period}${h12}點`;
  if (min === 30) return `${period}${h12}點半`;
  return null;
}

/**
 * 贈品的人話名稱。資料裡是「禮券－全聯」這種原始標籤，直接取後半會變成「全聯」。
 * 只在能確定講法的分類補字（禮券／電影票），其餘一律只用細項名——
 * 例如「超商－7-11」不知道實際是商品卡還是禮券，就只寫「7-11」，不編。
 */
const NAMEABLE_CATEGORIES = { 禮券: "禮券", 電影票: "電影票" };

function giftLabel(event) {
  const subTags = event.subTags || [];
  if (subTags.length) {
    const max = Math.max(...subTags.map((t) => CP_SCORES[t] ?? 0));
    const tied = subTags.filter((t) => (CP_SCORES[t] ?? 0) === max);
    // 同分時優先挑講得出完整名稱的分類：一場同時有「超商－全聯」與「禮券－全聯」時，
    // 前者只能寫成「全聯」，後者是「全聯禮券」——後者才是人話。
    const chosen = tied.find((t) => NAMEABLE_CATEGORIES[t.split("－")[0]]) || tied[0];
    const [category, item] = chosen.split("－");
    if (!item) return chosen;
    const suffix = NAMEABLE_CATEGORIES[category];
    return suffix ? `${item}${suffix}` : item;
  }
  // 只有粗分類時（「食品」「禮券」）補一個「好禮」，否則會吐出像資料庫欄位的單字
  const coarse = (event.tags || []).filter((t) => GIFT_RANK.includes(t));
  return coarse.length ? `${coarse[0]}好禮` : null;
}

/**
 * 六套句型骨架，用 `dayOfYear % 6` 輪替。
 *
 * 為什麼是骨架不是只換開場白：原本 30 句 HOOKS 天天不同，但第二行之後永遠是
 * 「機構／地址／日期時間／贈品／兩段 CTA」同一個模子，追蹤者看兩天就認得出來，
 * 所以看起來像機器人。要有變化必須連結構一起換。
 *
 * ⚠️ 為什麼是 6 套、而且乘數是 1：固定捐血室與 PTT 場次會週期性重複出現，
 * 同一個地點又碰上同一套骨架就會發出幾乎一樣的兩篇。設骨架數 N、乘數 m，
 * 間隔 g 天的兩篇會撞號的條件是 (m*g) % N === 0：
 *   - N=5, m=3 → 間隔 5 天撞（實測 8/14 與 8/19 的新竹西大捐血室就是這樣撞的）
 *   - N=7, m=1 → 間隔 7 天撞，而「每週同一天」正是最常見的重複型態，更糟
 *   - N=6, m=1 → 5 和 7 都不整除 6，兩種最常見的重複間隔都不會撞
 * 改動骨架數量時要重算這個，不要只是加一套上去。
 *
 * 共同原則（Threads 是圖片為主的版位）：
 * - 短。海報講得完的（完整地址、機構全名、日期）文案就不再重複。
 * - 只放一個連結。導首頁而不是單一場次頁，因為多數看到貼文的人不在那個縣市，
 *   「全台今天哪裡有」才是對他們有用的東西。
 */
/** 地點／時間都抓不到時整行不印，避免留下孤零零一個句號。 */
function joinDetail(parts, sep) {
  const kept = parts.filter(Boolean);
  return kept.length ? kept.join(sep) + "。" : null;
}

const CAPTION_SKELETONS = [
  ({ hook, gift, place, when, city, others, url }) => [
    hook,
    "",
    `${gift}，這場誠意有到。`,
    joinDetail([place, when], "，"),
    "",
    `不在${city || "附近"}？全台今天還有 ${others} 場 👇`,
    url,
    "",
    "#捐血 #捐血好康",
  ].filter((l) => l !== null),
  ({ hook, gift, place, when, spotCount, url }) => [
    hook,
    "",
    `捐一次 = ${gift}。`,
    joinDetail([place, when], "・"),
    "",
    `全台今天 ${spotCount} 處都在這，你附近有沒有 👇`,
    url,
    "",
    "#捐血 #捐血好康 #台灣捐血",
  ].filter((l) => l !== null),
  ({ hook, gift, place, when, others, url }) => [
    hook,
    "",
    `今天最好康的一場：${place || "見圖"}，${gift}。`,
    when ? `${when}，還來得及。` : "時間看圖。",
    "",
    `另外 ${others} 場在這 👇`,
    url,
    "",
    "#捐血 #捐血好康",
  ],
  ({ hook, gift, place, when, spotCount, url }) => [
    hook,
    "",
    `📍 ${place || "詳見海報"}`,
    `🎁 ${gift}`,
    when ? `⏰ ${when}` : null,
    "",
    `全台今天 ${spotCount} 處 👇`,
    url,
    "",
    "#捐血 #捐血好康 #台灣捐血",
  ].filter((l) => l !== null),
  ({ hook, gift, place, when, spotCount, url }) => [
    hook,
    "",
    `${place || "這場"}今天有${gift}${when ? `，${when}` : ""}。`,
    "順手捐一袋，好禮帶著走。",
    "",
    `不在附近的，全台今天 ${spotCount} 處一次查 👇`,
    url,
    "",
    "#捐血 #捐血好康",
  ],
  ({ hook, gift, place, when, others, url }) => [
    hook,
    "",
    place ? `先講結論：今天去${place}最划算。` : "先講結論：今天這場最划算。",
    joinDetail([gift, when], "，"),
    "",
    `其他 ${others} 場在這 👇`,
    url,
    "",
    "#捐血 #捐血好康",
  ].filter((l) => l !== null),
];

function buildGiftCaption({ event, hook, spotCount, dayOfYear }) {
  const gift = giftLabel(event) || "好禮";
  const parsed = shortPlace(event.location);
  const place = parsed?.label || fallbackPlace(event.location);
  const end = friendlyEnd(event.time);
  const when = end ? `開到${end}` : event.time || null;

  // 乘數必須是 1、骨架必須是 6 套，理由見 CAPTION_SKELETONS 上的註解（撞號條件）
  const skeleton = CAPTION_SKELETONS[dayOfYear % CAPTION_SKELETONS.length];
  const caption = skeleton({
    hook,
    gift,
    place,
    when,
    city: parsed?.city || null,
    spotCount,
    others: Math.max(spotCount - 1, 1),
    url: SITE_CTA_URL,
  }).join("\n");

  // Threads 上限 500 字。地點／機構名偶爾很長，超過就退到最短版本保住發文。
  if (caption.length > 490) {
    return [hook, "", `${gift}｜${place || "詳見海報"}`, "", `全台今天 ${spotCount} 處 👇`, SITE_CTA_URL, "", "#捐血 #捐血好康"].join("\n");
  }
  return caption;
}

// ---- 輪播（多場次多海報） ----

const LIST_NUMERALS = ["①", "②", "③", "④", "⑤"];

// 清單式貼文的開頭與結尾也要輪替，否則多場版本會變成新的模板。
const LIST_LEADS = [
  (n) => `今天最好康的 ${n} 場：`,
  (n) => `今天這 ${n} 場最值得跑：`,
  (n) => `今日精選 ${n} 場，一次看：`,
  (n) => `今天我會選這 ${n} 場：`,
  (n) => `好康排行榜，今天前 ${n} 名：`,
  (n) => `今天有 ${n} 場特別可以：`,
];

const LIST_CTAS = [
  (spotCount) => `完整時間地點、全台今天 ${spotCount} 處 👇`,
  (spotCount) => `其他場次與你附近的，全台今天 ${spotCount} 處 👇`,
  (spotCount) => `全台今天 ${spotCount} 處，一次查 👇`,
];

/**
 * 多場次輪播的文案：一場一行，剩下的交給海報。
 * 不用 CAPTION_SKELETONS，因為那幾套是為「單一場次」寫的句子。
 */
function buildCarouselCaption({ events, hook, spotCount, dayOfYear }) {
  const rows = events.map((e, i) => {
    const place = shortPlace(e.location)?.label || fallbackPlace(e.location) || "詳見海報";
    return `${LIST_NUMERALS[i]} ${place}・${giftLabel(e) || "好禮"}`;
  });

  const build = (list) => [
    hook,
    "",
    LIST_LEADS[dayOfYear % LIST_LEADS.length](list.length),
    ...list,
    "",
    LIST_CTAS[dayOfYear % LIST_CTAS.length](spotCount),
    SITE_CTA_URL,
    "",
    "#捐血 #捐血好康",
  ].join("\n");

  // 地點名偶爾很長；超過上限就少列一場（圖還是照發，只是文案不逐張點名）
  let list = rows;
  while (list.length > 2 && build(list).length > 490) list = list.slice(0, -1);
  return build(list);
}

// ---- 備援：轄區輪替 + 自製 banner（沿用原本設計） ----

function pickRegion(events, dayOfYear) {
  const startIndex = dayOfYear % REGIONS.length;
  for (let i = 0; i < REGIONS.length; i++) {
    const region = REGIONS[(startIndex + i) % REGIONS.length];
    const regionEvents = events.filter((e) => e.center === region.centerFilter);
    if (regionEvents.length > 0) return { region, regionEvents };
  }
  return null;
}

function pickHighlights(regionEvents, max = 4) {
  const seen = new Set();
  const sorted = [...regionEvents].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const highlights = [];
  for (const e of sorted) {
    const key = `${e.organization}|${e.location}`;
    if (seen.has(key)) continue;
    seen.add(key);
    highlights.push(e);
    if (highlights.length >= max) break;
  }
  return highlights;
}

function buildRegionCaption({ region, regionEvents, highlights, hook, dateStr, weekday }) {
  const lines = [];
  lines.push(hook);
  lines.push("");
  lines.push(`${region.displayName}（${region.areaNote}）${dateStr}（週${weekday}）共有 ${regionEvents.length} 場捐血活動，例如：`);
  lines.push("");
  for (const e of highlights) {
    lines.push(`・${e.time}　${e.organization}｜${(e.location || "").slice(0, 40)}`);
  }
  lines.push("");
  lines.push("完整地點、開放時間、即時庫存查詢：");
  lines.push(`${BASE_URL}/region/${region.slug}?ref=threads`);
  lines.push("");
  lines.push("#捐血 #台灣捐血 #愛心捐血");

  let caption = lines.join("\n");
  if (caption.length > 480 && highlights.length > 1) {
    return buildRegionCaption({
      region,
      regionEvents,
      highlights: highlights.slice(0, highlights.length - 1),
      hook,
      dateStr,
      weekday,
    });
  }
  return caption;
}

// ---- Threads Graph API ----

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 送出建立容器的請求，回傳 container id。 */
async function createContainer(params) {
  const createUrl = new URL(`${GRAPH_BASE}/${THREADS_USER_ID}/threads`);
  for (const [k, v] of Object.entries(params)) createUrl.searchParams.set(k, v);
  createUrl.searchParams.set("access_token", THREADS_ACCESS_TOKEN);

  const createRes = await fetch(createUrl, { method: "POST" });
  const createBody = await createRes.json();
  if (!createRes.ok || !createBody.id) {
    throw new Error(`建立 Threads 媒體容器失敗：${JSON.stringify(createBody)}`);
  }
  return createBody.id;
}

/** 輪詢容器狀態直到 FINISHED（Threads 要去抓圖，不是立刻就緒）。 */
async function waitForContainer(containerId) {
  const statusUrl = new URL(`${GRAPH_BASE}/${containerId}`);
  statusUrl.searchParams.set("fields", "status,error_message");
  statusUrl.searchParams.set("access_token", THREADS_ACCESS_TOKEN);

  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(3000);
    const statusRes = await fetch(statusUrl);
    const statusBody = await statusRes.json();
    if (statusBody.status === "FINISHED") return containerId;
    if (statusBody.status === "ERROR") {
      throw new Error(`Threads 媒體容器處理失敗：${statusBody.error_message || JSON.stringify(statusBody)}`);
    }
  }
  throw new Error("Threads 媒體容器逾時未完成處理（等了 30 秒）");
}

async function createAndWaitContainer({ text, imageUrl }) {
  return waitForContainer(
    await createContainer({ media_type: "IMAGE", image_url: imageUrl, text })
  );
}

/**
 * 輪播：先為每張圖各建一個 is_carousel_item 容器（這種容器不帶文字），
 * 再用 media_type=CAROUSEL 把它們的 id 串成一則貼文，文字掛在 CAROUSEL 上。
 * 依官方文件，輪播最少 2 張最多 20 張，且整串只算一則貼文。
 */
async function createAndWaitCarousel({ text, imageUrls }) {
  const childIds = [];
  for (const imageUrl of imageUrls) {
    childIds.push(
      await createContainer({ media_type: "IMAGE", image_url: imageUrl, is_carousel_item: "true" })
    );
  }
  return waitForContainer(
    await createContainer({ media_type: "CAROUSEL", children: childIds.join(","), text })
  );
}

async function publishContainer(containerId) {
  const publishUrl = new URL(`${GRAPH_BASE}/${THREADS_USER_ID}/threads_publish`);
  publishUrl.searchParams.set("creation_id", containerId);
  publishUrl.searchParams.set("access_token", THREADS_ACCESS_TOKEN);

  const publishRes = await fetch(publishUrl, { method: "POST" });
  const publishBody = await publishRes.json();
  if (!publishRes.ok || !publishBody.id) {
    throw new Error(`發布 Threads 貼文失敗：${JSON.stringify(publishBody)}`);
  }
  return publishBody.id;
}

/** 輪播最多放幾場。資料實測平均每天有 6.5 場可用，78% 的天數有 2 場以上。 */
const CAROUSEL_MAX = 3;

/**
 * 決定今天要發什麼。回傳 { kind, caption, imageUrls }。
 * 優先序：多場輪播 → 單場單圖 → 轄區 banner 備援。
 */
async function planPost(events, meta) {
  const { dateStr, weekday, dayOfYear } = meta;
  const hook = HOOKS[dayOfYear % HOOKS.length]; // 每日輪替開場白

  // 主策略：今日最好康的前幾場 + 各自的真實海報
  const giftEvents = pickGiftEvents(events, CAROUSEL_MAX);
  if (giftEvents.length) {
    // Threads 抓不到圖會整篇失敗，所以先驗證；抓不到的那場直接剔除而不是放棄整篇
    const usable = (
      await Promise.all(
        giftEvents.map(async (event) => {
          const imageUrl = event.pttData.images[0];
          if (await isImageReachable(imageUrl)) return { event, imageUrl };
          console.log(`[postToThreads] 海報圖抓不到，跳過這場：${imageUrl}`);
          return null;
        })
      )
    ).filter(Boolean);

    if (usable.length >= 2) {
      return {
        kind: "carousel",
        caption: buildCarouselCaption({
          events: usable.map((u) => u.event),
          hook,
          spotCount: events.length,
          dayOfYear,
        }),
        imageUrls: usable.map((u) => u.imageUrl),
      };
    }
    if (usable.length === 1) {
      return {
        kind: "gift",
        caption: buildGiftCaption({
          event: usable[0].event,
          hook,
          spotCount: events.length,
          dayOfYear,
        }),
        imageUrls: [usable[0].imageUrl],
      };
    }
    console.log("[postToThreads] 今天好康場次的海報圖都抓不到，改用備援 banner。");
  }

  // 備援：轄區輪替 + 自製 banner
  const picked = pickRegion(events, dayOfYear);
  if (!picked) return null;
  const { region, regionEvents } = picked;
  const highlights = pickHighlights(regionEvents);
  const imageParams = new URLSearchParams({
    region: region.slug,
    date: dateStr,
    count: String(regionEvents.length),
    area: region.areaNote,
  });
  return {
    kind: "region",
    caption: buildRegionCaption({ region, regionEvents, highlights, hook, dateStr, weekday }),
    imageUrls: [`${BASE_URL}/api/og/threads?${imageParams.toString()}`],
  };
}

async function main() {
  if (!THREADS_USER_ID || !THREADS_ACCESS_TOKEN) {
    console.log("[postToThreads] 尚未設定 THREADS_USER_ID / THREADS_ACCESS_TOKEN，略過本次發文。");
    return;
  }

  const meta = getTaipeiToday();
  const events = await loadTodayEvents(meta.year, meta.month, meta.dateStr);
  if (events.length === 0) {
    console.log(`[postToThreads] ${meta.dateStr} 沒有任何捐血活動資料，略過本次發文。`);
    return;
  }

  const plan = await planPost(events, meta);
  if (!plan) {
    console.log(`[postToThreads] ${meta.dateStr} 找不到可發的內容，略過本次發文。`);
    return;
  }

  const kindLabel = {
    carousel: `好康場次輪播（${plan.imageUrls.length} 張）`,
    gift: "好康贈品場次（單圖）",
    region: "轄區 banner（備援）",
  }[plan.kind];
  console.log(`[postToThreads] 今天發文類型：${kindLabel}`);
  console.log(`[postToThreads] 貼文內容預覽：\n${plan.caption}`);
  console.log(`[postToThreads] 配圖網址：\n  ${plan.imageUrls.join("\n  ")}`);

  const containerId =
    plan.kind === "carousel"
      ? await createAndWaitCarousel({ text: plan.caption, imageUrls: plan.imageUrls })
      : await createAndWaitContainer({ text: plan.caption, imageUrl: plan.imageUrls[0] });
  const postId = await publishContainer(containerId);
  console.log(`[postToThreads] 發布成功，Threads 貼文 id：${postId}`);
}

main().catch((err) => {
  console.error("[postToThreads] 發文失敗：", err);
  process.exitCode = 1;
});
