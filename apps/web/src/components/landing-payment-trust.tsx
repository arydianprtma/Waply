"use client";

import { ShieldCheck, Zap, Receipt, Lock, CheckCircle2 } from "lucide-react";

export function LandingPaymentTrust() {
  const paymentMethods = [
    { name: "QRIS", type: "Semua E-Wallet & Bank", badge: "Instan" },
    { name: "BCA Virtual Account", type: "Bank Transfer", badge: "Otomatis" },
    { name: "Mandiri Bill", type: "Bank Transfer", badge: "Otomatis" },
    { name: "BRI Virtual Account", type: "Bank Transfer", badge: "Otomatis" },
    { name: "BNI Virtual Account", type: "Bank Transfer", badge: "Otomatis" },
    { name: "Permata & CIMB", type: "Bank Transfer", badge: "Otomatis" },
    { name: "GoPay & ShopeePay", type: "Direct E-Wallet", badge: "Instan" },
  ];

  return (
    <section className="py-10 sm:py-14 px-4 md:px-12 bg-base-200/50 border-t border-base-200">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-base-100 border border-base-300 p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left Info */}
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

            {/* Right Payment Channel Pills */}
            <div className="lg:max-w-md w-full">
              <div className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-3">
                Metode Pembayaran yang Didukung:
              </div>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((m) => (
                  <div
                    key={m.name}
                    className="px-3.5 py-2 rounded-xl bg-base-200/70 border border-base-300 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-base-content">{m.name}</div>
                      <div className="text-[10px] text-base-content/60">{m.type}</div>
                    </div>
                    <span className="badge badge-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border-none text-[9px] px-1.5 py-0.5">
                      {m.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
