// ─── Client-Safe Billing Types & Helpers (No Node.js fs/path) ─────────────────

export type PlanId = string;

export interface PlanFeatureAccess {
  // WhatsApp
  devices: boolean;
  warmupHealth: boolean;
  // Messaging
  broadcast: boolean;
  contacts: boolean;
  sendMessage: boolean;
  messageLogs: boolean;
  templatesSpintax: boolean;
  blacklistDnd: boolean;
  // Automation
  autoReply: boolean;
  // Developers & API
  apiDocs: boolean;
  apiKeys: boolean;
  webhooks: boolean;

  // Backward-compat aliases
  apiAccess?: boolean;
  contactsUnlimited?: boolean;
}

export const DEFAULT_FREE_ACCESS: PlanFeatureAccess = {
  devices: true,
  warmupHealth: false,
  broadcast: false,
  contacts: false,
  sendMessage: true,
  messageLogs: true,
  templatesSpintax: true,
  blacklistDnd: false,
  autoReply: false,
  apiDocs: true,
  apiKeys: true,
  webhooks: true,
};

export const FEATURE_ACCESS_CATEGORIES = [
  {
    category: "WhatsApp",
    items: [
      { key: "devices" as keyof PlanFeatureAccess, label: "Koneksi WhatsApp Devices" },
      { key: "warmupHealth" as keyof PlanFeatureAccess, label: "Warmup & Anti-Ban Safety" },
    ],
  },
  {
    category: "Messaging",
    items: [
      { key: "broadcast" as keyof PlanFeatureAccess, label: "Broadcast / Blast Bulk Kampanye" },
      { key: "contacts" as keyof PlanFeatureAccess, label: "Contacts & Groups Management" },
      { key: "sendMessage" as keyof PlanFeatureAccess, label: "Send Message (Kirim Pesan Manual)" },
      { key: "messageLogs" as keyof PlanFeatureAccess, label: "Message Logs (Riwayat Pesan)" },
      { key: "templatesSpintax" as keyof PlanFeatureAccess, label: "Templates & Spintax Generator" },
      { key: "blacklistDnd" as keyof PlanFeatureAccess, label: "Blacklist & DND Protection" },
    ],
  },
  {
    category: "Automation",
    items: [
      { key: "autoReply" as keyof PlanFeatureAccess, label: "Auto Reply Rules & Bot Automation" },
    ],
  },
  {
    category: "Developers & API",
    items: [
      { key: "apiDocs" as keyof PlanFeatureAccess, label: "API Documentation & Playground" },
      { key: "apiKeys" as keyof PlanFeatureAccess, label: "API Keys Developer" },
      { key: "webhooks" as keyof PlanFeatureAccess, label: "Webhook Integration & Events" },
    ],
  },
];

export const FEATURE_ACCESS_LABELS: Record<string, string> = {
  devices: "Koneksi WhatsApp Devices",
  warmupHealth: "Warmup & Anti-Ban Safety",
  broadcast: "Broadcast / Blast Bulk Kampanye",
  contacts: "Contacts & Groups Management",
  sendMessage: "Send Message (Kirim Pesan Manual)",
  messageLogs: "Message Logs (Riwayat Pesan)",
  templatesSpintax: "Templates & Spintax Generator",
  blacklistDnd: "Blacklist & DND Protection",
  autoReply: "Auto Reply Rules & Bot Automation",
  apiDocs: "API Documentation & Playground",
  apiKeys: "API Keys Developer",
  webhooks: "Webhook Integration & Events",
};

export interface DetailedPlanFeature {
  label: string;
  included: boolean;
  category?: string;
}

export function getPlanDetailedFeatureList(plan: Partial<Plan>): DetailedPlanFeature[] {
  const periodLabel =
    plan.period === "day"
      ? "hari"
      : plan.period === "week"
      ? "minggu"
      : plan.period === "year"
      ? "tahun"
      : "bulan";
  const list: DetailedPlanFeature[] = [];

  // 1. Devices
  if (typeof plan.maxDevices === "number") {
    list.push({
      label: `${plan.maxDevices} WhatsApp Device${plan.maxDevices > 1 ? "s" : ""}`,
      included: true,
      category: "Limits",
    });
  }

  // 2. Messages
  if (plan.monthlyMessages === -1) {
    list.push({
      label: `Unlimited Pesan / ${periodLabel}`,
      included: true,
      category: "Limits",
    });
  } else if (typeof plan.monthlyMessages === "number") {
    list.push({
      label: `${plan.monthlyMessages.toLocaleString("id-ID")} Pesan / ${periodLabel}`,
      included: true,
      category: "Limits",
    });
  }

  // 3. Full categorized features from access checklist
  const access = plan.access || {
    devices: true,
    warmupHealth: false,
    broadcast: false,
    contacts: false,
    sendMessage: true,
    messageLogs: true,
    templatesSpintax: true,
    blacklistDnd: true,
    autoReply: false,
    apiDocs: true,
    apiKeys: true,
    webhooks: true,
  };

  FEATURE_ACCESS_CATEGORIES.forEach((cat) => {
    cat.items.forEach((item) => {
      // Resolve value with fallback to legacy keys if present
      let isIncluded = Boolean(access[item.key]);
      if (item.key === "apiKeys" && access.apiAccess !== undefined) {
        isIncluded = Boolean(access.apiKeys || access.apiAccess);
      }
      if (item.key === "contacts" && access.contactsUnlimited !== undefined) {
        isIncluded = Boolean(access.contacts || access.contactsUnlimited);
      }
      list.push({
        label: item.label,
        included: isIncluded,
        category: cat.category,
      });
    });
  });

  return list;
}

export interface Plan {
  id: string;
  name: string;
  price: number; // IDR, 0 = free (final price charged)
  originalPrice?: number; // IDR, original price before discount (harga coret)
  discountPercent?: number; // e.g. 20 for 20%
  discountBadge?: string; // e.g. "DISKON 20%", "HEMAT 20%", "FLASH SALE"
  period?: "month" | "week" | "year" | "day";
  maxDevices: number;
  monthlyMessages: number; // -1 for unlimited
  features: string[];
  access?: PlanFeatureAccess;
  isPopular?: boolean;
  isActive?: boolean;
  watermarkEnabled?: boolean;
  createdAt?: string;
}

export function getPlanDisplayFeatures(plan: Partial<Plan>): string[] {
  const periodLabel =
    plan.period === "day"
      ? "hari"
      : plan.period === "week"
      ? "minggu"
      : plan.period === "year"
      ? "tahun"
      : "bulan";
  const items: string[] = [];

  // 1. Devices
  if (typeof plan.maxDevices === "number") {
    items.push(`${plan.maxDevices} WhatsApp Device${plan.maxDevices > 1 ? "s" : ""}`);
  }

  // 2. Messages
  if (plan.monthlyMessages === -1) {
    items.push(`Unlimited Pesan / ${periodLabel}`);
  } else if (typeof plan.monthlyMessages === "number") {
    items.push(`${plan.monthlyMessages.toLocaleString("id-ID")} Pesan / ${periodLabel}`);
  }

  // 3. Checked Access features
  if (plan.access) {
    FEATURE_ACCESS_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        let isIncluded = Boolean(plan.access?.[item.key]);
        if (item.key === "apiKeys" && plan.access?.apiAccess !== undefined) {
          isIncluded = Boolean(plan.access.apiKeys || plan.access.apiAccess);
        }
        if (item.key === "contacts" && plan.access?.contactsUnlimited !== undefined) {
          isIncluded = Boolean(plan.access.contacts || plan.access.contactsUnlimited);
        }
        if (isIncluded) {
          items.push(item.label);
        }
      });
    });
  }

  // 4. Custom features
  if (plan.features && Array.isArray(plan.features)) {
    plan.features.forEach((f) => {
      const trimmed = f.trim();
      if (!trimmed) return;
      const isDeviceLine = /whatsapp device/i.test(trimmed);
      const isQuotaLine = /pesan\s*\//i.test(trimmed);
      const isAccessDuplicate = Object.values(FEATURE_ACCESS_LABELS).some(
        (lbl) => lbl.toLowerCase() === trimmed.toLowerCase()
      );
      if (!isDeviceLine && !isQuotaLine && !isAccessDuplicate && !items.includes(trimmed)) {
        items.push(trimmed);
      }
    });
  }

  return items;
}

export const DEFAULT_PLANS: Record<string, Plan> = {
  // ─── DAILY / HARIAN PLANS ───────────────────────────
  DAILY_STARTER: {
    id: "DAILY_STARTER",
    name: "Starter Harian",
    price: 5000,
    period: "day",
    maxDevices: 1,
    monthlyMessages: 500,
    features: [
      "1 WhatsApp Device",
      "500 Pesan / hari",
      "Koneksi WhatsApp Devices",
      "Send Message (Kirim Pesan Manual)",
      "Message Logs (Riwayat Pesan)",
      "Templates & Spintax Generator",
      "API Documentation & Playground",
    ],
    access: {
      devices: true,
      warmupHealth: false,
      broadcast: true,
      contacts: true,
      sendMessage: true,
      messageLogs: true,
      templatesSpintax: true,
      blacklistDnd: true,
      autoReply: false,
      apiDocs: true,
      apiKeys: true,
      webhooks: false,
    },
    isActive: true,
  },
  DAILY_PRO: {
    id: "DAILY_PRO",
    name: "Pro Harian",
    price: 15000,
    period: "day",
    maxDevices: 3,
    monthlyMessages: 5000,
    isPopular: true,
    features: [
      "3 WhatsApp Devices",
      "5.000 Pesan / hari",
      "Koneksi WhatsApp Devices",
      "Warmup & Anti-Ban Safety",
      "Broadcast / Blast Bulk Kampanye",
      "Contacts & Groups Management",
      "Auto Reply Rules & Bot Automation",
      "Webhook Integration & Events",
    ],
    access: {
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
    isActive: true,
  },

  // ─── MONTHLY / BULANAN PLANS ─────────────────────────
  FREE: {
    id: "FREE",
    name: "Free Trial",
    price: 0,
    period: "month",
    maxDevices: 1,
    monthlyMessages: 100,
    features: ["1 WhatsApp Device", "100 Pesan / bulan", "Basic API", "Basic Webhook"],
    access: {
      devices: true,
      warmupHealth: false,
      broadcast: false,
      contacts: false,
      sendMessage: true,
      messageLogs: true,
      templatesSpintax: true,
      blacklistDnd: false,
      autoReply: false,
      apiDocs: true,
      apiKeys: true,
      webhooks: true,
      apiAccess: true,
      contactsUnlimited: false,
    },
    watermarkEnabled: true,
    isActive: true,
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    price: 49000,
    period: "month",
    maxDevices: 2,
    monthlyMessages: 5000,
    features: ["2 WhatsApp Devices", "5.000 Pesan / bulan", "Spintax & Webhook", "Auto-Reply"],
    access: {
      devices: true,
      warmupHealth: false,
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
      apiAccess: true,
      contactsUnlimited: true,
    },
    isActive: true,
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    price: 149000,
    period: "month",
    maxDevices: 5,
    monthlyMessages: 25000,
    isPopular: true,
    features: [
      "5 WhatsApp Devices",
      "25.000 Pesan / bulan",
      "Keyword Auto Reply",
      "Broadcast Campaign",
      "Priority Support",
    ],
    access: {
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
      apiAccess: true,
      contactsUnlimited: true,
    },
    isActive: true,
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 299000,
    period: "month",
    maxDevices: 10,
    monthlyMessages: 200000,
    features: [
      "10 WhatsApp Devices",
      "200.000 Pesan / bulan",
      "Advanced Automation",
      "Multi-device Rotation",
      "Priority Support",
    ],
    access: {
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
      apiAccess: true,
      contactsUnlimited: true,
    },
    isActive: true,
  },

  // ─── YEARLY / TAHUNAN PLANS (HEMAT 20%) ──────────────
  YEARLY_STARTER: {
    id: "YEARLY_STARTER",
    name: "Starter Tahunan",
    price: 470000,
    period: "year",
    maxDevices: 2,
    monthlyMessages: 60000,
    features: [
      "2 WhatsApp Devices",
      "60.000 Pesan / tahun",
      "Koneksi WhatsApp Devices",
      "Broadcast / Blast Bulk Kampanye",
      "Contacts & Groups Management",
      "Auto Reply Rules & Bot Automation",
      "API & Webhook Integrations",
    ],
    access: {
      devices: true,
      warmupHealth: false,
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
    isActive: true,
  },
  YEARLY_BUSINESS: {
    id: "YEARLY_BUSINESS",
    name: "Business Tahunan",
    price: 1430000,
    period: "year",
    maxDevices: 5,
    monthlyMessages: 300000,
    isPopular: true,
    features: [
      "5 WhatsApp Devices",
      "300.000 Pesan / tahun",
      "Koneksi WhatsApp Devices",
      "Warmup & Anti-Ban Safety",
      "Broadcast / Blast Bulk Kampanye",
      "Auto Reply Rules & Bot Automation",
      "Priority Support 24/7",
    ],
    access: {
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
    isActive: true,
  },
  YEARLY_PRO: {
    id: "YEARLY_PRO",
    name: "Pro Tahunan",
    price: 2870000,
    period: "year",
    maxDevices: 10,
    monthlyMessages: 2400000,
    features: [
      "10 WhatsApp Devices",
      "2.400.000 Pesan / tahun",
      "Semua Fitur Enterprise Lengkap",
      "Multi-device Rotation System",
      "Dedicated Account Manager",
    ],
    access: {
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
    isActive: true,
  },
};

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "PENDING" | "FREE";
export type InvoiceStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

export interface Subscription {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  orderId: string;
  planId: PlanId;
  amount: number;
  status: InvoiceStatus;
  paymentMethod: string | null;
  snapToken: string | null;
  midtransTransactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  durationMonths?: number;
  selectedAddonIds?: string[];
  addonsAmount?: number;
}
