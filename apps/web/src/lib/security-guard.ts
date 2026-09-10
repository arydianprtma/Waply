import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const SECURITY_CONFIG_FILE = path.join(DATA_DIR, "security_config.json");
const SECURITY_LOGS_FILE = path.join(DATA_DIR, "security_logs.json");

export interface SecurityConfig {
  enabled: boolean;
  action: "REJECT" | "WARN_ADMIN" | "SUSPEND_USER";
  autoSuspendThreshold: number; // e.g. suspend user if > 3 violations
  blockedKeywords: string[];
}

export interface SecurityViolationLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  recipientPhone?: string;
  matchedKeyword: string;
  snippet: string;
  actionTaken: string;
}

const DEFAULT_KEYWORDS = [
  "slot gacor",
  "judol",
  "judi online",
  "maxwin",
  "pragmatic play",
  "zeus slot",
  "togel online",
  "bandar togel",
  "poker online",
  "pinjol tanpa ktp",
  "pinjol ilegal",
  "dana kaget tipu",
  "transfer bca fiktif",
  "phishing login",
  "hack whatsapp",
  "sadap wa",
];

const DEFAULT_CONFIG: SecurityConfig = {
  enabled: true,
  action: "REJECT",
  autoSuspendThreshold: 3,
  blockedKeywords: DEFAULT_KEYWORDS,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getSecurityConfig(): SecurityConfig {
  ensureDataDir();
  try {
    if (!fs.existsSync(SECURITY_CONFIG_FILE)) {
      fs.writeFileSync(
        SECURITY_CONFIG_FILE,
        JSON.stringify(DEFAULT_CONFIG, null, 2)
      );
      return DEFAULT_CONFIG;
    }
    const raw = fs.readFileSync(SECURITY_CONFIG_FILE, "utf-8");
    return JSON.parse(raw || JSON.stringify(DEFAULT_CONFIG));
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveSecurityConfig(config: SecurityConfig): SecurityConfig {
  ensureDataDir();
  fs.writeFileSync(SECURITY_CONFIG_FILE, JSON.stringify(config, null, 2));
  return config;
}

export function getSecurityLogs(): SecurityViolationLog[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(SECURITY_LOGS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(SECURITY_LOGS_FILE, "utf-8");
    const logs: SecurityViolationLog[] = JSON.parse(raw || "[]");
    return logs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch {
    return [];
  }
}

export function logSecurityViolation(
  log: Omit<SecurityViolationLog, "id" | "timestamp">
): SecurityViolationLog {
  ensureDataDir();
  const logs = getSecurityLogs();
  const entry: SecurityViolationLog = {
    ...log,
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  // Keep last 500 logs
  const updated = [entry, ...logs].slice(0, 500);
  fs.writeFileSync(SECURITY_LOGS_FILE, JSON.stringify(updated, null, 2));
  return entry;
}

export function checkMessageSecurity(
  text: string,
  user?: { id?: string | null; name?: string | null; email?: string | null },
  recipientPhone?: string
): { isAllowed: boolean; matchedKeyword?: string; message?: string } {
  const config = getSecurityConfig();
  if (!config.enabled || !text) {
    return { isAllowed: true };
  }

  const normalizedText = text.toLowerCase();
  for (const kw of config.blockedKeywords) {
    const cleanKw = kw.trim().toLowerCase();
    if (!cleanKw) continue;

    if (normalizedText.includes(cleanKw)) {
      // Log violation
      logSecurityViolation({
        userId: user?.id || undefined,
        userName: user?.name || undefined,
        userEmail: user?.email || undefined,
        recipientPhone,
        matchedKeyword: cleanKw,
        snippet: text.length > 80 ? `${text.substring(0, 80)}...` : text,
        actionTaken: "Pesan Diblokir (KEYWORD_BLOCKED)",
      });

      return {
        isAllowed: false,
        matchedKeyword: cleanKw,
        message: `Pesan ditolak: Terdeteksi kata kunci terlarang ("${cleanKw}"). Pastikan pesan Anda mematuhi kebijakan anti-spam & anti-penipuan.`,
      };
    }
  }

  return { isAllowed: true };
}
