"use client";

import React from "react";
import { Lock, Zap, Receipt, ShieldCheck } from "lucide-react";

interface PaymentLogoItem {
  id: string;
  name: string;
  category: string;
  src: string;
}

const PAYMENT_LOGOS: PaymentLogoItem[] = [
  {
    id: "midtrans",
    name: "Midtrans",
    category: "Payment Gateway",
    src: "/icons/payments/midtrans.svg",
  },
  {
    id: "qris",
    name: "QRIS",
    category: "Semua E-Wallet & Bank",
    src: "/icons/payments/qris.svg",
  },
  {
    id: "bca",
    name: "BCA Virtual Account",
    category: "Bank Transfer",
    src: "/icons/payments/bca.svg",
  },
  {
    id: "mandiri",
    name: "Mandiri Bill",
    category: "Bank Transfer",
    src: "/icons/payments/mandiri.svg",
  },
  {
    id: "bri",
    name: "BRI (BRIVA)",
    category: "Bank Transfer",
    src: "/icons/payments/bri.svg",
  },
  {
    id: "bni",
    name: "BNI Virtual Account",
    category: "Bank Transfer",
    src: "/icons/payments/bni.svg",
  },
  {
    id: "permata",
    name: "Permata Bank",
    category: "Bank Transfer",
    src: "/icons/payments/permata.svg",
  },
  {
    id: "cimb",
    name: "CIMB Niaga",
    category: "Bank Transfer",
    src: "/icons/payments/cimb-niaga.svg",
  },
  {
    id: "gopay",
    name: "GoPay",
    category: "E-Wallet Instan",
    src: "/icons/payments/gopay.svg",
  },
  {
    id: "shopeepay",
    name: "ShopeePay",
    category: "E-Wallet Instan",
    src: "/icons/payments/shopee-pay.svg",
  },
];

export function LandingPaymentTrust() {
  // Duplicate array for seamless infinite scrolling loop
  const marqueeItems = [...PAYMENT_LOGOS, ...PAYMENT_LOGOS];

  return (
    <section className="py-12 sm:py-16 px-4 md:px-12 bg-base-200/50 border-t border-base-200 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Trust & Guarantees */}
        <div className="rounded-3xl bg-base-100 border border-base-300 p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Transaksi Aman & Terenkripsi • Powered by Midtrans</span>
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

            <div className="lg:max-w-sm w-full p-4 sm:p-5 rounded-2xl bg-base-200/60 border border-base-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-base-300/80">
                <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">
                  Payment Processor
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-base-content/60 font-semibold">Powered by</span>
                  <img
                    src="/icons/payments/midtrans.svg"
                    alt="Midtrans"
                    className="h-4 w-auto object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1">
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
        </div>

        {/* Scrolling Infinite Logo Marquee */}
        <div className="space-y-4">
          <div className="text-center text-xs font-bold uppercase tracking-wider text-base-content/50">
            Didukung Oleh Saluran Pembayaran Resmi
          </div>

          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] py-2">
            <div className="flex items-center gap-4 w-max animate-marquee hover:[animation-play-state:paused]">
              {marqueeItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center justify-center px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all shrink-0 min-w-[150px] h-[64px]"
                  title={item.name}
                >
                  <img
                    src={item.src}
                    alt={item.name}
                    className="max-h-7 max-w-[110px] w-auto h-auto object-contain transition-transform duration-200 hover:scale-105"
                    loading="lazy"
                  />
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
          animation: marquee 24s linear infinite;
        }
      `}</style>
    </section>
  );
}
