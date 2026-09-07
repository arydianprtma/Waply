import fs from "fs";
import path from "path";
import { getSubscription, getAllPlans } from "./billing";
import { DEFAULT_PLANS } from "./billing-types";

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");
const USER_DEVICES_FILE = path.join(DATA_DIR, "user_devices.json");

export interface UserDeviceRecord {
  id: string; // sessionId, e.g. dev_123456
  userId: string;
  name: string;
  createdAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllUserDeviceRecords(): Record<string, UserDeviceRecord> {
  ensureDataDir();
  try {
    if (fs.existsSync(USER_DEVICES_FILE)) {
      return JSON.parse(fs.readFileSync(USER_DEVICES_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

export function saveUserDeviceRecords(records: Record<string, UserDeviceRecord>): void {
  ensureDataDir();
  fs.writeFileSync(USER_DEVICES_FILE, JSON.stringify(records, null, 2));
}

/**
 * Get device quota limit for a user based on their active subscription plan
 */
export function getUserDeviceLimit(userId: string): {
  maxDevices: number;
  planId: string;
  planName: string;
} {
  try {
    const sub = getSubscription(userId);
    const planId = sub?.planId || "FREE";
    const allPlans = getAllPlans();
    const plan = allPlans[planId] || DEFAULT_PLANS[planId];

    const maxDevices = typeof plan?.maxDevices === "number" && plan.maxDevices > 0 ? plan.maxDevices : 1;
    const planName = plan?.name || (planId === "FREE" ? "Free Trial" : planId);

    return {
      maxDevices,
      planId,
      planName,
    };
  } catch {
    return {
      maxDevices: 1,
      planId: "FREE",
      planName: "Free Trial",
    };
  }
}

/**
 * Get session IDs belonging to a user
 */
export function getUserSessionIds(userId: string): string[] {
  const records = getAllUserDeviceRecords();
  return Object.values(records)
    .filter((r) => r.userId === userId)
    .map((r) => r.id);
}

/**
 * Register a new device session for a user and check limit
 */
export function registerUserDevice(
  userId: string,
  sessionId: string,
  deviceName: string,
  userRole?: string
): { success: boolean; error?: string } {
  const limit = getUserDeviceLimit(userId);
  const existing = getUserSessionIds(userId);

  // If user reached device limit:
  if (userRole !== "admin" && existing.length >= limit.maxDevices) {
    return {
      success: false,
      error: `Batas maksimal WhatsApp Device (${limit.maxDevices}) untuk paket ${limit.planName} telah tercapai. Silakan upgrade paket Anda untuk menambah device baru.`,
    };
  }

  const records = getAllUserDeviceRecords();
  records[sessionId] = {
    id: sessionId,
    userId,
    name: deviceName,
    createdAt: new Date().toISOString(),
  };
  saveUserDeviceRecords(records);

  return { success: true };
}

/**
 * Unregister a device session when disconnected/deleted
 */
export function unregisterUserDevice(sessionId: string): void {
  const records = getAllUserDeviceRecords();
  if (records[sessionId]) {
    delete records[sessionId];
    saveUserDeviceRecords(records);
  }
}
