/**
 * 驗證 /blood-center 頁的資料來源（lib/bloodCenters.ts）解析正確。
 *
 * 為什麼要這支：專案沒有測試框架，而「把 96 個異質地址字串解析成名錄」正是最容易
 * 默默出錯的地方——少幾筆、名稱殘留括號、縣市對不到 slug，頁面都還是會 build 成功。
 * tsc / lint / build 抓不到這類錯，所以另外寫斷言。
 *
 * 執行：node scripts/verifyBloodCenters.mjs
 * 通過時 exit 0，任何一項斷言失敗 exit 1 並印出原因。
 *
 * 實作備註：Node 20 不能直接跑 TypeScript，專案也沒有 tsx/esbuild，
 * 所以用專案既有的 typescript 套件把 lib/*.ts 即時去型別後再 import，
 * 確保驗證的是**頁面真正使用的那份程式碼**，而不是複製一份會走鐘的邏輯。
 */

import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { pathToFileURL } from "url";
import ts from "typescript";

const ROOT = path.resolve(import.meta.dirname, "..");
// 資料裡實際有 36 個不重複固定捐血點（87 個 location 字串去重後的結果）。
// 門檻設 30 是為了抓「解析器壞掉導致大量漏抓」，不是期望值。
const MIN_STATIONS = 30;

/** 把 lib/*.ts 去型別寫進暫存目錄，並把 @/lib/x 改成相對路徑，讓 node 能直接 import */
async function loadLibModules(files) {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "bloodtw-verify-"));
  for (const file of files) {
    const src = await fs.readFile(path.join(ROOT, "lib", `${file}.ts`), "utf-8");
    const js = ts.transpileModule(src, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        isolatedModules: true,
      },
    }).outputText;
    await fs.writeFile(
      path.join(outDir, `${file}.mjs`),
      js.replace(/from\s+["']@\/lib\/([\w-]+)["']/g, 'from "./$1.mjs"'),
      "utf-8",
    );
  }
  return outDir;
}

async function loadDonationData() {
  const dataDir = path.join(ROOT, "data");
  // 與頁面一致：讀全部月份，不是只讀近期
  // （只讀近 4 個月只找得到 41 個捐血點，讀全部才有 87 個）
  const files = (await fs.readdir(dataDir))
    .filter((f) => /^bloodInfo-\d{6}\.json$/.test(f))
    .sort();
  const merged = {};
  for (const file of files) {
    const month = JSON.parse(await fs.readFile(path.join(dataDir, file), "utf-8"));
    for (const [date, events] of Object.entries(month)) {
      merged[date] = merged[date] ? [...merged[date], ...events] : events;
    }
  }
  return { merged, files };
}

const failures = [];
const check = (ok, label, detail = "") => {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failures.push(label);
  }
};

async function main() {
  const outDir = await loadLibModules(["cityConfig", "bloodCenters"]);
  const { extractFixedStations, groupStationsByCity } = await import(
    pathToFileURL(path.join(outDir, "bloodCenters.mjs")).href
  );
  const { getAllCitySlugs } = await import(
    pathToFileURL(path.join(outDir, "cityConfig.mjs")).href
  );

  const { merged, files } = await loadDonationData();
  console.log(`資料檔：${files.join(", ")}\n`);

  const stations = extractFixedStations(merged);
  const groups = groupStationsByCity(stations);
  const validSlugs = new Set(getAllCitySlugs());

  console.log("斷言：");

  check(
    stations.length >= MIN_STATIONS,
    `固定捐血點數量 >= ${MIN_STATIONS}`,
    `實際 ${stations.length} 個`,
  );

  const badName = stations.filter((s) => !s.name || /[（()）]/.test(s.name));
  check(
    badName.length === 0,
    "每筆 name 非空且不含括號殘留",
    badName.length ? `${badName.length} 筆有問題：${badName.slice(0, 3).map((s) => s.name).join(" / ")}` : "",
  );

  const badAddr = stations.filter((s) => !s.address || !s.address.trim());
  check(badAddr.length === 0, "每筆 address 非空", badAddr.length ? `${badAddr.length} 筆為空` : "");

  const emptyGroup = groups.filter((g) => !g.stations || g.stations.length === 0);
  check(
    emptyGroup.length === 0 && groups.length > 0,
    "縣市分組沒有空組",
    `共 ${groups.length} 組，空組 ${emptyGroup.length} 個`,
  );

  const badSlug = stations.filter((s) => s.citySlug !== null && !validSlugs.has(s.citySlug));
  check(
    badSlug.length === 0,
    "所有 /city/{slug} 連結都存在於 cityConfig",
    badSlug.length ? `無效 slug：${[...new Set(badSlug.map((s) => s.citySlug))].join(", ")}` : "",
  );

  // 這項不是硬性標準，但比例太低代表分組品質有問題，印出來當健康指標
  const withSlug = stations.filter((s) => s.citySlug).length;
  const pct = Math.round((withSlug / stations.length) * 100);
  check(pct >= 70, "至少 70% 捐血點能對應到縣市頁", `實際 ${pct}%（${withSlug}/${stations.length}）`);

  console.log(`\n概況：${stations.length} 個捐血點、${groups.length} 個縣市分組`);
  console.log(
    `有服務時間 ${stations.filter((s) => s.hours).length} 個、` +
      `無服務時間 ${stations.filter((s) => !s.hours).length} 個（頁面顯示「以現場公告為準」）`,
  );
  console.log("\n分組概覽：");
  for (const g of groups.slice(0, 8)) {
    console.log(`  ${g.city.padEnd(5)} ${String(g.stations.length).padStart(2)} 個  ${g.stations.slice(0, 3).map((s) => s.name).join("、")}`);
  }

  await fs.rm(outDir, { recursive: true, force: true });

  if (failures.length) {
    console.error(`\n❌ ${failures.length} 項斷言失敗`);
    process.exit(1);
  }
  console.log("\n✅ 全部斷言通過");
}

main().catch((err) => {
  console.error("驗證腳本執行失敗：", err);
  process.exit(1);
});
