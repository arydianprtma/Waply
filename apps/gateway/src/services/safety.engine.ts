import { WASocket, DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { logger } from "../utils/logger.js";

export class SafetyEngine {
  /**
   * Menghitung jeda acak (jitter) dalam milidetik antara minSeconds dan maxSeconds
   */
  static getRandomDelayMs(minSeconds = 4, maxSeconds = 12): number {
    const min = Math.min(minSeconds, maxSeconds) * 1000;
    const max = Math.max(minSeconds, maxSeconds) * 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Mensimulasikan pengetikan alami (composing state) di WhatsApp
   */
  static async simulateTyping(
    socket: WASocket,
    jid: string,
    textLength = 20
  ): Promise<void> {
    try {
      // Hitung durasi mengetik cepat & alami: ~15ms per karakter, dibatasi min 600ms dan max 1.5s
      const typingDuration = Math.min(Math.max(textLength * 15, 600), 1500);

      logger.debug({ jid, typingDuration }, "SafetyEngine: Simulating typing...");
      await socket.sendPresenceUpdate("composing", jid).catch(() => {});

      // Tunggu durasi pengetikan
      await new Promise((resolve) => setTimeout(resolve, typingDuration));

      // Hentikan status pengetikan
      await socket.sendPresenceUpdate("paused", jid).catch(() => {});
    } catch (err) {
      logger.warn({ err, jid }, "SafetyEngine: Failed to update presence state, continuing send");
    }
  }

  /**
   * Memeriksa apakah error pemutusan koneksi memicu Circuit Breaker (misal: 401 Logged Out)
   */
  static isCriticalDisconnect(error: any): boolean {
    if (!error) return false;

    const statusCode = (error as Boom)?.output?.statusCode;
    if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
      logger.error(
        { statusCode },
        "🚨 SafetyEngine: CIRCUIT BREAKER TRIGGERED - Session logged out by WhatsApp server. Stopping auto-reconnect."
      );
      return true;
    }

    if (statusCode === DisconnectReason.badSession) {
      logger.error(
        { statusCode },
        "🚨 SafetyEngine: Bad session detected. Reconnect halted."
      );
      return true;
    }

    return false;
  }
}
