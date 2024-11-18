/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',  // 設置為雙星號以允許所有域名
      },
    ],
  },
};

export default nextConfig;
