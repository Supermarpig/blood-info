import { ImageResponse } from "next/og";
import { getRegionBySlug } from "@/lib/regionConfig";
import { loadTcFont } from "@/lib/ogFont";

export const runtime = "nodejs";

const SITE = "bloodtw.com";
const TAGLINE = "全台捐血活動・血液庫存即時查詢";
const HEADLINE = "今日全台捐血地點推薦";

/**
 * 給 scripts/postToThreads.js 用的每日社群貼文配圖。
 *
 * 刻意只吃 region + date 兩個查詢參數（不帶當日活動明細），這樣圖片內容
 * 只取決於「哪個轄區、哪一天」，跟 /data 底下的資料檔是否已部署完全無關——
 * 排程貼文腳本可以在剛爬完當天資料、PR 都還沒 merge 的當下就直接產文，
 * 這張圖仍然會是對的。實際活動明細放在貼文文字內容，不放圖上。
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const regionSlug = searchParams.get("region") ?? "";
  const date = searchParams.get("date") ?? "";

  const region = getRegionBySlug(regionSlug);
  const regionLabel = region ? `${region.displayName}` : "全台";

  const font = await loadTcFont(`${HEADLINE}${SITE}${TAGLINE}${regionLabel}${date}捐血資訊`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)",
          fontFamily: font ? "Noto Sans TC" : "sans-serif",
        }}
      >
        {/* 頁首：紅色血滴點 + 站名 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9999px",
              background: "#ef4444",
            }}
          />
          <div style={{ fontSize: "32px", fontWeight: 700, color: "#111827" }}>
            {SITE}
          </div>
        </div>

        {/* 主標題（左側紅色強調條） */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            borderLeft: "10px solid #ef4444",
            paddingLeft: "36px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.3,
              display: "flex",
            }}
          >
            {HEADLINE}
          </div>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#ef4444",
              display: "flex",
            }}
          >
            {regionLabel}
          </div>
        </div>

        {/* 頁尾：標語 + 日期 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "28px",
            color: "#6b7280",
          }}
        >
          <div style={{ display: "flex" }}>{TAGLINE}</div>
          {date ? <div style={{ display: "flex" }}>{date}</div> : <div />}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: font
        ? [{ name: "Noto Sans TC", data: font, weight: 700 as const, style: "normal" as const }]
        : undefined,
      headers: {
        // 每張圖對應固定的 region+date，內容不會變，可以放心長快取。
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
