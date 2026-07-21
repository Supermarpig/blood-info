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

// 贈品吸引力排序（越前面越好康）。
const GIFT_RANK = ["電影票", "禮券", "超商", "餐飲", "生活用品", "食品"];

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

/**
 * 由活動 id 產生活動詳情頁短碼：djb2 hash → base36 補零 6 碼。
 * ⚠️ 必須與 lib/eventId.ts 的 eventShortId 保持一致，否則組出的 /activity URL 會 404。
 */
function eventShortId(id) {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash) + id.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(36).padStart(6, "0");
}

/** 活動詳情頁完整網址：/activity/{activityDate}-{eventShortId(id)} */
function activityUrl(event) {
  return `${BASE_URL}/activity/${event.activityDate}-${eventShortId(event.id)}`;
}

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

/** 從今天活動中挑「有贈品 + 有海報圖」且最好康的一場（挑不到回 null）。 */
function pickGiftEvent(events) {
  const candidates = events.filter(
    (e) =>
      Array.isArray(e.tags) &&
      e.tags.some((t) => GIFT_RANK.includes(t)) &&
      e.pttData &&
      Array.isArray(e.pttData.images) &&
      e.pttData.images.length > 0
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const d = bestGiftIndex(a) - bestGiftIndex(b);
    if (d !== 0) return d;
    // 同名次時，贈品項目較多的（tags 多）通常整體好康度更高，排前面
    return (b.tags?.length || 0) - (a.tags?.length || 0);
  });
  return candidates[0];
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

function buildGiftCaption({ event, hook, dateStr, weekday }) {
  const knownGifts = (event.tags || []).filter((t) => GIFT_RANK.includes(t));
  const best = GIFT_RANK[bestGiftIndex(event)];
  const giftList = knownGifts.join("、");

  const lines = [];
  lines.push(hook);
  lines.push("");
  lines.push(event.organization);
  lines.push(event.location);
  lines.push(`${dateStr}（週${weekday}）· ${event.time}`);
  lines.push("");
  lines.push(`今日贈品：${giftList}（完整內容見圖）`);
  lines.push("");
  lines.push("活動詳情與地圖：");
  lines.push(activityUrl(event));
  lines.push("");
  lines.push(`#捐血 #捐血送${best} #台灣捐血`);
  return lines.join("\n");
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
  lines.push(`${BASE_URL}/region/${region.slug}`);
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

async function createAndWaitContainer({ text, imageUrl }) {
  const createUrl = new URL(`${GRAPH_BASE}/${THREADS_USER_ID}/threads`);
  createUrl.searchParams.set("media_type", "IMAGE");
  createUrl.searchParams.set("image_url", imageUrl);
  createUrl.searchParams.set("text", text);
  createUrl.searchParams.set("access_token", THREADS_ACCESS_TOKEN);

  const createRes = await fetch(createUrl, { method: "POST" });
  const createBody = await createRes.json();
  if (!createRes.ok || !createBody.id) {
    throw new Error(`建立 Threads 媒體容器失敗：${JSON.stringify(createBody)}`);
  }
  const containerId = createBody.id;

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

/** 決定今天要發什麼（贈品優先、備援轄區 banner）。回傳 { caption, imageUrl, kind }。 */
async function planPost(events, meta) {
  const { dateStr, weekday, dayOfYear } = meta;
  const hook = HOOKS[dayOfYear % HOOKS.length]; // 每日輪替開場白

  // 主策略：好康贈品場次 + 真實海報圖
  const giftEvent = pickGiftEvent(events);
  if (giftEvent) {
    const imageUrl = giftEvent.pttData.images[0];
    if (await isImageReachable(imageUrl)) {
      return {
        kind: "gift",
        caption: buildGiftCaption({ event: giftEvent, hook, dateStr, weekday }),
        imageUrl,
      };
    }
    console.log(`[postToThreads] 好康場次的海報圖抓不到（${imageUrl}），改用備援 banner。`);
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
    imageUrl: `${BASE_URL}/api/og/threads?${imageParams.toString()}`,
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

  console.log(`[postToThreads] 今天發文類型：${plan.kind === "gift" ? "好康贈品場次" : "轄區 banner（備援）"}`);
  console.log(`[postToThreads] 貼文內容預覽：\n${plan.caption}`);
  console.log(`[postToThreads] 配圖網址：${plan.imageUrl}`);

  const containerId = await createAndWaitContainer({ text: plan.caption, imageUrl: plan.imageUrl });
  const postId = await publishContainer(containerId);
  console.log(`[postToThreads] 發布成功，Threads 貼文 id：${postId}`);
}

main().catch((err) => {
  console.error("[postToThreads] 發文失敗：", err);
  process.exitCode = 1;
});
