import fs from "fs";
import path from "path";
import crypto from "crypto";

export * from "./billing-types";
import {
  PlanId,
  PlanFeatureAccess,
  FEATURE_ACCESS_LABELS,
  getPlanDisplayFeatures,
  Plan,
  DEFAULT_PLANS,
  DEFAULT_FREE_ACCESS,
  SubscriptionStatus,
  InvoiceStatus,
  Subscription,
  Invoice,
} from "./billing-types";
import { getAdminSettings } from "./admin-settings";

// ─── Plan Storage & Server Methods ────────────────────────────────────────────

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const PLANS_FILE = path.join(DATA_DIR, "plans.json");
const SUBSCRIPTION_FILE = path.join(DATA_DIR, "subscription.json");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getAllPlans(): Record<string, Plan> {
  ensureDataDir();
  try {
    if (!fs.existsSync(PLANS_FILE)) {
      // First-time init: persist DEFAULT_PLANS to plans.json
      fs.writeFileSync(PLANS_FILE, JSON.stringify(DEFAULT_PLANS, null, 2));
      return DEFAULT_PLANS;
    }
    const raw = fs.readFileSync(PLANS_FILE, "utf-8");
    const stored: Record<string, Plan> = JSON.parse(raw || "{}");
    if (stored && typeof stored === "object") {
      return stored;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveCustomPlan(plan: Plan): Plan {
  ensureDataDir();
  const all = getAllPlans();
  const cleanId = plan.id.toUpperCase().replace(/\s+/g, "_");
  const updatedPlan: Plan = {
    ...plan,
    id: cleanId,
    createdAt: plan.createdAt || new Date().toISOString(),
    isActive: plan.isActive ?? true,
    period: plan.period || "month",
    access: plan.access || {
      devices: true,
      warmupHealth: true,
      broadcast: true,
      contacts: true,
      sendMessage: true,
      messageLogs: true,
      templatesSpintax: true,
      blacklistDnd: true,
      autoReply: true,
      apiDocs: true,
      apiKeys: true,
      webhooks: true,
    },
  };
  all[cleanId] = updatedPlan;
  fs.writeFileSync(PLANS_FILE, JSON.stringify(all, null, 2));
  return updatedPlan;
}

export function deleteCustomPlan(planId: string): boolean {
  ensureDataDir();
  try {
    const all = getAllPlans();
    const cleanId = planId.trim().toUpperCase();
    const targetKey = Object.keys(all).find((k) => k.toUpperCase() === cleanId) || planId;

    if (all[targetKey]) {
      delete all[targetKey];
      fs.writeFileSync(PLANS_FILE, JSON.stringify(all, null, 2));
      return true;
    }
  } catch (err) {
    console.error("Failed to delete plan:", err);
  }
  return false;
}

export const PLANS: Record<string, Plan> = new Proxy({} as Record<string, Plan>, {
  get(target, prop: string) {
    const dynamic = getAllPlans();
    return dynamic[prop];
  },
  ownKeys() {
    return Object.keys(getAllPlans());
  },
  getOwnPropertyDescriptor(target, prop: string) {
    const dynamic = getAllPlans();
    if (prop in dynamic) {
      return {
        enumerable: true,
        configurable: true,
        value: dynamic[prop],
      };
    }
    return undefined;
  },
});

// ─── Subscription CRUD ────────────────────────────────────────────────────────

function getAllSubscriptions(): Record<string, Subscription> {
  ensureDataDir();
  try {
    if (fs.existsSync(SUBSCRIPTION_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SUBSCRIPTION_FILE, "utf-8"));
      if (raw && typeof raw === "object") {
        if (raw.userId && raw.planId) {
          // Single legacy object format -> convert to map
          return { [raw.userId]: raw as Subscription };
        }
        return raw as Record<string, Subscription>;
      }
    }
  } catch {}
  return {};
}

export function getSubscription(userId: string): Subscription {
  ensureDataDir();
  const cleanId = userId ? userId.trim() : "";
  const all = getAllSubscriptions();

  if (cleanId && all[cleanId]) {
    return all[cleanId];
  }

  // Fallback: Check users_registry.json for user's assigned plan
  try {
    const usersFile = path.join(DATA_DIR, "users_registry.json");
    if (fs.existsSync(usersFile)) {
      const users: any[] = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
      const found = users.find(
        (u) =>
          u.id === cleanId ||
          (cleanId.includes("@") && u.email?.toLowerCase() === cleanId.toLowerCase())
      );
      if (found) {
        return {
          userId: found.id,
          planId: (found.planId as PlanId) || "FREE",
          status: (found.planStatus as SubscriptionStatus) || (found.planId === "FREE" ? "FREE" : "ACTIVE"),
          startDate: null,
          endDate: null,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch {}

  return {
    userId: cleanId || "anonymous",
    planId: "FREE",
    status: "FREE",
    startDate: null,
    endDate: null,
    updatedAt: new Date().toISOString(),
  };
}

export function saveSubscription(data: Subscription): void {
  ensureDataDir();
  const all = getAllSubscriptions();
  if (data.userId) {
    all[data.userId] = data;
    fs.writeFileSync(SUBSCRIPTION_FILE, JSON.stringify(all, null, 2));
  }
}

export function activateSubscription(
  userId: string,
  planId: PlanId,
  durationMonths: number = 1
): Subscription {
  const allPlans = getAllPlans();
  const plan = allPlans[planId] || DEFAULT_PLANS[planId];
  const period = plan?.period || "month";

  const now = new Date();
  const endDate = new Date(now);

  if (period === "day") {
    endDate.setDate(endDate.getDate() + 1);
  } else if (period === "week") {
    endDate.setDate(endDate.getDate() + 7);
  } else if (period === "year") {
    const months = typeof durationMonths === "number" && durationMonths > 0 ? durationMonths : 12;
    const years = Math.max(1, Math.round(months / 12));
    endDate.setDate(endDate.getDate() + (365 * years));
  } else {
    // "month" / default: multiply 365 for each full year or 30 days per month
    const months = typeof durationMonths === "number" && durationMonths > 0 ? durationMonths : 1;
    if (months % 12 === 0) {
      endDate.setDate(endDate.getDate() + (365 * (months / 12)));
    } else {
      endDate.setDate(endDate.getDate() + (30 * months));
    }
  }

  const sub: Subscription = {
    userId,
    planId,
    status: "ACTIVE",
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    updatedAt: now.toISOString(),
  };
  saveSubscription(sub);

  // Also sync user in users_registry.json if present
  try {
    const usersFile = path.join(DATA_DIR, "users_registry.json");
    if (fs.existsSync(usersFile)) {
      const users: any[] = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
      const idx = users.findIndex(
        (u) =>
          u.id === userId ||
          (userId.includes("@") && u.email?.toLowerCase() === userId.toLowerCase())
      );
      if (idx !== -1) {
        users[idx].planId = planId;
        users[idx].planStatus = "ACTIVE";
        users[idx].subscriptionStatus = "ACTIVE";
        users[idx].endDate = endDate.toISOString();
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      }
    }
  } catch {}

  return sub;
}

export function getUserPlanAccess(userId: string): PlanFeatureAccess {
  try {
    const sub = getSubscription(userId);
    const allPlans = getAllPlans();
    const plan = allPlans[sub.planId] || DEFAULT_PLANS[sub.planId] || DEFAULT_PLANS["FREE"];
    if (sub.status === "EXPIRED") {
      return DEFAULT_FREE_ACCESS;
    }
    return plan?.access || (plan?.price === 0 || plan?.id === "FREE" ? DEFAULT_FREE_ACCESS : {
      devices: true,
      warmupHealth: true,
      broadcast: true,
      contacts: true,
      sendMessage: true,
      messageLogs: true,
      templatesSpintax: true,
      blacklistDnd: true,
      autoReply: true,
      apiDocs: true,
      apiKeys: true,
      webhooks: true,
    });
  } catch {
    return DEFAULT_FREE_ACCESS;
  }
}

// ─── Invoice CRUD ─────────────────────────────────────────────────────────────

export function getInvoices(userId: string): Invoice[] {
  ensureDataDir();
  try {
    if (fs.existsSync(INVOICES_FILE)) {
      const all: Invoice[] = JSON.parse(fs.readFileSync(INVOICES_FILE, "utf-8"));
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch {}
  return [];
}

export function getInvoiceByOrderId(orderId: string): Invoice | null {
  ensureDataDir();
  try {
    if (fs.existsSync(INVOICES_FILE)) {
      const all: Invoice[] = JSON.parse(fs.readFileSync(INVOICES_FILE, "utf-8"));
      return all.find((inv) => inv.orderId === orderId) || null;
    }
  } catch {}
  return null;
}

export function createInvoice(data: Omit<Invoice, "id" | "createdAt">): Invoice {
  ensureDataDir();
  const invoices = getInvoices(data.userId);
  const invoice: Invoice = {
    ...data,
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  invoices.unshift(invoice);
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2));
  return invoice;
}

export function updateInvoice(orderId: string, update: Partial<Invoice>): Invoice | null {
  ensureDataDir();
  try {
    const all: Invoice[] = fs.existsSync(INVOICES_FILE)
      ? JSON.parse(fs.readFileSync(INVOICES_FILE, "utf-8"))
      : [];
    const idx = all.findIndex((inv) => inv.orderId === orderId);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...update };
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(all, null, 2));
    return all[idx];
  } catch {
    return null;
  }
}

// ─── Midtrans Helpers ─────────────────────────────────────────────────────────

const MIDTRANS_SANDBOX_BASE = "https://app.sandbox.midtrans.com/snap/v1";

/** Generate a unique order ID */
export function generateOrderId(planId: PlanId): string {
  return `WAPLY-${planId}-${Date.now()}`;
}

/** Create Snap token via Midtrans REST API */
export async function createSnapToken(params: {
  orderId: string;
  amount: number;
  planId: PlanId;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName?: string;
}): Promise<{ token: string; redirect_url: string }> {
  const adminSettings = getAdminSettings();
  const serverKey = process.env.MIDTRANS_SERVER_KEY || adminSettings.paymentConfig.serverKey;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY tidak dikonfigurasi. Silakan isi di Pengaturan Sistem Admin.");

  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    adminSettings.paymentConfig.environment === "production";

  const snapBaseUrl = isProduction
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";

  const auth = Buffer.from(`${serverKey}:`).toString("base64");
  const plan = PLANS[params.planId] || DEFAULT_PLANS[params.planId] || { name: params.planId };

  const body = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    item_details: [
      {
        id: params.planId,
        price: params.amount,
        quantity: 1,
        name: params.itemName || `Waply ${plan.name} Gateway & API Plan`,
      },
    ],
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || undefined,
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/order?payment=finish&orderId=${params.orderId}`,
    },
  };

  const res = await fetch(`${snapBaseUrl}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Midtrans error: ${res.status} — ${err}`);
  }

  return res.json();
}

/** Verify Midtrans notification signature */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const adminSettings = getAdminSettings();
  const serverKey = process.env.MIDTRANS_SERVER_KEY || adminSettings.paymentConfig.serverKey || "";
  const payload = `${params.orderId}${params.statusCode}${params.grossAmount}${serverKey}`;
  const computed = crypto.createHash("sha512").update(payload).digest("hex");
  return computed === params.signatureKey;
}

/** Map Midtrans transaction_status to InvoiceStatus */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): InvoiceStatus {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" ? "PAID" : "FAILED";
  }
  if (transactionStatus === "settlement") return "PAID";
  if (["deny", "cancel", "failure"].includes(transactionStatus)) return "FAILED";
  if (transactionStatus === "expire") return "EXPIRED";
  return "PENDING";
}

/** Query Midtrans API directly for transaction status */
export async function checkMidtransOrderStatus(orderId: string): Promise<any> {
  const adminSettings = getAdminSettings();
  const serverKey = process.env.MIDTRANS_SERVER_KEY || adminSettings.paymentConfig.serverKey;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY tidak dikonfigurasi");

  const auth = Buffer.from(`${serverKey}:`).toString("base64");
  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    adminSettings.paymentConfig.environment === "production";

  const baseUrl = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  const res = await fetch(`${baseUrl}/${orderId}/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Midtrans status error: ${res.status} — ${err}`);
  }

  return res.json();
}

/** Charge payment directly via Midtrans Core API (Headless Custom UI) */
export async function chargeMidtransCoreApi(params: {
  paymentType: "qris" | "bank_transfer" | "echannel" | "cstore" | "gopay" | "shopeepay";
  bank?: "bca" | "bni" | "bri" | "permata" | "mandiri";
  orderId: string;
  amount: number;
  planId: PlanId;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemName?: string;
}): Promise<any> {
  const adminSettings = getAdminSettings();
  const serverKey = process.env.MIDTRANS_SERVER_KEY || adminSettings.paymentConfig.serverKey;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY tidak dikonfigurasi. Silakan isi di Pengaturan Sistem Admin.");

  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    adminSettings.paymentConfig.environment === "production";

  const baseUrl = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  const auth = Buffer.from(`${serverKey}:`).toString("base64");
  const plan = PLANS[params.planId] || DEFAULT_PLANS[params.planId] || { name: params.planId };

  let payload: any = {
    payment_type: params.paymentType,
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    item_details: [
      {
        id: params.planId,
        price: params.amount,
        quantity: 1,
        name: params.itemName || `Waply ${plan.name} Gateway & API Plan`,
      },
    ],
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || undefined,
    },
  };

  if (params.paymentType === "qris") {
    payload.qris = { acquirer: "gopay" };
  } else if (params.paymentType === "bank_transfer") {
    if (params.bank === "mandiri") {
      payload.payment_type = "echannel";
      payload.echannel = {
        bill_info1: "Waply Gateway",
        bill_info2: params.itemName || "Langganan Paket",
      };
    } else if (params.bank === "permata") {
      payload.payment_type = "permata";
    } else {
      payload.bank_transfer = {
        bank: params.bank || "bca",
      };
    }
  } else if (params.paymentType === "gopay") {
    payload.gopay = {
      enable_callback: true,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/order?payment=finish&orderId=${params.orderId}`,
    };
  } else if (params.paymentType === "shopeepay") {
    payload.shopeepay = {
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/order?payment=finish&orderId=${params.orderId}`,
    };
  }

  const res = await fetch(`${baseUrl}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || (json.status_code && json.status_code !== "200" && json.status_code !== "201")) {
    throw new Error(json.status_message || `Gagal memproses charge Midtrans (${res.status})`);
  }

  return json;
}

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || "http://localhost:3002";

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

export async function sendWhatsAppInvoiceNotification(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  planName: string;
  amount: number;
  status: "PENDING" | "PAID";
  paymentMethod?: string | null;
  vaNumber?: string | null;
}): Promise<boolean> {
  try {
    if (!params.customerPhone) return false;
    const recipient = normalizePhone(params.customerPhone);
    if (!recipient || recipient.length < 9) return false;

    // Fetch active WhatsApp device from gateway
    const sessionRes = await fetch(`${GATEWAY_URL}/api/sessions`, { cache: "no-store" }).catch(() => null);
    if (!sessionRes || !sessionRes.ok) return false;

    const sessionJson = await sessionRes.json().catch(() => null);
    const devices = sessionJson?.data || [];
    const connectedDevice = devices.find((d: any) => d.status === "connected" || d.status === "CONNECTED") || devices[0];

    if (!connectedDevice?.id) {
      console.log(`[Notification] No connected WhatsApp device available to send receipt to ${recipient}`);
      return false;
    }

    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(params.amount);

    let message = "";
    if (params.status === "PAID") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
      message = `*PEMBAYARAN BERHASIL DITERIMA!* 🎉✅\n\nHalo *${params.customerName || "Pelanggan Waply"}*,\nTerima kasih, pembayaran untuk langganan Waply Anda telah berhasil diverifikasi!\n\n📋 *Rincian Pesanan:*\n• *Order ID:* ${params.orderId}\n• *Paket Layanan:* Waply ${params.planName}\n• *Total Nominal:* ${formattedAmount}\n• *Metode Bayar:* ${params.paymentMethod || "Transfer / QRIS"}\n• *Status Langganan:* LUNAS / AKTIF 🚀\n\nPaket Anda telah aktif dan kuota gateway sudah dapat langsung digunakan.\n\n🌐 *Buka Dashboard:* ${appUrl}/dashboard\n\n_Terima kasih telah mempercayakan WhatsApp Gateway bisnis Anda kepada Waply!_`;
    } else {
      message = `*TAGIHAN PESANAN WAPLY* 🧾\n\nHalo *${params.customerName || "Pelanggan Waply"}*,\nPesanan langganan Waply Gateway Anda telah berhasil dibuat.\n\n📋 *Detail Tagihan:*\n• *Order ID:* ${params.orderId}\n• *Paket:* Waply ${params.planName}\n• *Total Tagihan:* ${formattedAmount}\n• *Metode Bayar:* ${params.paymentMethod || "Virtual Account / QRIS"}\n• *Status:* MENUNGGU PEMBAYARAN ⏳\n\n${params.vaNumber ? `💳 *No. Virtual Account:* \`${params.vaNumber}\`\n\n` : ""}Silakan selesaikan pembayaran tepat sesuai nominal agar sistem memverifikasi secara instan.\n\n_Pesan otomatis ini dikirim oleh Waply Cloud Gateway_`;
    }

    const sendRes = await fetch(`${GATEWAY_URL}/api/sessions/${connectedDevice.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipient,
        message,
      }),
    });

    const sendJson = await sendRes.json().catch(() => null);
    if (sendJson?.success) {
      console.log(`[Notification] WhatsApp receipt sent to ${recipient} (Order: ${params.orderId})`);
      return true;
    }
  } catch (err: any) {
    console.error("[Notification] Failed to send WhatsApp invoice notification:", err.message);
  }
  return false;
}

export { sendEmailInvoiceNotification } from "./email-service";

