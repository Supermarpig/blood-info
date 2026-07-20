import { ImageResponse } from "next/og";
import { getRegionBySlug } from "@/lib/regionConfig";
import { loadTcFont } from "@/lib/ogFont";

export const runtime = "nodejs";

const SITE = "bloodtw.com";
const TAGLINE = "全台捐血活動・血液庫存即時查詢";
const HEADLINE = "今日捐血地點推薦";

/**
 * 給 scripts/postToThreads.js 用的每日社群貼文配圖（1080×1080）。
 *
 * 這支 route 本身「不讀」/data 資料檔——它只把收到的查詢參數畫出來，
 * 所以圖片內容跟資料檔是否已部署完全無關。發文腳本手上有當日資料，
 * 就把場次數（count）、涵蓋縣市（area）當參數帶進來，讓圖片有實際資訊；
 * 沒帶時也能正常降級（只顯示轄區）。
 *
 * 參數：
 * - region：轄區 slug（north / hsinchu / central / south）
 * - date：YYYY-MM-DD
 * - count：當日該轄區場次數（選填）
 * - area：涵蓋縣市字串，例如「高雄、台南、嘉義、屏東」（選填）
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const regionSlug = searchParams.get("region") ?? "";
  const date = searchParams.get("date") ?? "";
  const count = searchParams.get("count") ?? "";
  const area = (searchParams.get("area") ?? "").replace(/[、,]/g, "・");

  const region = getRegionBySlug(regionSlug);
  const regionLabel = region ? region.displayName : "全台";

  const font = await loadTcFont(
    `${HEADLINE}${SITE}${TAGLINE}${regionLabel}${date}${count}${area}場捐血活動今日進行中查看完整地點`
  );

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

        {/* 主內容（垂直置中、左側紅色強調條） */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            borderLeft: "10px solid #ef4444",
            paddingLeft: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "58px",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            {HEADLINE}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "112px",
              fontWeight: 700,
              color: "#ef4444",
              lineHeight: 1.1,
            }}
          >
            {regionLabel}
          </div>

          {area ? (
            <div style={{ display: "flex", fontSize: "38px", color: "#4b5563" }}>
              {area}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}

          {count ? (
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "72px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {count}
              </div>
              <div style={{ display: "flex", fontSize: "40px", color: "#4b5563" }}>
                場捐血活動今日進行中
              </div>
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
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
        // 圖片內容由 region+date(+count+area) 決定，可放心長快取。
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
