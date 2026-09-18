import fs from "fs";
import path from "path";
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
      host: process.env.SMTP_HOST || "smtp.sendgrid.net",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      username: process.env.SMTP_USER || "apikey",
      password: process.env.SMTP_PASSWORD || "",
      fromEmail: process.env.SMTP_FROM || "notifications@waply.id",
      fromName: "Waply WhatsApp Gateway",
      enabled: false,
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
