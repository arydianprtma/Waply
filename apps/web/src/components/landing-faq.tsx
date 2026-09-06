"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, MessageSquare } from "lucide-react";

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
      "Tidak perlu. Sendora menggunakan teknologi WhatsApp Multi-Device Gateway modern. Anda cukup scan QR code menggunakan nomor WhatsApp pribadi atau WhatsApp Business biasa yang sudah Anda miliki, dan API langsung aktif seketika dalam hitungan detik tanpa proses approval Meta yang rumit.",
  },
  {
    category: "Keamanan",
    question: "Bagaimana cara kerja Proteksi Anti-Ban di Sendora?",
    answer:
      "Sendora dilengkapi algoritma Anti-Ban cerdas: Dynamic Typing Simulation (mensimulasikan jeda mengetik manusia), Smart Random Delay (jeda acak 3-7 detik antar pesan broadcast), Warm-up Queueing (pembatasan volume bertahap untuk nomor baru), dan Auto-Pause saat terdeteksi lonjakan error dari WhatsApp server.",
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
      "Sendora menyediakan REST API standar yang bisa dipanggil dari bahasa apapun: Laravel/PHP, Node.js/TypeScript, Python, Golang, Java, C#, hingga integrasi tanpa coding seperti Zapier, Make, n8n, atau plugin WordPress/WooCommerce.",
  },
  {
    category: "Teknis",
    question: "Apakah bisa mengirim gambar, PDF, dokumen, dan pesan lokasi?",
    answer:
      "Tentu saja. Sendora mendukung pengiriman pesan Teks, Gambar (JPG/PNG/WebP), Dokumen (PDF, Excel, Word), Video, Audio (Voice Note PTT), Pesan Lokasi, dan Kontak (vCard) secara mulus via REST API endpoint.",
  },
  {
    category: "Umum",
    question: "Berapa banyak nomor WhatsApp yang bisa saya hubungkan?",
    answer:
      "Jumlah perangkat tergantung pada paket langganan Anda (1 device untuk Starter, hingga unlimited/multi-device untuk paket Business & Enterprise). Anda dapat mengelola semua nomor WhatsApp dalam satu dashboard terpusat.",
  },
  {
    category: "Harga",
    question: "Metode pembayaran apa saja yang tersedia untuk upgrade?",
    answer:
      "Kami mendukung pembayaran otomatis instan via Midtrans: QRIS (GoPay, OVO, Dana, ShopeePay, BCA QR), Virtual Account semua Bank Nasional (BCA, Mandiri, BNI, BRI, Permata), dan Kartu Kredit/Debit.",
  },
];

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
    <section id="faq" className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200/80">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-3 text-slate-600 text-base leading-relaxed">
            Semua hal yang perlu Anda ketahui tentang integrasi WhatsApp Gateway, keamanan anti-ban, dan performa Sendora.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5 max-w-3xl mx-auto">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                    : "border-slate-200/90 shadow-xs hover:border-slate-300"
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 select-none group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider shrink-0 ${
                        faq.category === "Keamanan"
                          ? "bg-amber-100 text-amber-800"
                          : faq.category === "Teknis"
                          ? "bg-blue-100 text-blue-800"
                          : faq.category === "Harga"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {faq.category}
                    </span>
                    <span className="font-bold text-slate-900 text-sm md:text-base group-hover:text-primary transition-colors">
                      {faq.question}
                    </span>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? "bg-primary text-white rotate-180"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mini CTA Support Box */}
        <div className="mt-12 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Masih punya pertanyaan lain?</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Tim technical support kami siap membantu integrasi sistem Anda 24/7.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Tim%20Sendora,%20saya%20ingin%20tanya%20seputar%20API%20WhatsApp%20Gateway"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm rounded-xl font-bold px-5 border-slate-300 hover:border-primary hover:bg-primary hover:text-white shrink-0"
          >
            Chat Support CS
          </a>
        </div>
      </div>
    </section>
  );
}
