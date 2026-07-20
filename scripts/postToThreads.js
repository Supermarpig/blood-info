// scripts/postToThreads.js
//
// 每天早上（daily-update workflow 內，緊接在 updateData.js 之後執行）從當日剛爬到的
// 捐血活動資料中，四個捐血中心轄區輪流挑一個，整理成一則貼文發到 Threads（@blood._.tw）。
//
// 設計重點：
// - 直接讀當次 checkout 裡剛產生的 /data/bloodInfo-*.json，不等 PR merge、不等站台重新部署，
//   所以貼文文字內容永遠是「今天早上剛爬到的最新資料」。
// - 配圖走 app/api/og/threads route，只帶 region + date 兩個參數，跟資料檔部署時機無關
//   （見該 route 檔案開頭註解）。
// - 沒設定 THREADS_USER_ID / THREADS_ACCESS_TOKEN 時直接跳過並印出原因，不讓整個
//   daily-update workflow 因為社群發文失敗而變紅字。
//
// 手動測試：node scripts/postToThreads.js
// 需要環境變數：THREADS_USER_ID、THREADS_ACCESS_TOKEN，選填 NEXT_PUBLIC_BASE_URL（預設正式站）

import { promises as fs } from "fs";
import path from "path";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://www.bloodtw.com").replace(/\/+$/, "");
const THREADS_USER_ID = process.env.THREADS_USER_ID;
const THREADS_ACCESS_TOKEN = process.env.THREADS_ACCESS_TOKEN;
const GRAPH_BASE = "https://graph.threads.net/v1.0";

// 對應 lib/regionConfig.ts 的四個轄區（捐血中心 = data 裡 event.center 的值）。
const REGIONS = [
  { slug: "north", displayName: "北區", centerFilter: "台北", areaNote: "台北、新北、基隆、宜蘭、花蓮" },
  { slug: "hsinchu", displayName: "桃竹苗", centerFilter: "新竹", areaNote: "桃園、新竹、苗栗" },
  { slug: "central", displayName: "中區", centerFilter: "台中", areaNote: "台中、彰化、南投" },
  { slug: "south", displayName: "南區", centerFilter: "高雄", areaNote: "高雄、台南、嘉義、屏東" },
];

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

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

/** 從 dayOfYear 決定輪替起始的轄區，往後找第一個「今天有活動」的轄區。 */
function pickRegion(events, dayOfYear) {
  const startIndex = dayOfYear % REGIONS.length;
  for (let i = 0; i < REGIONS.length; i++) {
    const region = REGIONS[(startIndex + i) % REGIONS.length];
    const regionEvents = events.filter((e) => e.center === region.centerFilter);
    if (regionEvents.length > 0) {
      return { region, regionEvents };
    }
  }
  return null;
}

/** 從轄區當日活動中挑幾筆不重複地點、依時間排序的代表活動。 */
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

function buildCaption({ region, regionEvents, highlights, dateStr, weekday }) {
  const lines = [];
  lines.push(`今日全台捐血地點推薦｜${dateStr}（週${weekday}）`);
  lines.push("");
  lines.push(`${region.displayName}（${region.areaNote}）今天共有 ${regionEvents.length} 場捐血活動，例如：`);
  lines.push("");
  for (const e of highlights) {
    const location = (e.location || "").slice(0, 40);
    lines.push(`・${e.time}　${e.organization}｜${location}`);
  }
  lines.push("");
  lines.push("完整地點、開放時間、即時庫存查詢：");
  lines.push(`${BASE_URL}/region/${region.slug}`);
  lines.push("");
  lines.push("#捐血 #台灣捐血 #愛心捐血");

  // Threads 貼文文字上限約 500 字，超過就砍掉多餘的活動明細行再重組一次。
  let caption = lines.join("\n");
  if (caption.length > 480 && highlights.length > 1) {
    return buildCaption({
      region,
      regionEvents,
      highlights: highlights.slice(0, highlights.length - 1),
      dateStr,
      weekday,
    });
  }
  return caption;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 建立媒體容器，輪詢到 FINISHED 再回傳 containerId。 */
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

  // Meta 建議發布前先輪詢容器狀態，圖片通常幾秒內就會是 FINISHED。
  const statusUrl = new URL(`${GRAPH_BASE}/${containerId}`);
  statusUrl.searchParams.set("fields", "status,error_message");
  statusUrl.searchParams.set("access_token", THREADS_ACCESS_TOKEN);

  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(3000);
    const statusRes = await fetch(statusUrl);
    const statusBody = await statusRes.json();
    if (statusBody.status === "FINISHED") {
      return containerId;
    }
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

async function main() {
  if (!THREADS_USER_ID || !THREADS_ACCESS_TOKEN) {
    console.log("[postToThreads] 尚未設定 THREADS_USER_ID / THREADS_ACCESS_TOKEN，略過本次發文。");
    return;
  }

  const { year, month, dateStr, weekday, dayOfYear } = getTaipeiToday();
  const events = await loadTodayEvents(year, month, dateStr);
  if (events.length === 0) {
    console.log(`[postToThreads] ${dateStr} 沒有任何捐血活動資料，略過本次發文。`);
    return;
  }

  const picked = pickRegion(events, dayOfYear);
  if (!picked) {
    console.log(`[postToThreads] ${dateStr} 四個轄區都沒有活動資料，略過本次發文。`);
    return;
  }
  const { region, regionEvents } = picked;
  const highlights = pickHighlights(regionEvents);

  const caption = buildCaption({ region, regionEvents, highlights, dateStr, weekday });
  const imageUrl = `${BASE_URL}/api/og/threads?region=${region.slug}&date=${dateStr}`;

  console.log(`[postToThreads] 今天推薦轄區：${region.displayName}（共 ${regionEvents.length} 場活動）`);
  console.log(`[postToThreads] 貼文內容預覽：\n${caption}`);
  console.log(`[postToThreads] 配圖網址：${imageUrl}`);

  const containerId = await createAndWaitContainer({ text: caption, imageUrl });
  const postId = await publishContainer(containerId);
  console.log(`[postToThreads] 發布成功，Threads 貼文 id：${postId}`);
}

main().catch((err) => {
  console.error("[postToThreads] 發文失敗：", err);
  process.exitCode = 1;
});
