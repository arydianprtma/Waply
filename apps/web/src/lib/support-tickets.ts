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

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: "user" | "admin" | "support";
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
    console.error("[SupportTickets] Error reading tickets file:", err);
    return getDefaultTickets();
  }
}

export function saveTickets(tickets: SupportTicket[]): boolean {
  try {
    ensureDataDir();
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[SupportTickets] Error saving tickets file:", err);
    return false;
  }
}

export function getUserTickets(userId: string, email?: string): SupportTicket[] {
  const all = getAllTickets();
  return all.filter(
    (t) => t.userId === userId || (email && t.userEmail.toLowerCase() === email.toLowerCase())
  );
}

export function getTicketById(id: string): SupportTicket | null {
  const all = getAllTickets();
  return all.find((t) => t.id.toUpperCase() === id.toUpperCase()) || null;
}

export function createTicket(input: CreateTicketInput): SupportTicket {
  const all = getAllTickets();
  const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const initialMessage: TicketMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticketId,
    senderId: input.userId,
    senderName: input.userName,
    senderEmail: input.userEmail,
    senderRole: "user",
    message: input.message,
    createdAt: now,
  };

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
    messages: [initialMessage],
    createdAt: now,
    updatedAt: now,
    unreadByUser: false,
    unreadByAdmin: true,
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
    senderRole: "user" | "admin" | "support";
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
    all[index].unreadByAdmin = true;
    all[index].unreadByUser = false;
  } else {
    // Admin or support replied
    if (all[index].status === "OPEN") {
      all[index].status = "IN_PROGRESS";
    }
    all[index].unreadByUser = true;
    all[index].unreadByAdmin = false;
  }

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

export function deleteTicket(ticketId: string): boolean {
  const all = getAllTickets();
  const filtered = all.filter((t) => t.id.toUpperCase() !== ticketId.toUpperCase());
  if (filtered.length === all.length) return false;
  return saveTickets(filtered);
}
