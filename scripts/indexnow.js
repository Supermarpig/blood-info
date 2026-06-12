/**
 * 將近期變動的頁面提交到 IndexNow（Bing / Yahoo 奇摩 / Naver / Yandex 共用端點）。
 *
 * URL 來源是「線上的 sitemap.xml」而不是本地重算：
 * sitemap 與活動頁路由共用 lib/eventId.ts 的 eventShortId，
 * 抓線上產物可避免在純 Node 腳本裡複製 hash 邏輯（單一真實來源），
 * 也保證提交的 URL 都是已部署、可被爬的。
 *
 * 提交範圍（避免重複提交沒變動的頁面）：
 *   - 核心每日變動頁：/、/recent、/calendar、/news
 *   - 未來 7 天內的活動頁 /activity/YYYY-MM-DD-xxxxxx
 *   - 最近 3 天發佈的文章頁 /news/YYYY-MM-DD-slug
 *
 * 用法：node scripts/indexnow.js
 */

const BASE_URL = "https://www.bloodtw.com";
const HOST = "www.bloodtw.com";
const KEY = "4b1c7f70b16b87b0c389b0fbd402af4e";
const ACTIVITY_DAYS_AHEAD = 7;
const NEWS_DAYS_BACK = 3;

function fmt(date) {
  return date.toISOString().slice(0, 10);
}

async function main() {
  const res = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!res.ok) {
    throw new Error(`抓取 sitemap.xml 失敗：HTTP ${res.status}`);
  }
  const xml = await res.text();
  const allUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (allUrls.length === 0) {
    throw new Error("sitemap.xml 解析不到任何 <loc>，格式可能變了");
  }

  const today = new Date();
  const activityMax = fmt(new Date(today.getTime() + ACTIVITY_DAYS_AHEAD * 86400000));
  const newsMin = fmt(new Date(today.getTime() - NEWS_DAYS_BACK * 86400000));
  const todayStr = fmt(today);

  const core = ["/", "/recent", "/calendar", "/news"].map((p) =>
    p === "/" ? BASE_URL : `${BASE_URL}${p}`
  );

  const urlList = [
    ...core,
    ...allUrls.filter((url) => {
      const activity = url.match(/\/activity\/(\d{4}-\d{2}-\d{2})-/);
      if (activity) {
        return activity[1] >= todayStr && activity[1] <= activityMax;
      }
      const news = url.match(/\/news\/(\d{4}-\d{2}-\d{2})-/);
      if (news) {
        return news[1] >= newsMin;
      }
      return false;
    }),
  ];

  console.log(`提交 ${urlList.length} 個 URL 到 IndexNow（sitemap 共 ${allUrls.length} 個）`);

  const submit = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${BASE_URL}/${KEY}.txt`,
      urlList,
    }),
  });

  // 200 = OK、202 = 已收到（金鑰驗證中），都算成功
  if (submit.status !== 200 && submit.status !== 202) {
    const body = await submit.text();
    throw new Error(`IndexNow 提交失敗：HTTP ${submit.status} ${body}`);
  }
  console.log(`IndexNow 回應 HTTP ${submit.status}，提交成功`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
