import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
    });

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    };

    const response = await axios.get(targetUrl, {
      headers,
      httpsAgent,
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const images: string[] = [];

    // 策略 1: 尋找 Colorbox 群組圖片 (.group3 img)
    $(".group3 img").each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        images.push(new URL(src, targetUrl).href);
      }
    });

    // 策略 2: 尋找 cboxElement 內的圖片
    if (images.length === 0) {
      $(".cboxElement img").each((_, el) => {
        const src = $(el).attr("src");
        if (src) {
          images.push(new URL(src, targetUrl).href);
        }
      });
    }

    // 策略 3: 尋找文章內容中的所有圖片 (排除 header/footer 等無關圖片)
    if (images.length === 0) {
      $(".news_content_area img").each((_, el) => {
        const src = $(el).attr("src");
        // 簡單過濾掉像是 icon 的小圖
        if (src && !src.includes("icon") && !src.includes("logo")) {
          images.push(new URL(src, targetUrl).href);
        }
      });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching event images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
