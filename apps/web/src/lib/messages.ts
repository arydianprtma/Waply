import fs from "fs";
import path from "path";
import { prisma } from "@sendora/database";
import { getSubscription, getAllPlans } from "./billing";
import { DEFAULT_PLANS } from "./billing-types";

export interface StoredMessage {
  id: string;
  userId: string;
  deviceId?: string;
  to?: string;
  recipient?: string;
  content: string;
  rawContent?: string;
  status: "SENT" | "FAILED" | "PENDING";
  failReason?: string | null;
  providerMessageId?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Retrieve stored messages with local fallback and optional user filter
 */
export function getStoredMessages(userId?: string): StoredMessage[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
    const list: StoredMessage[] = JSON.parse(raw || "[]");
    if (!userId) return list;
    return list.filter((m) => m.userId === userId);
  } catch {
    return [];
  }
}

/**
 * Record a new message locally and in DB
 */
export async function recordSentMessage(
  data: Partial<StoredMessage> & {
    userId: string;
    content: string;
    recipient?: string;
    to?: string;
  }
): Promise<StoredMessage> {
  ensureDataDir();

  const now = new Date().toISOString();
  const recipient = data.recipient || data.to || "";
  const msgId = data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const status = data.status || "SENT";

  const newMsg: StoredMessage = {
    id: msgId,
    userId: data.userId,
    deviceId: data.deviceId,
    to: recipient,
    recipient: recipient,
    content: data.content,
    rawContent: data.rawContent || data.content,
    status: status,
    failReason: data.failReason || null,
    providerMessageId: data.providerMessageId || null,
    sentAt: status === "SENT" ? data.sentAt || now : null,
    createdAt: now,
  };

  // 1. Save to local JSON storage
  try {
    let list: StoredMessage[] = [];
    if (fs.existsSync(MESSAGES_FILE)) {
      list = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8") || "[]");
    }
    list.unshift(newMsg);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(list, null, 2));
  } catch (fsErr) {
    console.error("Failed to save message to messages.json:", fsErr);
  }

  // 2. Try saving to Prisma DB (async fallback)
  try {
    await prisma.message.create({
      data: {
        id: msgId,
        userId: data.userId,
        deviceId: data.deviceId || "default",
        recipient: recipient,
        content: data.content,
        rawContent: data.rawContent || data.content,
        status: status === "SENT" ? "SENT" : "FAILED",
        failReason: data.failReason,
        providerMessageId: data.providerMessageId,
        sentAt: status === "SENT" ? new Date() : null,
      },
    });
  } catch (dbErr) {
    // Non-blocking fallback if DB table is unavailable
  }

  return newMsg;
}

/**
 * Check if user can send a message based on their active plan's message quota
 */
export function canUserSendMessage(
  userId: string,
  userRole?: string
): {
  allowed: boolean;
  reason?: string;
  maxMessages: number;
  usedMessages: number;
  remainingMessages: number;
  isUnlimited: boolean;
} {
  if (userRole === "admin") {
    return {
      allowed: true,
      maxMessages: -1,
      usedMessages: 0,
      remainingMessages: -1,
      isUnlimited: true,
    };
  }

  const sub = getSubscription(userId);
  const planId = sub?.planId || "FREE";
  const allPlans = getAllPlans();
  const plan = allPlans[planId] || DEFAULT_PLANS[planId] || DEFAULT_PLANS.FREE;

  const maxMessages = typeof plan?.monthlyMessages === "number" ? plan.monthlyMessages : 100;
  const isUnlimited = maxMessages === -1;

  if (isUnlimited) {
    return {
      allowed: true,
      maxMessages: -1,
      usedMessages: 0,
      remainingMessages: -1,
      isUnlimited: true,
    };
  }

  // Count user's sent messages (status SENT)
  const userMessages = getStoredMessages(userId).filter((m) => m.status === "SENT");
  const usedMessages = userMessages.length;
  const remainingMessages = Math.max(0, maxMessages - usedMessages);

  if (usedMessages >= maxMessages) {
    return {
      allowed: false,
      reason: `Kuota pengiriman pesan akun Anda telah habis (${usedMessages} dari ${maxMessages} pesan terpakai). Silakan upgrade paket langganan Anda untuk terus mengirim pesan.`,
      maxMessages,
      usedMessages,
      remainingMessages: 0,
      isUnlimited: false,
    };
  }

  return {
    allowed: true,
    maxMessages,
    usedMessages,
    remainingMessages,
    isUnlimited: false,
  };
}

/**
 * Check if a date string falls on today (local or UTC)
 */
export function isDateToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const isLocalToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const isUtcToday = d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  return isLocalToday || isUtcToday;
}

/**
 * Get map of deviceId -> total messages sent today
 */
export function getAllDevicesSentTodayMap(): Record<string, number> {
  const all = getStoredMessages();
  const map: Record<string, number> = {};
  for (const m of all) {
    if (m.deviceId && m.status === "SENT" && isDateToday(m.sentAt || m.createdAt)) {
      map[m.deviceId] = (map[m.deviceId] || 0) + 1;
    }
  }
  return map;
}

/**
 * Get total messages sent today for a single device
 */
export function getDeviceSentTodayCount(deviceId: string): number {
  const all = getStoredMessages();
  return all.filter(
    (m) =>
      m.deviceId === deviceId &&
      m.status === "SENT" &&
      isDateToday(m.sentAt || m.createdAt)
  ).length;
}

