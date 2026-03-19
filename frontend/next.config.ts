import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // Mitigate GHSA-3x4c-7xq6-9pq8: cap image cache TTL to limit disk growth
    minimumCacheTTL: 3600,
    // Limit sizes to prevent cache exhaustion
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
