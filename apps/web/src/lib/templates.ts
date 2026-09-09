import fs from "fs";
import path from "path";

export type TemplateCategory =
  | "BROADCAST"
  | "PROMO"
  | "NOTIFIKASI"
  | "OTP"
  | "SUPPORT"
  | "LAINNYA";

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  shortcode: string; // e.g. tpl_order_notif
  category: TemplateCategory;
  content: string; // Spintax-enabled message body
  variables: string[]; // detected vars like ["name", "order_id"]
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMPLATES_FILE)) {
    const defaults: MessageTemplate[] = [
      {
        id: "tpl_demo_1",
        userId: "admin-default-user",
        name: "Notifikasi Pesanan",
        shortcode: "tpl_order_notif",
        category: "NOTIFIKASI",
        content:
          "{Halo|Hai|Selamat siang} {Kak|Pak/Bu} {{name}}, pesanan #{{order_id}} Anda {sudah dikirim|sedang dalam perjalanan}. Estimasi tiba {{eta}}. Terima kasih sudah berbelanja!",
        variables: ["name", "order_id", "eta"],
        usageCount: 42,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tpl_demo_2",
        userId: "admin-default-user",
        name: "Promo Flash Sale",
        shortcode: "tpl_promo_flash",
        category: "PROMO",
        content:
          "{Halo|Hai} {{name}}! 🔥 *FLASH SALE* hari ini saja!\n\nDapatkan diskon hingga *50%* untuk semua produk kami. Gunakan kode: *{{promo_code}}*\n\nBerlaku s/d {{deadline}}. Jangan sampai kehabisan! 🛒",
        variables: ["name", "promo_code", "deadline"],
        usageCount: 18,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tpl_demo_3",
        userId: "admin-default-user",
        name: "OTP Verifikasi",
        shortcode: "tpl_otp_verify",
        category: "OTP",
        content:
          "Kode verifikasi Anda adalah *{{otp_code}}*. Berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.",
        variables: ["otp_code"],
        usageCount: 156,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(defaults, null, 2));
  }
}

export function getTemplates(userId: string): MessageTemplate[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(TEMPLATES_FILE, "utf-8");
    const tpls: MessageTemplate[] = JSON.parse(raw);
    return tpls
      .filter((t) => t.userId === userId || t.userId === "admin-default-user")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

export function getTemplateById(id: string, userId: string): MessageTemplate | null {
  return getTemplates(userId).find((t) => t.id === id) || null;
}

/** Extract variable names from template content like {{name}}, {{order_id}} */
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
}

export function createTemplate(
  userId: string,
  data: Pick<MessageTemplate, "name" | "shortcode" | "category" | "content">
): MessageTemplate {
  ensureDataDir();
  const raw = fs.readFileSync(TEMPLATES_FILE, "utf-8");
  const tpls: MessageTemplate[] = JSON.parse(raw);

  const newTpl: MessageTemplate = {
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    ...data,
    variables: extractVariables(data.content),
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tpls.unshift(newTpl);
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(tpls, null, 2));
  return newTpl;
}

export function updateTemplate(
  id: string,
  userId: string,
  data: Partial<Pick<MessageTemplate, "name" | "shortcode" | "category" | "content">>
): MessageTemplate | null {
  ensureDataDir();
  const raw = fs.readFileSync(TEMPLATES_FILE, "utf-8");
  const tpls: MessageTemplate[] = JSON.parse(raw);

  const idx = tpls.findIndex((t) => t.id === id && (t.userId === userId || t.userId === "admin-default-user"));
  if (idx === -1) return null;

  tpls[idx] = {
    ...tpls[idx],
    ...data,
    variables: data.content
      ? extractVariables(data.content)
      : tpls[idx].variables,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(tpls, null, 2));
  return tpls[idx];
}

export function deleteTemplate(id: string, userId: string): boolean {
  ensureDataDir();
  const raw = fs.readFileSync(TEMPLATES_FILE, "utf-8");
  const tpls: MessageTemplate[] = JSON.parse(raw);
  const filtered = tpls.filter((t) => !(t.id === id && (t.userId === userId || t.userId === "admin-default-user")));
  if (filtered.length === tpls.length) return false;
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export function incrementTemplateUsage(id: string) {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(TEMPLATES_FILE, "utf-8");
    const tpls: MessageTemplate[] = JSON.parse(raw);
    const tpl = tpls.find((t) => t.id === id);
    if (tpl) {
      tpl.usageCount = (tpl.usageCount || 0) + 1;
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(tpls, null, 2));
    }
  } catch {}
}
