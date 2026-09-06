import type { NextConfig } from "next";

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  allowedDevOrigins: [
    ...allowedDevOrigins,
    "localhost:3001",
    "localhost:3000",
    "127.0.0.1:3001",
  ],
};

export default nextConfig;
