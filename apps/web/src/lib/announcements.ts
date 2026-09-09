import fs from "fs";
import path from "path";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "URGENT";
  targetAudience: "ALL" | "FREE" | "PAID";
  isPinned: boolean;
  isActive: boolean;
  isPopup?: boolean;
  popupActionText?: string;
  popupActionUrl?: string;
  popupImage?: string;
  popupImageRatio?: "16:9" | "1:1" | "4:3" | "AUTO";
  createdAt: string;
  updatedAt: string;
  readBy?: string[]; // Array of user IDs who have marked this read
}

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, "announcements.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDefaultAnnouncements(): Announcement[] {
  return [
    {
      id: "ann_welcome_01",
      title: "Selamat Datang di Waply API Gateway! 🎉",
      message: "Nikmati kuota 100 pesan Free Trial Anda. Silakan hubungkan WhatsApp Device Anda melalui scan QR Code di menu WhatsApp Devices.",
      type: "SUCCESS",
      targetAudience: "ALL",
      isPinned: true,
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date().toISOString(),
      readBy: [],
    },
    {
      id: "ann_antiban_02",
      title: "Pembaruan Algoritma Smart Anti-Ban 🛡️",
      message: "Sistem telah diperbarui dengan Dynamic Human Delay & Typing Presence simulation untuk memaksimalkan keamanan akun nomor WhatsApp Anda.",
      type: "INFO",
      targetAudience: "ALL",
      isPinned: false,
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      updatedAt: new Date().toISOString(),
      readBy: [],
    },
  ];
}

export function getAllAnnouncements(): Announcement[] {
  ensureDataDir();
  if (!fs.existsSync(ANNOUNCEMENTS_FILE)) {
    const defaults = getDefaultAnnouncements();
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }

  try {
    const raw = fs.readFileSync(ANNOUNCEMENTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultAnnouncements();
  } catch {
    return getDefaultAnnouncements();
  }
}

export function saveAnnouncements(list: Announcement[]): void {
  ensureDataDir();
  fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(list, null, 2));
}

export function createAnnouncement(data: Omit<Announcement, "id" | "createdAt" | "updatedAt" | "readBy">): Announcement {
  const all = getAllAnnouncements();
  const now = new Date().toISOString();
  const item: Announcement = {
    ...data,
    id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
    readBy: [],
  };

  all.unshift(item);
  saveAnnouncements(all);
  return item;
}

export function updateAnnouncement(id: string, data: Partial<Omit<Announcement, "id" | "createdAt">>): Announcement | null {
  const all = getAllAnnouncements();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  saveAnnouncements(all);
  return all[idx];
}

export function deleteAnnouncement(id: string): boolean {
  const all = getAllAnnouncements();
  const filtered = all.filter((a) => a.id !== id);
  if (filtered.length === all.length) return false;

  saveAnnouncements(filtered);
  return true;
}

export function markAnnouncementAsRead(announcementId: string, userId: string): boolean {
  const all = getAllAnnouncements();
  const item = all.find((a) => a.id === announcementId);
  if (!item) return false;

  if (!item.readBy) item.readBy = [];
  if (!item.readBy.includes(userId)) {
    item.readBy.push(userId);
    saveAnnouncements(all);
  }
  return true;
}

export function markAllAnnouncementsAsRead(userId: string): void {
  const all = getAllAnnouncements();
  let changed = false;

  all.forEach((item) => {
    if (!item.readBy) item.readBy = [];
    if (!item.readBy.includes(userId)) {
      item.readBy.push(userId);
      changed = true;
    }
  });

  if (changed) {
    saveAnnouncements(all);
  }
}
