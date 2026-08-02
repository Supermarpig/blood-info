/**
 * 從 Google Search Console API 抓真實成效數據，算出「今天該寫什麼」的優先順序。
 *
 * 為什麼要有這支：/post 過去只會比對 skill 檔案裡寫死的問句庫，那是「我還沒寫的題目」，
 * 不是「有人在搜、但我吃不到的題目」。這支把後者變成可讀的數據。
 *
 * ⚠️ 能力邊界（很重要，不要誤用）：
 * GSC 只回報「本站已經有曝光」的查詢。完全沒排進去的需求它看不到，
 * 那種題目仍然要靠問句庫 / 關鍵字工具 / 常識去補。
 * 這支能回答「哪裡差一點就吃得到」，不能回答「市場上還有什麼」。
 *
 * 產出五個桶子：
 *   strikingDistance — 排名 4~20 名、有量，推一把就進前三 → 最高投報率
 *   lowCtr           — 已在前 10 名但 CTR 遠低於該名次的行情 → 改標題／summary
 *   uncoveredDemand  — 有曝光但排名 20 名外，且站上沒有專文 → 開新文
 *   decayingPages    — 對比前一期，點擊掉超過 30% 的頁 → 該更新
 *   risingQueries    — 成長中的查詢，順風時加碼
 *
 * 用法：pnpm gsc          （人看的 markdown 報告印到 stdout）
 *       pnpm gsc --json   （只印 JSON，給程式吃）
 * 完整結果一律另存 data-seo/gsc-insights.json。
 *
 * 需要環境變數（放 .env.local）：
 *   GSC_SITE_URL                     例：sc-domain:bloodtw.com 或 https://www.bloodtw.com/
 *   GSC_SERVICE_ACCOUNT_FILE         service account 金鑰 JSON 的路徑
 *   或 GSC_SERVICE_ACCOUNT_JSON_BASE64  同一份 JSON 的 base64（CI 用，避免換行問題）
 */

import { promises as fs } from "fs";
import path from "path";
import { google } from "googleapis";

const ROOT = path.resolve(import.meta.dirname, "..");
const NEWS_DIR = path.join(ROOT, "content/news");
const OUT_DIR = path.join(ROOT, "data-seo");
const OUT_FILE = path.join(OUT_DIR, "gsc-insights.json");

const DAYS = 28;
// GSC 資料有 2~3 天延遲，直接抓到今天會拿到殘缺的尾巴，把區間往回推。
const LAG_DAYS = 3;

// 各名次的 CTR 行情（產業通用曲線，用來判斷「這個名次本來該有多少點擊」）。
// 不是 Google 官方數字，只當相對基準用，不要拿去當預測值。
const CTR_BENCHMARK = {
  1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.06,
  6: 0.05, 7: 0.04, 8: 0.032, 9: 0.028, 10: 0.025,
};
const benchmarkCtr = (position) => {
  const p = Math.round(position);
  if (p <= 10) return CTR_BENCHMARK[Math.max(1, p)];
  if (p <= 20) return 0.015;
  return 0.005;
};

// ---------- env ----------

async function loadEnvLocal() {
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // 沒有 .env.local 就吃系統環境變數（CI）
  }
}

async function getCredentials() {
  const b64 = process.env.GSC_SERVICE_ACCOUNT_JSON_BASE64;
  if (b64) return JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));

  const file = process.env.GSC_SERVICE_ACCOUNT_FILE;
  if (file) {
    const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
    return JSON.parse(await fs.readFile(abs, "utf-8"));
  }
  return null;
}

// ---------- 日期 ----------

const fmt = (d) => d.toISOString().slice(0, 10);
const shift = (d, days) => {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
};

function periods() {
  const end = shift(new Date(), -LAG_DAYS);
  const start = shift(end, -(DAYS - 1));
  const prevEnd = shift(start, -1);
  const prevStart = shift(prevEnd, -(DAYS - 1));
  return {
    current: { startDate: fmt(start), endDate: fmt(end) },
    previous: { startDate: fmt(prevStart), endDate: fmt(prevEnd) },
  };
}

// ---------- GSC ----------

async function queryGsc(api, siteUrl, period, dimensions) {
  const res = await api.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: period.startDate,
      endDate: period.endDate,
      dimensions,
      type: "web",
      rowLimit: 25000,
    },
  });
  return res.data.rows || [];
}

// ---------- 站上內容覆蓋度 ----------

/** 抽出中文 bigram + 英數詞，用來比對「這個查詢站上有沒有專文」。 */
function tokens(text) {
  const clean = String(text || "").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
  const out = new Set();
  const cjk = clean.replace(/[a-z0-9]+/g, "");
  for (let i = 0; i < cjk.length - 1; i++) out.add(cjk.slice(i, i + 2));
  for (const word of String(text || "").toLowerCase().match(/[a-z0-9]{2,}/g) || []) out.add(word);
  return out;
}

/**
 * 非文章的功能頁也算「已覆蓋」。
 * 少了這段的話，「血型 遺傳」會被判成沒人寫，但站上其實有 /blood-type 計算機，
 * 結果就是叫你去寫一篇跟自家工具頁自相殘殺的文章。
 */
const TOOL_PAGES = [
  { slug: "blood-type", title: "血型遺傳計算機 父母血型 小孩血型 機率" },
  { slug: "eligibility", title: "捐血資格 條件 檢查 我可以捐血嗎" },
  { slug: "myth-quiz", title: "捐血迷思 大挑戰 測驗 常見錯誤觀念" },
  { slug: "blood-shortage", title: "血荒 缺血 血庫庫存 即時查詢" },
  { slug: "faq", title: "捐血常見問題 問答" },
  { slug: "record", title: "捐血紀錄 捐血次數 查詢" },
  { slug: "donate", title: "捐血流程 怎麼捐血 第一次捐血" },
];

async function loadArticles() {
  const files = (await fs.readdir(NEWS_DIR)).filter((f) => f.endsWith(".json"));
  const articles = [];
  for (const file of files) {
    try {
      const data = JSON.parse(await fs.readFile(path.join(NEWS_DIR, file), "utf-8"));
      const text = [
        data.title,
        data.summary,
        ...(data.sections || []).map((s) => s.heading),
      ].filter(Boolean).join(" ");
      articles.push({ file, slug: data.slug, title: data.title, date: data.date, kind: "news", tokens: tokens(text) });
    } catch {
      // 壞掉的 JSON 跳過，不要整支掛掉
    }
  }
  for (const page of TOOL_PAGES) {
    articles.push({ file: null, slug: page.slug, title: page.title, date: null, kind: "tool", tokens: tokens(page.title) });
  }
  return articles;
}

/**
 * IDF 加權的覆蓋度比對。
 * 沒加權的話「捐血」這種每篇都有的詞會把分數全部拉高，導致什麼都判定成「已覆蓋」。
 */
function buildIdf(articles) {
  const df = new Map();
  for (const a of articles) for (const t of a.tokens) df.set(t, (df.get(t) || 0) + 1);
  const n = articles.length || 1;
  return (token) => Math.log((n + 1) / ((df.get(token) || 0) + 1)) + 1;
}

/**
 * 回傳最接近的前 N 篇，不是只回一篇。
 *
 * 為什麼:bigram 比對對同義詞與語序變化會漏判。實測「血壓高可以捐血嗎」只拿到 0.55，
 * 但站上其實有〈高血壓可以捐血嗎〉;「捐血後可以運動嗎」拿 0.36，站上有〈捐血後多久能運動〉。
 * 只回一篇又只看分數的話，這種題目會被誤判成「沒人寫」而生出重複文章。
 * 所以把候選攤開來，讓最後判斷由讀得懂中文的人/模型做。
 */
function coverageCandidates(query, articles, idf, topN = 3) {
  const qt = tokens(query);
  if (!qt.size) return [];
  let total = 0;
  for (const t of qt) total += idf(t);
  const scored = articles.map((a) => {
    let matched = 0;
    for (const t of qt) if (a.tokens.has(t)) matched += idf(t);
    return { score: total ? matched / total : 0, article: a };
  });
  return scored.sort((x, y) => y.score - x.score).slice(0, topN);
}

function bestCoverage(query, articles, idf) {
  const [top] = coverageCandidates(query, articles, idf, 1);
  return top || { score: 0, article: null };
}

// ---------- 分析 ----------

function analyze({ curQueries, prevQueries, curPages, prevPages, queryPages, articles }) {
  const idf = buildIdf(articles);
  const prevQueryMap = new Map(prevQueries.map((r) => [r.keys[0], r]));
  const prevPageMap = new Map(prevPages.map((r) => [r.keys[0], r]));

  // 每個查詢目前主要是哪一頁在排 → 決定「更新舊文」還是「開新文」
  const topPageFor = new Map();
  for (const row of queryPages) {
    const [q, page] = row.keys;
    const cur = topPageFor.get(q);
    if (!cur || row.impressions > cur.impressions) {
      topPageFor.set(q, { page, impressions: row.impressions, position: row.position });
    }
  }

  const strikingDistance = [];
  const lowCtr = [];
  const uncoveredDemand = [];
  const risingQueries = [];

  for (const row of curQueries) {
    const query = row.keys[0];
    const { impressions, clicks, ctr, position } = row;
    const bench = benchmarkCtr(position);
    const ranked = topPageFor.get(query) || null;

    // 兩桶互斥：同一個查詢只該給一個行動建議。
    // CTR 不足優先 —— 改標題比推排名便宜得多，而且名次已經到位了。
    const isLowCtr = position <= 10 && impressions >= 100 && ctr < bench * 0.6;

    if (isLowCtr) {
      lowCtr.push({
        query, impressions, clicks, ctr, position,
        benchmarkCtr: bench,
        upside: Math.round(impressions * (bench - ctr)),
        page: ranked?.page || null,
      });
    } else if (position >= 4 && position <= 20 && impressions >= 50) {
      // 推到第 3 名可多拿多少點擊
      const upside = Math.round(impressions * Math.max(0, CTR_BENCHMARK[3] - ctr));
      if (upside >= 3) {
        strikingDistance.push({ query, impressions, clicks, ctr, position, upside, page: ranked?.page || null });
      }
    }

    if (position > 20 && impressions >= 30) {
      const candidates = coverageCandidates(query, articles, idf, 3);
      // 門檻放寬到 0.55，寧可多列幾個候選讓人工刷掉，也不要漏掉真正的缺口。
      // 最終「到底重不重複」由讀得懂中文的判斷，不是這個分數說了算。
      if ((candidates[0]?.score || 0) < 0.55) {
        uncoveredDemand.push({
          query, impressions, clicks, position,
          coverageScore: Number((candidates[0]?.score || 0).toFixed(2)),
          nearest: candidates.map((c) => ({
            slug: c.article.slug,
            title: c.article.title,
            kind: c.article.kind,
            score: Number(c.score.toFixed(2)),
          })),
        });
      }
    }

    const prev = prevQueryMap.get(query);
    if (prev && prev.clicks >= 5 && clicks > prev.clicks * 1.5) {
      risingQueries.push({ query, clicks, prevClicks: prev.clicks, impressions, position });
    }
  }

  const decayingPages = [];
  for (const row of curPages) {
    const page = row.keys[0];
    // /activity/ 是單場捐血活動頁，活動結束後流量歸零是正常的，不是需要修的衰退。
    // 不濾掉的話這桶會被過期活動塞滿，真正該更新的文章反而被擠出榜。
    if (page.includes("/activity/")) continue;
    const prev = prevPageMap.get(page);
    if (!prev || prev.clicks < 20) continue;
    const drop = (prev.clicks - row.clicks) / prev.clicks;
    if (drop >= 0.3) {
      decayingPages.push({
        page,
        clicks: row.clicks,
        prevClicks: prev.clicks,
        dropPct: Math.round(drop * 100),
        position: row.position,
        prevPosition: prev.position,
      });
    }
  }

  const bySize = (a, b) => b.upside - a.upside;
  return {
    strikingDistance: strikingDistance.sort(bySize).slice(0, 25),
    lowCtr: lowCtr.sort(bySize).slice(0, 25),
    uncoveredDemand: uncoveredDemand.sort((a, b) => b.impressions - a.impressions).slice(0, 30),
    decayingPages: decayingPages.sort((a, b) => b.prevClicks - a.prevClicks).slice(0, 15),
    risingQueries: risingQueries.sort((a, b) => b.clicks - a.clicks).slice(0, 15),
  };
}

// ---------- 報告 ----------

const pct = (n) => `${(n * 100).toFixed(1)}%`;
const pos = (n) => n.toFixed(1);

function report(result, meta) {
  const L = [];
  L.push(`# GSC 機會分析（${meta.current.startDate} ~ ${meta.current.endDate}，對比前 ${DAYS} 天）`);
  L.push("");
  const delta = meta.totals.clicksChangePct;
  const trend = delta === null ? "" : `｜較前期 ${delta >= 0 ? "+" : ""}${delta}%`;
  L.push(`站台：${meta.siteUrl}`);
  L.push("");
  L.push(`本期：點擊 ${meta.totals.clicks}（${meta.totals.clicksPerDay}/天）｜曝光 ${meta.totals.impressions}｜CTR ${pct(meta.totals.ctr)}${trend}`);
  L.push(`前期：點擊 ${meta.prevTotals.clicks}（${meta.prevTotals.clicksPerDay}/天）｜曝光 ${meta.prevTotals.impressions}｜CTR ${pct(meta.prevTotals.ctr)}`);
  L.push("");

  L.push(`## 1. 臨門一腳（排名 4~20，推一把就進前三）— ${result.strikingDistance.length} 個`);
  L.push("");
  if (result.strikingDistance.length) {
    L.push("| 查詢 | 曝光 | 點擊 | 排名 | 進前三可多拿 | 目前排名頁 |");
    L.push("|---|---|---|---|---|---|");
    for (const r of result.strikingDistance) {
      L.push(`| ${r.query} | ${r.impressions} | ${r.clicks} | ${pos(r.position)} | +${r.upside} | ${r.page || "—"} |`);
    }
  } else L.push("（無）");
  L.push("");

  L.push(`## 2. 標題該重寫（已在前 10 名但 CTR 低於行情）— ${result.lowCtr.length} 個`);
  L.push("");
  if (result.lowCtr.length) {
    L.push("| 查詢 | 曝光 | 排名 | 目前 CTR | 該名次行情 | 補上可多拿 | 頁面 |");
    L.push("|---|---|---|---|---|---|---|");
    for (const r of result.lowCtr) {
      L.push(`| ${r.query} | ${r.impressions} | ${pos(r.position)} | ${pct(r.ctr)} | ${pct(r.benchmarkCtr)} | +${r.upside} | ${r.page || "—"} |`);
    }
  } else L.push("（無）");
  L.push("");

  L.push(`## 3. 有需求但站上沒專文（排名 20 名外）— ${result.uncoveredDemand.length} 個`);
  L.push("");
  L.push("> ⚠️ 這桶是「開新文」的**候選**，不是結論。");
  L.push("> 覆蓋度用的是中文 bigram 比對，對同義詞與語序變化會漏判");
  L.push(">（例：「血壓高」對不上既有的〈高血壓可以捐血嗎〉）。");
  L.push("> **動筆前務必先看過右欄「最接近的既有文」的標題**，確認不是換句話說的同一題。");
  L.push("");
  if (result.uncoveredDemand.length) {
    L.push("| 查詢 | 曝光 | 排名 | 覆蓋度 | 最接近的既有文（要人工確認） |");
    L.push("|---|---|---|---|---|");
    for (const r of result.uncoveredDemand) {
      const near = r.nearest.map((n) => `${n.title || n.slug}（${n.score}）`).join("<br>") || "—";
      L.push(`| ${r.query} | ${r.impressions} | ${pos(r.position)} | ${r.coverageScore} | ${near} |`);
    }
  } else L.push("（無）");
  L.push("");

  L.push(`## 4. 衰退中的頁面（點擊掉 30% 以上）— ${result.decayingPages.length} 個`);
  L.push("");
  if (result.decayingPages.length) {
    L.push("| 頁面 | 前期點擊 | 本期點擊 | 跌幅 | 排名變化 |");
    L.push("|---|---|---|---|---|");
    for (const r of result.decayingPages) {
      L.push(`| ${r.page} | ${r.prevClicks} | ${r.clicks} | -${r.dropPct}% | ${pos(r.prevPosition)} → ${pos(r.position)} |`);
    }
  } else L.push("（無）");
  L.push("");

  L.push(`## 5. 成長中的查詢（點擊較前期 +50% 以上）— ${result.risingQueries.length} 個`);
  L.push("");
  if (result.risingQueries.length) {
    L.push("| 查詢 | 前期點擊 | 本期點擊 | 排名 |");
    L.push("|---|---|---|---|");
    for (const r of result.risingQueries) {
      L.push(`| ${r.query} | ${r.prevClicks} | ${r.clicks} | ${pos(r.position)} |`);
    }
  } else L.push("（無）");
  L.push("");

  L.push("---");
  L.push("");
  L.push("**注意**：GSC 只看得到「本站已有曝光」的查詢。完全沒排進去的需求不會出現在上面，");
  L.push("那類題目仍要靠問句庫或關鍵字工具補。這份報告回答「哪裡差一點」，不回答「市場上還有什麼」。");
  return L.join("\n");
}

// ---------- main ----------

async function main() {
  await loadEnvLocal();

  const siteUrl = process.env.GSC_SITE_URL;
  const credentials = await getCredentials();

  if (!siteUrl || !credentials) {
    console.error(
      [
        "⚠️  GSC 尚未設定，跳過數據分析。",
        "",
        "需要在 .env.local 補上：",
        "  GSC_SITE_URL=sc-domain:bloodtw.com",
        "  GSC_SERVICE_ACCOUNT_FILE=.gsc-service-account.json",
        "",
        "設定步驟見 SEO-POLICY.md 底部。",
      ].join("\n"),
    );
    process.exit(2);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const api = google.searchconsole({ version: "v1", auth });

  const { current, previous } = periods();

  const [curQueries, prevQueries, curPages, prevPages, queryPages] = await Promise.all([
    queryGsc(api, siteUrl, current, ["query"]),
    queryGsc(api, siteUrl, previous, ["query"]),
    queryGsc(api, siteUrl, current, ["page"]),
    queryGsc(api, siteUrl, previous, ["page"]),
    queryGsc(api, siteUrl, current, ["query", "page"]),
  ]);

  const articles = await loadArticles();
  const result = analyze({ curQueries, prevQueries, curPages, prevPages, queryPages, articles });

  const sum = (rows) => {
    const t = rows.reduce(
      (acc, r) => ({ clicks: acc.clicks + r.clicks, impressions: acc.impressions + r.impressions }),
      { clicks: 0, impressions: 0 },
    );
    t.ctr = t.impressions ? t.clicks / t.impressions : 0;
    t.clicksPerDay = Math.round(t.clicks / DAYS);
    return t;
  };
  const totals = sum(curQueries);
  const prevTotals = sum(prevQueries);
  totals.clicksChangePct = prevTotals.clicks
    ? Math.round(((totals.clicks - prevTotals.clicks) / prevTotals.clicks) * 100)
    : null;

  const meta = { siteUrl, current, previous, totals, prevTotals, articleCount: articles.length, generatedAt: new Date().toISOString() };
  const payload = { meta, ...result };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(payload, null, 2), "utf-8");

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(report(result, meta));
    console.log(`\n（完整 JSON：data-seo/gsc-insights.json）`);
  }
}

// 給測試用：只有直接執行時才跑 main
export { tokens, buildIdf, bestCoverage, loadArticles, analyze, benchmarkCtr };

if (process.argv[1] === import.meta.filename) {
  main().catch(onError);
}

function onError(err) {
  console.error("GSC 分析失敗：", err?.message || err);
  if (err?.code === 403) {
    console.error("→ 403 通常是 service account 還沒被加進 Search Console 的使用者清單。");
  }
  process.exit(1);
}
