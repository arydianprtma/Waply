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

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
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
        replyMessage: "{Halo|Hai|Selamat siang} {{pushName}}! 👋\n\nBerikut daftar harga layanan Waply:\n📦 *Starter*: Rp99.000/bln\n🚀 *Pro*: Rp199.000/bln\n💎 *Enterprise*: Hubungi tim sales kami.\n\nAda yang bisa kami bantu lagi?",
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
        replyMessage: "{Halo|Hai} {{pushName}}! Terima kasih telah menghubungi kami. Bot otomatis Waply siap membantu Anda. Silakan ketik *menu* untuk melihat opsi layanan kami.",
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
    return rules.filter((r) => r.userId === userId);
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

  const idx = rules.findIndex((r) => r.id === id && r.userId === userId);
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

  const filtered = rules.filter((r) => !(r.id === id && r.userId === userId));
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
  ensureDataDir();
  
  let allRules: AutoReplyRule[] = [];
  try {
    const data = fs.readFileSync(AUTOREPLY_FILE, "utf-8");
    allRules = JSON.parse(data);
  } catch {
    allRules = [];
  }

  // Prioritas rules:
  // 1. Rules milik userId spesifik (jika bukan admin-default-user)
  // 2. Rules kustom non-demo yang aktif
  // 3. Rules demo bawaan (rule_demo_*)
  const activeRules = allRules.filter((r) => r.isActive && (!r.deviceId || !deviceId || r.deviceId === deviceId));
  
  const userRules = userId && userId !== "admin-default-user" 
    ? activeRules.filter((r) => r.userId === userId) 
    : [];
  const customRules = activeRules.filter((r) => !r.id.startsWith("rule_demo_") && (!userId || r.userId !== userId));
  const demoRules = activeRules.filter((r) => r.id.startsWith("rule_demo_"));

  const rules: AutoReplyRule[] = [...userRules, ...customRules, ...demoRules];
  const cleanText = incomingText.trim().toLowerCase();

  let matchedRule: AutoReplyRule | null = null;

  // Filter rules compatible with this device
  const eligibleRules = rules.filter((r) => !r.deviceId || !deviceId || r.deviceId === deviceId);

  // Tier 1: EXACT match (Highest Priority)
  for (const rule of eligibleRules) {
    if (rule.matchType === "EXACT") {
      const match = rule.keywords.some((k) => k.trim().toLowerCase() === cleanText);
      if (match) {
        matchedRule = rule;
        break;
      }
    }
  }

  // Tier 2: STARTS_WITH match (Prefix commands like /info, !menu)
  if (!matchedRule) {
    for (const rule of eligibleRules) {
      if (rule.matchType === "STARTS_WITH") {
        const match = rule.keywords.some((k) => cleanText.startsWith(k.trim().toLowerCase()));
        if (match) {
          matchedRule = rule;
          break;
        }
      }
    }
  }

  // Tier 3: CONTAINS match (Keyword search within sentence)
  if (!matchedRule) {
    for (const rule of eligibleRules) {
      if (rule.matchType === "CONTAINS") {
        const match = rule.keywords.some((k) => cleanText.includes(k.trim().toLowerCase()));
        if (match) {
          matchedRule = rule;
          break;
        }
      }
    }
  }

  // Tier 4: REGEX match
  if (!matchedRule) {
    for (const rule of eligibleRules) {
      if (rule.matchType === "REGEX") {
        try {
          const regex = new RegExp(rule.keywords[0] || "", "i");
          if (regex.test(incomingText)) {
            matchedRule = rule;
            break;
          }
        } catch {}
      }
    }
  }

  // Tier 5: FALLBACK rule (Default responder)
  if (!matchedRule) {
    matchedRule = eligibleRules.find((r) => r.matchType === "FALLBACK") || null;
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
