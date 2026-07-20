import { ImageResponse } from "next/og";
import { getNewsBySlug } from "@/lib/newsUtils";
import { loadTcFont } from "@/lib/ogFont";

export const runtime = "nodejs";

const SITE = "bloodtw.com";
const TAGLINE = "全台捐血活動・血液庫存即時查詢";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = getNewsBySlug(slug);

  const title = article?.title ?? "捐血資訊";
  const date = article?.date ?? "";

  // 子集需要的所有字元（標題 + 固定文案 + 日期）
  const font = await loadTcFont(`${title}${SITE}${TAGLINE}${date}捐血資訊`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)",
          fontFamily: font ? "Noto Sans TC" : "sans-serif",
        }}
      >
        {/* 頁首：紅色血滴點 + 站名 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9999px",
              background: "#ef4444",
            }}
          />
          <div style={{ fontSize: "30px", fontWeight: 700, color: "#111827" }}>
            {SITE}
          </div>
        </div>

        {/* 標題（左側紅色強調條） */}
        <div
          style={{
            display: "flex",
            borderLeft: "8px solid #ef4444",
            paddingLeft: "32px",
          }}
        >
          <div
            style={{
              fontSize: "62px",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.25,
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        {/* 頁尾：日期 + 標語 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "26px",
            color: "#6b7280",
          }}
        >
          <div style={{ display: "flex" }}>{TAGLINE}</div>
          {date ? <div style={{ display: "flex" }}>{date}</div> : <div />}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: font
        ? [{ name: "Noto Sans TC", data: font, weight: 700 as const, style: "normal" as const }]
        : undefined,
      headers: {
        // 邊緣快取一天、stale-while-revalidate 一週
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
