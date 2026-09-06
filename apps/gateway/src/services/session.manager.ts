import fs from "fs";
import path from "path";
import { BaileysInstance, SessionInfo } from "./baileys.service.js";
import { logger } from "../utils/logger.js";

export class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, BaileysInstance> = new Map();
  private baseDir: string;

  private constructor() {
    this.baseDir = path.resolve(process.cwd(), "sessions");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Mengembalikan semua sesi yang tersimpan
   */
  public getAllSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).map((session) =>
      session.getInfo()
    );
  }

  /**
   * Mengambil sesi berdasarkan ID
   */
  public getSession(id: string): BaileysInstance | undefined {
    return this.sessions.get(id);
  }

  /**
   * Membuat atau memulai sesi Baileys baru
   */
  public async createSession(id: string, name = "WhatsApp Device"): Promise<BaileysInstance> {
    let session = this.sessions.get(id);

    if (session) {
      if (session.status === "CONNECTED") {
        logger.info({ sessionId: id }, "Session already active and connected");
        return session;
      }
      logger.info({ sessionId: id }, "Re-initializing existing session instance");
      await session.initialize();
      return session;
    }

    logger.info({ sessionId: id, name }, "Creating new Baileys session");
    session = new BaileysInstance(id, name);
    this.sessions.set(id, session);
    await session.initialize();

    return session;
  }

  /**
   * Menghapus sesi dan kredensial di disk
   */
  public async deleteSession(id: string): Promise<boolean> {
    const session = this.sessions.get(id);
    if (session) {
      await session.logout();
      this.sessions.delete(id);
      logger.info({ sessionId: id }, "Session removed from manager");
      return true;
    }

    // Jika sesi ada di disk tapi tidak di memory
    const sessionPath = path.join(this.baseDir, id);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      return true;
    }

    return false;
  }

  /**
   * Memulihkan sesi yang tersimpan di disk saat server startup
   */
  public async restoreSessions(): Promise<void> {
    try {
      if (!fs.existsSync(this.baseDir)) return;

      const sessionDirs = fs
        .readdirSync(this.baseDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      logger.info({ count: sessionDirs.length }, "🔄 Restoring saved WhatsApp sessions from disk...");

      for (const sessionId of sessionDirs) {
        // Cek apakah folder memiliki file kredensial
        const credsPath = path.join(this.baseDir, sessionId, "creds.json");
        if (fs.existsSync(credsPath)) {
          logger.info({ sessionId }, `Restoring session: ${sessionId}`);
          await this.createSession(sessionId, `Device ${sessionId}`);
        }
      }
    } catch (err) {
      logger.error({ err }, "Error restoring sessions on startup");
    }
  }
}
