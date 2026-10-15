import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSubscription, saveSubscription, deleteUserInvoices, PlanId, Subscription } from "@/lib/billing";
import { getDataDirectory } from "./data-dir";

/**
 * Generate a professional, clean alphanumeric User ID
 * Format: usr_ + 12 alphanumeric lowercase characters (e.g. usr_7k9p2m4x8q1w)
 */
export function generateUserId(): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.randomBytes(12);
  let rand = "";
  for (let i = 0; i < 12; i++) {
    rand += chars[bytes[i] % chars.length];
  }
  return `usr_${rand}`;
}

export function isLegacyEmailUserId(id?: string): boolean {
  if (!id) return false;
  return (
    id.includes("_gmail_com") ||
    id.includes("_yahoo_com") ||
    id.includes("@") ||
    (id.startsWith("usr_") && id.includes("_com")) ||
    (id.startsWith("usr_") && id.includes("."))
  );
}

export type UserAccountStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  passwordHash?: string | null;
  status: UserAccountStatus;
  banReason?: string | null;
  avatarUrl?: string | null;
  planId: string;
  planStatus: "ACTIVE" | "EXPIRED" | "FREE" | "PENDING";
  messagesUsed: number;
  devicesCount: number;
  createdAt: string;
  lastLoginAt?: string | null;
  registeredIp?: string | null;
  lastLoginIp?: string | null;
  duplicateIpCount?: number;
  emailVerified?: boolean;
  emailVerifyToken?: string | null;
}

const DATA_DIR = getDataDirectory();
const USERS_FILE = path.join(DATA_DIR, "users_registry.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "admin-master-waply-01",
    email: "arydianprtma@gmail.com",
    name: "Ary Dian Pratama",
    role: "admin",
    status: "ACTIVE",
    banReason: null,
    planId: "PRO",
    planStatus: "ACTIVE",
    messagesUsed: 0,
    devicesCount: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    registeredIp: "127.0.0.1",
    lastLoginIp: "127.0.0.1",
  },
  {
    id: "admin-master-waply-02",
    email: "admin@waply.id",
    name: "Waply Super Admin",
    role: "admin",
    status: "ACTIVE",
    banReason: null,
    planId: "PRO",
    planStatus: "ACTIVE",
    messagesUsed: 0,
    devicesCount: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    registeredIp: "127.0.0.1",
    lastLoginIp: "127.0.0.1",
  },
];

/**
 * Returns all managed users with dynamic duplicate IP count calculation.
 */
export function getAllManagedUsers(): ManagedUser[] {
  ensureDataDir();
  try {
    let list: ManagedUser[] = [];
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(INITIAL_USERS, null, 2));
      list = INITIAL_USERS;
    } else {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      list = JSON.parse(raw);
    }

    // Deduplicate user list by email
    const dedupedMap = new Map<string, ManagedUser>();
    for (const u of list) {
      const key = (u.email || u.id).toLowerCase();
      if (!dedupedMap.has(key)) {
        dedupedMap.set(key, u);
      } else {
        // Merge preferring active plan, newer login, fuller name, or non-empty avatarUrl
        const existing = dedupedMap.get(key)!;
        const preferU = (u.planId && u.planId !== "FREE") || (!existing.name && u.name) || (u.lastLoginAt && (!existing.lastLoginAt || new Date(u.lastLoginAt) > new Date(existing.lastLoginAt)));
        const mergedAvatar = u.avatarUrl || existing.avatarUrl || null;
        if (preferU) {
          dedupedMap.set(key, { ...existing, ...u, avatarUrl: mergedAvatar });
        } else {
          dedupedMap.set(key, { ...existing, avatarUrl: mergedAvatar });
        }
      }
    }
    list = Array.from(dedupedMap.values());

    // Calculate duplicate IP count for every user
    const ipCounts = new Map<string, number>();
    for (const u of list) {
      const ip = u.lastLoginIp || u.registeredIp;
      if (ip && ip !== "127.0.0.1" && ip !== "::1") {
        ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
      }
    }

    return list.map((u) => {
      const ip = u.lastLoginIp || u.registeredIp;
      const count = ip && ip !== "127.0.0.1" && ip !== "::1" ? (ipCounts.get(ip) || 1) : 1;
      
      // Dynamic live subscription resolution: check ID, then email
      let sub = getSubscription(u.id);
      if ((!sub || sub.planId === "FREE") && u.email) {
        const subByEmail = getSubscription(u.email);
        if (subByEmail && subByEmail.planId !== "FREE") {
          sub = subByEmail;
        }
      }

      const effectivePlanId = (sub && sub.planId !== "FREE" ? sub.planId : u.planId) || "FREE";
      let effectivePlanStatus: "ACTIVE" | "EXPIRED" | "FREE" | "PENDING" =
        sub && sub.planId !== "FREE"
          ? (sub.status as any)
          : u.planStatus || (effectivePlanId === "FREE" ? "FREE" : "ACTIVE");

      let liveMessagesUsed = u.messagesUsed || 0;
      try {
        const msgsFile = path.join(DATA_DIR, "messages.json");
        if (fs.existsSync(msgsFile)) {
          const allMsgs: any[] = JSON.parse(fs.readFileSync(msgsFile, "utf-8") || "[]");
          liveMessagesUsed = allMsgs.filter(
            (m) => (m.userId === u.id || (u.email && m.userId === u.email)) && m.status === "SENT"
          ).length;
        }
      } catch {}

      return {
        ...u,
        planId: effectivePlanId,
        planStatus: effectivePlanStatus,
        messagesUsed: liveMessagesUsed,
        duplicateIpCount: count,
      };
    });
  } catch {
    return INITIAL_USERS;
  }
}

export function saveManagedUsers(users: ManagedUser[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function registerOrSyncUser(user: {
  id: string;
  email: string;
  name: string;
  role?: "admin" | "user";
  passwordHash?: string | null;
  ipAddress?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  emailVerifyToken?: string | null;
}): ManagedUser {
  const users = getAllManagedUsers();
  const existingIdx = users.findIndex(
    (u) =>
      u.id === user.id ||
      (user.email && u.email && u.email.toLowerCase() === user.email.toLowerCase())
  );

  let sub = getSubscription(user.id);
  if ((!sub || sub.planId === "FREE") && user.email) {
    const subByEmail = getSubscription(user.email);
    if (subByEmail && subByEmail.planId !== "FREE") {
      sub = subByEmail;
    }
  }

  const cleanIp = user.ipAddress && user.ipAddress.trim() ? user.ipAddress.trim() : null;

  if (existingIdx >= 0) {
    const existing = users[existingIdx];
    const prevRegIp = existing.registeredIp;
    const isPrevRegLocal = !prevRegIp || prevRegIp === "127.0.0.1" || prevRegIp === "::1";
    const updatedRegIp =
      cleanIp && cleanIp !== "127.0.0.1" && isPrevRegLocal
        ? cleanIp
        : prevRegIp || cleanIp || "127.0.0.1";
    const updatedLastIp =
      cleanIp && cleanIp !== "127.0.0.1"
        ? cleanIp
        : cleanIp || existing.lastLoginIp || "127.0.0.1";

    const effectivePlanId = (sub && sub.planId !== "FREE" ? sub.planId : existing.planId) || "FREE";
    const effectivePlanStatus =
      sub && sub.planId !== "FREE"
        ? (sub.status as any)
        : existing.planStatus || (effectivePlanId === "FREE" ? "FREE" : "ACTIVE");

    const effectiveAvatar =
      user.avatarUrl !== undefined
        ? user.avatarUrl
        : existing.avatarUrl !== undefined
        ? existing.avatarUrl
        : null;

    // Auto-migrate legacy email-based user IDs (e.g. usr_arygaming53_gmail_com) to clean alphanumeric ID
    let effectiveUserId = existing.id;
    if (
      isLegacyEmailUserId(effectiveUserId) &&
      effectiveUserId !== "admin-master-waply-01" &&
      existing.role !== "admin"
    ) {
      const newAlphanumericId = generateUserId();
      // Update invoices in invoices.json
      try {
        const invFile = path.join(DATA_DIR, "invoices.json");
        if (fs.existsSync(invFile)) {
          const invs = JSON.parse(fs.readFileSync(invFile, "utf-8") || "[]");
          let changed = false;
          invs.forEach((inv: any) => {
            if (
              inv.userId === effectiveUserId ||
              (existing.email && inv.customerEmail?.toLowerCase() === existing.email.toLowerCase())
            ) {
              inv.userId = newAlphanumericId;
              changed = true;
            }
          });
          if (changed) fs.writeFileSync(invFile, JSON.stringify(invs, null, 2));
        }
      } catch {}

      // Update subscription in subscription.json
      try {
        const subFile = path.join(DATA_DIR, "subscription.json");
        if (fs.existsSync(subFile)) {
          const subs = JSON.parse(fs.readFileSync(subFile, "utf-8") || "{}");
          if (subs[effectiveUserId]) {
            subs[newAlphanumericId] = { ...subs[effectiveUserId], userId: newAlphanumericId };
            delete subs[effectiveUserId];
            fs.writeFileSync(subFile, JSON.stringify(subs, null, 2));
          }
        }
      } catch {}

      effectiveUserId = newAlphanumericId;
    } else if (user.id && !isLegacyEmailUserId(user.id)) {
      effectiveUserId = user.id;
    }

    users[existingIdx] = {
      ...existing,
      id: effectiveUserId,
      name: user.name || existing.name,
      email: user.email || existing.email,
      role: user.role || existing.role,
      passwordHash: user.passwordHash !== undefined ? user.passwordHash : existing.passwordHash,
      avatarUrl: effectiveAvatar,
      planId: effectivePlanId,
      planStatus: effectivePlanStatus,
      lastLoginAt: new Date().toISOString(),
      registeredIp: updatedRegIp,
      lastLoginIp: updatedLastIp,
      emailVerified: user.emailVerified !== undefined ? user.emailVerified : existing.emailVerified,
      emailVerifyToken: user.emailVerifyToken !== undefined ? user.emailVerifyToken : existing.emailVerifyToken,
    };
    saveManagedUsers(users);
    return users[existingIdx];
  }

  const effectivePlanId = (sub && sub.planId) || "FREE";
  const effectivePlanStatus = sub && sub.status === "ACTIVE" ? "ACTIVE" : (effectivePlanId === "FREE" ? "FREE" : "ACTIVE");

  const effectiveNewId =
    user.id && !isLegacyEmailUserId(user.id)
      ? user.id
      : generateUserId();

  const newUser: ManagedUser = {
    id: effectiveNewId,
    email: user.email,
    name: user.name || user.email.split("@")[0],
    role: user.role || (user.email === "admin@waply.id" ? "admin" : "user"),
    passwordHash: user.passwordHash || null,
    status: "ACTIVE",
    banReason: null,
    avatarUrl: user.avatarUrl || null,
    planId: effectivePlanId,
    planStatus: effectivePlanStatus,
    messagesUsed: 0,
    devicesCount: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    registeredIp: cleanIp || "127.0.0.1",
    lastLoginIp: cleanIp || "127.0.0.1",
    emailVerified: user.email === "admin@waply.id" ? true : (user.emailVerified ?? false),
    emailVerifyToken: user.emailVerifyToken || null,
  };

  users.push(newUser);
  saveManagedUsers(users);
  return newUser;
}

export function verifyUserEmail(email: string, token: string): boolean {
  const users = getAllManagedUsers();
  const cleanEmail = email.trim().toLowerCase();
  const idx = users.findIndex(
    (u) => u.email.toLowerCase() === cleanEmail && u.emailVerifyToken === token
  );

  if (idx === -1) return false;

  users[idx].emailVerified = true;
  users[idx].emailVerifyToken = null;
  saveManagedUsers(users);
  return true;
}

export function updateUserAvatar(
  userIdOrEmail: string,
  avatarUrl: string | null
): ManagedUser | null {
  const users = getAllManagedUsers();
  const clean = userIdOrEmail.trim().toLowerCase();
  const idx = users.findIndex(
    (u) => u.id === userIdOrEmail || u.email.toLowerCase() === clean
  );
  if (idx === -1) return null;

  users[idx].avatarUrl = avatarUrl;
  saveManagedUsers(users);
  return users[idx];
}

export function getUserById(userId: string): ManagedUser | null {
  const users = getAllManagedUsers();
  return users.find((u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase()) || null;
}

export function getUserByEmail(email: string): ManagedUser | null {
  const users = getAllManagedUsers();
  const clean = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === clean) || null;
}

export function getUsersByIp(ip: string): ManagedUser[] {
  const users = getAllManagedUsers();
  const clean = ip.trim();
  return users.filter((u) => u.lastLoginIp === clean || u.registeredIp === clean);
}

export function banUsersByIp(
  ip: string,
  banReason: string = "Spam multi-akun free trial dari IP yang sama"
): { bannedCount: number; users: ManagedUser[] } {
  const users = getAllManagedUsers();
  const clean = ip.trim();
  let count = 0;

  for (let i = 0; i < users.length; i++) {
    const isTarget = users[i].lastLoginIp === clean || users[i].registeredIp === clean;
    if (isTarget && users[i].role !== "admin" && users[i].id !== "admin-master-waply-01") {
      users[i].status = "BANNED";
      users[i].banReason = banReason;
      count++;
    }
  }

  saveManagedUsers(users);
  return { bannedCount: count, users: getAllManagedUsers() };
}

export function updateUserStatus(
  userId: string,
  status: UserAccountStatus,
  banReason?: string
): ManagedUser | null {
  const users = getAllManagedUsers();
  const idx = users.findIndex((u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
  if (idx === -1) return null;

  users[idx].status = status;
  users[idx].banReason = status === "BANNED" ? banReason || "Pelanggaran aturan sistem Waply" : null;
  saveManagedUsers(users);
  return users[idx];
}

export function updateUserPlan(
  userId: string,
  planId: string,
  durationDays: number = 30
): ManagedUser | null {
  const users = getAllManagedUsers();
  const idx = users.findIndex(
    (u) =>
      u.id === userId ||
      u.email.toLowerCase() === userId.toLowerCase() ||
      (userId.includes("@") && u.email.toLowerCase() === userId.toLowerCase())
  );
  if (idx === -1) return null;

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + durationDays);

  const subData: Subscription = {
    userId: users[idx].id,
    planId: planId as PlanId,
    status: planId === "FREE" ? "FREE" : "ACTIVE",
    startDate: planId === "FREE" ? null : now.toISOString(),
    endDate: planId === "FREE" ? null : endDate.toISOString(),
    updatedAt: now.toISOString(),
  };

  saveSubscription(subData);
  if (users[idx].email && users[idx].email.toLowerCase() !== users[idx].id.toLowerCase()) {
    saveSubscription({ ...subData, userId: users[idx].email.toLowerCase() });
  }

  users[idx].planId = planId;
  users[idx].planStatus = planId === "FREE" ? "FREE" : "ACTIVE";
  saveManagedUsers(users);
  return users[idx];
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const users = getAllManagedUsers();
  const target = users.find((u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());

  const targetEmail = (target?.email || (userId.includes("@") ? userId : "")).toLowerCase().trim();
  const targetId = target?.id || userId;

  if (
    target?.role === "admin" ||
    targetEmail === "admin@waply.id" ||
    targetId === "admin-master-waply-01"
  ) {
    return { success: false, error: "Akun Super Admin utama tidak dapat dihapus!" };
  }

  // 1. Remove from managed users list
  if (target) {
    const remaining = users.filter((u) => u.id !== target.id && u.email.toLowerCase() !== target.email.toLowerCase());
    saveManagedUsers(remaining);

    // 2. Clean up user subscription cache completely
    try {
      const subFile = path.join(DATA_DIR, "subscription.json");
      if (fs.existsSync(subFile)) {
        const subData = JSON.parse(fs.readFileSync(subFile, "utf-8") || "{}");
        if (target.id && subData[target.id]) delete subData[target.id];
        if (target.email && subData[target.email.toLowerCase()]) delete subData[target.email.toLowerCase()];
        fs.writeFileSync(subFile, JSON.stringify(subData, null, 2));
      }
    } catch {}
  }

  // 3. Clean up user invoices permanently
  try {
    deleteUserInvoices(targetId, targetEmail);
  } catch {}

  // 4. Delete user in Supabase Auth backend
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (sbUrl && sbKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(sbUrl, sbKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Try deleting by direct UUID
      if (targetId && !targetId.startsWith("usr_") && targetId.includes("-")) {
        await supabaseAdmin.auth.admin.deleteUser(targetId).catch(() => {});
      }

      // If email is present, lookup user in Supabase and delete
      if (targetEmail) {
        const { data } = await supabaseAdmin.auth.admin.listUsers();
        const matches = data?.users?.filter(
          (u) => u.email?.toLowerCase() === targetEmail || u.id === targetId
        ) || [];

        for (const match of matches) {
          await supabaseAdmin.auth.admin.deleteUser(match.id);
        }
      }
    } catch (sbErr: any) {
      console.error("[deleteUser] Supabase admin deletion error:", sbErr.message);
    }
  }

  return { success: true };
}

export function getAdminUserStats() {
  const users = getAllManagedUsers();
  const totalUsers = users.length;
  const activeSubscribed = users.filter((u) => u.planStatus === "ACTIVE" && u.planId !== "FREE").length;
  const freeUsers = users.filter((u) => u.planId === "FREE" || u.planStatus === "FREE").length;
  const bannedUsers = users.filter((u) => u.status === "BANNED" || u.status === "SUSPENDED").length;

  const duplicateIpUsers = users.filter((u) => (u.duplicateIpCount || 0) > 1).length;

  return {
    totalUsers,
    activeSubscribed,
    freeUsers,
    bannedUsers,
    duplicateIpUsers,
  };
}
