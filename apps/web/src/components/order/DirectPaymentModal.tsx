"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Check,
  X,
  Copy,
  Building2,
  Smartphone,
  QrCode,
  Download,
  HelpCircle,
  RefreshCw,
  Mail,
  Zap,
  MessageSquare,
  Server,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Plan } from "@/lib/billing-types";
import { AddonItem } from "@/lib/addon-types";
import { ModalPortal } from "@/components/ui/ModalPortal";

export interface PaymentChargeData {
  orderId: string;
  grossAmount: number;
  paymentType: string;
  bank?: string;
  qrCodeUrl?: string | null;
  qrString?: string | null;
  vaNumber?: string | null;
  billerCode?: string | null;
  billKey?: string | null;
  deeplinkUrl?: string | null;
  expiryTime?: string;
  transactionStatus?: string;
}

interface DirectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  chargeData: PaymentChargeData;
  customerEmail: string;
  selectedAddonIds: string[];
  availableAddons: AddonItem[];
  isAddonMode: boolean;
  currentPlan: Plan;
  effectiveDurationMonths: number;
  paymentSuccess: boolean;
  setPaymentSuccess: (success: boolean) => void;
}

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatVaNumber(va: string) {
  return va.replace(/(\d{4})/g, "$1 ").trim();
}

export default function DirectPaymentModal({
  isOpen,
  onClose,
  chargeData,
  customerEmail,
  selectedAddonIds,
  availableAddons,
  isAddonMode,
  currentPlan,
  effectiveDurationMonths,
  paymentSuccess,
  setPaymentSuccess,
}: DirectPaymentModalProps) {
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [activeInstructionTab, setActiveInstructionTab] = useState<"mbanking" | "ibanking" | "atm">("mbanking");
  const [timeRemaining, setTimeRemaining] = useState<string>("23:59:59");
  const [syncChecking, setSyncChecking] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: "info" | "warning" | "error"; title: string; message: string } | null>(null);

  // Polling check for payment status
  useEffect(() => {
    if (!isOpen || paymentSuccess || !chargeData?.orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: chargeData.orderId }),
        });
        const json = await res.json();
        if (json.success && json.data?.status === "PAID") {
          setPaymentSuccess(true);
        }
      } catch {
        // Silently retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, paymentSuccess, chargeData?.orderId, setPaymentSuccess]);

  // Countdown timer for expiry
  useEffect(() => {
    if (!isOpen || paymentSuccess) return;

    const targetTime = Date.now() + 24 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      if (diff === 0) {
        clearInterval(timer);
        setTimeRemaining("Waktu Habis");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${mins
          .toString()
          .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, paymentSuccess]);

  const copyToClipboard = (text: string, type: "va" | "amount") => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "va") {
        setCopiedVa(true);
        setTimeout(() => setCopiedVa(false), 2500);
      } else {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2500);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10 max-h-[94vh] flex flex-col overflow-hidden">
          
          {/* Modal Top Header Bar */}
          <div className="px-5 sm:px-7 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
            <div className="flex items-center gap-3">
              {/* Official Waply Logo Emblem */}
              <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-xs border border-slate-200/80 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/waply-icon.png"
                  alt="Waply Icon"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                    {paymentSuccess ? "Pembayaran Berhasil" : "Selesaikan Pembayaran"}
                  </h3>
                  <span className="badge badge-xs bg-emerald-50 text-emerald-700 border-emerald-200/80 font-bold text-[9px] px-1.5">
                    WAPLY GATEWAY
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono mt-0.5">
                  <span className="text-slate-500 font-bold text-[11px]">Order ID:</span>
                  <span className="text-slate-900 font-black tracking-wide select-all bg-slate-200/80 px-1.5 py-0.5 rounded text-[11px] border border-slate-300/60 shadow-2xs">
                    {chargeData.orderId}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!paymentSuccess ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold font-mono shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                  <span>{timeRemaining}</span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terverifikasi
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 text-slate-700">
            
            {/* SUCCESS STATE */}
            {paymentSuccess ? (
              <div className="py-2 text-center space-y-6 max-w-xl mx-auto">
                {/* Hero Badge */}
                <div className="relative inline-block mx-auto mt-1">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-50">
                    <CheckCircle2 className="w-11 h-11 animate-bounce" />
                  </div>
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400 text-[9px] font-black uppercase tracking-wider shadow-xs border border-slate-700">
                    LUNAS
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-2xl font-black tracking-tight text-slate-900">
                    Pembayaran Berhasil!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {chargeData.orderId?.startsWith("WAPLY-ADDON") || isAddonMode ? (
                      <>
                        Terima kasih! Addon{" "}
                        <strong className="text-slate-900">
                          {selectedAddonIds
                            .map((id) => availableAddons.find((a) => a.id === id)?.name)
                            .filter(Boolean)
                            .join(", ") || "Top-Up Kuota"}
                        </strong>{" "}
                        telah aktif dan kuota langsung ditambahkan ke akun Anda.
                      </>
                    ) : (
                      <>
                        Terima kasih! Paket <strong className="text-slate-900">Waply {currentPlan.name}</strong> Anda telah aktif. Kuota pesan dan akses API gateway langsung dapat digunakan sekarang.
                      </>
                    )}
                  </p>
                </div>

                {/* Digital Receipt Card */}
                <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs space-y-3.5 text-left shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Total Pembayaran
                      </span>
                      <div className="text-2xl font-black text-emerald-600 font-mono">
                        {formatIDR(chargeData.grossAmount)}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      PAID
                    </span>
                  </div>

                  <div className="space-y-2 text-slate-600 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ID Pesanan:</span>
                      <span className="font-mono font-bold text-slate-800">{chargeData.orderId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">
                        {chargeData.orderId?.startsWith("WAPLY-ADDON") || isAddonMode ? "Item Addon:" : "Paket Layanan:"}
                      </span>
                      <strong className="text-emerald-700 font-bold">
                        {chargeData.orderId?.startsWith("WAPLY-ADDON") || isAddonMode ? (
                          selectedAddonIds
                            .map((id) => availableAddons.find((a) => a.id === id)?.name)
                            .filter(Boolean)
                            .join(", ") || "Top-Up Addon"
                        ) : (
                          `Waply ${currentPlan.name} (${
                            effectiveDurationMonths === 36
                              ? "3 Tahun"
                              : effectiveDurationMonths === 24
                              ? "2 Tahun"
                              : effectiveDurationMonths === 12
                              ? "1 Tahun"
                              : `${effectiveDurationMonths} Bulan`
                          })`
                        )}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Metode Pembayaran:</span>
                      <span className="font-semibold text-slate-800">
                        {chargeData.paymentType === "bank_transfer"
                          ? `Virtual Account ${chargeData.bank?.toUpperCase() || ""}`
                          : "QRIS / E-Wallet"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Waktu Aktivasi:</span>
                      <span className="font-medium text-slate-700">
                        {new Date().toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </span>
                    </div>
                  </div>

                  {customerEmail && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 font-medium">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Bukti bayar dan rincian invoice dikirimkan ke: <strong>{customerEmail}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Unlocked Benefits */}
                <div className="grid grid-cols-3 gap-2.5 text-[11px] font-bold">
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex flex-col items-center">
                    <Smartphone className="w-4 h-4 text-emerald-600 mb-1" />
                    <span>{currentPlan.maxDevices} Devices</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex flex-col items-center">
                    <MessageSquare className="w-4 h-4 text-sky-600 mb-1" />
                    <span>
                      {currentPlan.monthlyMessages === -1
                        ? "Unlimited"
                        : currentPlan.monthlyMessages.toLocaleString("id-ID")}{" "}
                      Pesan
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex flex-col items-center">
                    <Server className="w-4 h-4 text-primary mb-1" />
                    <span>REST API Siap</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/dashboard"
                    className="btn btn-primary rounded-xl text-white font-extrabold shadow-md shadow-primary/20 gap-2 text-sm px-8"
                  >
                    Buka Dashboard Gateway <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="btn btn-ghost btn-sm text-xs font-bold text-slate-500 hover:text-slate-800 self-center"
                  >
                    Lihat Invoice di Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              /* PENDING 2-COLUMN WIDE LAYOUT */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
                
                {/* LEFT COLUMN: Payment Method Display (QRIS / VA / Mandiri Bill) */}
                <div className="md:col-span-6 space-y-4">
                  
                  {/* 1. QRIS VIEW */}
                  {chargeData.paymentType === "qris" && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 text-center space-y-4 shadow-xs">
                      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl inline-block shadow-xs mx-auto">
                        {chargeData.qrCodeUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={chargeData.qrCodeUrl}
                            alt="QRIS Code Waply"
                            width={220}
                            height={220}
                            className="w-52 h-52 sm:w-56 sm:h-56 object-contain mx-auto rounded-xl"
                          />
                        ) : chargeData.qrString ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                              chargeData.qrString
                            )}`}
                            alt="QRIS Code Waply"
                            width={220}
                            height={220}
                            className="w-52 h-52 sm:w-56 sm:h-56 object-contain mx-auto rounded-xl"
                          />
                        ) : (
                          <div className="w-52 h-52 flex flex-col items-center justify-center bg-slate-100 rounded-xl text-xs text-slate-400 font-medium gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
                            Memuat QRIS...
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <QrCode className="w-3.5 h-3.5" /> QRIS Nasional (Semua Bank & E-Wallet)
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                          BCA Mobile, Livin Mandiri, BRImo, BNI, GoPay, OVO, DANA, atau ShopeePay.
                        </p>
                      </div>

                      {chargeData.qrCodeUrl && (
                        <div>
                          <a
                            href={chargeData.qrCodeUrl}
                            target="_blank"
                            rel="noreferrer"
                            download="QRIS-Waply.png"
                            className="btn btn-outline btn-xs gap-1.5 rounded-lg text-slate-700 font-bold hover:bg-slate-100"
                          >
                            <Download className="w-3.5 h-3.5" /> Unduh Gambar QRIS
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. VIRTUAL ACCOUNT VIEW (BCA, BRI, BNI, PERMATA, CIMB) */}
                  {chargeData.vaNumber && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-700" />
                          <span className="font-extrabold text-slate-800 text-sm">
                            {chargeData.bank?.toUpperCase() === "BCA" && "BCA Virtual Account"}
                            {chargeData.bank?.toUpperCase() === "BRI" && "BRI (BRIVA)"}
                            {chargeData.bank?.toUpperCase() === "BNI" && "BNI Virtual Account"}
                            {chargeData.bank?.toUpperCase() === "PERMATA" && "Permata Virtual Account"}
                            {chargeData.bank?.toUpperCase() === "CIMB" && "CIMB Virtual Account"}
                            {!["BCA", "BRI", "BNI", "PERMATA", "CIMB"].includes(chargeData.bank?.toUpperCase() || "") &&
                              `${chargeData.bank?.toUpperCase()} Virtual Account`}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase font-mono">
                          {chargeData.bank || "VA"}
                        </span>
                      </div>

                      {/* VA Display Box */}
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Nomor Virtual Account
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-900 select-all break-all leading-tight">
                          {formatVaNumber(chargeData.vaNumber)}
                        </div>
                      </div>

                      {/* Prominent Copy Button */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(chargeData.vaNumber!, "va")}
                        className={`btn btn-block rounded-xl font-extrabold gap-1.5 transition-all shadow-xs ${
                          copiedVa
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
                            : "btn-primary text-white"
                        }`}
                      >
                        {copiedVa ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedVa ? "Nomor VA Berhasil Disalin!" : "Salin Nomor Virtual Account"}
                      </button>
                    </div>
                  )}

                  {/* 3. MANDIRI BILL VIEW */}
                  {chargeData.billerCode && chargeData.billKey && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-600" />
                          <span className="font-extrabold text-slate-800 text-sm">Mandiri Bill Payment</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase font-mono">
                          MANDIRI
                        </span>
                      </div>

                      {/* Biller Code */}
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Kode Perusahaan (Biller Code)</div>
                          <div className="text-lg font-black font-mono text-slate-900">{chargeData.billerCode}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(chargeData.billerCode!, "va")}
                          className="btn btn-xs btn-outline rounded-lg text-slate-600 font-bold gap-1"
                        >
                          <Copy className="w-3 h-3" /> Salin
                        </button>
                      </div>

                      {/* Bill Key */}
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Nomor Pelanggan (Bill Key)</div>
                          <div className="text-lg font-black font-mono text-slate-900 select-all">{chargeData.billKey}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(chargeData.billKey!, "va")}
                          className="btn btn-xs btn-primary rounded-lg text-white font-bold gap-1"
                        >
                          <Copy className="w-3 h-3" /> Salin
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. GOPAY DEEPLINK */}
                  {chargeData.deeplinkUrl && (
                    <div className="text-center">
                      <a
                        href={chargeData.deeplinkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-block rounded-xl text-white font-extrabold shadow-md gap-2"
                      >
                        <Smartphone className="w-4 h-4" /> Buka Aplikasi GoPay Sekarang
                      </a>
                    </div>
                  )}

                  {/* Fallback if no specific payment details match */}
                  {chargeData.paymentType !== "qris" &&
                    !chargeData.vaNumber &&
                    !(chargeData.billerCode && chargeData.billKey) &&
                    !chargeData.deeplinkUrl && (
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                          <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Menyiapkan Rincian Pembayaran...</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                            Sedang memproses instruksi pembayaran dengan gateway perbankan. Silakan klik tombol verifikasi di bawah jika Anda telah melakukan transfer.
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Total Nominal + Panduan Pembayaran + Sync Status & Actions */}
                <div className="md:col-span-6 space-y-4">
                  
                  {/* Total Tagihan Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden shadow-xs border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Total Tagihan Pembayaran
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(chargeData.grossAmount.toString(), "amount")}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAmount ? "Tersalin" : "Salin Nominal"}</span>
                      </button>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">
                      {formatIDR(chargeData.grossAmount)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                      Transfer tepat sesuai nominal hingga 3 digit terakhir untuk verifikasi otomatis instan.
                    </p>
                  </div>

                  {/* Panduan Pembayaran Accordion */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/60">
                    <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-primary" /> Panduan Pembayaran
                      </span>
                      <div className="flex gap-1 bg-slate-200/60 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setActiveInstructionTab("mbanking")}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            activeInstructionTab === "mbanking"
                              ? "bg-white text-slate-900 shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          m-Banking
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveInstructionTab("ibanking")}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            activeInstructionTab === "ibanking"
                              ? "bg-white text-slate-900 shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Internet
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveInstructionTab("atm")}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            activeInstructionTab === "atm"
                              ? "bg-white text-slate-900 shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          ATM
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 text-xs text-slate-600 bg-white">
                      {/* BCA Instructions */}
                      {chargeData.bank?.toUpperCase() === "BCA" && (
                        <>
                          {activeInstructionTab === "mbanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Buka aplikasi <strong>BCA Mobile</strong> &gt; pilih <strong>m-BCA</strong>.</li>
                              <li>Pilih menu <strong>m-Transfer</strong> &gt; <strong>BCA Virtual Account</strong>.</li>
                              <li>Masukkan nomor Virtual Account di atas &gt; klik <strong>Send</strong>.</li>
                              <li>Periksa nama tagihan <strong>WAPLY</strong> dan nominal pembayaran.</li>
                              <li>Masukkan <strong>PIN m-BCA</strong> Anda. Pembayaran otomatis terverifikasi.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "ibanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Login ke <strong>KlikBCA Individual</strong>.</li>
                              <li>Pilih menu <strong>Transfer Dana</strong> &gt; <strong>Transfer ke BCA Virtual Account</strong>.</li>
                              <li>Masukkan nomor Virtual Account di atas lalu klik <strong>Lanjutkan</strong>.</li>
                              <li>Masukkan respon <strong>KeyBCA APPLI 1</strong> lalu klik <strong>Kirim</strong>.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "atm" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Masukkan <strong>Kartu ATM BCA</strong> & PIN Anda.</li>
                              <li>Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>Ke Rek BCA Virtual Account</strong>.</li>
                              <li>Masukkan nomor Virtual Account di atas lalu tekan <strong>Benar</strong>.</li>
                              <li>Konfirmasi rincian transaksi lalu selesaikan pembayaran.</li>
                            </ol>
                          )}
                        </>
                      )}

                      {/* Mandiri Instructions */}
                      {chargeData.bank?.toUpperCase() === "MANDIRI" && (
                        <>
                          {activeInstructionTab === "mbanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Buka aplikasi <strong>Livin&apos; by Mandiri</strong> & login.</li>
                              <li>Pilih menu <strong>Bayar</strong> &gt; cari penyedia jasa <strong>Midtrans / Waply</strong> ({chargeData.billerCode}).</li>
                              <li>Masukkan <strong>Nomor Pembayaran (Bill Key)</strong>: {chargeData.billKey}.</li>
                              <li>Periksa detail tagihan lalu masukkan <strong>PIN Livin&apos;</strong> Anda.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "ibanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Login ke <strong>Mandiri Online</strong>.</li>
                              <li>Pilih menu <strong>Bayar</strong> &gt; <strong>Multi Payment</strong>.</li>
                              <li>Pilih penyedia jasa <strong>Midtrans</strong> lalu masukkan Bill Key.</li>
                              <li>Konfirmasi dengan Token Mandiri Anda.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "atm" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Masukkan Kartu ATM Mandiri & PIN.</li>
                              <li>Pilih <strong>Bayar/Beli</strong> &gt; <strong>Lainnya</strong> &gt; <strong>Multi Payment</strong>.</li>
                              <li>Masukkan Kode Perusahaan ({chargeData.billerCode}) & Bill Key ({chargeData.billKey}).</li>
                              <li>Konfirmasi pembayaran lalu selesaikan transaksi.</li>
                            </ol>
                          )}
                        </>
                      )}

                      {/* BRI Instructions */}
                      {chargeData.bank?.toUpperCase() === "BRI" && (
                        <>
                          {activeInstructionTab === "mbanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Buka aplikasi <strong>BRImo</strong> & login akun Anda.</li>
                              <li>Pilih menu <strong>Tagihan / Pembayaran</strong> &gt; <strong>BRIVA</strong>.</li>
                              <li>Masukkan nomor BRIVA di atas lalu klik <strong>Lanjutkan</strong>.</li>
                              <li>Periksa nominal tagihan dan masukkan <strong>PIN BRImo</strong> Anda.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "ibanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Login ke <strong>Internet Banking BRI</strong>.</li>
                              <li>Pilih menu <strong>Pembayaran</strong> &gt; <strong>BRIVA</strong>.</li>
                              <li>Masukkan nomor BRIVA dan konfirmasi dengan m-Token.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "atm" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Masukkan Kartu ATM BRI & PIN.</li>
                              <li>Pilih <strong>Transaksi Lain</strong> &gt; <strong>Pembayaran</strong> &gt; <strong>Lainnya</strong> &gt; <strong>BRIVA</strong>.</li>
                              <li>Masukkan nomor BRIVA di atas lalu tekan <strong>Ya</strong> untuk konfirmasi.</li>
                            </ol>
                          )}
                        </>
                      )}

                      {/* BNI Instructions */}
                      {chargeData.bank?.toUpperCase() === "BNI" && (
                        <>
                          {activeInstructionTab === "mbanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Buka aplikasi <strong>BNI Mobile Banking</strong> & login.</li>
                              <li>Pilih menu <strong>Pembayaran</strong> &gt; <strong>Virtual Account Billing</strong>.</li>
                              <li>Pilih Tab <strong>Input Baru</strong> lalu masukkan nomor Virtual Account.</li>
                              <li>Konfirmasi transaksi dan masukkan <strong>Password Transaksi</strong>.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "ibanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Login ke <strong>BNI Internet Banking</strong>.</li>
                              <li>Pilih <strong>Transaksi</strong> &gt; <strong>Virtual Account Billing</strong>.</li>
                              <li>Masukkan nomor Virtual Account dan otorisasi dengan token BNI.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "atm" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Masukkan Kartu ATM BNI & PIN.</li>
                              <li>Pilih <strong>Menu Lain</strong> &gt; <strong>Pembayaran</strong> &gt; <strong>Menu Berikutnya</strong> &gt; <strong>Virtual Account Billing</strong>.</li>
                              <li>Masukkan nomor Virtual Account di atas lalu selesaikan transaksi.</li>
                            </ol>
                          )}
                        </>
                      )}

                      {/* Permata Instructions */}
                      {chargeData.bank?.toUpperCase() === "PERMATA" && (
                        <>
                          {activeInstructionTab === "mbanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Buka aplikasi <strong>PermataMobile X</strong> & login.</li>
                              <li>Pilih menu <strong>Bayar Tagihan</strong> &gt; <strong>Virtual Account</strong>.</li>
                              <li>Masukkan nomor Permata Virtual Account di atas.</li>
                              <li>Periksa total nominal dan konfirmasi dengan <strong>PIN Mobile Banking</strong>.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "ibanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Login ke <strong>PermataNet</strong>.</li>
                              <li>Pilih menu <strong>Pembayaran</strong> &gt; <strong>Virtual Account</strong>.</li>
                              <li>Masukkan nomor Virtual Account dan ikuti instruksi otorisasi token.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "atm" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Masukkan Kartu ATM Permata & PIN Anda.</li>
                              <li>Pilih <strong>Transaksi Lainnya</strong> &gt; <strong>Pembayaran</strong> &gt; <strong>Virtual Account</strong>.</li>
                              <li>Masukkan nomor Virtual Account di atas lalu selesaikan transaksi.</li>
                            </ol>
                          )}
                        </>
                      )}

                      {/* CIMB Niaga Instructions */}
                      {chargeData.bank?.toUpperCase() === "CIMB" && (
                        <>
                          {activeInstructionTab === "mbanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Buka aplikasi <strong>OCTO Mobile</strong> & login.</li>
                              <li>Pilih menu <strong>Transfer</strong> &gt; <strong>Rekening Ponsel / Virtual Account Lainnya</strong>.</li>
                              <li>Masukkan nomor CIMB Virtual Account di atas.</li>
                              <li>Periksa rincian tagihan lalu masukkan <strong>PIN OCTO Mobile</strong>.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "ibanking" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Login ke <strong>OCTO Clicks</strong>.</li>
                              <li>Pilih <strong>Bayar Tagihan</strong> &gt; <strong>Virtual Account</strong>.</li>
                              <li>Masukkan nomor Virtual Account dan konfirmasi SMS OTP.</li>
                            </ol>
                          )}
                          {activeInstructionTab === "atm" && (
                            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                              <li>Masukkan Kartu ATM CIMB Niaga & PIN Anda.</li>
                              <li>Pilih <strong>Pembayaran</strong> &gt; <strong>Lanjut</strong> &gt; <strong>Virtual Account</strong>.</li>
                              <li>Masukkan nomor Virtual Account lalu ikuti petunjuk pada layar.</li>
                            </ol>
                          )}
                        </>
                      )}

                      {/* Other / General VA Instructions */}
                      {!["BCA", "MANDIRI", "BRI", "BNI", "PERMATA", "CIMB"].includes(chargeData.bank?.toUpperCase() || "") &&
                        chargeData.paymentType !== "qris" && (
                          <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                            <li>Buka aplikasi m-Banking atau ATM bank Anda.</li>
                            <li>Pilih menu <strong>Transfer</strong> &gt; <strong>Ke Rekening Virtual Account</strong> (atau Bank Lain jika antar bank).</li>
                            <li>Masukkan nomor Virtual Account di atas dan pastikan nama penerima <strong>Waply Gateway</strong>.</li>
                            <li>Masukkan nominal tagihan tepat sesuai yang tertera di layar.</li>
                            <li>Selesaikan transaksi. Sistem akan memverifikasi secara otomatis dalam beberapa detik.</li>
                          </ol>
                        )}

                      {/* QRIS Instructions */}
                      {chargeData.paymentType === "qris" && (
                        <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                          <li>Buka aplikasi m-Banking atau E-Wallet (BCA Mobile, Livin, BRImo, BNI, GoPay, OVO, DANA, ShopeePay).</li>
                          <li>Pilih menu <strong>Scan QRIS / Bayar</strong>.</li>
                          <li>Arahkan kamera ke QR Code di samping (atau unduh gambar QRIS).</li>
                          <li>Pastikan nominal tagihan dan nama penerima <strong>Waply Gateway</strong> sesuai.</li>
                          <li>Konfirmasi pembayaran dan masukkan PIN transaksi Anda.</li>
                        </ol>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator Bar */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span className="font-bold text-slate-700">Menunggu Pembayaran</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Sinkronisasi Otomatis 3 Detik
                    </span>
                  </div>

                  {/* Feedback Notice */}
                  {syncNotice && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150 ${
                        syncNotice.type === "warning"
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : syncNotice.type === "error"
                          ? "bg-rose-50 border-rose-200 text-rose-900"
                          : "bg-sky-50 border-sky-200 text-sky-900"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                          <span>{syncNotice.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSyncNotice(null)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-black/5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {syncNotice.message}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1 gap-2.5">
                    <button
                      type="button"
                      disabled={syncChecking}
                      onClick={async () => {
                        setSyncChecking(true);
                        setSyncNotice(null);
                        try {
                          const res = await fetch("/api/billing/sync", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ orderId: chargeData.orderId }),
                          });
                          const json = await res.json();
                          if (json.success && json.data?.status === "PAID") {
                            setPaymentSuccess(true);
                          } else {
                            const currentStatus = json.data?.transactionStatus || json.data?.status || "PENDING";
                            setSyncNotice({
                              type: "warning",
                              title: `Status: ${currentStatus.toUpperCase()}`,
                              message:
                                "Pembayaran belum terdeteksi masuk. Jika Anda baru saja menyelesaikan transfer, mohon tunggu 5-10 detik agar sistem perbankan mengirim konfirmasi. Halaman otomatis beralih saat sukses.",
                            });
                          }
                        } catch {
                          setSyncNotice({
                            type: "error",
                            title: "Gagal Menghubungi Server",
                            message:
                              "Koneksi terputus saat memeriksa status. Sistem tetap mencoba sinkronisasi otomatis di latar belakang.",
                          });
                        } finally {
                          setSyncChecking(false);
                        }
                      }}
                      className="btn btn-outline btn-sm rounded-xl text-xs font-bold gap-1.5 flex-1 shadow-2xs hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      {syncChecking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Memeriksa Status...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Saya Sudah Bayar
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-ghost btn-sm text-xs text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Tutup / Bayar Nanti
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
