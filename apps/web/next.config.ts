import type { NextConfig } from "next";

const customOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const appUrlHost = process.env.NEXT_PUBLIC_APP_URL
  ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_APP_URL).host;
      } catch {
        return "";
      }
    })()
  : "";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  allowedDevOrigins: [
    ...customOrigins,
    ...(appUrlHost ? [appUrlHost] : []),
    "localhost:3001",
    "localhost:3000",
    "127.0.0.1:3001",
    "127.0.0.1:3000",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
