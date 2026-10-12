import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  PaymentChannelDefinition,
  AVAILABLE_PAYMENT_CHANNELS,
  DEFAULT_ENABLED_PAYMENT_CHANNELS,
} from "./payment-channels";

export {
  type PaymentChannelDefinition,
  AVAILABLE_PAYMENT_CHANNELS,
  DEFAULT_ENABLED_PAYMENT_CHANNELS,
};

export interface AdminSystemSettings {
  systemProfile: {
    adminName: string;
    adminEmail: string;
    appName: string;
    adminPasswordHash?: string | null;
  };
  gatewayConfig: {
    gatewayUrl: string;
    minDelaySec: number;
    maxDelaySec: number;
    typingPresence: boolean;
    autoRotateEnabled: boolean;
    circuitBreakerThreshold: number;
  };
  watermarkConfig: {
    enabled: boolean;
    text: string;
    applyToFreeOnly: boolean;
  };
  paymentConfig: {
    provider: "midtrans";
    environment: "sandbox" | "production";
    merchantId: string;
    clientKey: string;
    serverKey: string;
    sandbox?: {
      merchantId: string;
      clientKey: string;
      serverKey: string;
    };
    production?: {
      merchantId: string;
      clientKey: string;
      serverKey: string;
    };
    enabled: boolean;
    enabledChannels?: string[];
  };
  smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password?: string;
    fromEmail: string;
    fromName: string;
    noreplyEmail: string;
    noreplyName: string;
    enabled: boolean;
  };
  maintenanceConfig: {
    enabled: boolean;
    message: string;
    allowAdminBypass: boolean;
  };
  dataRetentionDays: number;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const ADMIN_SETTINGS_FILE = path.join(DATA_DIR, "admin_settings.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDefaultAdminSettings(): AdminSystemSettings {
  const prodMerchantId = process.env.MIDTRANS_PRODUCTION_MERCHANT_ID || process.env.MIDTRANS_MERCHANT_ID || "";
  const prodClientKey = process.env.NEXT_PUBLIC_MIDTRANS_PRODUCTION_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const prodServerKey = process.env.MIDTRANS_PRODUCTION_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY || "";

  const sandMerchantId = process.env.MIDTRANS_SANDBOX_MERCHANT_ID || "";
  const sandClientKey = process.env.NEXT_PUBLIC_MIDTRANS_SANDBOX_CLIENT_KEY || "";
  const sandServerKey = process.env.MIDTRANS_SANDBOX_SERVER_KEY || "";

  const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true" || process.env.MIDTRANS_ENVIRONMENT === "production";

  return {
    systemProfile: {
      adminName: "Super Administrator",
      adminEmail: "admin@waply.id",
      appName: "Waply WhatsApp Gateway",
    },
    gatewayConfig: {
      gatewayUrl: "http://localhost:3002",
      minDelaySec: 4,
      maxDelaySec: 8,
      typingPresence: true,
      autoRotateEnabled: true,
      circuitBreakerThreshold: 5,
    },
    watermarkConfig: {
      enabled: true,
      text: "\n\n> `Waply.id`",
      applyToFreeOnly: true,
    },
    paymentConfig: {
      provider: "midtrans",
      environment: isProd ? "production" : "sandbox",
      merchantId: isProd ? prodMerchantId : sandMerchantId,
      clientKey: isProd ? prodClientKey : sandClientKey,
      serverKey: isProd ? prodServerKey : sandServerKey,
      sandbox: {
        merchantId: sandMerchantId,
        clientKey: sandClientKey,
        serverKey: sandServerKey,
      },
      production: {
        merchantId: prodMerchantId,
        clientKey: prodClientKey,
        serverKey: prodServerKey,
      },
      enabled: true,
      enabledChannels: DEFAULT_ENABLED_PAYMENT_CHANNELS,
    },
    smtpConfig: {
      host: process.env.SMTP_HOST || "smtp.resend.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      username: process.env.SMTP_USER || "resend",
      password: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "",
      fromEmail: process.env.SMTP_FROM || "support@waply.web.id",
      fromName: "Waply Support",
      noreplyEmail: process.env.SMTP_NOREPLY_FROM || "noreply@waply.web.id",
      noreplyName: "Waply Security",
      enabled: true,
    },
    maintenanceConfig: {
      enabled: false,
      message: "Sistem sedang dalam peningkatan performa server terjadwal. Silakan coba kembali beberapa saat lagi.",
      allowAdminBypass: true,
    },
    dataRetentionDays: 30,
    updatedAt: new Date().toISOString(),
  };
}

export function getAdminSettings(): AdminSystemSettings {
  ensureDataDir();
  if (!fs.existsSync(ADMIN_SETTINGS_FILE)) {
    const defaults = getDefaultAdminSettings();
    fs.writeFileSync(ADMIN_SETTINGS_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }

  try {
    const raw = fs.readFileSync(ADMIN_SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const defaults = getDefaultAdminSettings();
    return {
      ...defaults,
      ...parsed,
      paymentConfig: {
        ...defaults.paymentConfig,
        ...(parsed.paymentConfig || {}),
        enabledChannels:
          parsed.paymentConfig?.enabledChannels && Array.isArray(parsed.paymentConfig.enabledChannels)
            ? parsed.paymentConfig.enabledChannels
            : DEFAULT_ENABLED_PAYMENT_CHANNELS,
      },
    };
  } catch {
    return getDefaultAdminSettings();
  }
}

export function saveAdminSettings(data: Partial<AdminSystemSettings>): AdminSystemSettings {
  ensureDataDir();
  let current = getDefaultAdminSettings();
  if (fs.existsSync(ADMIN_SETTINGS_FILE)) {
    try {
      const raw = fs.readFileSync(ADMIN_SETTINGS_FILE, "utf-8");
      current = { ...current, ...JSON.parse(raw) };
    } catch {
      //
    }
  }

  const updated: AdminSystemSettings = {
    ...current,
    ...data,
    systemProfile: {
      ...current.systemProfile,
      ...(data.systemProfile || {}),
      adminPasswordHash:
        data.systemProfile && "adminPasswordHash" in data.systemProfile
          ? data.systemProfile.adminPasswordHash
          : current.systemProfile?.adminPasswordHash,
    },
    gatewayConfig: {
      ...current.gatewayConfig,
      ...(data.gatewayConfig || {}),
    },
    watermarkConfig: {
      ...(current.watermarkConfig || {
        enabled: true,
        text: "\n\n—\n*Waply.com*",
        applyToFreeOnly: true,
      }),
      ...(data.watermarkConfig || {}),
    },
    paymentConfig: {
      ...current.paymentConfig,
      ...(data.paymentConfig || {}),
    },
    smtpConfig: {
      ...current.smtpConfig,
      ...(data.smtpConfig || {}),
    },
    maintenanceConfig: {
      ...current.maintenanceConfig,
      ...(data.maintenanceConfig || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(ADMIN_SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combined: string): boolean {
  try {
    const [salt, key] = combined.split(":");
    if (!salt || !key) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(key, "hex"));
  } catch {
    return false;
  }
}

export function hasAdminPassword(): boolean {
  const settings = getAdminSettings();
  return !!(settings.systemProfile?.adminPasswordHash || process.env.ADMIN_PASSWORD);
}

export function verifyAdminPassword(inputPassword: string): boolean {
  const settings = getAdminSettings();
  const hash = settings.systemProfile?.adminPasswordHash;
  if (hash) {
    return verifyPassword(inputPassword, hash);
  }
  if (process.env.ADMIN_PASSWORD) {
    return inputPassword === process.env.ADMIN_PASSWORD;
  }
  // When no password has been explicitly set yet, allow initial login
  return true;
}

export function setAdminPassword(newPassword: string): void {
  const hash = hashPassword(newPassword);
  const current = getAdminSettings();
  saveAdminSettings({
    systemProfile: {
      ...current.systemProfile,
      adminPasswordHash: hash,
    },
  });
}

