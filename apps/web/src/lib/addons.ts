import fs from "fs";
import path from "path";
import { AddonItem, UserAddon, AddonType } from "./addon-types";
import { getSubscription } from "./billing";

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const ADDONS_FILE = path.join(DATA_DIR, "addons_catalog.json");
const USER_ADDONS_FILE = path.join(DATA_DIR, "user_addons.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export const DEFAULT_ADDONS: Record<string, AddonItem> = {};

export function getAllAddons(): Record<string, AddonItem> {
  ensureDataDir();
  try {
    if (!fs.existsSync(ADDONS_FILE)) {
      fs.writeFileSync(ADDONS_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    const raw = fs.readFileSync(ADDONS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAddons(addons: Record<string, AddonItem>): void {
  ensureDataDir();
  fs.writeFileSync(ADDONS_FILE, JSON.stringify(addons, null, 2));
}

export function createOrUpdateAddon(addon: AddonItem): AddonItem {
  const all = getAllAddons();
  all[addon.id] = {
    ...addon,
    createdAt: all[addon.id]?.createdAt || new Date().toISOString(),
  };
  saveAddons(all);
  return all[addon.id];
}

export function deleteAddon(addonId: string): boolean {
  const all = getAllAddons();
  if (all[addonId]) {
    delete all[addonId];
    saveAddons(all);
    return true;
  }
  return false;
}

// ─── User Purchased Addons ───────────────────────────────────────────────────

function getAllUserAddonsMap(): Record<string, UserAddon[]> {
  ensureDataDir();
  try {
    if (fs.existsSync(USER_ADDONS_FILE)) {
      return JSON.parse(fs.readFileSync(USER_ADDONS_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveUserAddonsMap(map: Record<string, UserAddon[]>): void {
  ensureDataDir();
  fs.writeFileSync(USER_ADDONS_FILE, JSON.stringify(map, null, 2));
}

export function getUserAddons(userId: string): UserAddon[] {
  const map = getAllUserAddonsMap();
  const cleanId = userId ? userId.trim() : "";
  let targetKey = cleanId;
  let list = map[cleanId] || [];

  // Cross-reference by email or alternate ID if empty
  if (list.length === 0 && cleanId) {
    try {
      const usersFile = path.join(DATA_DIR, "users_registry.json");
      if (fs.existsSync(usersFile)) {
        const users: any[] = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        const found = users.find(
          (u) =>
            u.id === cleanId ||
            u.id?.toLowerCase() === cleanId.toLowerCase() ||
            (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
        );
        if (found) {
          if (found.id && map[found.id]?.length > 0) {
            targetKey = found.id;
            list = map[found.id];
          } else if (found.email && map[found.email.toLowerCase()]?.length > 0) {
            targetKey = found.email.toLowerCase();
            list = map[found.email.toLowerCase()];
          }
        }
      }
    } catch {}
  }

  const now = new Date();
  let changed = false;
  const updatedList = list.map((item) => {
    const isPast = item.expiresAt ? new Date(item.expiresAt) < now : false;
    if (item.status === "ACTIVE" && isPast) {
      changed = true;
      return { ...item, status: "EXPIRED" as const };
    }
    return item;
  });

  if (changed) {
    map[targetKey] = updatedList;
    saveUserAddonsMap(map);
  }

  return updatedList;
}

export function getUserAddonTotals(userId: string): {
  extraDevices: number;
  extraMessages: number;
  activeAddons: UserAddon[];
} {
  const now = new Date();
  // Filter ONLY truly active and non-expired addons
  const addons = getUserAddons(userId).filter((a) => {
    if (a.status !== "ACTIVE") return false;
    if (a.expiresAt) {
      const exp = new Date(a.expiresAt);
      if (!isNaN(exp.getTime()) && exp < now) return false;
    }
    return true;
  });

  let extraDevices = 0;
  let extraMessages = 0;

  for (const a of addons) {
    if (a.type === "DEVICE") {
      extraDevices += a.amount;
    } else if (a.type === "MESSAGES") {
      extraMessages += a.amount;
    }
  }

  return {
    extraDevices,
    extraMessages,
    activeAddons: addons,
  };
}

export function grantUserAddon(params: {
  userId: string;
  addonId: string;
  customAmount?: number;
  pricePaid?: number;
  orderId?: string;
  expiresAt?: string | null;
}): UserAddon {
  const allAddons = getAllAddons();
  const catalog = allAddons[params.addonId];
  const map = getAllUserAddonsMap();
  const list = map[params.userId] || [];
  const sub = getSubscription(params.userId);
  const now = new Date();

  // If orderId is provided, prevent duplicate activation for the same invoice order
  if (params.orderId) {
    const existing = list.find(
      (item) =>
        item.orderId === params.orderId &&
        item.addonId === params.addonId &&
        item.status === "ACTIVE"
    );
    if (existing) {
      return existing;
    }
  }

  // Default expiresAt follows user active subscription endDate for device addons
  let expiry = params.expiresAt;
  if (expiry === undefined) {
    if (catalog?.type === "DEVICE" && sub?.endDate) {
      expiry = sub.endDate;
    } else {
      expiry = null;
    }
  }

  const userAddon: UserAddon = {
    id: `uadd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: params.userId,
    addonId: params.addonId,
    name: catalog?.name || params.addonId,
    type: catalog?.type || (params.addonId.includes("DEV") ? "DEVICE" : "MESSAGES"),
    amount: params.customAmount || catalog?.amount || 1,
    pricePaid: params.pricePaid !== undefined ? params.pricePaid : catalog?.price || 0,
    orderId: params.orderId,
    activatedAt: now.toISOString(),
    expiresAt: expiry,
    status: "ACTIVE",
  };

  list.push(userAddon);
  map[params.userId] = list;
  saveUserAddonsMap(map);
  return userAddon;
}

export function activateUserAddonsFromInvoice(
  userId: string,
  addonIds: string[],
  orderId?: string
): UserAddon[] {
  const results: UserAddon[] = [];
  for (const addonId of addonIds) {
    const granted = grantUserAddon({
      userId,
      addonId,
      orderId,
    });
    results.push(granted);
  }
  return results;
}
