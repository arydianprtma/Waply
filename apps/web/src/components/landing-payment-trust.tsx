"use client";

import React from "react";
import { Lock, Zap, Receipt, ShieldCheck } from "lucide-react";

interface PaymentLogoItem {
  id: string;
  name: string;
  category: string;
  badge: string;
  logoSvg: React.ReactNode;
}

const PAYMENT_LOGOS: PaymentLogoItem[] = [
  {
    id: "midtrans",
    name: "Midtrans",
    category: "Payment Processor",
    badge: "Official",
    logoSvg: (
      <div className="flex items-center gap-1.5 font-sans font-black tracking-tight text-sm">
        <span className="w-3.5 h-3.5 rounded-full bg-[#002B49] border-2 border-[#0092E1] inline-block"></span>
        <span className="text-[#002B49] dark:text-sky-300 font-bold">mid</span>
        <span className="text-[#0092E1] font-bold">trans</span>
      </div>
    ),
  },
  {
    id: "qris",
    name: "QRIS",
    category: "Semua E-Wallet & M-Banking",
    badge: "Instan",
    logoSvg: (
      <div className="flex items-center gap-1 font-sans font-black tracking-tighter text-sm text-[#ea1d25]">
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v8h-3v-8z" />
        </svg>
        <span className="text-slate-900 dark:text-white font-extrabold tracking-tight">QRIS</span>
      </div>
    ),
  },
  {
    id: "bca",
    name: "BCA VA",
    category: "Virtual Account",
    badge: "Otomatis",
    logoSvg: (
      <div className="px-2.5 py-0.5 rounded-md bg-[#0060af] text-white font-sans font-extrabold text-xs tracking-wider">
        BCA
      </div>
    ),
  },
  {
    id: "mandiri",
    name: "Mandiri Bill",
    category: "Virtual Account",
    badge: "Otomatis",
    logoSvg: (
      <div className="flex items-center gap-1 font-sans font-extrabold text-xs text-[#003d79] dark:text-sky-200">
        <span className="w-2.5 h-2.5 rounded-full bg-[#f6ab00]"></span>
        <span>mandiri</span>
      </div>
    ),
  },
  {
    id: "bri",
    name: "BRI (BRIVA)",
    category: "Virtual Account",
    badge: "Otomatis",
    logoSvg: (
      <div className="flex items-center gap-1 font-sans font-extrabold text-xs text-[#00529c] dark:text-sky-300">
        <span className="text-[#f37021] font-black">BRI</span>
        <span className="text-[10px] text-slate-500 font-semibold">VA</span>
      </div>
    ),
  },
  {
    id: "bni",
    name: "BNI VA",
    category: "Virtual Account",
    badge: "Otomatis",
    logoSvg: (
      <div className="flex items-center gap-1 font-sans font-extrabold text-xs text-[#005e6a] dark:text-teal-300">
        <span className="text-[#005e6a] dark:text-teal-300">BNI</span>
        <span className="text-[#f15a24] font-black">46</span>
      </div>
    ),
  },
  {
    id: "permata",
    name: "Permata Bank",
    category: "Virtual Account",
    badge: "Otomatis",
    logoSvg: (
      <div className="flex items-center gap-1.5 font-sans font-bold text-xs text-[#008144] dark:text-emerald-300">
        <span className="w-2.5 h-2.5 rotate-45 bg-gradient-to-tr from-[#008144] to-[#e31b23] inline-block rounded-2xs"></span>
        <span>Permata</span>
      </div>
    ),
  },
  {
    id: "cimb",
    name: "CIMB Niaga",
    category: "Virtual Account",
    badge: "Otomatis",
    logoSvg: (
      <div className="px-2 py-0.5 rounded bg-[#7d0000] text-white font-sans font-bold text-[11px] tracking-tight">
        CIMB NIAGA
      </div>
    ),
  },
  {
    id: "gopay",
    name: "GoPay",
    category: "E-Wallet Instan",
    badge: "Instan",
    logoSvg: (
      <div className="flex items-center gap-1 font-sans font-bold text-xs text-[#00aed6]">
        <span className="w-4 h-4 rounded-full bg-[#00aed6] text-white flex items-center justify-center text-[10px] font-black">
          G
        </span>
        <span className="text-slate-900 dark:text-white font-extrabold">gopay</span>
      </div>
    ),
  },
  {
    id: "shopeepay",
    name: "ShopeePay",
    category: "E-Wallet Instan",
    badge: "Instan",
    logoSvg: (
      <div className="flex items-center gap-1 font-sans font-bold text-xs text-[#ee4d2d]">
        <span className="w-3.5 h-3.5 rounded-full bg-[#ee4d2d] text-white flex items-center justify-center text-[9px] font-black">
          S
        </span>
        <span className="font-extrabold">ShopeePay</span>
      </div>
    ),
  },
];

export function LandingPaymentTrust() {
  // Duplicate list to achieve continuous infinite marquee loop
  const marqueeItems = [...PAYMENT_LOGOS, ...PAYMENT_LOGOS];

  return (
    <section className="py-12 sm:py-16 px-4 md:px-12 bg-base-200/50 border-t border-base-200 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Trust & Guarantees */}
        <div className="rounded-3xl bg-base-100 border border-base-300 p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Transaksi Aman & Terenkripsi
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-base-content">
                Pembayaran Otomatis & Langsung Aktif 24/7
              </h3>
              <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                Upgrade paket langganan kapan saja tanpa perlu konfirmasi manual atau upload bukti transfer. Seluruh transaksi diproses secara real-time melalui gateway resmi Midtrans.
              </p>

              {/* Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-base-content/80">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Aktivasi Instan &lt; 5 Detik</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-base-content/80">
                  <Receipt className="w-4 h-4 text-primary shrink-0" />
                  <span>Invoice Otomatis ke Email</span>
                </div>
              </div>
            </div>

            <div className="lg:max-w-sm w-full p-4 sm:p-5 rounded-2xl bg-base-200/60 border border-base-300 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-base-content">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Terhubung ke Jaringan Perbankan Nasional</span>
              </div>
              <p className="text-[11px] text-base-content/60 leading-relaxed">
                Mendukung pembayaran instan via kode QR QRIS, Transfer Virtual Account bank terkemuka, dan dompet digital e-wallet.
              </p>
            </div>
          </div>
        </div>

        {/* Scrolling Infinite Logo Marquee */}
        <div className="space-y-3">
          <div className="text-center text-xs font-bold uppercase tracking-wider text-base-content/50">
            Didukung Oleh Saluran Pembayaran Terverifikasi
          </div>

          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] py-2">
            <div className="flex items-center gap-4 w-max animate-marquee hover:[animation-play-state:paused]">
              {marqueeItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-base-100 border border-base-300 shadow-2xs hover:border-primary/40 hover:shadow-sm transition-all shrink-0 min-w-[200px]"
                >
                  <div className="w-28 flex items-center justify-center shrink-0">
                    {item.logoSvg}
                  </div>
                  <div className="border-l border-base-200 pl-3 min-w-0">
                    <div className="font-bold text-xs text-base-content truncate">{item.name}</div>
                    <div className="text-[10px] text-base-content/50 truncate">{item.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </section>
  );
}
