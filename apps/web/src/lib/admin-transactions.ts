import fs from "fs";
import path from "path";
import { Invoice, InvoiceStatus, activateSubscription } from "./billing";
import { getAdminSettings } from "./admin-settings";
import { getAllManagedUsers } from "./admin-users";

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");

export interface TransactionDetail extends Invoice {
  userName?: string;
  userEmail?: string;
  planName?: string;
  period?: string;
  paymentType?: string;
  settlementTime?: string;
  vaNumber?: string | null;
  paymentUrl?: string | null;
}

export interface TransactionSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  averageOrderValue: number;
  totalTransactions: number;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getAllTransactions(): {
  transactions: TransactionDetail[];
  summary: TransactionSummary;
} {
  ensureDataDir();
  try {
    let invoices: Invoice[] = [];
    if (fs.existsSync(INVOICES_FILE)) {
      const raw = fs.readFileSync(INVOICES_FILE, "utf-8");
      invoices = JSON.parse(raw || "[]");
    }

    const users = getAllManagedUsers();
    const userMap = new Map(users.map((u) => [u.id.toLowerCase(), u]));
    users.forEach((u) => {
      if (u.email) userMap.set(u.email.toLowerCase(), u);
    });

    const enriched: TransactionDetail[] = invoices.map((inv) => {
      const user =
        userMap.get((inv.userId || "").toLowerCase()) ||
        userMap.get(((inv as any).userEmail || "").toLowerCase());

      return {
        ...inv,
        userName: (inv as any).userName || user?.name || "Customer",
        userEmail: (inv as any).userEmail || user?.email || "-",
        planName: (inv as any).planName || inv.planId || "Plan",
        period: (inv as any).period || "month",
        vaNumber: (inv as any).vaNumber || null,
        paymentUrl: (inv as any).paymentUrl || null,
      };
    });

    // Sort by latest createdAt
    enriched.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate Financial Summary
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let successCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    enriched.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.status === "PAID") {
        totalRevenue += amount;
        successCount++;

        const txDate = new Date(tx.paidAt || tx.createdAt);
        if (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        ) {
          monthlyRevenue += amount;
        }
      } else if (tx.status === "PENDING") {
        pendingCount++;
      } else if (tx.status === "EXPIRED" || tx.status === "FAILED") {
        failedCount++;
      }
    });

    const averageOrderValue =
      successCount > 0 ? Math.round(totalRevenue / successCount) : 0;

    return {
      transactions: enriched,
      summary: {
        totalRevenue,
        monthlyRevenue,
        successCount,
        pendingCount,
        failedCount,
        averageOrderValue,
        totalTransactions: enriched.length,
      },
    };
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return {
      transactions: [],
      summary: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        successCount: 0,
        pendingCount: 0,
        failedCount: 0,
        averageOrderValue: 0,
        totalTransactions: 0,
      },
    };
  }
}

export async function syncMidtransTransaction(
  orderId: string
): Promise<{ success: boolean; status?: string; message: string }> {
  ensureDataDir();
  try {
    if (!fs.existsSync(INVOICES_FILE)) {
      return { success: false, message: "Data invoice belum tersedia" };
    }

    const raw = fs.readFileSync(INVOICES_FILE, "utf-8");
    const invoices: Invoice[] = JSON.parse(raw || "[]");
    const targetIdx = invoices.findIndex(
      (inv) => inv.orderId === orderId || inv.id === orderId
    );

    if (targetIdx === -1) {
      return { success: false, message: `Transaksi ${orderId} tidak ditemukan` };
    }

    const target = invoices[targetIdx];
    const settings = getAdminSettings();
    const serverKey =
      settings.paymentConfig?.serverKey || process.env.MIDTRANS_SERVER_KEY || "";
    const isProd =
      settings.paymentConfig?.environment === "production" ||
      process.env.MIDTRANS_IS_PRODUCTION === "true";

    if (!serverKey) {
      return {
        success: false,
        message: "Midtrans Server Key belum dikonfigurasi di Settings",
      };
    }

    const host = isProd
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";
    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

    const res = await fetch(`${host}/v2/${target.orderId}/status`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok && data.status_code === "404") {
      return {
        success: false,
        message: `Order ID ${target.orderId} belum tercatat di Midtrans`,
      };
    }

    const transactionStatus = data.transaction_status;
    const fraudStatus = data.fraud_status;

    let newStatus: InvoiceStatus = target.status;

    if (
      transactionStatus === "capture" ||
      transactionStatus === "settlement"
    ) {
      if (fraudStatus === "challenge") {
        newStatus = "PENDING";
      } else {
        newStatus = "PAID";
        target.paidAt = data.settlement_time || new Date().toISOString();
        target.paymentMethod = data.payment_type || target.paymentMethod;

        // Activate user subscription
        if (target.userId && target.planId) {
          activateSubscription(target.userId, target.planId, target.durationMonths || 1);
        }
      }
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      newStatus = "EXPIRED";
    } else if (transactionStatus === "pending") {
      newStatus = "PENDING";
    }

    target.status = newStatus;
    invoices[targetIdx] = target;
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2));

    return {
      success: true,
      status: newStatus,
      message: `Status berhasil disinkronkan ke: ${newStatus} (${transactionStatus || "OK"})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal menghubungi Midtrans API",
    };
  }
}

export function clearAllTransactions(): boolean {
  ensureDataDir();
  try {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify([], null, 2));
    return true;
  } catch {
    return false;
  }
}

export function deleteTransaction(orderId: string): boolean {
  ensureDataDir();
  try {
    if (!fs.existsSync(INVOICES_FILE)) return true;
    const raw = fs.readFileSync(INVOICES_FILE, "utf-8");
    const invoices: Invoice[] = JSON.parse(raw || "[]");
    const filtered = invoices.filter(
      (inv) => inv.orderId !== orderId && inv.id !== orderId
    );
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(filtered, null, 2));
    return true;
  } catch {
    return false;
  }
}
