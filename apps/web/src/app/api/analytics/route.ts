import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getSubscription, getAllPlans } from "@/lib/billing";
import { DEFAULT_PLANS } from "@/lib/billing-types";
import { getUserSessionIds } from "@/lib/user-devices";
import { getUserAddonTotals } from "@/lib/addons";
import fs from "fs";
import path from "path";

import { getStoredMessages } from "@/lib/messages";

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

function getDaysForRange(range: string): string[] {
  let count = 7;
  if (range === "24h") count = 1;
  else if (range === "30d") count = 30;
  else if (range === "all") count = 60;

  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

function formatDayLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr.slice(5);
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    // Read all local storage files and filter strictly by user.id
    const rawContacts = readJson<any[]>("contacts.json", []);
    const rawBroadcasts = readJson<any[]>("broadcast-campaigns.json", []);
    const rawAutoreplies = readJson<any[]>("autoreply.json", []);
    const rawWebhookLogs = readJson<any[]>("webhook_logs.json", []);
    const rawTemplates = readJson<any[]>("templates.json", []);

    const contacts = rawContacts.filter((c: any) => c.userId === user.id);
    const broadcasts = rawBroadcasts.filter((b: any) => b.userId === user.id);
    const autoreplies = rawAutoreplies.filter((r: any) => r.userId === user.id);
    const webhookLogs = rawWebhookLogs.filter((l: any) => l.userId === user.id);
    const templates = rawTemplates.filter((t: any) => t.userId === user.id || t.userId === "admin-default-user");

    // Get user-specific stored messages
    const userMessages = getStoredMessages(user.id);
    const sentMessages = userMessages.filter((m) => m.status === "SENT");

    const totalContacts = contacts.length;
    const totalBroadcasts = broadcasts.length;
    const activeBroadcasts = broadcasts.filter((b: any) =>
      ["RUNNING", "running", "pending"].includes(b.status)
    ).length;
    const totalAutoReplies = autoreplies.length;
    const activeAutoReplies = autoreplies.filter((r: any) => r.isActive).length;
    const totalMessages = sentMessages.length;
    const totalTemplates = templates.length;
    const totalWebhookLogs = webhookLogs.length;

    // Messages sent today
    const today = new Date().toISOString().split("T")[0];
    const messagesToday = sentMessages.filter((m: any) =>
      (m.sentAt || m.createdAt || "").startsWith(today)
    ).length;

    // Traffic History data with Inbound & Outbound for Recharts AreaChart
    const days = getDaysForRange(range);
    const trafficHistory = days.map((day) => {
      const outbound = sentMessages.filter((m: any) =>
        (m.sentAt || m.createdAt || "").startsWith(day)
      ).length;
      const inbound = webhookLogs.filter((l: any) =>
        (l.deliveredAt || l.createdAt || "").startsWith(day)
      ).length;
      return {
        date: day,
        dayLabel: formatDayLabel(day),
        outbound,
        inbound,
        total: outbound + inbound,
      };
    });

    const messageTrend = trafficHistory.map((t) => ({
      date: t.date,
      count: t.outbound,
    }));

    // Recent activity (last 5 messages)
    const recentMessages = sentMessages
      .slice(0, 5)
      .map((m: any) => ({
        type: "message",
        label: `Pesan terkirim ke ${m.recipient || m.to || m.phone || "—"}`,
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

    const { extraDevices, extraMessages, activeAddons } = getUserAddonTotals(user.id);

    const baseMessages = typeof plan?.monthlyMessages === "number" ? plan.monthlyMessages : 100;
    const isUnlimitedMessages = baseMessages === -1;
    const maxMessages = isUnlimitedMessages ? -1 : baseMessages + extraMessages;
    const usedMessages = totalMessages;
    const remainingMessages = isUnlimitedMessages ? -1 : Math.max(0, maxMessages - usedMessages);

    const baseDevices = typeof plan?.maxDevices === "number" ? plan.maxDevices : 1;
    const maxDevices = baseDevices + extraDevices;
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
        trafficHistory,
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
