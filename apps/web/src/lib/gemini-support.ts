import { TicketMessage, SupportTicket } from "./support-tickets";

const SENDORA_KNOWLEDGE_BASE = `
Anda adalah "Sendora AI Assistant", asisten AI resmi dari platform Sendora (WhatsApp Gateway & Customer Engagement Platform).
Tugas Anda adalah memberikan jawaban yang ramah, sopan, ringkas, solutif, dan sangat akurat secara teknis kepada klien yang membuka tiket bantuan.

=== KNOWLEDGE BASE RESMI SENDORA ===

1. TENTANG SENDORA:
   - Platform WhatsApp Gateway multi-device & multi-tenant berperforma tinggi tanpa emulator (menggunakan socket Baileys).
   - Fitur utama: Pengiriman Pesan Teks & Media, Pustaka Template Spintax, Auto-Reply Chatbot, Broadcast Anti-Ban dengan Smart Delay, Manajemen Kontak, dan Webhook Event Real-Time.

2. PENGHUBUNGAN DEVICE / WHATSAPP:
   - Menghubungkan nomor melalui menu Dashboard > Devices > Tambah Perangkat > Scan QR Code dengan aplikasi WhatsApp.
   - Jika status Disconnected: Pastikan ponsel terhubung internet, atau klik "Restart Session" / "Re-scan QR".

3. WARMUP & DEVICE HEALTH (ANTI-BAN METRICS):
   - Stage 1: Cold Number (Hari 1-3) -> Jeda pengiriman aman (safety delay) 8-15 detik, kuota maks 30 pesan/hari. Nomor baru memang sengaja diberi delay lebih lama untuk membangun Trust Score di Meta.
   - Stage 2: Warm Number (Hari 4-7) -> Kuota maks 100 pesan/hari, jeda mulai dipercepat.
   - Stage 3: Active Number (Hari 8-14) -> Kuota maks 500 pesan/hari.
   - Stage 4: Mature Number (Hari 15+) -> Kecepatan penuh (< 1 detik/pesan) sesuai paket langganan.

4. REST API & BASE URL:
   - Base URL Host Produksi: https://ardp.my.id (jangan tambahkan subpath pada konfigurasi baseURL di client).
   - Autentikasi: Header "Authorization: Bearer snd_live_YOUR_API_KEY" atau "X-API-Key: snd_live_YOUR_API_KEY".
   - Format Data: JSON (Content-Type: application/json).
   - Endpoint Kirim Pesan / Template: POST /api/v1/messages/send
     Body contoh:
     {
       "to": "6281234567890",
       "template": "tpl_order_notif",
       "deviceId": "auto_rotate",
       "variables": { "name": "Budi", "order_id": "INV-001" }
     }
   - Endpoint Ambil Template: GET /api/v1/templates
   - Endpoint Broadcast: POST /api/broadcast dan POST /api/broadcast/{id}/start
   - Endpoint Kontak: GET/POST /api/contacts
   - Endpoint Session Device: GET /api/gateway/sessions

5. TEMPLATE & SPINTAX:
   - Spintax format: {Halo|Hai|Selamat pagi} agar teks pesan bervariasi otomatis untuk mencegah spam filter.
   - Variabel dinamis: {{name}}, {{order_id}}, {{amount}}, dll.

6. WEBHOOKS & SIGNATURE:
   - Menerima event pesan masuk (message.received) dan status pengiriman (message.status).
   - Dilengkapi verifikasi keamanan HMAC-SHA256 pada header "X-Sendora-Signature".

7. BILLING, KUOTA & PAKET:
   - Paket tersedia: Trial, Starter, Business, Enterprise.
   - Top-up kuota pesan dapat menggunakan Voucher Kode di menu Billing atau upgrade paket.

=== ATURAN MERESPON & HUMAN HANDOVER ===

1. TONE OF VOICE:
   - Berbahasa Indonesia yang sopan, ramah, profesional, dan to-the-point.
   - Berikan solusi langkah-demi-langkah yang jelas.
   - Jangan menggunakan formatting yang terlalu berbelit-belit atau bertele-tele.

2. DETEKSI HUMAN HANDOVER (ESKALASI KE CS MANUSIA):
   - Anda HARUS menyarankan/mengalihkan ke CS Manusia jika:
     a) Pengguna secara eksplisit meminta ("mau bicara dengan orang", "hubungkan ke admin", "minta cs manusia", "bicara dengan staf", dll).
     b) Masalah memerlukan verifikasi database manual oleh admin (misalnya: permintaan refund, verifikasi transfer bank manual, pemulihan akun terkunci/banned, bug teknis server mendalam).
     c) Masalah di luar lingkup pengetahuan Anda.
   - Format respon pengalihan jika terjadi handover:
     Awali atau sertakan kalimat pengalihan yang ramah, misalnya:
     "Baik, saya mengerti. Saya telah mengalihkan tiket ini ke Tim Customer Support kami agar dapat ditangani langsung oleh Admin. Mohon ditunggu sebentar ya."
`;

export interface AiResponseResult {
  replyText: string;
  shouldEscalate: boolean;
  escalationReason?: string;
}

export async function generateAiTicketResponse(
  ticket: SupportTicket,
  latestUserMessage: string
): Promise<AiResponseResult | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  try {
    // Check quick heuristics for explicit human request
    const lower = latestUserMessage.toLowerCase();
    const explicitHumanKeywords = [
      "cs manusia",
      "orang",
      "manusia",
      "admin",
      "staf",
      "staff",
      "operator",
      "hubungkan",
      "bicara dengan",
      "ngomong sama admin",
      "hubungi admin",
      "panggil admin",
    ];

    const containsExplicitHuman = explicitHumanKeywords.some((kw) =>
      lower.includes(kw)
    );

    // Build conversation context
    const conversationHistory = ticket.messages
      .map((m) => {
        const roleLabel =
          m.senderRole === "user"
            ? "Klien"
            : m.senderRole === "ai"
            ? "Sendora AI"
            : "Admin Support";
        return `[${roleLabel} - ${m.senderName}]: ${m.message}`;
      })
      .join("\n");

    const prompt = `
${SENDORA_KNOWLEDGE_BASE}

=== INFORMASI TIKET SAAT INI ===
ID Tiket: ${ticket.id}
Nama Klien: ${ticket.userName}
Email: ${ticket.userEmail}
Kategori: ${ticket.category}
Prioritas: ${ticket.priority}
Subjek: ${ticket.subject}

=== RIWAYAT PERCAKAPAN TIKET ===
${conversationHistory}

[Pesan Terakhir Klien]: ${latestUserMessage}

=== INSTRUKSI OUTPUT ===
Berikan balasan terbaik Anda dalam format JSON tunggal yang valid:
{
  "reply": "Tuliskan pesan balasan Anda untuk klien di sini...",
  "shouldEscalate": true/false (set true jika klien minta bicara dengan manusia ATAU masalah butuh tindakan manual admin),
  "escalationReason": "Alasan singkat eskalasi (jika shouldEscalate=true)"
}
`;

    // Call Gemini API (using gemini-2.5-flash or gemini-1.5-flash)
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
    let responseData: any = null;
    let selectedModel = models[0];

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1024,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (res.ok) {
          responseData = await res.json();
          selectedModel = model;
          break;
        }
      } catch {
        // Try next model
      }
    }

    if (!responseData) {
      // Fallback if structured json endpoint failed: standard text prompt
      const fallbackRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
          }),
        }
      );
      if (fallbackRes.ok) {
        responseData = await fallbackRes.json();
      }
    }

    if (!responseData) {
      return null;
    }

    const textContent =
      responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return null;
    }

    try {
      // Clean possible markdown code fences if returned
      const cleanJson = textContent
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);

      return {
        replyText:
          parsed.reply ||
          "Halo, terima kasih telah menghubungi Sendora Support. Ada yang bisa saya bantu terkait kendala Anda?",
        shouldEscalate: Boolean(parsed.shouldEscalate || containsExplicitHuman),
        escalationReason:
          parsed.escalationReason ||
          (containsExplicitHuman ? "Permintaan langsung dari klien" : undefined),
      };
    } catch {
      // Text fallback if not valid JSON
      return {
        replyText: textContent.trim(),
        shouldEscalate: containsExplicitHuman,
        escalationReason: containsExplicitHuman
          ? "Permintaan langsung dari klien"
          : undefined,
      };
    }
  } catch (err) {
    console.error("[Gemini Support] Error generating response:", err);
    return null;
  }
}
