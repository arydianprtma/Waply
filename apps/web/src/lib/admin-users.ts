import fs from "fs";
import path from "path";
import { getSubscription, saveSubscription, PlanId, getAllPlans, DEFAULT_PLANS } from "@/lib/billing";

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
}

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");
const USERS_FILE = path.join(DATA_DIR, "users_registry.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "admin-master-sendora-01",
    email: "admin@sendora.id",
    name: "Sendora Super Admin",
    role: "admin",
    status: "ACTIVE",
    banReason: null,
    planId: "ENTERPRISE",
    planStatus: "ACTIVE",
    messagesUsed: 0,
    devicesCount: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
];

export function getAllManagedUsers(): ManagedUser[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(INITIAL_USERS, null, 2));
      return INITIAL_USERS;
    }
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    const list: ManagedUser[] = JSON.parse(raw);
    return list;
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
}): ManagedUser {
  const users = getAllManagedUsers();
  const existingIdx = users.findIndex(
    (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
  );

  const sub = getSubscription(user.id);

  if (existingIdx >= 0) {
    users[existingIdx] = {
      ...users[existingIdx],
      id: user.id,
      name: user.name || users[existingIdx].name,
      email: user.email,
      role: user.role || users[existingIdx].role,
      planId: sub.planId || users[existingIdx].planId || "FREE",
      planStatus: sub.status === "ACTIVE" ? "ACTIVE" : (sub.planId === "FREE" ? "FREE" : "EXPIRED"),
      lastLoginAt: new Date().toISOString(),
    };
    saveManagedUsers(users);
    return users[existingIdx];
  }

  const newUser: ManagedUser = {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0],
    role: user.role || (user.email === "admin@sendora.id" ? "admin" : "user"),
    status: "ACTIVE",
    banReason: null,
    planId: sub.planId || "FREE",
    planStatus: sub.status === "ACTIVE" ? "ACTIVE" : "FREE",
    messagesUsed: 0,
    devicesCount: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
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

export function updateUserStatus(
  userId: string,
  status: UserAccountStatus,
  banReason?: string
): ManagedUser | null {
  const users = getAllManagedUsers();
  const idx = users.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) return null;

  users[idx].status = status;
  users[idx].banReason = status === "BANNED" ? (banReason || "Pelanggaran aturan sistem Sendora") : null;
  saveManagedUsers(users);
  return users[idx];
}

export function updateUserPlan(
  userId: string,
  planId: string,
  durationDays: number = 30
): ManagedUser | null {
  const users = getAllManagedUsers();
  const idx = users.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) return null;

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + durationDays);

  saveSubscription({
    userId: users[idx].id,
    planId: planId as PlanId,
    status: planId === "FREE" ? "FREE" : "ACTIVE",
    startDate: planId === "FREE" ? null : now.toISOString(),
    endDate: planId === "FREE" ? null : endDate.toISOString(),
    updatedAt: now.toISOString(),
  });

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

  if (target.role === "admin" || target.email.toLowerCase() === "admin@sendora.id" || target.id === "admin-master-sendora-01") {
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

  return {
    totalUsers,
    activeSubscribed,
    freeUsers,
    bannedUsers,
  };
}
