"use client";

import { useState } from "react";
import { ChevronDown, MessageSquare, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "Umum" | "Teknis" | "Keamanan" | "Harga";
}

const FAQS: FAQItem[] = [
  {
    category: "Umum",
    question: "Apakah perlu verifikasi centang hijau (WhatsApp Business API Official)?",
    answer:
      "Tidak perlu. Waply menggunakan teknologi WhatsApp Multi-Device Gateway modern. Anda cukup scan QR code menggunakan nomor WhatsApp pribadi atau WhatsApp Business biasa yang sudah Anda miliki, dan API langsung aktif seketika dalam hitungan detik tanpa proses approval Meta yang rumit.",
  },
  {
    category: "Keamanan",
    question: "Bagaimana cara kerja Proteksi Anti-Ban di Waply?",
    answer:
      "Waply dilengkapi algoritma Anti-Ban cerdas: Dynamic Typing Simulation (mensimulasikan jeda mengetik manusia), Smart Random Delay (jeda acak 3-7 detik antar pesan broadcast), Warm-up Queueing (pembatasan volume bertahap untuk nomor baru), dan Auto-Pause saat terdeteksi lonjakan error dari WhatsApp server.",
  },
  {
    category: "Harga",
    question: "Apakah ada Free Trial dan bagaimana kuotanya?",
    answer:
      "Ya! Setiap pendaftar baru langsung mendapatkan kuota Free Trial sebanyak 100 pesan tanpa perlu memasukkan kartu kredit. Anda bisa langsung mencoba mengirim pesan teks, media gambar/PDF, serta menguji webhook secara instan.",
  },
  {
    category: "Teknis",
    question: "Bahasa pemrograman apa saja yang didukung?",
    answer:
      "Waply menyediakan REST API standar yang bisa dipanggil dari bahasa apapun: Laravel/PHP, Node.js/TypeScript, Python, Golang, Java, C#, hingga integrasi tanpa coding seperti Zapier, Make, n8n, atau plugin WordPress/WooCommerce.",
  },
  {
    category: "Teknis",
    question: "Apakah bisa mengirim gambar, PDF, dokumen, dan pesan lokasi?",
    answer:
      "Tentu saja. Waply mendukung pengiriman pesan Teks, Gambar (JPG/PNG/WebP), Dokumen (PDF, Excel, Word), Video, Audio (Voice Note PTT), Pesan Lokasi, dan Kontak (vCard) secara mulus via REST API endpoint.",
  },
  {
    category: "Umum",
    question: "Berapa banyak nomor WhatsApp yang bisa saya hubungkan?",
    answer:
      "Jumlah perangkat tergantung pada paket langganan Anda (1 device untuk Starter, hingga multi-device untuk paket Business & Enterprise). Anda dapat mengelola semua nomor WhatsApp dalam satu dashboard terpusat.",
  },
  {
    category: "Harga",
    question: "Metode pembayaran apa saja yang tersedia untuk upgrade?",
    answer:
      "Kami mendukung pembayaran otomatis instan via Midtrans: QRIS (GoPay, OVO, Dana, ShopeePay, BCA QR), Virtual Account semua Bank Nasional (BCA, Mandiri, BNI, BRI, Permata), dan Kartu Kredit/Debit.",
  },
];

const CATEGORY_BADGES: Record<string, string> = {
  Umum: "bg-slate-100 text-slate-700 border-slate-200",
  Keamanan: "bg-amber-50 text-amber-700 border-amber-200",
  Teknis: "bg-sky-50 text-sky-700 border-sky-200",
  Harga: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  const categories = ["Semua", "Umum", "Keamanan", "Teknis", "Harga"];

  const filteredFaqs =
    activeCategory === "Semua"
      ? FAQS
      : FAQS.filter((faq) => faq.category === activeCategory);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-24 bg-slate-50 border-t border-slate-200/80">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            Frequently Asked Questions
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-2 text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed">
            Informasi lengkap seputar integrasi WhatsApp Gateway, keamanan anti-ban, dan performa Waply.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setOpenIndex(null);
                  }}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 max-w-3xl mx-auto">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden ${
                  isOpen
                    ? "border-emerald-400/80 ring-1 ring-emerald-200/70 shadow-xs"
                    : "border-slate-200/90 shadow-2xs hover:border-slate-300"
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-4.5 flex items-center justify-between gap-3 select-none group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider shrink-0 border ${
                        CATEGORY_BADGES[faq.category] || "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {faq.category}
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm md:text-base group-hover:text-emerald-700 transition-colors">
                      {faq.question}
                    </span>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? "bg-emerald-50 text-emerald-700 rotate-180"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Box */}
        <div className="mt-10 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Masih punya pertanyaan lain?</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Tim technical support kami siap membantu integrasi sistem WhatsApp Anda.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Tim%20Waply,%20saya%20ingin%20tanya%20seputar%20API%20WhatsApp%20Gateway"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl font-semibold px-4 py-2 text-xs transition-colors shrink-0 shadow-2xs w-full sm:w-auto"
          >
            Chat Support CS
          </a>
        </div>
      </div>
    </section>
  );
}

