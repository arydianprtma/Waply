import type { TicketMessage, SupportTicket } from "./support-tickets";
import { getAllPlans, getPlanDiscountStatus } from "./billing";
import { getRelevantKnowledgeForPrompt } from "./ai-knowledge";

function getDynamicPlansKnowledge(): string {
  try {
    const plansObj = getAllPlans();
    const activePlans = Object.values(plansObj).filter((p) => p.isActive !== false);

    if (activePlans.length === 0) {
      return "Saat ini belum ada paket berbayar yang aktif. Silakan tanyakan ke admin.";
    }

    const periodMap: Record<string, string> = {
      day: "hari",
      week: "minggu",
      month: "bulan",
      year: "tahun",
    };

    const lines = activePlans.map((plan) => {
      const periodName = periodMap[plan.period || "month"] || "bulan";
      const discStatus = getPlanDiscountStatus(plan);
      const effectivePrice = discStatus.effectivePrice;

      const priceStr =
        effectivePrice === 0
          ? "Gratis (Rp 0)"
          : `Rp ${effectivePrice.toLocaleString("id-ID")}/${periodName}`;

      const discountInfo =
        discStatus.isDiscountActive && discStatus.originalPrice && discStatus.discountPercent
          ? ` (Sedang Promo Diskon ${discStatus.discountPercent}% dari normal Rp ${discStatus.originalPrice.toLocaleString("id-ID")})`
          : "";

      const msgQuota =
        plan.monthlyMessages === -1
          ? "Unlimited Pesan"
          : `${(plan.monthlyMessages || 0).toLocaleString("id-ID")} Pesan / ${periodName}`;

      const deviceQuota = `${plan.maxDevices || 1} WhatsApp Device${(plan.maxDevices || 1) > 1 ? "s" : ""}`;
      const watermarkStr = plan.watermarkEnabled ? "Watermark ON" : "White-Label (Tanpa Watermark)";
      const popularBadge = plan.isPopular ? " [Pilihan Populer / Best Seller ⭐]" : "";

      // List key active feature capabilities from access
      const accessBadges: string[] = [];
      if (plan.access?.broadcast) accessBadges.push("Broadcast Bulk");
      if (plan.access?.autoReply) accessBadges.push("Auto-Reply Bot");
      if (plan.access?.webhooks) accessBadges.push("Webhook Real-time");
      if (plan.access?.warmupHealth) accessBadges.push("Warmup & Anti-Ban Safety");
      if (plan.access?.contacts) accessBadges.push("Manajemen Kontak & Grup");
      if (plan.access?.blacklistDnd) accessBadges.push("Blacklist & DND Protection");
      if (plan.access?.apiKeys) accessBadges.push("API Developer Keys");
      if (plan.access?.systemLogs) accessBadges.push("System Logs");

      const featuresList =
        plan.features && plan.features.length > 0
          ? plan.features.join(", ")
          : accessBadges.join(", ");

      return `- **${plan.name}** (ID: \`${plan.id}\`)${popularBadge}:
  • Harga: **${priceStr}**${discountInfo}
  • Kuota Chat: **${msgQuota}** | Batas Device: **${deviceQuota}** (${watermarkStr})
  • Fitur & Kemampuan: ${featuresList}
  • Akses Modul Aktif: ${accessBadges.join(", ") || "Dasar Gateway"}`;
    });

    return lines.join("\n\n");
  } catch (err) {
    console.error("[Gemini Support] Error generating dynamic plans:", err);
    return "Paket langganan aktif dapat dilihat pada menu Dashboard > Billing.";
  }
}

const WAPLY_STATIC_KNOWLEDGE = `
Anda adalah "Waply AI Assistant", asisten AI resmi dari platform Waply (WhatsApp Gateway & Customer Engagement Platform).
Tugas Anda adalah memberikan jawaban yang cerdas, ramah, solutif, percaya diri, dan sangat akurat secara teknis kepada pengguna.

=== KNOWLEDGE BASE RESMI WAPLY ===

1. TENTANG WAPLY:
   - Platform WhatsApp Gateway multi-device & multi-tenant berperforma tinggi tanpa emulator (menggunakan direct Baileys WebSocket engine).
   - Fitur utama: Pengiriman Pesan Teks & Media, Pustaka Template Spintax, Auto-Reply Chatbot, Broadcast Anti-Ban dengan Smart Delay, Manajemen Kontak, dan Webhook Event Real-Time.

2. PENGHUBUNGAN DEVICE / WHATSAPP:
   - Hubungkan nomor melalui menu **Dashboard > Devices > Tambah Perangkat > Scan QR Code** via WhatsApp di ponsel.
   - Jika status Disconnected: Pastikan ponsel terkoneksi internet, lalu klik **Restart Session** atau **Scan Ulang QR**.

3. WARMUP & DEVICE HEALTH (ANTI-BAN METRICS):
   - **Stage 1: Cold Number (Hari 1-3)** -> Safety delay 8-15 detik/pesan, batas maks 30 pesan/hari untuk membangun Trust Score di Meta.
   - **Stage 2: Warm Number (Hari 4-7)** -> Batas maks 100 pesan/hari.
   - **Stage 3: Active Number (Hari 8-14)** -> Batas maks 500 pesan/hari.
   - **Stage 4: Mature Number (Hari 15+) -> Kecepatan penuh (< 1 detik/pesan) sesuai kuota paket.

4. REST API & BASE URL:
   - Base URL Produksi: \`https://ardp.my.id\` (jangan tambahkan subpath pada konfigurasi baseURL).
   - Autentikasi: Header \`Authorization: Bearer snd_live_YOUR_API_KEY\` atau \`X-API-Key: snd_live_YOUR_API_KEY\`.
   - Endpoint Kirim Pesan: \`POST /api/v1/messages/send\`
   - Endpoint Template: \`GET/POST /api/v1/templates\`
   - Endpoint Broadcast: \`POST /api/broadcast\`
   - Endpoint Webhook: \`GET/POST /api/webhooks\`

5. CARA UPGRADE & PEMBAYARAN:
   - Pengguna dapat langsung menuju menu **Dashboard > Billing**, lalu klik tombol **Upgrade** pada paket yang dipilih.
   - Mendukung pembayaran instan via **QRIS**, **Virtual Account Bank (BCA, Mandiri, BRI, BNI)**, dan **E-Wallet**.
   - Kuota atau voucher diskon dapat dimasukkan pada kolom **Redeem Voucher** di halaman Billing.

=== ATURAN MERESPON (SANGAT PENTING) ===

1. GAYA BAHASA, EMOTICON & FORMAT BOLD:
   - Gunakan emoticon yang wajar, sopan, dan ramah (contoh: ✨, 🚀, 📱, 💡, 💳, 📦, 👍) untuk membuat pesan terasa hidup dan menyenangkan. Jangan berlebihan (cukup 1-2 per poin).
   - Gunakan **huruf tebal (bold)** dengan format \`**kata**\` pada nama paket, harga, nama menu, limit angka, dan poin-poin penting agar pesan terstruktur rapi dan enak dibaca.
   - JANGAN PERNAH mengulang sapaan nama seperti "Halo Kak [Nama]" di setiap balasan lanjutan! Langsung jawab pertanyaan ke intinya secara mengalir layaknya obrolan WhatsApp yang luwes.

2. PENJELASAN PAKET LANGGANAN (BERDASARKAN DATA REAL-TIME DATABASE):
   - Jika pengguna menanyakan tentang paket, harga, atau fitur apa saja yang tersedia, jelaskan SECARA LENGKAP DAN DETAIL HANYA paket yang sedang aktif di database (terlampir di bawah).
   - Jangan menyebutkan paket yang tidak terdaftar di database!
   - JANGAN PERNAH menawarkan atau menyebutkan diskon/promo yang sudah kadaluarsa (expired). Cek status promo dari data harga real-time di bawah. Jika tidak ada keterangan "(Sedang Promo Diskon...)", gunakan harga normal resmi yang tertera.
   - Jangan menyuruh pengguna cek sendiri di menu billing; berikan perbandingan jelas dengan harga, kuota, dan fitur-fiturnya.

3. JANGAN GAMPANG MELEMPARKAN KE CS MANUSIA (TETAP TANGANI SENDIRI):
   - Anda adalah asisten cerdas dan mandiri. Jawablah semua pertanyaan seputar paket, harga, fitur, teknis, API, panduan, dan troubleshooting secara tuntas.
   - JANGAN mengalihkan ke CS Manusia hanya karena pertanyaan seputar harga atau cara langganan!
   - Alihkan ke CS Manusia (\`shouldEscalate: true\`) HANYA jika:
     a) Pengguna secara eksplisit dan tegas mendesak ingin berbicara dengan staf manusia (misal: "saya mau bicara dengan orang asli sekarang", "hubungkan ke admin manusia").
     b) Kasus administrasi manual tingkat tinggi yang membutuhkan akses rekening bank admin (seperti: klaim refund transfer uang manual) atau pembukaan banned akun di tingkat basis data.
   - Jika terjadi eskalasi valid:
     "Baik, permintaan Anda saya teruskan ke Tim Customer Support kami agar dapat ditangani langsung oleh Admin. Mohon ditunggu sebentar ya! 🙏"

4. MENUTUP / MENYELESAIKAN SESI CHAT (shouldClose):
   - Standar / Default: "shouldClose": false.
   - Sesi tiket chat WAJIB TETAP TERBUKA untuk semua percakapan umum, obrolan santai, ucapan terima kasih ("makasih", "terima kasih"), apresiasi/pujian ("bagus juga ya platform ini", "keren"), dan konfirmasi ("ok", "siap", "baik", "noted").
   - Set "shouldClose": true HANYA jika pengguna SECARA EKSPLISIT DAN TEGAS MEMERINTAHKAN / MEMINTA UNTUK MENUTUP TIKET (contoh perintah langsung: "tolong tutup tiket ini", "tutup sesi chat", "akhiri sesi tiket", "close ticket").
   - JANGAN PERNAH menutup sesi chat jika pengguna tidak secara gamblang menyuruh menutup tiket!
`;

export interface AiResponseResult {
  replyText: string;
  shouldEscalate: boolean;
  escalationReason?: string;
  shouldClose?: boolean;
  closeReason?: string;
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

    // Check heuristics strictly for explicit session close command from user
    const explicitClosePhrases = [
      "tutup sesi",
      "tutup chat",
      "tutup tiket",
      "akhiri sesi",
      "akhiri chat",
      "akhiri tiket",
      "akhiri percakapan",
      "close ticket",
      "close tiket",
      "close chat",
      "tolong ditutup",
      "tolong tutup tiket",
      "bisa ditutup tiket",
      "bisa tolong ditutup",
      "bisa di close tiket",
      "bisa di-close tiket",
      "selesaikan tiket",
    ];

    const containsExplicitClose = explicitClosePhrases.some((phrase) => lower.includes(phrase));

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

    // Fetch dynamic plans directly from database / storage
    const dynamicPlansKnowledge = getDynamicPlansKnowledge();

    // Fetch relevant knowledge from AI Knowledge Base & Admin SOPs
    const relevantKnowledge = getRelevantKnowledgeForPrompt(
      `${ticket.subject} ${latestUserMessage}`,
      ticket.category
    );

    const prompt = `
${WAPLY_STATIC_KNOWLEDGE}

=== DAFTAR PAKET LANGGANAN REAL-TIME DARI DATABASE WAPLY ===
${dynamicPlansKnowledge}
${relevantKnowledge ? `\n=== BASIS PENGETAHUAN & SOLUSI TERUJI DARI ADMIN (KNOWLEDGE BASE) ===\n${relevantKnowledge}\n` : ""}
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
  "shouldEscalate": true/false (true jika ada permintaan eskalasi ke admin manusia),
  "escalationReason": "Alasan singkat eskalasi (jika shouldEscalate=true)",
  "shouldClose": true/false (HANYA true jika klien secara eksplisit menyuruh menutup/mengakhiri tiket bantuan),
  "closeReason": "Alasan penutupan tiket (jika shouldClose=true)"
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
      // Strictly require explicit close command from user to close session
      const shouldCloseFinal = containsExplicitClose || (Boolean(parsed.shouldClose) && containsExplicitClose);

      return {
        replyText:
          parsed.reply ||
          (shouldCloseFinal
            ? "Sama-sama! Senang bisa membantu Anda. Sesi tiket bantuan ini saya tandai selesai ya. Jika membutuhkan bantuan lagi di kemudian hari, jangan ragu untuk membuka tiket baru. Semoga harimu menyenangkan! ✨🙏"
            : textContent.trim()),
        shouldEscalate: shouldEscalateFinal,
        escalationReason:
          parsed.escalationReason ||
          (isExplicitEscalation ? "Permintaan langsung dari pengguna" : undefined),
        shouldClose: shouldCloseFinal,
        closeReason:
          parsed.closeReason ||
          (shouldCloseFinal ? "Permintaan penutupan sesi oleh klien" : undefined),
      };
    } catch {
      // Text fallback if not valid JSON
      const isExplicitEscalation = containsExplicitHuman && !hasNegation;
      const shouldCloseFinal = containsExplicitClose;
      return {
        replyText: textContent.trim(),
        shouldEscalate: isExplicitEscalation,
        escalationReason: isExplicitEscalation
          ? "Permintaan langsung dari pengguna"
          : undefined,
        shouldClose: shouldCloseFinal,
        closeReason: shouldCloseFinal
          ? "Permintaan penutupan sesi oleh klien"
          : undefined,
      };
    }
  } catch (err) {
    console.error("[Gemini Support] Error generating response:", err);
    return null;
  }
}
