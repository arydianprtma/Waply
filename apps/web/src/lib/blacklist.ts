import fs from "fs";
import path from "path";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".sendora-data");
const LOCAL_BLACKLIST_FILE = path.join(LOCAL_STORAGE_DIR, "blacklist.json");

export function getLocalBlacklist(userId?: string): any[] {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_BLACKLIST_FILE)) {
      fs.writeFileSync(LOCAL_BLACKLIST_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(LOCAL_BLACKLIST_FILE, "utf-8");
    const list = JSON.parse(data || "[]");
    if (userId) {
      return list.filter((item: any) => item.userId === userId);
    }
    return list;
  } catch {
    return [];
  }
}

export function isBlacklisted(userId: string, phoneNumber: string): boolean {
  const clean = phoneNumber.replace(/\D/g, "");
  const list = getLocalBlacklist(userId);
  return list.some((item: any) => item.phoneNumber.replace(/\D/g, "") === clean);
}

export function addToBlacklist(
  userId: string,
  phoneNumber: string,
  reason: "UNSUBSCRIBE_KEYWORD" | "MANUAL" = "UNSUBSCRIBE_KEYWORD"
): void {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    const all = getLocalBlacklist();
    const clean = phoneNumber.replace(/\D/g, "");
    const alreadyExists = all.some(
      (item: any) => item.userId === userId && item.phoneNumber.replace(/\D/g, "") === clean
    );
    if (!alreadyExists) {
      all.unshift({
        id: `bl_${Date.now()}`,
        userId,
        phoneNumber: clean,
        reason,
        createdAt: new Date().toISOString(),
      });
      fs.writeFileSync(LOCAL_BLACKLIST_FILE, JSON.stringify(all, null, 2));
    }
  } catch (err) {
    console.error("[Blacklist] Failed to add to blacklist:", err);
  }
}
