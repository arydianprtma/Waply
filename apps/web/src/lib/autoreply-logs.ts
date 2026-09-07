import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");
const LOGS_FILE = path.join(DATA_DIR, "autoreply_logs.json");

export interface AutoReplyLog {
  id: string;
  userId: string;
  ruleId: string;
  ruleName: string;
  sender: string;
  inboundText: string;
  replyText: string;
  deviceId: string;
  success: boolean;
  createdAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, "[]");
}

export function getAutoReplyLogs(userId: string, limit = 100): AutoReplyLog[] {
  ensureDataDir();
  try {
    const all: AutoReplyLog[] = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    return all
      .filter((l) => l.userId === userId)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function saveAutoReplyLog(
  data: Omit<AutoReplyLog, "id" | "createdAt">
): AutoReplyLog {
  ensureDataDir();
  const logs: AutoReplyLog[] = fs.existsSync(LOGS_FILE)
    ? JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"))
    : [];

  const log: AutoReplyLog = {
    ...data,
    id: `arl_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    createdAt: new Date().toISOString(),
  };

  // Keep last 500 logs only
  logs.unshift(log);
  if (logs.length > 500) logs.splice(500);

  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
  return log;
}

export function clearAutoReplyLogs(userId?: string): void {
  ensureDataDir();
  if (!userId) {
    fs.writeFileSync(LOGS_FILE, "[]");
    return;
  }
  try {
    const logs: AutoReplyLog[] = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8") || "[]");
    const filtered = logs.filter((l) => l.userId !== userId);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(filtered, null, 2));
  } catch {}
}

