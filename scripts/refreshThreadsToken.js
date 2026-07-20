// scripts/refreshThreadsToken.js
//
// Threads 的 long-lived access token 效期 60 天，需要在過期前手動換發新的，
// 否則 postToThreads.js 會開始失敗。建議每 50 天左右手動跑一次：
//
//   THREADS_ACCESS_TOKEN=舊的token node scripts/refreshThreadsToken.js
//
// 換到新 token 後，記得回 GitHub repo → Settings → Secrets → Actions
// 把 THREADS_ACCESS_TOKEN 更新成新的值（GitHub Actions 沒辦法自己改自己的 secret）。

const token = process.env.THREADS_ACCESS_TOKEN;

if (!token) {
  console.error("請帶入 THREADS_ACCESS_TOKEN 環境變數（目前正在使用、尚未過期的 token）。");
  process.exit(1);
}

const url = new URL("https://graph.threads.net/refresh_access_token");
url.searchParams.set("grant_type", "th_refresh_token");
url.searchParams.set("access_token", token);

const res = await fetch(url);
const body = await res.json();

if (!res.ok || !body.access_token) {
  console.error("換發失敗：", JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log("換發成功，新的 long-lived token（效期約 60 天）：\n");
console.log(body.access_token);
console.log("\n請把它更新到 GitHub repo 的 THREADS_ACCESS_TOKEN secret。");
