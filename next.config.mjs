import fs from "node:fs";
import path from "node:path";

// Cloudflare Workers 沒有檔案系統，runtime 無法用 fs 讀 /data。
// 在 build/dev 時把 /data 複製到 public/data，讓資料變成靜態資源（由 CDN 直接提供）。
const dataDir = path.join(process.cwd(), "data");
const publicDataDir = path.join(process.cwd(), "public", "data");
if (fs.existsSync(dataDir)) {
  fs.rmSync(publicDataDir, { recursive: true, force: true });
  fs.cpSync(dataDir, publicDataDir, { recursive: true });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
