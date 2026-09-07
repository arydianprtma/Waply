import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getSubscription, getAllPlans } from "@/lib/billing";
import { DEFAULT_PLANS } from "@/lib/billing-types";
import { getUserSessionIds } from "@/lib/user-devices";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");

function readJson<T>(file: string, fallback: T): T {
  try {
    const fp = path.join(DATA_DIR, file);
    if (!fs.existsSync(fp)) return fallback;
    return JSON.parse(fs.readFileSync(fp, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

export async function GET() {
  try {
    const user = await getAuthUser();

    // Read all local storage files
    const contacts = readJson<any[]>("contacts.json", []);
    const broadcasts = readJson<any[]>("broadcast.json", []);
    const autoreplies = readJson<any[]>("autoreply.json", []);
    const messages = readJson<any[]>("messages.json", []);
    const webhookLogs = readJson<any[]>("webhook_logs.json", []);
    const templates = readJson<any[]>("templates.json", []);

    const totalContacts = contacts.length;
    const totalBroadcasts = broadcasts.length;
    const activeBroadcasts = broadcasts.filter((b: any) =>
      ["running", "pending"].includes(b.status)
    ).length;
    const totalAutoReplies = autoreplies.length;
    const activeAutoReplies = autoreplies.filter((r: any) => r.isActive).length;
    const totalMessages = messages.length;
    const totalTemplates = templates.length;
    const totalWebhookLogs = webhookLogs.length;

    // Messages sent today
    const today = new Date().toISOString().split("T")[0];
    const messagesToday = messages.filter((m: any) =>
      (m.sentAt || m.createdAt || "").startsWith(today)
    ).length;

    // Trend data: messages per day for last 7 days
    const days = getLast7Days();
    const messageTrend = days.map((day) => ({
      date: day,
      count: messages.filter((m: any) =>
        (m.sentAt || m.createdAt || "").startsWith(day)
      ).length,
    }));

    // Recent activity (last 5 messages)
    const recentMessages = messages
      .slice(-5)
      .reverse()
      .map((m: any) => ({
        type: "message",
        label: `Pesan terkirim ke ${m.to || m.phone || "—"}`,
        time: m.sentAt || m.createdAt || new Date().toISOString(),
      }));

    const recentWebhooks = webhookLogs
      .slice(-3)
      .reverse()
      .map((l: any) => ({
        type: "webhook",
        label: `Webhook ${l.event || "event"} — ${l.statusCode === 200 ? "Berhasil" : "Gagal"}`,
        time: l.deliveredAt || new Date().toISOString(),
      }));

    const recentActivity = [...recentMessages, ...recentWebhooks]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);

    // User subscription & quota info
    const sub = getSubscription(user.id);
    const planId = sub?.planId || "FREE";
    const allPlans = getAllPlans();
    const plan = allPlans[planId] || DEFAULT_PLANS[planId] || DEFAULT_PLANS.FREE;

    const maxMessages = typeof plan?.monthlyMessages === "number" ? plan.monthlyMessages : 100;
    const isUnlimitedMessages = maxMessages === -1;
    const usedMessages = totalMessages;
    const remainingMessages = isUnlimitedMessages ? -1 : Math.max(0, maxMessages - usedMessages);

    const maxDevices = typeof plan?.maxDevices === "number" ? plan.maxDevices : 1;
    const userSessions = getUserSessionIds(user.id);
    const usedDevices = user.role === "admin" ? Math.min(1, maxDevices) : userSessions.length;
    const remainingDevices = Math.max(0, maxDevices - usedDevices);

    return NextResponse.json({
      success: true,
      data: {
        totalMessages,
        messagesToday,
        totalContacts,
        totalBroadcasts,
        activeBroadcasts,
        totalAutoReplies,
        activeAutoReplies,
        totalTemplates,
        totalWebhookLogs,
        messageTrend,
        recentActivity,
        quota: {
          planId,
          planName: plan?.name || "Free Trial",
          maxMessages,
          isUnlimitedMessages,
          usedMessages,
          remainingMessages,
          maxDevices,
          usedDevices,
          remainingDevices,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
