import fs from "fs";
import path from "path";

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
    enabled: boolean;
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

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");
const ADMIN_SETTINGS_FILE = path.join(DATA_DIR, "admin_settings.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDefaultAdminSettings(): AdminSystemSettings {
  return {
    systemProfile: {
      adminName: "Super Administrator",
      adminEmail: "admin@sendora.id",
      appName: "Sendora WhatsApp Gateway",
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
      text: "\n\n—\n⚡ ```Sendora.com```",
      applyToFreeOnly: true,
    },
    paymentConfig: {
      provider: "midtrans",
      environment: "sandbox",
      merchantId: process.env.MIDTRANS_MERCHANT_ID || "",
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
      serverKey: process.env.MIDTRANS_SERVER_KEY || "",
      enabled: true,
    },
    smtpConfig: {
      host: process.env.SMTP_HOST || "smtp.sendgrid.net",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      username: process.env.SMTP_USER || "apikey",
      password: process.env.SMTP_PASSWORD || "",
      fromEmail: process.env.SMTP_FROM || "notifications@sendora.id",
      fromName: "Sendora WhatsApp Gateway",
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
    return {
      ...getDefaultAdminSettings(),
      ...parsed,
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
        text: "\n\n—\n⚡ *Sendora.com*",
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
