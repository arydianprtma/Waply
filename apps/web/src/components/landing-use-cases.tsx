"use client";

import {
  ShoppingBag,
  KeyRound,
  Receipt,
  Megaphone,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const USE_CASES = [
  {
    icon: ShoppingBag,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    badge: "E-Commerce & Retail",
    title: "Notifikasi & Resi Pengiriman Otomatis",
    description:
      "Kirim invoice pembayaran, update nomor resi kurir, dan notifikasi barang dikirim secara otomatis saat status pesanan berubah.",
    highlights: ["Kirim lampiran invoice PDF", "Webhook status pesanan realtime", "Integrasi WooCommerce & Custom API"],
  },
  {
    icon: KeyRound,
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    badge: "Keamanan Akun",
    title: "OTP & Verifikasi Login 2 Langkah",
    description:
      "Alternatif hemat biaya hingga 80% dibandingkan SMS OTP konvensional. Kirim token autentikasi 6 digit ke nomor customer dalam hitungan detik.",
    highlights: ["Latency pengiriman < 2 detik", "Format template dinamis", "Hemat biaya operasional"],
  },
  {
    icon: Receipt,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    badge: "Billing & Finansial",
    title: "Pengingat Jatuh Tempo & Tagihan",
    description:
      "Kirim tagihan iuran, biaya langganan, atau invoice pembayaran otomatis sebelum tanggal jatuh tempo dengan tombol link bayar.",
    highlights: ["Sertakan link pembayaran online", "Jadwal kirim otomatis H-3 / H-1", "Tanda terima lunas otomatis"],
  },
  {
    icon: Megaphone,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    badge: "Marketing & CRM",
    title: "Broadcast Promo Terjadwal Aman",
    description:
      "Kirim kampanye promo, newsletter, atau pengumuman event ke ribuan kontak sekaligus dengan perlindungan Spintax dan auto-rotate nomor.",
    highlights: ["Distribusi beban multi-device", "Delay acak human typing", "Auto-blacklist pesan STOP"],
  },
];

export function LandingUseCases() {
  return (
    <section id="use-cases" className="py-12 sm:py-20 px-4 md:px-12 bg-base-100 border-t border-base-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 mb-3">
            Skenario Nyata & Solusi
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-base-content">
            Dirancang untuk Berbagai Kebutuhan Bisnis
          </h2>
          <p className="text-base-content/70 mt-3 text-xs sm:text-sm leading-relaxed">
            Mulai dari otomasi toko online hingga sistem enterprise, Waply menangani seluruh alur pesan WhatsApp bisnis Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.title}
                className="p-6 sm:p-8 rounded-3xl bg-base-100 border border-base-300 hover:border-primary/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${uc.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-base-200 text-base-content/70">
                      {uc.badge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-base-content mb-2">
                    {uc.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed mb-6">
                    {uc.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-base-200 space-y-2">
                  {uc.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs text-base-content/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
