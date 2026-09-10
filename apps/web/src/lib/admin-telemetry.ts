import os from "os";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const GATEWAY_URL =
  process.env.GATEWAY_INTERNAL_URL || "http://localhost:3002";

export interface SystemTelemetry {
  server: {
    hostname: string;
    platform: string;
    arch: string;
    nodeVersion: string;
    uptimeSeconds: number;
    cpuCores: number;
    cpuModel: string;
    totalMemBytes: number;
    freeMemBytes: number;
    usedMemBytes: number;
    memoryUsagePercent: number;
    loadAverage: number[];
  };
  process: {
    pid: number;
    uptimeSeconds: number;
    rssBytes: number;
    heapTotalBytes: number;
    heapUsedBytes: number;
    heapUsagePercent: number;
  };
  gateway: {
    status: "ONLINE" | "OFFLINE" | "DEGRADED";
    url: string;
    latencyMs?: number;
    activeSessionsCount?: number;
    details?: any;
  };
  storage: {
    dataDirSizeBytes: number;
    invoicesCount: number;
    usersCount: number;
  };
}

function getDirectorySize(dirPath: string): number {
  let size = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += getDirectorySize(fullPath);
      } else if (file.isFile()) {
        size += fs.statSync(fullPath).size;
      }
    }
  } catch {}
  return size;
}

export async function getSystemTelemetry(): Promise<SystemTelemetry> {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsagePercent = Math.round((usedMem / totalMem) * 100);

  const memUsage = process.memoryUsage();
  const heapUsagePercent = Math.round(
    (memUsage.heapUsed / memUsage.heapTotal) * 100
  );

  // Check Gateway Health
  let gatewayStatus: "ONLINE" | "OFFLINE" | "DEGRADED" = "OFFLINE";
  let latencyMs = 0;
  let activeSessionsCount = 0;
  let gatewayDetails: any = null;

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${GATEWAY_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    latencyMs = Date.now() - start;

    if (res.ok) {
      const json = await res.json();
      gatewayStatus = "ONLINE";
      gatewayDetails = json;
      activeSessionsCount = json.activeSessions || 0;
    } else {
      gatewayStatus = "DEGRADED";
    }
  } catch {
    gatewayStatus = "OFFLINE";
    latencyMs = Date.now() - start;
  }

  // Storage Stats
  const dataDirSize = getDirectorySize(DATA_DIR);

  let invoicesCount = 0;
  try {
    const invFile = path.join(DATA_DIR, "invoices.json");
    if (fs.existsSync(invFile)) {
      const raw = fs.readFileSync(invFile, "utf-8");
      invoicesCount = JSON.parse(raw || "[]").length;
    }
  } catch {}

  let usersCount = 0;
  try {
    const uFile = path.join(DATA_DIR, "users_registry.json");
    if (fs.existsSync(uFile)) {
      const raw = fs.readFileSync(uFile, "utf-8");
      usersCount = JSON.parse(raw || "[]").length;
    }
  } catch {}

  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown CPU";

  return {
    server: {
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(os.uptime()),
      cpuCores: cpus.length,
      cpuModel,
      totalMemBytes: totalMem,
      freeMemBytes: freeMem,
      usedMemBytes: usedMem,
      memoryUsagePercent,
      loadAverage: os.loadavg ? os.loadavg() : [0, 0, 0],
    },
    process: {
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      rssBytes: memUsage.rss,
      heapTotalBytes: memUsage.heapTotal,
      heapUsedBytes: memUsage.heapUsed,
      heapUsagePercent,
    },
    gateway: {
      status: gatewayStatus,
      url: GATEWAY_URL,
      latencyMs,
      activeSessionsCount,
      details: gatewayDetails,
    },
    storage: {
      dataDirSizeBytes: dataDirSize,
      invoicesCount,
      usersCount,
    },
  };
}
