import fs from "fs";
import path from "path";
import { getSubscription, saveSubscription, PlanId, Subscription } from "@/lib/billing";

export type UserAccountStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  status: UserAccountStatus;
  banReason?: string | null;
  planId: string;
  planStatus: "ACTIVE" | "EXPIRED" | "FREE" | "PENDING";
  messagesUsed: number;
  devicesCount: number;
  createdAt: string;
  lastLoginAt?: string | null;
  registeredIp?: string | null;
  lastLoginIp?: string | null;
  duplicateIpCount?: number;
}

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const USERS_FILE = path.join(DATA_DIR, "users_registry.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "admin-master-waply-01",
    email: "admin@waply.id",
    name: "Waply Super Admin",
    role: "admin",
    status: "ACTIVE",
    banReason: null,
    planId: "ENTERPRISE",
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
        // Merge preferring active plan, newer login, or fuller name
        const existing = dedupedMap.get(key)!;
        const preferU = (u.planId && u.planId !== "FREE") || (!existing.name && u.name) || (u.lastLoginAt && (!existing.lastLoginAt || new Date(u.lastLoginAt) > new Date(existing.lastLoginAt)));
        if (preferU) {
          dedupedMap.set(key, { ...existing, ...u });
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

      return {
        ...u,
        planId: effectivePlanId,
        planStatus: effectivePlanStatus,
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
  ipAddress?: string | null;
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

    users[existingIdx] = {
      ...existing,
      id: user.id || existing.id,
      name: user.name || existing.name,
      email: user.email || existing.email,
      role: user.role || existing.role,
      planId: effectivePlanId,
      planStatus: effectivePlanStatus,
      lastLoginAt: new Date().toISOString(),
      registeredIp: updatedRegIp,
      lastLoginIp: updatedLastIp,
    };
    saveManagedUsers(users);
    return users[existingIdx];
  }

  const effectivePlanId = (sub && sub.planId) || "FREE";
  const effectivePlanStatus = sub && sub.status === "ACTIVE" ? "ACTIVE" : (effectivePlanId === "FREE" ? "FREE" : "ACTIVE");

  const newUser: ManagedUser = {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0],
    role: user.role || (user.email === "admin@waply.id" ? "admin" : "user"),
    status: "ACTIVE",
    banReason: null,
    planId: effectivePlanId,
    planStatus: effectivePlanStatus,
    messagesUsed: 0,
    devicesCount: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    registeredIp: cleanIp || "127.0.0.1",
    lastLoginIp: cleanIp || "127.0.0.1",
  };

  users.push(newUser);
  saveManagedUsers(users);
  return newUser;
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

export function deleteUser(userId: string): { success: boolean; error?: string } {
  const users = getAllManagedUsers();
  const target = users.find((u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());

  if (!target) {
    return { success: false, error: "User tidak ditemukan" };
  }

  if (
    target.role === "admin" ||
    target.email.toLowerCase() === "admin@waply.id" ||
    target.id === "admin-master-waply-01"
  ) {
    return { success: false, error: "Akun Super Admin utama tidak dapat dihapus!" };
  }

  const remaining = users.filter((u) => u.id !== target.id && u.email.toLowerCase() !== target.email.toLowerCase());
  saveManagedUsers(remaining);

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
