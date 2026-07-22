import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase proxy timeout so slow AI calls don't cause "socket hang up"
  experimental: {
    proxyTimeout: 120_000, // 120 seconds
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
