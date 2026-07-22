import type { NextConfig } from "next";

// BACKEND_URL is set in the Vercel dashboard (or Railway env vars).
// Falls back to localhost:8000 for local development.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Increase proxy timeout so slow AI calls don't cause "socket hang up"
  experimental: {
    proxyTimeout: 120_000, // 120 seconds
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
