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
  private recentRecipients = new Map<string, string>(); // name/jid to phone number mapping
  private lastRecipientPhone = "";

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
        browser: ["Waply Gateway", "Chrome", "1.0.0"],
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
          const isRestartRequired = statusCode === DisconnectReason.restartRequired || statusCode === 515;

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

          // 3a. Khusus Stream Error 515 / Restart Required: langsung re-inisialisasi socket tanpa penundaan panjang
          if (isRestartRequired) {
            logger.info(
              { sessionId: this.id },
              "Baileys stream restart required (515). Re-initializing socket immediately in 800ms..."
            );
            setTimeout(() => this.initialize(), 800);
            return;
          }

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(this.reconnectAttempts * 3000, 20000);
            logger.warn(
              { sessionId: this.id, attempt: this.reconnectAttempts, delay, statusCode },
              `WhatsApp disconnected. Reconnecting in ${delay / 1000}s...`
            );
            setTimeout(() => this.initialize(), delay);
          } else {
            logger.error(
              { sessionId: this.id, attempts: this.reconnectAttempts },
              "Max reconnect attempts reached. Scheduled for soft self-healing watchdog."
            );
            // Soft self-healing background recovery after 60s
            setTimeout(() => {
              if (this.status !== "CONNECTED") {
                logger.info({ sessionId: this.id }, "Watchdog attempting soft session recovery...");
                this.reconnectAttempts = 0;
                this.initialize();
              }
            }, 60000);
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

        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const rawSender = msg.key.remoteJid || "";
          const senderName = msg.pushName || "";
          
          // Extract text across all WhatsApp message wrappers
          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.ephemeralMessage?.message?.conversation ||
            msg.message.ephemeralMessage?.message?.extendedTextMessage?.text ||
            msg.message.viewOnceMessage?.message?.conversation ||
            msg.message.viewOnceMessage?.message?.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            "";

          if (!text) continue;

          // Resolve phone number: check s.whatsapp.net, participant JID, or recent recipients
          let resolvedPhone = "";
          if (rawSender.endsWith("@s.whatsapp.net")) {
            resolvedPhone = rawSender.split("@")[0];
          } else if (msg.key.participant?.endsWith("@s.whatsapp.net")) {
            resolvedPhone = msg.key.participant.split("@")[0];
          } else if (this.recentRecipients.has(rawSender)) {
            resolvedPhone = this.recentRecipients.get(rawSender)!;
          } else if (this.lastRecipientPhone) {
            resolvedPhone = this.lastRecipientPhone;
            this.recentRecipients.set(rawSender, this.lastRecipientPhone);
          } else {
            resolvedPhone = rawSender.split("@")[0];
          }

          logger.info(
            { sessionId: this.id, rawSender, resolvedPhone, senderName, text },
            `📩 Received WhatsApp message from ${resolvedPhone || rawSender}: "${text}"`
          );

          // Forward to Next.js Web App Inbound API for Auto-Reply, Chat Storage & Webhook Dispatching
          try {
            const webUrl = process.env.WEB_APP_URL || "http://127.0.0.1:3001";
            const inbRes = await fetch(`${webUrl}/api/inbound`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                deviceId: this.id,
                sender: resolvedPhone,
                rawSender,
                senderName,
                text,
                messageId: msg.key.id,
                timestamp: new Date().toISOString(),
              }),
            });
            const inbJson: any = await inbRes.json().catch(() => ({}));
            logger.info(
              { sessionId: this.id, resolvedPhone, success: inbJson?.success, reason: inbJson?.reason },
              `✅ Inbound message forwarded to Web API successfully`
            );
          } catch (err) {
            logger.error({ err }, "Error forwarding inbound message to web API");
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

    // Format nomor WhatsApp internasional atau JID (@lid / @s.whatsapp.net)
    let formattedJid = "";
    let cleanNumber = "";
    if (recipientNumber.includes("@lid") || recipientNumber.includes("@s.whatsapp.net") || recipientNumber.includes("@g.us")) {
      formattedJid = recipientNumber;
      cleanNumber = recipientNumber.split("@")[0];
    } else {
      cleanNumber = recipientNumber.replace(/\D/g, "");
      if (cleanNumber.startsWith("0")) {
        cleanNumber = "62" + cleanNumber.slice(1);
      } else if (cleanNumber.startsWith("8")) {
        cleanNumber = "62" + cleanNumber;
      }
      formattedJid = `${cleanNumber}@s.whatsapp.net`;
    }

    // Cache recent recipient
    this.lastRecipientPhone = cleanNumber;
    this.recentRecipients.set(cleanNumber, cleanNumber);
    this.recentRecipients.set(formattedJid, cleanNumber);

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
   * Mengirim pesan media (gambar, video, audio, atau dokumen) dengan timeout guard 10 detik
   */
  async sendMediaMessage(
    recipientNumber: string,
    mediaUrl: string,
    options: {
      mediaType?: "image" | "document" | "video" | "audio" | "auto";
      fileName?: string;
      caption?: string;
      mimetype?: string;
    } = {}
  ): Promise<{ messageId: string; status: string }> {
    if (!this.socket || this.status !== "CONNECTED") {
      throw new Error(`Device WhatsApp belum terhubung (Status: ${this.status})`);
    }

    let formattedJid = "";
    let cleanNumber = "";
    if (recipientNumber.includes("@lid") || recipientNumber.includes("@s.whatsapp.net") || recipientNumber.includes("@g.us")) {
      formattedJid = recipientNumber;
      cleanNumber = recipientNumber.split("@")[0];
    } else {
      cleanNumber = recipientNumber.replace(/\D/g, "");
      if (cleanNumber.startsWith("0")) {
        cleanNumber = "62" + cleanNumber.slice(1);
      } else if (cleanNumber.startsWith("8")) {
        cleanNumber = "62" + cleanNumber;
      }
      formattedJid = `${cleanNumber}@s.whatsapp.net`;
    }

    this.lastRecipientPhone = cleanNumber;
    this.recentRecipients.set(cleanNumber, cleanNumber);
    this.recentRecipients.set(formattedJid, cleanNumber);

    logger.info({ sessionId: this.id, recipient: formattedJid, mediaUrl }, "Fetching media with 10s timeout guard...");

    // 1. Download media with 10s AbortSignal timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let mediaBuffer: Buffer;
    let detectedMime = options.mimetype || "";

    try {
      const res = await fetch(mediaUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Gagal mengunduh media dari URL (HTTP ${res.status}: ${res.statusText})`);
      }

      const arrayBuf = await res.arrayBuffer();
      mediaBuffer = Buffer.from(arrayBuf);
      if (!detectedMime) {
        detectedMime = res.headers.get("content-type") || "";
      }
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr.name === "AbortError") {
        throw new Error("Unduhan media timeout (melebihi batas 10 detik). Pastikan server hosting media dapat diakses cepat.");
      }
      throw new Error(`Kesalahan unduh media: ${fetchErr.message}`);
    }

    // 2. Tentukan Tipe Media
    let type = options.mediaType || "auto";
    if (type === "auto") {
      if (detectedMime.startsWith("image/")) type = "image";
      else if (detectedMime.startsWith("video/")) type = "video";
      else if (detectedMime.startsWith("audio/")) type = "audio";
      else type = "document";
    }

    const caption = options.caption || "";
    if (caption) {
      await SafetyEngine.simulateTyping(this.socket, formattedJid, caption.length);
    }

    let payload: any;
    const fileName = options.fileName || (mediaUrl.split("/").pop()?.split("?")[0] || "file");

    if (type === "image") {
      payload = { image: mediaBuffer, caption: caption || undefined, mimetype: detectedMime || "image/jpeg" };
    } else if (type === "video") {
      payload = { video: mediaBuffer, caption: caption || undefined, mimetype: detectedMime || "video/mp4" };
    } else if (type === "audio") {
      payload = { audio: mediaBuffer, mimetype: detectedMime || "audio/mp4", ptt: false };
    } else {
      payload = {
        document: mediaBuffer,
        mimetype: detectedMime || "application/octet-stream",
        fileName,
        caption: caption || undefined,
      };
    }

    const result = await this.socket.sendMessage(formattedJid, payload);

    if (result?.key?.id && result?.message) {
      this.msgStore.set(result.key.id, result.message);
      if (this.msgStore.size > 2000) {
        const firstKey = this.msgStore.keys().next().value;
        if (firstKey) this.msgStore.delete(firstKey);
      }
    }

    const messageId = result?.key?.id || `msg_${Date.now()}`;
    logger.info({ sessionId: this.id, messageId, recipient: cleanNumber, type }, "✅ Media message sent successfully!");

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
