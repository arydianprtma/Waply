import fs from "fs";
import path from "path";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketCategory =
  | "TECHNICAL"
  | "BILLING"
  | "APPEAL"
  | "FEATURE"
  | "OTHER";

export type TicketHandlingMode = "AI" | "HUMAN";

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: "user" | "admin" | "support" | "ai" | "system";
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  handlingMode?: TicketHandlingMode;
  escalatedAt?: string | null;
  escalationReason?: string | null;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  unreadByUser?: boolean;
  unreadByAdmin?: boolean;
}

export interface CreateTicketInput {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  category: TicketCategory;
  priority?: TicketPriority;
  message: string;
}

const DATA_DIR = path.resolve(process.cwd(), ".sendora-data");
const TICKETS_FILE = path.join(DATA_DIR, "support-tickets.json");
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultTickets(): SupportTicket[] {
  return [];
}

function purgeExpiredTickets(tickets: SupportTicket[]): { active: SupportTicket[]; changed: boolean } {
  const now = Date.now();
  let changed = false;
  const active = tickets.filter((t) => {
    if (t.status === "RESOLVED" || t.status === "CLOSED") {
      const resolvedTime = t.resolvedAt
        ? new Date(t.resolvedAt).getTime()
        : new Date(t.updatedAt).getTime();
      if (now - resolvedTime > SEVEN_DAYS_MS) {
        changed = true;
        return false; // Purge ticket older than 7 days
      }
    }
    return true;
  });
  return { active, changed };
}

export function getAllTickets(): SupportTicket[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(TICKETS_FILE)) {
      const defaults = getDefaultTickets();
      fs.writeFileSync(TICKETS_FILE, JSON.stringify(defaults, null, 2), "utf8");
      return defaults;
    }
    const raw = fs.readFileSync(TICKETS_FILE, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return getDefaultTickets();
    }

    // Auto-purge tickets resolved more than 7 days ago to save database space
    const { active, changed } = purgeExpiredTickets(data);
    if (changed) {
      saveTickets(active);
    }

    return active.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error("Error reading support tickets:", err);
    return getDefaultTickets();
  }
}

export function saveTickets(tickets: SupportTicket[]): boolean {
  try {
    ensureDataDir();
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error saving support tickets:", err);
    return false;
  }
}

export function getUserTickets(userId: string, userEmail: string): SupportTicket[] {
  const all = getAllTickets();
  return all.filter(
    (t) =>
      t.userId === userId ||
      t.userEmail.toLowerCase() === userEmail.toLowerCase()
  );
}

export function getTicketById(ticketId: string): SupportTicket | null {
  const all = getAllTickets();
  const ticket = all.find((t) => t.id.toUpperCase() === ticketId.toUpperCase());
  return ticket || null;
}

export function createTicket(input: CreateTicketInput): SupportTicket {
  const all = getAllTickets();
  const now = new Date().toISOString();
  const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

  const initialMessage: TicketMessage = {
    id: `msg_${Date.now()}_init`,
    ticketId,
    senderId: input.userId,
    senderName: input.userName,
    senderEmail: input.userEmail,
    senderRole: "user",
    message: input.message,
    createdAt: now,
  };

  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  );

  const newTicket: SupportTicket = {
    id: ticketId,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    userPhone: input.userPhone,
    subject: input.subject,
    category: input.category || "TECHNICAL",
    priority: input.priority || "MEDIUM",
    status: "OPEN",
    handlingMode: hasGeminiKey ? "AI" : "HUMAN",
    messages: [initialMessage],
    createdAt: now,
    updatedAt: now,
    unreadByUser: false,
    unreadByAdmin: !hasGeminiKey, // If AI handles it first, admin is not immediately alerted until escalated
  };

  all.unshift(newTicket);
  saveTickets(all);
  return newTicket;
}

export function replyToTicket(
  ticketId: string,
  reply: {
    senderId: string;
    senderName: string;
    senderEmail: string;
    senderRole: "user" | "admin" | "support" | "ai" | "system";
    message: string;
  }
): SupportTicket | null {
  const all = getAllTickets();
  const index = all.findIndex((t) => t.id.toUpperCase() === ticketId.toUpperCase());
  if (index === -1) return null;

  // Sesi sudah diakhiri / ditutup -> tidak boleh mengirim pesan lagi
  if (all[index].status === "RESOLVED" || all[index].status === "CLOSED") {
    return null;
  }

  const now = new Date().toISOString();

  // If Admin / Human Support replies for the first time on an AI or escalated ticket, inject a system join notification
  if (reply.senderRole === "admin" || reply.senderRole === "support") {
    const hadAdminReply = all[index].messages.some(
      (m) => m.senderRole === "admin" || m.senderRole === "support"
    );

    if (!hadAdminReply) {
      const joinMsg: TicketMessage = {
        id: `msg_${Date.now()}_join`,
        ticketId: all[index].id,
        senderId: "system",
        senderName: "Sistem",
        senderEmail: "system@sendora.id",
        senderRole: "system",
        message: `Admin (${reply.senderName || "Customer Support"}) telah bergabung ke ruang obrolan.`,
        createdAt: new Date(Date.now() - 100).toISOString(),
      };
      all[index].messages.push(joinMsg);
    }

    all[index].handlingMode = "HUMAN";
    if (all[index].status === "OPEN") {
      all[index].status = "IN_PROGRESS";
    }
    all[index].unreadByUser = true;
    all[index].unreadByAdmin = false;
  }

  const newMsg: TicketMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticketId: all[index].id,
    senderId: reply.senderId,
    senderName: reply.senderName,
    senderEmail: reply.senderEmail,
    senderRole: reply.senderRole,
    message: reply.message,
    createdAt: now,
  };

  all[index].messages.push(newMsg);
  all[index].updatedAt = now;

  // Update status and unread indicators
  if (reply.senderRole === "user") {
    all[index].unreadByAdmin = all[index].handlingMode === "HUMAN";
    all[index].unreadByUser = false;
  } else if (reply.senderRole === "ai") {
    all[index].unreadByUser = true;
    all[index].unreadByAdmin = false;
  }

  saveTickets(all);
  return all[index];
}

export function escalateTicketToHuman(
  ticketId: string,
  reason?: string,
  customNotice?: string
): SupportTicket | null {
  const all = getAllTickets();
  const index = all.findIndex((t) => t.id.toUpperCase() === ticketId.toUpperCase());
  if (index === -1) return null;

  const now = new Date().toISOString();
  all[index].handlingMode = "HUMAN";
  all[index].escalatedAt = now;
  all[index].escalationReason = reason || "Permintaan eskalasi ke CS Manusia";
  all[index].unreadByAdmin = true;
  all[index].updatedAt = now;

  // Append clean system handover message in the chat thread
  const handoverMsg: TicketMessage = {
    id: `msg_${Date.now()}_handover`,
    ticketId: all[index].id,
    senderId: "system",
    senderName: "Sistem",
    senderEmail: "system@sendora.id",
    senderRole: "system",
    message: customNotice || "Mohon tunggu, tiket telah dialihkan ke antrean CS dan Admin akan segera mengambil alih.",
    createdAt: now,
  };
  all[index].messages.push(handoverMsg);

  saveTickets(all);
  return all[index];
}

export function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): SupportTicket | null {
  const all = getAllTickets();
  const index = all.findIndex((t) => t.id.toUpperCase() === ticketId.toUpperCase());
  if (index === -1) return null;

  // Tiket yang sudah ditutup/selesai tidak dapat dibuka kembali
  if (
    (all[index].status === "RESOLVED" || all[index].status === "CLOSED") &&
    status !== "RESOLVED" &&
    status !== "CLOSED"
  ) {
    return all[index];
  }

  const now = new Date().toISOString();
  all[index].status = status;
  all[index].updatedAt = now;

  if (status === "RESOLVED" || status === "CLOSED") {
    all[index].resolvedAt = now;
  }

  saveTickets(all);
  return all[index];
}

export function updateTicketPriority(
  ticketId: string,
  priority: TicketPriority
): SupportTicket | null {
  const all = getAllTickets();
  const index = all.findIndex((t) => t.id.toUpperCase() === ticketId.toUpperCase());
  if (index === -1) return null;

  all[index].priority = priority;
  all[index].updatedAt = new Date().toISOString();
  saveTickets(all);
  return all[index];
}

export function markTicketAsRead(
  ticketId: string,
  role: "admin" | "user"
): SupportTicket | null {
  const all = getAllTickets();
  const index = all.findIndex((t) => t.id.toUpperCase() === ticketId.toUpperCase());
  if (index === -1) return null;

  if (role === "admin") {
    all[index].unreadByAdmin = false;
  } else {
    all[index].unreadByUser = false;
  }

  saveTickets(all);
  return all[index];
}

export function deleteTicket(ticketId: string): boolean {
  const all = getAllTickets();
  const filtered = all.filter((t) => t.id.toUpperCase() !== ticketId.toUpperCase());
  if (filtered.length === all.length) return false;
  return saveTickets(filtered);
}
