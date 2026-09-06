import fs from "fs";
import path from "path";
import { parseSpintax } from "./spintax";

export type MatchType = "EXACT" | "CONTAINS" | "STARTS_WITH" | "REGEX" | "FALLBACK";

export interface AutoReplyRule {
  id: string;
  userId: string;
  name: string;
  matchType: MatchType;
  keywords: string[]; // e.g. ["harga", "pricelist", "biaya"]
  replyMessage: string; // Template with spintax e.g. "{Halo|Hai} {{pushName}}, harga kami mulai dari Rp50.000"
  deviceId: string | null; // null = all devices
  delaySec: number; // simulated typing delay in seconds (e.g. 2)
  isActive: boolean;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");
const AUTOREPLY_FILE = path.join(DATA_DIR, "autoreply.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(AUTOREPLY_FILE)) {
    // Initial sample rules
    const defaultRules: AutoReplyRule[] = [
      {
        id: "rule_demo_1",
        userId: "admin-default-user",
        name: "Info Layanan & Harga",
        matchType: "CONTAINS",
        keywords: ["harga", "pricelist", "biaya", "paket"],
        replyMessage: "{Halo|Hai|Selamat siang} {{pushName}}! 👋\n\nBerikut daftar harga layanan Sendora:\n📦 *Starter*: Rp99.000/bln\n🚀 *Pro*: Rp199.000/bln\n💎 *Enterprise*: Hubungi tim sales kami.\n\nAda yang bisa kami bantu lagi?",
        deviceId: null,
        delaySec: 2,
        isActive: true,
        triggerCount: 14,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "rule_demo_2",
        userId: "admin-default-user",
        name: "Salam Pembuka / Ping",
        matchType: "EXACT",
        keywords: ["ping", "p", "halo", "hai", "hi", "test"],
        replyMessage: "{Halo|Hai} {{pushName}}! Terima kasih telah menghubungi kami. Bot otomatis Sendora siap membantu Anda. Silakan ketik *menu* untuk melihat opsi layanan kami.",
        deviceId: null,
        delaySec: 1,
        isActive: true,
        triggerCount: 38,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(AUTOREPLY_FILE, JSON.stringify(defaultRules, null, 2));
  }
}

export function getAutoReplyRules(userId: string): AutoReplyRule[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(AUTOREPLY_FILE, "utf-8");
    const rules: AutoReplyRule[] = JSON.parse(data);
    return rules.filter((r) => r.userId === userId || r.userId === "admin-default-user");
  } catch {
    return [];
  }
}

export function getAutoReplyRuleById(id: string, userId: string): AutoReplyRule | null {
  const rules = getAutoReplyRules(userId);
  return rules.find((r) => r.id === id) || null;
}

export function createAutoReplyRule(
  userId: string,
  ruleData: Omit<AutoReplyRule, "id" | "userId" | "triggerCount" | "createdAt" | "updatedAt">
): AutoReplyRule {
  ensureDataDir();
  const raw = fs.readFileSync(AUTOREPLY_FILE, "utf-8");
  const rules: AutoReplyRule[] = JSON.parse(raw);

  const newRule: AutoReplyRule = {
    id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    ...ruleData,
    triggerCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  rules.unshift(newRule);
  fs.writeFileSync(AUTOREPLY_FILE, JSON.stringify(rules, null, 2));
  return newRule;
}

export function updateAutoReplyRule(
  id: string,
  userId: string,
  ruleData: Partial<Omit<AutoReplyRule, "id" | "userId" | "createdAt">>
): AutoReplyRule | null {
  ensureDataDir();
  const raw = fs.readFileSync(AUTOREPLY_FILE, "utf-8");
  const rules: AutoReplyRule[] = JSON.parse(raw);

  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  rules[idx] = {
    ...rules[idx],
    ...ruleData,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(AUTOREPLY_FILE, JSON.stringify(rules, null, 2));
  return rules[idx];
}

export function deleteAutoReplyRule(id: string, userId: string): boolean {
  ensureDataDir();
  const raw = fs.readFileSync(AUTOREPLY_FILE, "utf-8");
  const rules: AutoReplyRule[] = JSON.parse(raw);

  const filtered = rules.filter((r) => r.id !== id);
  if (filtered.length === rules.length) return false;

  fs.writeFileSync(AUTOREPLY_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export function incrementRuleTrigger(id: string) {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(AUTOREPLY_FILE, "utf-8");
    const rules: AutoReplyRule[] = JSON.parse(raw);
    const rule = rules.find((r) => r.id === id);
    if (rule) {
      rule.triggerCount = (rule.triggerCount || 0) + 1;
      fs.writeFileSync(AUTOREPLY_FILE, JSON.stringify(rules, null, 2));
    }
  } catch {}
}

/**
 * Evaluates an incoming message against all active auto-reply rules.
 */
export function findMatchingRule(
  userId: string,
  incomingText: string,
  deviceId?: string
): { rule: AutoReplyRule; renderedReply: string } | null {
  const rules = getAutoReplyRules(userId).filter((r) => r.isActive);
  const cleanText = incomingText.trim().toLowerCase();

  let matchedRule: AutoReplyRule | null = null;

  // 1. Check specific rules first (EXACT, CONTAINS, STARTS_WITH, REGEX)
  for (const rule of rules) {
    if (rule.deviceId && deviceId && rule.deviceId !== deviceId) {
      continue; // device mismatch
    }

    if (rule.matchType === "EXACT") {
      const match = rule.keywords.some((k) => k.trim().toLowerCase() === cleanText);
      if (match) {
        matchedRule = rule;
        break;
      }
    } else if (rule.matchType === "CONTAINS") {
      const match = rule.keywords.some((k) => cleanText.includes(k.trim().toLowerCase()));
      if (match) {
        matchedRule = rule;
        break;
      }
    } else if (rule.matchType === "STARTS_WITH") {
      const match = rule.keywords.some((k) => cleanText.startsWith(k.trim().toLowerCase()));
      if (match) {
        matchedRule = rule;
        break;
      }
    } else if (rule.matchType === "REGEX") {
      try {
        const regex = new RegExp(rule.keywords[0] || "", "i");
        if (regex.test(incomingText)) {
          matchedRule = rule;
          break;
        }
      } catch {}
    }
  }

  // 2. If no rule matched, check if there is a FALLBACK rule
  if (!matchedRule) {
    matchedRule = rules.find((r) => r.matchType === "FALLBACK" && (!r.deviceId || r.deviceId === deviceId)) || null;
  }

  if (!matchedRule) return null;

  // Render response with variables and Spintax
  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("id-ID", { dateStyle: "medium" });

  let rendered = matchedRule.replyMessage
    .replace(/\{\{time\}\}/g, timeStr)
    .replace(/\{\{date\}\}/g, dateStr);

  rendered = parseSpintax(rendered);

  return {
    rule: matchedRule,
    renderedReply: rendered,
  };
}
