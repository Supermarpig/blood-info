/**
 * 動態抓 Noto Sans TC 子集（只取本圖會用到的字），讓 Satori 能渲染中文。
 * 用舊版 UA 讓 Google Fonts 回傳 TTF（Satori 不支援 woff2）；失敗則回 null 由預設拉丁字型降級。
 *
 * 共用給 app/api/og/** 底下所有動態產圖 route 使用。
 */
export async function loadTcFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const api = `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(
      text
    )}`;
    const cssRes = await fetch(api, {
      headers: {
        "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)",
      },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const m = css.match(
      /src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/
    );
    if (!m) return null;
    const fontRes = await fetch(m[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}
