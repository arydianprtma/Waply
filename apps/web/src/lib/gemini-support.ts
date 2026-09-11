import type { TicketMessage, SupportTicket } from "./support-tickets";

const WAPLY_KNOWLEDGE_BASE = `
Anda adalah "Waply AI Assistant", asisten AI resmi dari platform Waply (WhatsApp Gateway & Customer Engagement Platform).
Tugas Anda adalah memberikan jawaban yang ramah, sopan, ringkas, solutif, dan sangat akurat secara teknis kepada klien yang membuka tiket bantuan.

=== KNOWLEDGE BASE RESMI WAPLY ===

1. TENTANG WAPLY:
   - Platform WhatsApp Gateway multi-device & multi-tenant berperforma tinggi tanpa emulator (menggunakan direct socket engine).
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
   - Dilengkapi verifikasi keamanan HMAC-SHA256 pada header "X-Waply-Signature".

7. BILLING, KUOTA & PAKET:
   - Paket tersedia: Trial, Starter, Business, Enterprise.
   - Top-up kuota pesan dapat menggunakan Voucher Kode di menu Billing atau upgrade paket.

=== ATURAN MERESPON (SANGAT PENTING) ===

1. GAYA BAHASA & ANTI-ROBOTIK:
   - JANGAN PERNAH mengulang-ulang sapaan nama pengguna seperti "Halo Kak [Nama]" atau "Hai Kak [Nama]" di setiap balasan! Ini membuat percakapan terasa kaku dan seperti robot.
   - Pada percakapan yang sedang berjalan (lanjutan chat), LANGSUNG jawab pertanyaan atau berikan solusi secara alami, mengalir, ramah, dan to-the-point seperti staf support profesional yang sedang chatting di WhatsApp (misal: "Bisa banget! Caranya...", "Tentu, untuk kendala tersebut...", "Langkahnya cukup mudah: ...").
   - Gunakan Bahasa Indonesia yang luwes, santun, solutif, dan mudah dimengerti.
   - Jangan bertele-tele atau membuat pengantar yang berulang.

2. DETEKSI HUMAN HANDOVER (ESKALASI KE CS MANUSIA):
   - Alihkan ke CS Manusia (shouldEscalate: true) HANYA jika:
     a) Pengguna secara positif meminta berbicara dengan orang/admin (contoh: "minta dihubungkan ke admin", "mau bicara dengan staf manusia", "hubungkan ke customer service asli").
     b) JANGAN eskalasi jika pengguna berkata "nanti saja", "mau sama kamu dulu", "ngobrol sama AI aja", "jangan ke admin", dsb.
     c) Masalah memerlukan verifikasi database internal admin (misal: refund dana, cek bukti transfer rekening, permohonan buka banned akun, reset credentials).
   - Format respon pengalihan jika terjadi handover:
     "Baik, saya mengerti. Saya teruskan tiket ini ke Tim Customer Support kami agar dapat ditangani langsung oleh staf Admin ya. Mohon ditunggu sebentar."
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
    // Check heuristics for explicit human request with negation filtering
    const lower = latestUserMessage.toLowerCase();
    
    // Check if user is saying they DON'T want human/admin or want AI instead
    const hasNegation = 
      lower.includes("nanti") ||
      lower.includes("jangan") ||
      lower.includes("ga usah") ||
      lower.includes("gak usah") ||
      lower.includes("ngga") ||
      lower.includes("tidak") ||
      lower.includes("gamau") ||
      lower.includes("sama kamu") ||
      lower.includes("sama ai") ||
      lower.includes("ngobrol sama ai");

    const positiveHumanPhrases = [
      "cs manusia",
      "orang asli",
      "bicara dengan admin",
      "bicara dengan manusia",
      "bicara sama admin",
      "hubungkan ke admin",
      "hubungkan ke cs",
      "sambungkan ke admin",
      "panggil admin",
      "minta cs",
      "minta admin",
      "chat admin",
      "operator manusia",
    ];

    const containsExplicitHuman = !hasNegation && positiveHumanPhrases.some((phrase) =>
      lower.includes(phrase)
    );

    // Build conversation context
    const conversationHistory = ticket.messages
      .map((m) => {
        const roleLabel =
          m.senderRole === "user"
            ? "Klien"
            : m.senderRole === "ai"
            ? "Waply AI"
            : "Admin Support";
        return `[${roleLabel}]: ${m.message}`;
      })
      .join("\n");

    const prompt = `
${WAPLY_KNOWLEDGE_BASE}

=== INFORMASI TIKET SAAT INI ===
ID Tiket: ${ticket.id}
Nama Klien: ${ticket.userName}
Kategori: ${ticket.category}
Prioritas: ${ticket.priority}
Subjek: ${ticket.subject}

=== RIWAYAT PERCAKAPAN TIKET ===
${conversationHistory}

[Pesan Terakhir Klien]: ${latestUserMessage}

=== INSTRUKSI OUTPUT ===
Jawab pesan terakhir klien secara langsung dan alami tanpa mengulang sapaan/nama klien jika ini percakapan lanjutan. Berikan balasan dalam format JSON:
{
  "reply": "Tulis balasan langsung, ramah, dan solutif di sini...",
  "shouldEscalate": true/false (true jika ada permintaan eskalasi atau butuh tindakan admin manual),
  "escalationReason": "Alasan singkat eskalasi (jika shouldEscalate=true)"
}
`;

    // Call Gemini API (using available fast flash models)
    const models = [
      "gemini-flash-lite-latest",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
    ];
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
      for (const model of models) {
        try {
          const fallbackRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
            break;
          }
        } catch {
          // continue
        }
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
          "Halo, terima kasih telah menghubungi Waply Support. Ada yang bisa saya bantu terkait kendala Anda?",
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
