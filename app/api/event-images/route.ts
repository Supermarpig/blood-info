import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }

    const html = await response.text();
    const root = parse(html);
    const images: string[] = [];

    const collect = (selector: string, filter?: (src: string) => boolean) => {
      for (const el of root.querySelectorAll(selector)) {
        const src = el.getAttribute("src");
        if (src && (!filter || filter(src))) {
          images.push(new URL(src, targetUrl).href);
        }
      }
    };

    // 策略 1: Colorbox 群組圖片
    collect(".group3 img");

    // 策略 2: cboxElement 內的圖片
    if (images.length === 0) {
      collect(".cboxElement img");
    }

    // 策略 3: 文章內容圖片（過濾掉 icon/logo 小圖）
    if (images.length === 0) {
      collect(
        ".news_content_area img",
        (src) => !src.includes("icon") && !src.includes("logo")
      );
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching event images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
