import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-user";
import fs from "fs";
import path from "path";
import { clearWebhookLogs } from "@/lib/webhooks";
import { clearAutoReplyLogs } from "@/lib/autoreply-logs";
import { getStoredMessages } from "@/lib/messages";

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");
const WEBHOOK_LOGS_FILE = path.join(DATA_DIR, "webhook_logs.json");
const AUTOREPLY_LOGS_FILE = path.join(DATA_DIR, "autoreply_logs.json");

export interface FormattedSystemLog {
  id: string;
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  category: "WEBHOOK" | "AUTOREPLY" | "MESSAGES" | "GATEWAY" | "SYSTEM";
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
    await requireAdminUser();

    const logs: FormattedSystemLog[] = [];

    // 1. Webhook Logs
    try {
      if (fs.existsSync(WEBHOOK_LOGS_FILE)) {
        const raw = fs.readFileSync(WEBHOOK_LOGS_FILE, "utf-8");
        const whLogs = JSON.parse(raw || "[]");
        for (const l of whLogs) {
          const isSuccess = Boolean(l.success || (l.responseStatus && l.responseStatus >= 200 && l.responseStatus < 300));
          const status = typeof l.responseStatus === "number" && l.responseStatus > 0 ? l.responseStatus : null;
          
          logs.push({
            id: l.id || `wh_${Math.random()}`,
            level: isSuccess ? "INFO" : "WARN",
            category: "WEBHOOK",
            title: `Webhook: ${l.event || "event"}`,
            message: isSuccess
              ? `Event "${l.event}" berhasil dikirimkan ke endpoint tujuan`
              : `Pengiriman event "${l.event}" ke endpoint tujuan gagal${status ? ` (HTTP ${status})` : " (Network / Timeout Error)"}`,
            details: l.responseBody || null,
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
      if (fs.existsSync(AUTOREPLY_LOGS_FILE)) {
        const raw = fs.readFileSync(AUTOREPLY_LOGS_FILE, "utf-8");
        const arLogs = JSON.parse(raw || "[]");
        for (const l of arLogs) {
          logs.push({
            id: l.id || `ar_${Math.random()}`,
            level: l.success ? "SUCCESS" : "ERROR",
            category: "AUTOREPLY",
            title: `Bot Auto-Reply (${l.ruleName || "Rule"})`,
            message: l.success
              ? `Auto-reply terkirim ke +${l.sender} sebagai respons terhadap pesan "${l.inboundText}"`
              : `Gagal mengirim auto-reply ke +${l.sender}`,
            details: l.replyText || null,
            target: l.sender ? `+${l.sender}` : null,
            statusCode: l.success ? 200 : 500,
            durationMs: null,
            time: l.createdAt || new Date().toISOString(),
          });
        }
      }
    } catch (arErr) {
      console.error("Error reading autoreply logs:", arErr);
    }

    // 3. Outbound Message Failure Logs
    try {
      const messages = getStoredMessages();
      for (const m of messages) {
        if (m.status === "FAILED") {
          logs.push({
            id: `msg_fail_${m.id}`,
            level: "ERROR",
            category: "MESSAGES",
            title: "Pengiriman Pesan Gagal",
            message: `Pesan keluar ke ${m.to || m.recipient || "-"} gagal dikirim`,
            details: m.failReason || m.content || null,
            target: m.to || m.recipient || null,
            statusCode: 500,
            durationMs: null,
            time: m.createdAt || m.sentAt || new Date().toISOString(),
          });
        }
      }
    } catch (msgErr) {
      console.error("Error reading message failure logs:", msgErr);
    }

    // Sort descending by time
    logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      success: true,
      data: logs.slice(0, 150),
    });
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve logs" },
      { status }
    );
  }
}

export async function DELETE() {
  try {
    await requireAdminUser();
    clearWebhookLogs();
    clearAutoReplyLogs();

    return NextResponse.json({
      success: true,
      message: "Log sistem berhasil dibersihkan",
    });
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to clear logs" },
      { status }
    );
  }
}
