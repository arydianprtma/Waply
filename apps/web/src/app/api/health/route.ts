import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || "http://localhost:3002";

export async function GET() {
  const startTime = Date.now();
  let gatewayStatus = "unreachable";
  let connectedDevicesCount = 0;

  try {
    const gwRes = await fetch(`${GATEWAY_URL}/api/sessions`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (gwRes.ok) {
      const gwJson = await gwRes.json();
      gatewayStatus = "healthy";
      if (Array.isArray(gwJson.data)) {
        connectedDevicesCount = gwJson.data.filter(
          (d: any) => d.status === "connected" || d.status === "CONNECTED"
        ).length;
      }
    }
  } catch (err: any) {
    gatewayStatus = `offline (${err.message || "timeout"})`;
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: "healthy",
    service: "sendora-web",
    version: "1.0.0",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    responseTimeMs,
    environment: process.env.NODE_ENV || "development",
    dependencies: {
      gateway: {
        status: gatewayStatus,
        url: GATEWAY_URL,
        connectedDevices: connectedDevicesCount,
      },
      storage: {
        status: fs.existsSync(path.resolve(process.cwd(), ".sendora-data")) ? "mounted" : "ready",
      },
    },
  });
}
