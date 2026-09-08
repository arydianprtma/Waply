import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { logger, baileysLogger } from "../utils/logger.js";
import { SafetyEngine } from "./safety.engine.js";

export type SessionState = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "BANNED_DETECTED";

export interface SessionInfo {
  id: string;
  name: string;
  phoneNumber?: string;
  status: SessionState;
  qrCode?: string;
  qrDataUrl?: string;
  lastConnectedAt?: Date;
  lastError?: string;
}

export class BaileysInstance {
  public id: string;
  public name: string;
  public socket: WASocket | null = null;
  public status: SessionState = "DISCONNECTED";
  public qrCode?: string;
  public qrDataUrl?: string;
  public phoneNumber?: string;
  public lastConnectedAt?: Date;
  public lastError?: string;

  private sessionsDir: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private msgStore = new Map<string, proto.IMessage>();

  constructor(id: string, name = "WhatsApp Device") {
    this.id = id;
    this.name = name;
    this.sessionsDir = path.resolve(process.cwd(), "sessions", id);

    // Ensure session directory exists
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Menginisialisasi dan menghubungkan socket Baileys WhatsApp
   */
  async initialize(): Promise<void> {
    try {
      this.status = "CONNECTING";
      this.lastError = undefined;
      logger.info({ sessionId: this.id }, `🔌 Initializing WhatsApp session: ${this.name}`);

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionsDir);
      const { version } = await fetchLatestBaileysVersion();

      this.socket = makeWASocket({
        version,
        logger: baileysLogger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
        },
        browser: ["Sendora Gateway", "Chrome", "1.0.0"],
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        defaultQueryTimeoutMs: 60000,
        getMessage: async (key) => {
          if (key.id && this.msgStore.has(key.id)) {
            return this.msgStore.get(key.id);
          }
          return undefined;
        },
      });

      // Simpan credentials saat terupdate
      this.socket.ev.on("creds.update", saveCreds);

      // Listener update status koneksi & QR code
      this.socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // 1. Jika ada QR code baru dari Baileys
        if (qr) {
          this.qrCode = qr;
          this.status = "CONNECTING";
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
            logger.info({ sessionId: this.id }, `📲 New QR Code generated for session ${this.id}`);
          } catch (qrErr) {
            logger.error({ qrErr }, "Failed to generate QR Data URL");
          }
        }

        // 2. Jika status koneksi Terbuka (CONNECTED)
        if (connection === "open") {
          this.status = "CONNECTED";
          this.qrCode = undefined;
          this.qrDataUrl = undefined;
          this.reconnectAttempts = 0;
          this.lastConnectedAt = new Date();

          // Ekstrak nomor WhatsApp dari JID (user format: 62812xxx:xx@s.whatsapp.net)
          const userJid = this.socket?.user?.id;
          if (userJid) {
            this.phoneNumber = userJid.split(":")[0].replace("@s.whatsapp.net", "");
          }

          logger.info(
            { sessionId: this.id, phoneNumber: this.phoneNumber },
            `✅ WhatsApp session CONNECTED successfully!`
          );
        }

        // 3. Jika status koneksi Tertutup (DISCONNECTED)
        if (connection === "close") {
          const error = lastDisconnect?.error as Boom | undefined;
          const statusCode = error?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;

          this.qrCode = undefined;
          this.qrDataUrl = undefined;
          this.status = "DISCONNECTED";

          // Jika user logout manual dari menu Perangkat Tertaut di WhatsApp HP
          if (isLoggedOut) {
            this.lastError = "Sesi telah keluar dari perangkat (Logged Out)";
            logger.info(
              { sessionId: this.id, statusCode },
              "Session logged out from device. Stopping auto-reconnect."
            );
            return;
          }

          this.lastError = error?.message || "Connection closed";

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(this.reconnectAttempts * 3000, 15000);
            logger.warn(
              { sessionId: this.id, attempt: this.reconnectAttempts, delay },
              `WhatsApp disconnected. Reconnecting in ${delay / 1000}s...`
            );
            setTimeout(() => this.initialize(), delay);
          } else {
            logger.error(
              { sessionId: this.id, attempts: this.reconnectAttempts },
              "Max reconnect attempts reached or permanent disconnect."
            );
          }
        }
      });

      // Listener pesan masuk (Inbound messages)
      this.socket.ev.on("messages.upsert", async ({ messages, type }) => {
        for (const msg of messages) {
          if (msg.key.id && msg.message) {
            this.msgStore.set(msg.key.id, msg.message);
            if (this.msgStore.size > 2000) {
              const firstKey = this.msgStore.keys().next().value;
              if (firstKey) this.msgStore.delete(firstKey);
            }
          }
        }

        if (type !== "notify") return;

        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const sender = msg.key.remoteJid;
          const senderName = msg.pushName || "";
          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

          logger.info(
            { sessionId: this.id, sender, senderName, text },
            `📩 Received WhatsApp message from ${sender}`
          );

          // Forward to Next.js Web App Inbound API for Auto-Reply, Chat Storage & Webhook Dispatching
          try {
            const webUrl = process.env.WEB_APP_URL || "http://localhost:3001";
            fetch(`${webUrl}/api/inbound`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                deviceId: this.id,
                sender: sender ? sender.split("@")[0] : "",
                senderName,
                text,
                messageId: msg.key.id,
                timestamp: new Date().toISOString(),
              }),
            }).catch((err) => {
              logger.warn({ err }, "Could not reach web inbound API");
            });
          } catch (err) {
            logger.error({ err }, "Error forwarding inbound message");
          }
        }
      });
    } catch (error) {
      this.status = "DISCONNECTED";
      this.lastError = (error as Error).message;
      logger.error({ sessionId: this.id, error }, "Failed to initialize Baileys instance");
    }
  }

  /**
   * Mengirim pesan teks WhatsApp dengan simulasi pengetikan (Typing Presence)
   */
  async sendTextMessage(recipientNumber: string, text: string): Promise<{ messageId: string; status: string }> {
    if (!this.socket || this.status !== "CONNECTED") {
      throw new Error(`Device WhatsApp belum terhubung (Status: ${this.status})`);
    }

    // Format nomor WhatsApp internasional (cth: 0851... / 851... -> 62851... -> 62851...@s.whatsapp.net)
    let cleanNumber = recipientNumber.replace(/\D/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.slice(1);
    } else if (cleanNumber.startsWith("8")) {
      cleanNumber = "62" + cleanNumber;
    }
    const formattedJid = `${cleanNumber}@s.whatsapp.net`;

    logger.info({ sessionId: this.id, recipient: formattedJid }, "Sending WhatsApp message...");

    // 1. Simulasi Pengetikan (Safety Anti-Ban)
    await SafetyEngine.simulateTyping(this.socket, formattedJid, text.length);

    // 2. Kirim pesan via Baileys socket
    const result = await this.socket.sendMessage(formattedJid, { text });

    if (result?.key?.id && result?.message) {
      this.msgStore.set(result.key.id, result.message);
      if (this.msgStore.size > 2000) {
        const firstKey = this.msgStore.keys().next().value;
        if (firstKey) this.msgStore.delete(firstKey);
      }
    }

    const messageId = result?.key?.id || `msg_${Date.now()}`;
    logger.info({ sessionId: this.id, messageId, recipient: cleanNumber }, "✅ Message sent successfully!");

    return {
      messageId,
      status: "SENT",
    };
  }

  /**
   * Logout dan hapus sesi dari disk
   */
  async logout(): Promise<void> {
    try {
      if (this.socket) {
        await this.socket.logout().catch(() => {});
        this.socket.end(new Error("Manual logout by user"));
        this.socket = null;
      }
      this.status = "DISCONNECTED";
      this.qrCode = undefined;
      this.qrDataUrl = undefined;
      this.phoneNumber = undefined;

      // Hapus data sesi di disk
      if (fs.existsSync(this.sessionsDir)) {
        fs.rmSync(this.sessionsDir, { recursive: true, force: true });
        logger.info({ sessionId: this.id }, "Session credentials deleted from disk");
      }
    } catch (err) {
      logger.error({ err, sessionId: this.id }, "Error during session logout");
    }
  }

  /**
   * Mendapatkan summary informasi sesi
   */
  getInfo(): SessionInfo {
    return {
      id: this.id,
      name: this.name,
      phoneNumber: this.phoneNumber,
      status: this.status,
      qrCode: this.qrCode,
      qrDataUrl: this.qrDataUrl,
      lastConnectedAt: this.lastConnectedAt,
      lastError: this.lastError,
    };
  }
}
