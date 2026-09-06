import fs from "fs";
import path from "path";
import crypto from "crypto";

export type WebhookEvent =
  | "message.received"
  | "message.sent"
  | "message.delivered"
  | "message.read"
  | "message.failed"
  | "message.opt_out"
  | "device.connected"
  | "device.disconnected"
  | "device.warning";

export interface WebhookConfig {
  id: string;
  userId: string;
  name: string;
  url: string;
  secret: string; // HMAC secret token
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastPingAt?: string;
  lastPingStatus?: "SUCCESS" | "FAILED";
  lastPingCode?: number;
}

export interface WebhookLog {
  id: string;
  userId: string;
  webhookId: string;
  event: WebhookEvent | "test.ping";
  url: string;
  payload: any;
  responseStatus: number;
  responseBody?: string;
  durationMs: number;
  success: boolean;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");
const WEBHOOKS_FILE = path.join(DATA_DIR, "webhooks.json");
const LOGS_FILE = path.join(DATA_DIR, "webhook_logs.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(WEBHOOKS_FILE)) {
    const defaultWebhooks: WebhookConfig[] = [
      {
        id: "wh_demo_1",
        userId: "admin-default-user",
        name: "Production CRM Webhook",
        url: "https://webhook.site/sendora-crm-demo",
        secret: "whsec_" + crypto.randomBytes(16).toString("hex"),
        events: ["message.received", "message.delivered", "device.connected"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastPingAt: new Date().toISOString(),
        lastPingStatus: "SUCCESS",
        lastPingCode: 200,
      },
    ];
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(defaultWebhooks, null, 2));
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2));
  }
}

export function getWebhooks(userId: string): WebhookConfig[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(WEBHOOKS_FILE, "utf-8");
    const webhooks: WebhookConfig[] = JSON.parse(data);
    return webhooks.filter((w) => w.userId === userId || w.userId === "admin-default-user");
  } catch {
    return [];
  }
}

export function getWebhookById(id: string, userId: string): WebhookConfig | null {
  const webhooks = getWebhooks(userId);
  return webhooks.find((w) => w.id === id) || null;
}

export function createWebhook(
  userId: string,
  data: Omit<WebhookConfig, "id" | "userId" | "createdAt" | "updatedAt">
): WebhookConfig {
  ensureDataDir();
  const raw = fs.readFileSync(WEBHOOKS_FILE, "utf-8");
  const webhooks: WebhookConfig[] = JSON.parse(raw);

  const newWebhook: WebhookConfig = {
    id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  webhooks.unshift(newWebhook);
  fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2));
  return newWebhook;
}

export function updateWebhook(
  id: string,
  userId: string,
  data: Partial<Omit<WebhookConfig, "id" | "userId" | "createdAt">>
): WebhookConfig | null {
  ensureDataDir();
  const raw = fs.readFileSync(WEBHOOKS_FILE, "utf-8");
  const webhooks: WebhookConfig[] = JSON.parse(raw);

  const idx = webhooks.findIndex((w) => w.id === id);
  if (idx === -1) return null;

  webhooks[idx] = {
    ...webhooks[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2));
  return webhooks[idx];
}

export function deleteWebhook(id: string, userId: string): boolean {
  ensureDataDir();
  const raw = fs.readFileSync(WEBHOOKS_FILE, "utf-8");
  const webhooks: WebhookConfig[] = JSON.parse(raw);

  const filtered = webhooks.filter((w) => w.id !== id);
  if (filtered.length === webhooks.length) return false;

  fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export function getWebhookLogs(userId: string, limit = 50): WebhookLog[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(LOGS_FILE, "utf-8");
    const logs: WebhookLog[] = JSON.parse(data);
    return logs
      .filter((l) => l.userId === userId || l.userId === "admin-default-user")
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function recordWebhookLog(log: Omit<WebhookLog, "id" | "createdAt">): WebhookLog {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(LOGS_FILE, "utf-8");
    const logs: WebhookLog[] = JSON.parse(raw);

    const newLog: WebhookLog = {
      id: `whlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...log,
      createdAt: new Date().toISOString(),
    };

    logs.unshift(newLog);
    // Keep max 200 logs
    const trimmed = logs.slice(0, 200);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2));
    return newLog;
  } catch {
    return {
      id: `whlog_${Date.now()}`,
      ...log,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Generates HMAC SHA-256 signature for payload
 */
export function generateSignature(payload: any, secret: string): string {
  const jsonStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", secret);
  return `sha256=${hmac.update(jsonStr).digest("hex")}`;
}

/**
 * Dispatches an event to all active subscribed webhooks
 */
export async function dispatchWebhookEvent(
  userId: string,
  event: WebhookEvent,
  payload: any
) {
  const webhooks = getWebhooks(userId).filter(
    (w) => w.isActive && w.events.includes(event)
  );

  const results = await Promise.allSettled(
    webhooks.map(async (webhook) => {
      const startTime = Date.now();
      const body = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      };
      const signature = generateSignature(body, webhook.secret);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Sendora-Signature": signature,
            "X-Sendora-Event": event,
            "User-Agent": "Sendora-Webhook-Dispatcher/1.0",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const durationMs = Date.now() - startTime;
        const respText = await res.text().catch(() => "");

        recordWebhookLog({
          userId,
          webhookId: webhook.id,
          event,
          url: webhook.url,
          payload: body,
          responseStatus: res.status,
          responseBody: respText.slice(0, 300),
          durationMs,
          success: res.ok,
        });

        updateWebhook(webhook.id, userId, {
          lastPingAt: new Date().toISOString(),
          lastPingStatus: res.ok ? "SUCCESS" : "FAILED",
          lastPingCode: res.status,
        });

        return { webhookId: webhook.id, status: res.status };
      } catch (err: any) {
        const durationMs = Date.now() - startTime;
        recordWebhookLog({
          userId,
          webhookId: webhook.id,
          event,
          url: webhook.url,
          payload: body,
          responseStatus: 0,
          responseBody: err.message || "Network Timeout",
          durationMs,
          success: false,
        });

        updateWebhook(webhook.id, userId, {
          lastPingAt: new Date().toISOString(),
          lastPingStatus: "FAILED",
          lastPingCode: 0,
        });
      }
    })
  );

  return results;
}
