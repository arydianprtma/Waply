import fs from "fs";
import path from "path";
import type { SupportTicket, TicketCategory } from "./support-tickets";

export type AiKnowledgeCategory =
  | "TECHNICAL"
  | "BILLING"
  | "APPEAL"
  | "FEATURE"
  | "OTHER"
  | "GENERAL";

export type AiKnowledgeSource = "auto_learned" | "admin_manual";

export interface AiKnowledgeItem {
  id: string;
  title: string;
  category: AiKnowledgeCategory;
  problemDescription: string;
  solution: string;
  keywords: string[];
  source: AiKnowledgeSource;
  sourceTicketId?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".waply-data");
const KNOWLEDGE_FILE = path.join(DATA_DIR, "ai-knowledge.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const INITIAL_KNOWLEDGE_BASE: AiKnowledgeItem[] = [
  {
    id: "kb-tech-01",
    title: "Kendala Sesi WhatsApp Terputus (Disconnected / Restart)",
    category: "TECHNICAL",
    problemDescription: "Device WhatsApp tiba-tiba disconnected atau status merah di dashboard.",
    solution: "1. Buka menu Dashboard > Devices.\n2. Pastikan HP utama WhatsApp menyala dan memiliki koneksi internet stabil.\n3. Klik tombol 'Restart Session'. Jika masih belum terhubung, klik 'Scan Ulang QR' dan tautkan kembali perangkat WhatsApp Anda.\n4. Pastikan WhatsApp di ponsel tidak mengaktifkan mode hemat daya ekstrem.",
    keywords: ["disconnected", "terputus", "koneksi", "device merah", "scan ulang", "baileys", "session", "qr mati"],
    source: "admin_manual",
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-bill-01",
    title: "Panduan Upgrade Paket & Pembayaran Otomatis",
    category: "BILLING",
    problemDescription: "Cara upgrade paket, pembayaran QRIS / VA belum terverifikasi, atau redeem voucher.",
    solution: "1. Buka menu Dashboard > Billing.\n2. Pilih paket yang diinginkan lalu klik tombol 'Upgrade'.\n3. Pilih metode pembayaran instan (QRIS, Bank BCA/Mandiri/BRI/BNI VA, atau E-Wallet).\n4. Setelah pembayaran berhasil, paket dan kuota aktif seketika dalam hitungan detik secara otomatis.\n5. Jika memiliki kode promo, masukkan di kolom 'Redeem Voucher' sebelum checkout.",
    keywords: ["upgrade", "bayar", "billing", "qris", "virtual account", "bca", "mandiri", "voucher", "diskon", "kuota habis", "langganan"],
    source: "admin_manual",
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-anti-01",
    title: "Strategi Anti-Banned & Penggunaan Spintax",
    category: "TECHNICAL",
    problemDescription: "Cara mengirim broadcast tanpa terblokir WhatsApp dan aturan warmup nomor baru.",
    solution: "1. Selalu gunakan Spintax seperti `{Halo|Hai|Selamat Siang}` pada pesan agar setiap chat memiliki hash unik.\n2. Untuk nomor WhatsApp baru, jalankan tahapan Warmup: Hari 1-3 maks 30 pesan/hari, Hari 4-7 maks 100 pesan/hari, Hari 8-14 maks 500 pesan/hari.\n3. Gunakan fitur 'Auto-Rotate Device' agar pengiriman broadcast terbagi rata ke seluruh nomor yang terhubung.\n4. Berikan jeda delay pengiriman minimal 4–12 detik antar pesan.",
    keywords: ["banned", "blokir", "anti-ban", "spintax", "warmup", "nomor baru", "delay", "aman broadcast"],
    source: "admin_manual",
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-feat-01",
    title: "Integrasi REST API & Inbound Webhook",
    category: "FEATURE",
    problemDescription: "Panduan integrasi API pengiriman pesan dan penerimaan webhook event.",
    solution: "1. Gunakan Base URL Produksi: `https://ardp.my.id` (tanpa sub-path tambahan).\n2. Kirim Header: `Authorization: Bearer <API_KEY>` atau `X-API-Key: <API_KEY>`.\n3. Endpoint Kirim Pesan: `POST /api/v1/messages/send` dengan payload `{ to: '628xxx', message: 'teks', deviceId: 'auto_rotate' }`.\n4. Daftarkan URL Webhook di menu Dashboard > Webhook untuk menerima event pesan masuk (`message.received`) dan status terkirim (`message.delivered`).",
    keywords: ["api", "webhook", "endpoint", "base url", "integrasi", "postman", "curl", "laravel", "nodejs", "rest api"],
    source: "admin_manual",
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-appeal-01",
    title: "Prosedur Peninjauan & Banding Akun (Appeal)",
    category: "APPEAL",
    problemDescription: "Akun pengguna tersuspend atau terkena filter firewall security.",
    solution: "1. Tim Admin Waply akan meninjau riwayat trafik pengiriman pesan untuk memastikan tidak ada pelanggaran hukum atau indikasi spam massal ilegal.\n2. Jika terbukti bukan aktivitas penipuan/phishing, akun akan dipulihkan oleh Admin dalam kurun waktu 1x24 jam kerja.\n3. Pastikan tidak menggunakan kata kunci yang terdaftar pada Keyword Firewall sistem.",
    keywords: ["banding", "appeal", "suspend", "banned akun", "terkunci", "firewall", "buka blokir"],
    source: "admin_manual",
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

function readKnowledgeFromFile(): AiKnowledgeItem[] {
  ensureDataDir();
  if (!fs.existsSync(KNOWLEDGE_FILE)) {
    try {
      fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(INITIAL_KNOWLEDGE_BASE, null, 2), "utf8");
      return INITIAL_KNOWLEDGE_BASE;
    } catch {
      return INITIAL_KNOWLEDGE_BASE;
    }
  }

  try {
    const raw = fs.readFileSync(KNOWLEDGE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_KNOWLEDGE_BASE;
  } catch {
    return INITIAL_KNOWLEDGE_BASE;
  }
}

function writeKnowledgeToFile(items: AiKnowledgeItem[]): boolean {
  ensureDataDir();
  try {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(items, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[AI Knowledge] Failed to write knowledge file:", err);
    return false;
  }
}

export function getAllKnowledge(options?: {
  onlyActive?: boolean;
  category?: string;
  source?: string;
  search?: string;
}): AiKnowledgeItem[] {
  let items = readKnowledgeFromFile();

  if (options?.onlyActive) {
    items = items.filter((i) => i.isActive !== false);
  }

  if (options?.category && options.category !== "ALL") {
    items = items.filter((i) => i.category === options.category);
  }

  if (options?.source && options.source !== "ALL") {
    items = items.filter((i) => i.source === options.source);
  }

  if (options?.search && options.search.trim()) {
    const q = options.search.toLowerCase().trim();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.problemDescription.toLowerCase().includes(q) ||
        i.solution.toLowerCase().includes(q) ||
        i.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getKnowledgeById(id: string): AiKnowledgeItem | null {
  const items = readKnowledgeFromFile();
  return items.find((i) => i.id === id) || null;
}

export function saveKnowledge(
  item: Partial<AiKnowledgeItem> & { title: string; solution: string }
): AiKnowledgeItem {
  const items = readKnowledgeFromFile();
  const now = new Date().toISOString();

  if (item.id) {
    const index = items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      const updated: AiKnowledgeItem = {
        ...items[index],
        ...item,
        title: item.title.trim(),
        solution: item.solution.trim(),
        problemDescription: item.problemDescription?.trim() || items[index].problemDescription,
        keywords: item.keywords && item.keywords.length > 0 ? item.keywords : items[index].keywords,
        category: (item.category as AiKnowledgeCategory) || items[index].category,
        updatedAt: now,
      };
      items[index] = updated;
      writeKnowledgeToFile(items);
      return updated;
    }
  }

  // Create new
  const cleanKeywords = item.keywords
    ? item.keywords.map((k) => k.toLowerCase().trim()).filter(Boolean)
    : extractKeywordsFromText(`${item.title} ${item.problemDescription || ""} ${item.solution}`);

  const newItem: AiKnowledgeItem = {
    id: item.id || `kb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: item.title.trim(),
    category: (item.category as AiKnowledgeCategory) || "GENERAL",
    problemDescription: item.problemDescription?.trim() || item.title.trim(),
    solution: item.solution.trim(),
    keywords: cleanKeywords,
    source: (item.source as AiKnowledgeSource) || "admin_manual",
    sourceTicketId: item.sourceTicketId,
    isActive: item.isActive ?? true,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  items.unshift(newItem);
  writeKnowledgeToFile(items);
  return newItem;
}

export function deleteKnowledge(id: string): boolean {
  const items = readKnowledgeFromFile();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  return writeKnowledgeToFile(filtered);
}

export function toggleKnowledge(id: string, active?: boolean): boolean {
  const items = readKnowledgeFromFile();
  const item = items.find((i) => i.id === id);
  if (!item) return false;
  item.isActive = typeof active === "boolean" ? active : !item.isActive;
  item.updatedAt = new Date().toISOString();
  return writeKnowledgeToFile(items);
}

export function incrementKnowledgeUsage(id: string) {
  const items = readKnowledgeFromFile();
  const item = items.find((i) => i.id === id);
  if (item) {
    item.usageCount = (item.usageCount || 0) + 1;
    writeKnowledgeToFile(items);
  }
}

function extractKeywordsFromText(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  const unique = Array.from(new Set(words));
  return unique.slice(0, 10);
}

const STOP_WORDS = new Set([
  "yang", "untuk", "pada", "ke", "di", "dari", "ini", "itu", "dan", "atau", "adalah",
  "kami", "kita", "anda", "saya", "kamu", "bisa", "dengan", "sudah", "akan", "dalam",
  "karena", "agar", "tetapi", "namun", "jika", "maka", "saat", "oleh", "tentang",
  "the", "and", "with", "from", "that", "this", "for", "have", "been", "halo", "selamat"
]);

/**
 * Auto-Learn Knowledge from a Resolved Support Ticket
 */
export function autoLearnFromTicket(ticket: SupportTicket): AiKnowledgeItem | null {
  if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
    return null;
  }

  const adminMessages = ticket.messages.filter(
    (m) => m.senderRole === "admin" || m.senderRole === "support"
  );

  if (adminMessages.length === 0) {
    return null;
  }

  const items = readKnowledgeFromFile();

  const existing = items.find((i) => i.sourceTicketId === ticket.id);
  if (existing) {
    return existing;
  }

  const userFirstMsg = ticket.messages.find((m) => m.senderRole === "user")?.message || ticket.subject;

  const bestAdminSolution = adminMessages
    .map((m) => m.message)
    .filter((msg) => msg.length > 15 && !msg.startsWith("[Mengirim"))
    .join("\n\n");

  if (!bestAdminSolution || bestAdminSolution.length < 15) {
    return null;
  }

  const extractedKeywords = extractKeywordsFromText(`${ticket.subject} ${userFirstMsg} ${bestAdminSolution}`);

  const learnedItem: AiKnowledgeItem = {
    id: `kb-learn-${ticket.id.replace(/[^a-zA-Z0-9]/g, "")}`,
    title: `[Solusi Admin] ${ticket.subject}`,
    category: (ticket.category as AiKnowledgeCategory) || "TECHNICAL",
    problemDescription: userFirstMsg.slice(0, 250),
    solution: bestAdminSolution,
    keywords: extractedKeywords,
    source: "auto_learned",
    sourceTicketId: ticket.id,
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  items.unshift(learnedItem);
  writeKnowledgeToFile(items);
  return learnedItem;
}

/**
 * Batch Learn from all existing resolved tickets in the system
 */
export function batchLearnFromAllResolvedTickets(tickets: SupportTicket[]): {
  learnedCount: number;
  items: AiKnowledgeItem[];
} {
  const resolvedTickets = tickets.filter(
    (t) => (t.status === "RESOLVED" || t.status === "CLOSED") && t.messages.some((m) => m.senderRole === "admin")
  );

  let count = 0;
  const learnedItems: AiKnowledgeItem[] = [];

  for (const t of resolvedTickets) {
    const result = autoLearnFromTicket(t);
    if (result) {
      count++;
      learnedItems.push(result);
    }
  }

  return { learnedCount: count, items: learnedItems };
}

/**
 * Retrieve most relevant knowledge items to inject into Gemini Prompt
 */
export function getRelevantKnowledgeForPrompt(
  userMessage: string,
  category?: string,
  maxItems = 4
): string {
  try {
    const activeItems = getAllKnowledge({ onlyActive: true });
    if (activeItems.length === 0) return "";

    const userLower = userMessage.toLowerCase();
    const userWords = userLower.split(/\s+/).filter((w) => w.length >= 3);

    const scored = activeItems.map((item) => {
      let score = 0;

      if (category && item.category === category) {
        score += 2;
      }

      for (const kw of item.keywords) {
        if (userLower.includes(kw.toLowerCase())) {
          score += 3;
        }
      }

      for (const word of userWords) {
        if (item.title.toLowerCase().includes(word)) score += 1.5;
        if (item.problemDescription.toLowerCase().includes(word)) score += 1;
      }

      if (item.usageCount > 0) {
        score += Math.min(item.usageCount * 0.2, 2);
      }

      return { item, score };
    });

    const sorted = scored.sort((a, b) => b.score - a.score);
    const topMatches = sorted.filter((s) => s.score > 0).slice(0, maxItems);

    let selected = topMatches.map((s) => s.item);
    if (selected.length === 0) {
      selected = activeItems.slice(0, 2);
    }

    if (selected.length === 0) return "";

    const lines = selected.map((k, idx) => {
      incrementKnowledgeUsage(k.id);
      const tag = k.source === "auto_learned" ? "Referensi Solusi Admin Teruji" : "SOP & Panduan Resmi";
      return `[Referensi Solusi #${idx + 1} (${tag})]:
Topik / Kendala: ${k.title}
Deskripsi Masalah: ${k.problemDescription}
Solusi / Prosedur:
${k.solution}`;
    });

    return lines.join("\n\n---\n\n");
  } catch (err) {
    console.error("[AI Knowledge] Error getting relevant knowledge:", err);
    return "";
  }
}
