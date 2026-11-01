import type { NextConfig } from "next";

const apiOrigin = process.env.DUA_API_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // AI chat can take >10s; the default rewrite proxy otherwise 502s.
    proxyTimeout: 30_000,
  },
  async rewrites() {
    return [
      { source: "/v1/:path*", destination: `${apiOrigin}/v1/:path*` },
      { source: "/health", destination: `${apiOrigin}/health` },
    ];
  },
};

export default nextConfig;
