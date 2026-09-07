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

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultTickets(): SupportTicket[] {
  return [
    {
      id: "TKT-108294",
      userId: "usr_default_guest",
      userName: "Ahmad Fauzi",
      userEmail: "fauzi@example.com",
      userPhone: "081299887766",
      subject: "Bantuan Konfigurasi Webhook Inbound Message",
      category: "TECHNICAL",
      priority: "MEDIUM",
      status: "RESOLVED",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      unreadByUser: false,
      unreadByAdmin: false,
      messages: [
        {
          id: "msg_01",
          ticketId: "TKT-108294",
          senderId: "usr_default_guest",
          senderName: "Ahmad Fauzi",
          senderEmail: "fauzi@example.com",
          senderRole: "user",
          message: "Halo CS Sendora, saya kesulitan menerima webhook callback saat ada pesan masuk di device saya. Mohon panduannya.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        },
        {
          id: "msg_02",
          ticketId: "TKT-108294",
          senderId: "admin-master-sendora-01",
          senderName: "Sendora Customer Support",
          senderEmail: "support@sendora.id",
          senderRole: "support",
          message: "Halo Kak Ahmad, pastikan endpoint webhook Anda mengembalikan HTTP Status 200 OK dengan payload JSON { success: true }. Anda juga bisa menguji callback menggunakan menu Webhook Tester di dashboard.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.8).toISOString(),
        },
        {
          id: "msg_03",
          ticketId: "TKT-108294",
          senderId: "usr_default_guest",
          senderName: "Ahmad Fauzi",
          senderEmail: "fauzi@example.com",
          senderRole: "user",
          message: "Terima kasih banyak tim Sendora! Sudah berhasil sekarang, mantap fast response.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        },
      ],
    },
    {
      id: "TKT-392015",
      userId: "usr_demo_user",
      userName: "Rina Wijaya",
      userEmail: "rina.w@business.co.id",
      userPhone: "081344556677",
      subject: "Pertanyaan Upgrade Kuota Broadcast Bisnis",
      category: "BILLING",
      priority: "HIGH",
      status: "IN_PROGRESS",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      unreadByUser: false,
      unreadByAdmin: false,
      messages: [
        {
          id: "msg_10",
          ticketId: "TKT-392015",
          senderId: "usr_demo_user",
          senderName: "Rina Wijaya",
          senderEmail: "rina.w@business.co.id",
          senderRole: "user",
          message: "Selamat siang tim Sendora, kami berencana mengirim broadcast promo bulanan ke 20.000 kontak. Apakah paket Business sudah mencukupi atau perlu add-on kuota tambahan?",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        },
        {
          id: "msg_11",
          ticketId: "TKT-392015",
          senderId: "admin-master-sendora-01",
          senderName: "Sendora Customer Support",
          senderEmail: "support@sendora.id",
          senderRole: "support",
          message: "Halo Kak Rina, paket Business kami mencakup 10.000 pesan/bulan. Untuk kebutuhan 20.000 pesan, kami sarankan memilih paket Pro (Unlimited) atau mengaktifkan multi-device load balancing agar pengiriman aman dan anti-ban.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
      ],
    },
  ];
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
    return data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
    if (all[index].status === "RESOLVED" || all[index].status === "CLOSED") {
      all[index].status = "OPEN";
    }
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

  const now = new Date().toISOString();
  all[index].status = status;
  all[index].updatedAt = now;

  if (status === "RESOLVED" || status === "CLOSED") {
    all[index].resolvedAt = now;
  } else {
    all[index].resolvedAt = null;
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
