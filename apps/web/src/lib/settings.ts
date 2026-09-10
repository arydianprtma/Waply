import fs from "fs";
import path from "path";
import { updateUserAvatar } from "./admin-users";

export interface AppSettings {
  userId: string;
  profile: {
    name: string;
    email: string;
    companyName: string;
    avatarUrl?: string;
  };
  security: {
    twoFactorEnabled: boolean;
    twoFactorMethod: "authenticator" | "email";
    lastPasswordChanged?: string | null;
    loginAlerts: boolean;
  };
  gateway: {
    url: string;
    minDelaySec: number;
    maxDelaySec: number;
    typingPresence: boolean;
  };
  workingHours: {
    enabled: boolean;
    startTime: string; // e.g. "08:00"
    endTime: string;   // e.g. "21:00"
    timezone: string;  // e.g. "Asia/Jakarta"
    daysOfWeek: number[]; // 1 = Monday ... 7 = Sunday
  };
  notifications: {
    emailOnBroadcastDone: boolean;
    emailOnDeviceDisconnect: boolean;
  };
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

function getDefaultSettings(userId: string, defaultProfile?: { name?: string; email?: string }): AppSettings {
  return {
    userId,
    profile: {
      name: defaultProfile?.name || "Waply User",
      email: defaultProfile?.email || "user@waply.id",
      companyName: "",
    },
    security: {
      twoFactorEnabled: false,
      twoFactorMethod: "authenticator",
      lastPasswordChanged: null,
      loginAlerts: true,
    },
    gateway: {
      url: "http://localhost:3002",
      minDelaySec: 4,
      maxDelaySec: 8,
      typingPresence: true,
    },
    workingHours: {
      enabled: false,
      startTime: "08:00",
      endTime: "21:00",
      timezone: "Asia/Jakarta",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    },
    notifications: {
      emailOnBroadcastDone: true,
      emailOnDeviceDisconnect: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAllSettings(): Record<string, AppSettings> {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    // If legacy single-object format
    if (parsed && parsed.profile && !parsed[parsed.userId]) {
      return { [parsed.userId || "admin-default-user"]: parsed };
    }
    return parsed || {};
  } catch {
    return {};
  }
}

function writeAllSettings(all: Record<string, AppSettings>) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(all, null, 2));
}

export function getSettings(
  userId: string,
  defaultProfile?: { name?: string; email?: string }
): AppSettings {
  const all = readAllSettings();
  const userSettings = all[userId];

  if (!userSettings) {
    const defaults = getDefaultSettings(userId, defaultProfile);
    all[userId] = defaults;
    writeAllSettings(all);
    return defaults;
  }

  // Ensure email always reflects current auth email if provided
  if (defaultProfile?.email && userSettings.profile.email !== defaultProfile.email) {
    userSettings.profile.email = defaultProfile.email;
    if (defaultProfile.name && (!userSettings.profile.name || userSettings.profile.name === "Waply Admin")) {
      userSettings.profile.name = defaultProfile.name;
    }
    all[userId] = userSettings;
    writeAllSettings(all);
  }

  return userSettings;
}

export function saveSettings(
  userId: string,
  data: Partial<Omit<AppSettings, "userId" | "updatedAt">>,
  defaultProfile?: { name?: string; email?: string }
): AppSettings {
  const all = readAllSettings();
  const current = all[userId] || getDefaultSettings(userId, defaultProfile);

  const updated: AppSettings = {
    ...current,
    userId,
    profile: {
      ...current.profile,
      ...(data.profile || {}),
      email: defaultProfile?.email || data.profile?.email || current.profile.email,
    },
    security: {
      ...(current.security || {
        twoFactorEnabled: false,
        twoFactorMethod: "authenticator",
        lastPasswordChanged: null,
        loginAlerts: true,
      }),
      ...(data.security || {}),
    },
    gateway: { ...current.gateway, ...(data.gateway || {}) },
    workingHours: { ...current.workingHours, ...(data.workingHours || {}) },
    notifications: { ...current.notifications, ...(data.notifications || {}) },
    updatedAt: new Date().toISOString(),
  };

  all[userId] = updated;
  writeAllSettings(all);

  if (data.profile && data.profile.avatarUrl !== undefined) {
    try {
      updateUserAvatar(userId, data.profile.avatarUrl || null);
      if (updated.profile.email) {
        updateUserAvatar(updated.profile.email, data.profile.avatarUrl || null);
      }
    } catch {
      // Ignore
    }
  }

  return updated;
}

export function isWithinWorkingHours(settings?: AppSettings): boolean {
  const s = settings || getSettings("admin-default-user");
  if (!s.workingHours || !s.workingHours.enabled) return true;

  try {
    const now = new Date();
    // Get current time in specified timezone
    const tz = s.workingHours.timezone || "Asia/Jakarta";
    const localTimeStr = now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false });
    const [currH, currM] = localTimeStr.split(":").map(Number);
    const currTotalMinutes = currH * 60 + currM;

    const [startH, startM] = s.workingHours.startTime.split(":").map(Number);
    const startTotalMinutes = startH * 60 + startM;

    const [endH, endM] = s.workingHours.endTime.split(":").map(Number);
    const endTotalMinutes = endH * 60 + endM;

    // Day of week: 1 = Mon ... 7 = Sun
    const day = now.getDay() === 0 ? 7 : now.getDay();
    if (s.workingHours.daysOfWeek && !s.workingHours.daysOfWeek.includes(day)) {
      return false;
    }

    if (startTotalMinutes <= endTotalMinutes) {
      return currTotalMinutes >= startTotalMinutes && currTotalMinutes <= endTotalMinutes;
    } else {
      // Overnight span (e.g. 22:00 - 06:00)
      return currTotalMinutes >= startTotalMinutes || currTotalMinutes <= endTotalMinutes;
    }
  } catch (err) {
    console.error("[WorkingHours] Error calculating working hours:", err);
    return true;
  }
}

export function resetLocalData(): string[] {
  ensureDataDir();
  const files = [
    "autoreply.json",
    "broadcast.json",
    "contacts.json",
    "contacts_groups.json",
    "blacklist.json",
    "webhook_logs.json",
    "templates.json",
    "messages.json",
  ];
  const deleted: string[] = [];
  for (const f of files) {
    const fp = path.join(DATA_DIR, f);
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      deleted.push(f);
    }
  }
  return deleted;
}
