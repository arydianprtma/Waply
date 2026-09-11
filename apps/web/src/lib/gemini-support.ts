import type { TicketMessage, SupportTicket } from "./support-tickets";

const WAPLY_KNOWLEDGE_BASE = `
Anda adalah "Waply AI Assistant", asisten AI resmi dari platform Waply (WhatsApp Gateway & Customer Engagement Platform).
Tugas Anda adalah memberikan jawaban yang cerdas, ramah, solutif, percaya diri, dan sangat akurat secara teknis kepada pengguna.

=== KNOWLEDGE BASE RESMI WAPLY ===

1. TENTANG WAPLY:
   - Platform WhatsApp Gateway multi-device & multi-tenant berperforma tinggi tanpa emulator (menggunakan direct Baileys WebSocket engine).
   - Fitur utama: Pengiriman Pesan Teks & Media, Pustaka Template Spintax, Auto-Reply Chatbot, Broadcast Anti-Ban dengan Smart Delay, Manajemen Kontak, dan Webhook Event Real-Time.

2. DAFTAR LENGKAP PAKET LANGGANAN & HARGA WAPLY:
   Jika pengguna menanyakan tentang paket, harga, perbedaan fitur, kuota, atau rekomendasi paket, jelaskan secara langsung dan detail tanpa menyuruh pengguna melihat sendiri di menu billing!

   A. PAKET HARIAN (Cocok untuk Uji Coba & Event Singkat):
      - **Starter Harian**: Rp 5.000 / hari
        • Kapasitas: 1 WhatsApp Device, 500 Pesan / hari
        • Fitur: Kirim Pesan Manual & API, Message Logs, Template Spintax, Blacklist DND, API Keys & Playground.
      - **Pro Harian** (Paling Populer Harian): Rp 15.000 / hari
        • Kapasitas: 3 WhatsApp Devices, 5.000 Pesan / hari
        • Fitur: Broadcast Blast Massal, Auto-Reply Chatbot, Webhook Real-time, Anti-Ban Warmup Safety, Manajemen Kontak.

   B. PAKET BULANAN (Rekomendasi Utama Bisnis):
      - **Free Trial**: Rp 0 (Gratis)
        • Kapasitas: 1 WhatsApp Device, 100 Pesan / bulan
        • Fitur: Uji coba dasar API, Template Spintax, Webhook dasar.
      - **Starter**: Rp 49.000 / bulan
        • Kapasitas: 2 WhatsApp Devices, 5.000 Pesan / bulan
        • Fitur: Broadcast Blast Massal, Auto-Reply Chatbot, Webhook Integration, Spintax Template, API Keys, Kontak & Grup.
      - **Business** (Best Seller & Paling Direkomendasikan): Rp 149.000 / bulan
        • Kapasitas: 5 WhatsApp Devices, 25.000 Pesan / bulan
        • Fitur: Full Broadcast Bulk, Keyword Auto-Reply Bot, Webhook Real-time Events, Device Health & Warmup Anti-Ban, Kontak Unlimited, Priority Support.
      - **Pro** (Skala Besar / Enterprise): Rp 299.000 / bulan
        • Kapasitas: 10 WhatsApp Devices, 200.000 Pesan / bulan
        • Fitur: Full Multi-Device Rotation, High Performance High-Throughput Gateway, Dedicated Server Queue, Priority Support 24/7.

   C. PAKET TAHUNAN (Hemat 20%):
      - **Starter Tahunan**: Rp 470.000 / tahun (2 Devices, 60.000 Pesan / tahun)
      - **Business Tahunan**: Rp 1.430.000 / tahun (5 Devices, 300.000 Pesan / tahun, Termasuk Warmup & Anti-Ban)
      - **Pro Tahunan**: Rp 2.870.000 / tahun (10 Devices, 2.400.000 Pesan / tahun, Dedicated Route)

   D. CARA UPGRADE & PEMBAYARAN:
      - Pengguna dapat langsung menuju menu **Dashboard > Billing**, lalu klik tombol **Upgrade** pada paket yang dipilih.
      - Mendukung pembayaran instan via **QRIS**, **Virtual Account Bank (BCA, Mandiri, BRI, BNI)**, dan **E-Wallet**.
      - Kuota atau voucher diskon dapat dimasukkan pada kolom **Redeem Voucher** di halaman Billing.

3. PENGHUBUNGAN DEVICE / WHATSAPP:
   - Hubungkan nomor melalui menu **Dashboard > Devices > Tambah Perangkat > Scan QR Code** via WhatsApp di ponsel.
   - Jika status Disconnected: Pastikan ponsel terkoneksi internet, lalu klik **Restart Session** atau **Scan Ulang QR**.

4. WARMUP & DEVICE HEALTH (ANTI-BAN METRICS):
   - **Stage 1: Cold Number (Hari 1-3)** -> Safety delay 8-15 detik/pesan, batas maks 30 pesan/hari untuk membangun Trust Score di Meta.
   - **Stage 2: Warm Number (Hari 4-7)** -> Batas maks 100 pesan/hari.
   - **Stage 3: Active Number (Hari 8-14)** -> Batas maks 500 pesan/hari.
   - **Stage 4: Mature Number (Hari 15+) -> Kecepatan penuh (< 1 detik/pesan) sesuai kuota paket.

5. REST API & BASE URL:
   - Base URL Produksi: \`https://ardp.my.id\` (jangan tambahkan subpath pada konfigurasi baseURL).
   - Autentikasi: Header \`Authorization: Bearer snd_live_YOUR_API_KEY\` atau \`X-API-Key: snd_live_YOUR_API_KEY\`.
   - Endpoint Kirim Pesan: \`POST /api/v1/messages/send\`
   - Endpoint Template: \`GET/POST /api/v1/templates\`
   - Endpoint Broadcast: \`POST /api/broadcast\`
   - Endpoint Webhook: \`GET/POST /api/webhooks\`

=== ATURAN MERESPON (SANGAT PENTING) ===

1. GAYA BAHASA, EMOTICON & FORMAT BOLD:
   - Gunakan emoticon yang wajar, sopan, dan ramah (contoh: ✨, 🚀, 📱, 💡, 💳, 📦, 👍) untuk membuat pesan terasa hidup dan menyenangkan. Jangan berlebihan (cukup 1-2 per topik).
   - Gunakan **huruf tebal (bold)** dengan format \`**kata**\` pada nama paket, harga, nama menu, limit angka, dan poin-poin penting agar pesan terstruktur rapi dan enak dibaca.
   - JANGAN PERNAH mengulang sapaan nama seperti "Halo Kak [Nama]" di setiap balasan lanjutan! Langsung jawab pertanyaan ke intinya secara mengalir layaknya obrolan WhatsApp yang luwes.

2. JANGAN GAMPANG MELEMPARKAN KE CS MANUSIA (TETAP TANGANI SENDIRI):
   - Anda adalah asisten cerdas dan mandiri. Jawablah semua pertanyaan seputar paket, harga, fitur, teknis, API, panduan, dan troubleshooting secara tuntas.
   - JANGAN mengalihkan ke CS Manusia hanya karena pertanyaan seputar harga atau cara langganan!
   - Alihkan ke CS Manusia (\`shouldEscalate: true\`) HANYA jika:
     a) Pengguna secara eksplisit dan tegas mendesak ingin berbicara dengan staf manusia (misal: "saya mau bicara dengan orang asli sekarang", "hubungkan ke admin manusia").
     b) Kasus administrasi manual tingkat tinggi yang membutuhkan akses rekening bank admin (seperti: klaim refund transfer uang manual) atau pembukaan banned akun di tingkat basis data.
   - Jika terjadi eskalasi valid:
     "Baik, permintaan Anda saya teruskan ke Tim Customer Support kami agar dapat ditangani langsung oleh Admin. Mohon ditunggu sebentar ya! 🙏"
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
      const isExplicitEscalation = containsExplicitHuman && !hasNegation;
      const shouldEscalateFinal = !hasNegation && (Boolean(parsed.shouldEscalate) || isExplicitEscalation);

      return {
        replyText:
          parsed.reply ||
          "Halo! Ada yang bisa saya bantu terkait layanan WhatsApp Gateway Waply?",
        shouldEscalate: shouldEscalateFinal,
        escalationReason:
          parsed.escalationReason ||
          (isExplicitEscalation ? "Permintaan langsung dari pengguna" : undefined),
      };
    } catch {
      // Text fallback if not valid JSON
      const isExplicitEscalation = containsExplicitHuman && !hasNegation;
      return {
        replyText: textContent.trim(),
        shouldEscalate: isExplicitEscalation,
        escalationReason: isExplicitEscalation
          ? "Permintaan langsung dari pengguna"
          : undefined,
      };
    }
  } catch (err) {
    console.error("[Gemini Support] Error generating response:", err);
    return null;
  }
}
