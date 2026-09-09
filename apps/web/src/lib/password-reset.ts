import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface PasswordResetRecord {
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const RESET_TOKENS_FILE = path.join(DATA_DIR, "password_resets.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadResetTokens(): PasswordResetRecord[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(RESET_TOKENS_FILE)) {
      fs.writeFileSync(RESET_TOKENS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const raw = fs.readFileSync(RESET_TOKENS_FILE, "utf-8");
    return JSON.parse(raw) as PasswordResetRecord[];
  } catch {
    return [];
  }
}

function saveResetTokens(tokens: PasswordResetRecord[]): void {
  ensureDataDir();
  fs.writeFileSync(RESET_TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

/**
 * Generate a new secure password reset token valid for 60 minutes.
 */
export function createPasswordResetToken(email: string): { token: string; expiresAt: string } {
  const cleanEmail = email.trim().toLowerCase();
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour

  const tokens = loadResetTokens();
  // Invalidate any prior active tokens for this email
  const filtered = tokens.filter((t) => t.email !== cleanEmail || t.used);

  filtered.push({
    email: cleanEmail,
    token,
    createdAt: now.toISOString(),
    expiresAt,
    used: false,
  });

  saveResetTokens(filtered);
  return { token, expiresAt };
}

/**
 * Check if a reset token is valid and unexpired.
 */
export function verifyPasswordResetToken(email: string, token: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const tokens = loadResetTokens();
  const record = tokens.find(
    (t) => t.email === cleanEmail && t.token === token && !t.used
  );

  if (!record) return false;
  if (new Date(record.expiresAt) < new Date()) return false;
  return true;
}

/**
 * Consume / invalidate a used reset token.
 */
export function consumePasswordResetToken(email: string, token: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const tokens = loadResetTokens();
  const index = tokens.findIndex(
    (t) => t.email === cleanEmail && t.token === token && !t.used
  );

  if (index === -1) return false;
  if (new Date(tokens[index].expiresAt) < new Date()) return false;

  tokens[index].used = true;
  saveResetTokens(tokens);
  return true;
}
