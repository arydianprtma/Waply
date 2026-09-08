import fs from "fs";
import path from "path";
import { prisma } from "@sendora/database";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".sendora-data");
const LOCAL_BLACKLIST_FILE = path.join(LOCAL_STORAGE_DIR, "blacklist.json");

export interface BlacklistItem {
  id: string;
  userId: string;
  phoneNumber: string;
  reason: string;
  notes?: string | null;
  createdAt: string;
}

export function getLocalBlacklist(userId?: string): BlacklistItem[] {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_BLACKLIST_FILE)) {
      fs.writeFileSync(LOCAL_BLACKLIST_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(LOCAL_BLACKLIST_FILE, "utf-8");
    const list: BlacklistItem[] = JSON.parse(data || "[]");
    if (userId) {
      return list.filter((item: any) => {
        if (item.userId === userId) return true;
        if (item.reason === "UNSUBSCRIBE_KEYWORD") return true;
        if (
          (userId === "admin-master-sendora-01" || userId === "admin-default-user" || userId.startsWith("usr_")) &&
          (item.userId === "admin-master-sendora-01" || item.userId === "admin-default-user" || item.reason === "UNSUBSCRIBE_KEYWORD")
        ) {
          return true;
        }
        return false;
      });
    }
    return list;
  } catch {
    return [];
  }
}

export function isBlacklisted(userId: string, phoneNumber: string): boolean {
  const clean = phoneNumber.replace(/\D/g, "");
  if (!clean) return false;
  const list = getLocalBlacklist();
  return list.some((item: any) => {
    const itemClean = item.phoneNumber ? item.phoneNumber.replace(/\D/g, "") : "";
    return itemClean === clean;
  });
}

export async function addToBlacklist(
  userId: string,
  phoneNumber: string,
  reason: "UNSUBSCRIBE_KEYWORD" | "MANUAL" = "UNSUBSCRIBE_KEYWORD",
  notes?: string
): Promise<void> {
  const clean = phoneNumber.replace(/\D/g, "");
  if (!clean) return;

  // 1. Save to Local JSON File (Fast sync backup)
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    const all = getLocalBlacklist();
    const alreadyExists = all.some(
      (item: any) =>
        (item.userId === userId || item.userId === "admin-master-sendora-01" || item.userId === "admin-default-user") &&
        item.phoneNumber.replace(/\D/g, "") === clean
    );
    if (!alreadyExists) {
      all.unshift({
        id: `bl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        phoneNumber: clean,
        reason,
        notes: notes || (reason === "UNSUBSCRIBE_KEYWORD" ? "Auto Opt-Out dari balasan STOP pelanggan" : null),
        createdAt: new Date().toISOString(),
      });
      fs.writeFileSync(LOCAL_BLACKLIST_FILE, JSON.stringify(all, null, 2));
    }
  } catch (err) {
    console.error("[Blacklist] Failed to save to local blacklist file:", err);
  }

  // 2. Save to Database via Prisma (if online)
  try {
    const existing = await prisma.blacklist.findFirst({
      where: { userId, phoneNumber: clean },
    });
    if (!existing) {
      await prisma.blacklist.create({
        data: {
          userId,
          phoneNumber: clean,
          reason,
          notes: notes || (reason === "UNSUBSCRIBE_KEYWORD" ? "Auto Opt-Out dari balasan STOP pelanggan" : null),
        },
      });
    }
  } catch {
    // Database might be offline / sqlite / fallback mode
  }
}

