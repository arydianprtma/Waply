import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUser } from "@/lib/auth-user";
import { getAdminUserStats, getAllManagedUsers } from "@/lib/admin-users";
import { fetchGateway } from "@/lib/gateway-client";

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

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (user.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "403 Forbidden: Akses khusus Super Admin" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("range") || "7d"; // 24h, 7d, 30d, all

  const contacts = readJson<any[]>("contacts.json", []);
  const broadcasts = readJson<any[]>("broadcast.json", []);
  const autoreplies = readJson<any[]>("autoreply.json", []);
  const apiMessages = readJson<any[]>("messages.json", []);
  const chatMessages = readJson<any[]>("chat_messages.json", []);
  const webhookLogs = readJson<any[]>("webhook_logs.json", []);
  const invoices = readJson<any[]>("invoices.json", []);
  const autoReplyLogs = readJson<any[]>("autoreply_logs.json", []);
  const blacklist = readJson<any[]>("blacklist.json", []);
  const templates = readJson<any[]>("templates.json", []);

  // Combine real recorded messages
  const allMessages = [...apiMessages, ...chatMessages];

  // Fetch Gateway live sessions & health
  let gatewayOnline = false;
  let gatewayLatencyMs = 0;
  let gatewayDevices: any[] = [];
  try {
    const start = Date.now();
    const gwRes = await fetchGateway("/api/sessions", {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    gatewayLatencyMs = Date.now() - start;
    if (gwRes.ok) {
      const gwJson = await gwRes.json();
      gatewayOnline = true;
      gatewayDevices = Array.isArray(gwJson.data) ? gwJson.data : [];
    }
  } catch {
    gatewayOnline = false;
    gatewayLatencyMs = 0;
  }

  const connectedDevicesCount = gatewayDevices.filter(
    (d: any) => d.status === "CONNECTED" || d.status === "connected"
  ).length;

  const allUsers = getAllManagedUsers();
  const userStats = getAdminUserStats();

  // Top Senders based on real message usage
  const topSenders = [...allUsers]
    .sort((a, b) => (b.messagesUsed || 0) - (a.messagesUsed || 0))
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      planId: u.planId,
      messagesUsed: u.messagesUsed || 0,
      devicesCount: u.devicesCount || 0,
      status: u.status,
    }));

  // Recent Users
  const recentUsers = [...allUsers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Plan Distribution Breakdown
  const planDistribution: Record<string, number> = {
    FREE: 0,
    STARTER: 0,
    PRO: 0,
    BUSINESS: 0,
    ENTERPRISE: 0,
  };
  allUsers.forEach((u) => {
    let p = (u.planId || "FREE").toUpperCase();
    if (p.includes("YEARLY_PRO")) p = "PRO";
    if (planDistribution[p] !== undefined) {
      planDistribution[p]++;
    } else {
      planDistribution[p] = (planDistribution[p] || 0) + 1;
    }
  });

  // Calculate real traffic curve (no fake baseline)
  const daysCount = timeRange === "24h" ? 1 : timeRange === "30d" ? 30 : timeRange === "all" ? 60 : 7;
  const trafficHistory = [];
  const now = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    const outbound = allMessages.filter((m: any) => {
      const ts = m.sentAt || m.createdAt || m.timestamp || "";
      const isOutbound = m.fromMe === true || m.direction === "OUTBOUND" || (!m.direction && m.fromMe !== false);
      return ts.startsWith(dateStr) && isOutbound;
    }).length;

    const inboundFromLogs = autoReplyLogs.filter((a: any) =>
      (a.createdAt || "").startsWith(dateStr)
    ).length;

    const inboundFromChats = allMessages.filter((m: any) => {
      const ts = m.sentAt || m.createdAt || m.timestamp || "";
      const isInbound = m.fromMe === false || m.direction === "INBOUND";
      return ts.startsWith(dateStr) && isInbound;
    }).length;

    const inbound = inboundFromLogs + inboundFromChats;

    trafficHistory.push({
      date: dateStr,
      dayLabel,
      outbound,
      inbound,
      total: outbound + inbound,
    });
  }

  // Real System Logs from Webhooks and Auto-reply activity
  const systemLogs = [
    ...webhookLogs
      .slice(0, 15)
      .map((l: any) => {
        const isSuccess = Boolean(l.success || (l.responseStatus && l.responseStatus >= 200 && l.responseStatus < 300));
        const status = typeof l.responseStatus === "number" && l.responseStatus > 0 ? l.responseStatus : null;
        return {
          level: isSuccess ? "INFO" : "WARN",
          message: isSuccess
            ? `Webhook "${l.event}" berhasil dikirimkan ke endpoint`
            : `Webhook "${l.event}" gagal dikirim${status ? ` (HTTP ${status})` : " (Timeout/Network Error)"}`,
          time: l.createdAt || new Date().toISOString(),
        };
      }),
    ...autoReplyLogs
      .slice(0, 10)
      .map((l: any) => ({
        level: l.success ? "INFO" : "ERROR",
        message: l.success
          ? `Auto-reply berhasil dikirim ke +${l.sender} (${l.ruleName})`
          : `Auto-reply gagal dikirim ke +${l.sender} (${l.ruleName})`,
        time: l.createdAt || new Date().toISOString(),
      })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 20);

  const todayStr = new Date().toISOString().split("T")[0];
  const messagesToday = allMessages.filter((m: any) =>
    (m.sentAt || m.createdAt || m.timestamp || "").startsWith(todayStr)
  ).length;

  const paidInvoices = invoices.filter((i: any) => i.status === "PAID");
  const totalRevenue = paidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
  const mrr = paidInvoices
    .filter((i: any) => {
      const invDate = new Date(i.paidAt || i.createdAt || 0);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      return invDate >= thirtyDaysAgo;
    })
    .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

  // Formatted recent messages for Message Logs Global
  const recentMessages = allMessages
    .sort((a, b) => new Date(b.sentAt || b.createdAt || b.timestamp || 0).getTime() - new Date(a.sentAt || a.createdAt || a.timestamp || 0).getTime())
    .slice(0, 50)
    .map((m: any) => ({
      id: m.id || `msg_${Math.random().toString(36).slice(2, 8)}`,
      recipient: m.recipient || m.to || m.recipientNumber || m.phone || "-",
      from: m.from || m.senderNumber || "-",
      direction: m.fromMe === false || m.direction === "INBOUND" ? "INBOUND" : "OUTBOUND",
      content: m.content || m.text || m.message || "-",
      status: m.status || "SENT",
      sentAt: m.sentAt || m.createdAt || m.timestamp || new Date().toISOString(),
    }));

  return NextResponse.json({
    success: true,
    data: {
      overview: {
        totalUsers: userStats.totalUsers,
        activeSubscribedUsers: userStats.activeSubscribed,
        freeUsers: userStats.freeUsers,
        bannedUsers: userStats.bannedUsers,
        totalMessages: allMessages.length,
        messagesToday,
        totalContacts: contacts.length,
        totalBroadcasts: broadcasts.length,
        activeBroadcasts: broadcasts.filter((b: any) =>
          ["running", "pending"].includes(b.status)
        ).length,
        totalAutoReplies: autoreplies.length,
        activeAutoReplies: autoreplies.filter((r: any) => r.isActive).length,
        totalTemplates: templates.length,
        totalWebhookLogs: webhookLogs.length,
        totalInvoices: invoices.length,
        paidInvoices: paidInvoices.length,
        totalRevenue,
        mrr,
        blacklistCount: blacklist.length,
        botTriggerCount: autoReplyLogs.length,
      },
      systemHealth: {
        gatewayOnline,
        latencyMs: gatewayLatencyMs,
        activeDevices: connectedDevicesCount,
        totalDevices: gatewayDevices.length,
        uptimeSeconds: Math.floor(process.uptime()),
        queueThroughput: messagesToday > 0 ? `${messagesToday} msg/hari` : "0 msg/s (Idle)",
        nodeMemoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      trafficHistory,
      planDistribution,
      topSenders,
      recentUsers,
      recentInvoices: invoices.slice(0, 5),
      recentMessages,
      systemLogs,
      autoReplyLogs: autoReplyLogs.slice(0, 20),
    },
  });
}
