import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-user";
import fs from "fs";
import path from "path";
import { getStoredMessages } from "@/lib/messages";
import { getAutoReplyLogs } from "@/lib/autoreply-logs";
import { getUserSessionIds } from "@/lib/user-devices";
import { getLocalCampaigns } from "@/lib/broadcast";

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const WEBHOOK_LOGS_FILE = path.join(DATA_DIR, "webhook_logs.json");

export interface FormattedUserLog {
  id: string;
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  category: "WEBHOOK" | "AUTOREPLY" | "MESSAGES" | "GATEWAY" | "BROADCAST" | "SYSTEM";
  title: string;
  message: string;
  details?: string | null;
  target?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  time: string;
}

export async function GET() {
  try {
    const user = await requireActiveUser();
    const isAdmin = user.role === "admin";

    const logs: FormattedUserLog[] = [];

    // 1. Webhook Logs
    try {
      if (fs.existsSync(WEBHOOK_LOGS_FILE)) {
        const raw = fs.readFileSync(WEBHOOK_LOGS_FILE, "utf-8");
        const whLogs = JSON.parse(raw || "[]");
        for (const l of whLogs) {
          if (!isAdmin && l.userId && l.userId !== user.id && l.userId !== user.email) {
            continue;
          }
          const isSuccess = Boolean(l.success || (l.responseStatus && l.responseStatus >= 200 && l.responseStatus < 300));
          const status = typeof l.responseStatus === "number" && l.responseStatus > 0 ? l.responseStatus : null;

          logs.push({
            id: l.id || `wh_${Math.random()}`,
            level: isSuccess ? "INFO" : "WARN",
            category: "WEBHOOK",
            title: `Webhook: ${l.event || "event"}`,
            message: isSuccess
              ? `Event "${l.event}" berhasil dikirimkan ke webhook endpoint`
              : `Pengiriman webhook "${l.event}" gagal${status ? ` (HTTP ${status})` : " (Network / Timeout Error)"}`,
            details: l.responseBody ? (typeof l.responseBody === "string" ? l.responseBody : JSON.stringify(l.responseBody)) : null,
            target: l.url || null,
            statusCode: status,
            durationMs: l.durationMs || null,
            time: l.createdAt || new Date().toISOString(),
          });
        }
      }
    } catch (whErr) {
      console.error("Error reading webhook logs:", whErr);
    }

    // 2. Auto-Reply Logs
    try {
      const arLogs = getAutoReplyLogs(user.id, 200);
      for (const l of arLogs) {
        logs.push({
          id: l.id || `ar_${Math.random()}`,
          level: l.success ? "SUCCESS" : "ERROR",
          category: "AUTOREPLY",
          title: `Auto-Reply: ${l.ruleName || "Rule"}`,
          message: l.success
            ? `Bot merespons pesan "${l.inboundText}" dari penerima +${l.sender}`
            : `Gagal mengirim auto-reply bot ke +${l.sender}`,
          details: l.replyText || null,
          target: l.sender ? `+${l.sender}` : null,
          statusCode: l.success ? 200 : 500,
          durationMs: null,
          time: l.createdAt || new Date().toISOString(),
        });
      }
    } catch (arErr) {
      console.error("Error reading autoreply logs:", arErr);
    }

    // 3. Outbound Messages Logs
    try {
      const messages = getStoredMessages(isAdmin ? undefined : user.id);
      for (const m of messages) {
        const isFailed = m.status === "FAILED";
        const isSent = m.status === "SENT";
        logs.push({
          id: `msg_${m.id}`,
          level: isFailed ? "ERROR" : isSent ? "SUCCESS" : "INFO",
          category: "MESSAGES",
          title: isFailed ? "Pesan Gagal Terkirim" : "Pesan Terkirim",
          message: isFailed
            ? `Pengiriman pesan ke ${m.to || m.recipient || "-"} gagal: ${m.failReason || "Error gateway"}`
            : `Pesan berhasil dikirim ke nomor ${m.to || m.recipient || "-"}`,
          details: m.content || null,
          target: m.to || m.recipient || null,
          statusCode: isFailed ? 500 : 200,
          durationMs: null,
          time: m.createdAt || m.sentAt || new Date().toISOString(),
        });
      }
    } catch (msgErr) {
      console.error("Error reading message logs:", msgErr);
    }

    // 4. Broadcast Campaign Logs
    try {
      const broadcasts = getLocalCampaigns(user.id);
      for (const b of broadcasts) {
        const isComplete = b.status === "COMPLETED";
        const isCancelled = b.status === "CANCELLED";
        const isPaused = b.status === "PAUSED";
        const isRunning = b.status === "RUNNING";

        logs.push({
          id: `bc_${b.id}`,
          level: isComplete ? "SUCCESS" : isCancelled ? "ERROR" : isPaused ? "WARN" : isRunning ? "INFO" : "INFO",
          title: `Broadcast: ${b.name || "Kampanye"}`,
          category: "BROADCAST",
          message: isComplete
            ? `Kampanye broadcast selesai. ${b.sentCount || 0} berhasil, ${b.failedCount || 0} gagal.`
            : isRunning
            ? `Kampanye broadcast sedang berjalan (${b.sentCount || 0}/${b.totalRecipients || 0} terkirim).`
            : isPaused
            ? `Kampanye broadcast dijeda oleh pengguna.`
            : isCancelled
            ? `Kampanye broadcast dibatalkan.`
            : `Status kampanye broadcast: ${b.status}.`,
          details: b.messageTemplate || null,
          target: `${b.totalRecipients || 0} penerima`,
          statusCode: isCancelled ? 500 : 200,
          durationMs: null,
          time: b.updatedAt || b.createdAt || new Date().toISOString(),
        });
      }
    } catch (bcErr) {
      console.error("Error reading broadcast logs:", bcErr);
    }

    // Sort descending by time
    logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Limit to latest 300 logs for performance
    const paginatedLogs = logs.slice(0, 300);

    return NextResponse.json({
      success: true,
      data: paginatedLogs,
      total: logs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch user activity logs" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await requireActiveUser();
    const isAdmin = user.role === "admin";

    // Clear user-scoped webhook logs
    try {
      if (fs.existsSync(WEBHOOK_LOGS_FILE)) {
        if (isAdmin) {
          fs.writeFileSync(WEBHOOK_LOGS_FILE, JSON.stringify([]));
        } else {
          const raw = fs.readFileSync(WEBHOOK_LOGS_FILE, "utf-8");
          const whLogs: any[] = JSON.parse(raw || "[]");
          const remaining = whLogs.filter((l) => l.userId !== user.id && l.userId !== user.email);
          fs.writeFileSync(WEBHOOK_LOGS_FILE, JSON.stringify(remaining, null, 2));
        }
      }
    } catch {}

    // Clear user-scoped autoreply logs
    try {
      const AUTOREPLY_LOGS_FILE = path.join(DATA_DIR, "autoreply_logs.json");
      if (fs.existsSync(AUTOREPLY_LOGS_FILE)) {
        if (isAdmin) {
          fs.writeFileSync(AUTOREPLY_LOGS_FILE, JSON.stringify([]));
        } else {
          const raw = fs.readFileSync(AUTOREPLY_LOGS_FILE, "utf-8");
          const arLogs: any[] = JSON.parse(raw || "[]");
          const remaining = arLogs.filter((l) => l.userId !== user.id);
          fs.writeFileSync(AUTOREPLY_LOGS_FILE, JSON.stringify(remaining, null, 2));
        }
      }
    } catch {}

    // Clear user-scoped messages
    try {
      const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
      if (fs.existsSync(MESSAGES_FILE)) {
        if (isAdmin) {
          fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
        } else {
          const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
          const msgs: any[] = JSON.parse(raw || "[]");
          const remaining = msgs.filter((m) => m.userId !== user.id);
          fs.writeFileSync(MESSAGES_FILE, JSON.stringify(remaining, null, 2));
        }
      }
    } catch {}

    return NextResponse.json({ success: true, message: "Log aktivitas berhasil dibersihkan" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membersihkan log" },
      { status: error.status || 500 }
    );
  }
}
