import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "台灣捐血活動查詢",
    short_name: "捐血查詢",
    description:
      "即時查詢全台捐血車出車地點、捐血站開放時間與捐血贈品，一頁掌握附近捐血資訊。",
    start_url: "/",
    display: "standalone",
    background_color: "#FFE8EE",
    theme_color: "#FF4D6D",
    orientation: "portrait",
    lang: "zh-TW",
    categories: ["health", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
