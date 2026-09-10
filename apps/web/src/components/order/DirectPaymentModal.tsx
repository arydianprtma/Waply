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
  const [activeInstructionTab, setActiveInstructionTab] = useState<"mbanking" | "ibanking" | "atm" | null>("mbanking");
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
      <div className="fixed inset-0 z-[99999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10 max-h-[92vh] flex flex-col overflow-hidden">
          {/* Modal Top Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl ${
                  paymentSuccess ? "bg-emerald-600" : "bg-gradient-to-tr from-emerald-600 to-teal-500"
                } text-white flex items-center justify-center font-black text-sm shadow-xs`}
              >
                {paymentSuccess ? <Check className="w-4 h-4" /> : "W"}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                  {paymentSuccess ? "Pembayaran Berhasil" : "Selesaikan Pembayaran"}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>Order: {chargeData.orderId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!paymentSuccess ? (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold font-mono">
                  <Clock className="w-3 h-3 text-rose-500 animate-pulse" />
                  <span>{timeRemaining}</span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* SUCCESS STATE */}
            {paymentSuccess ? (
              <div className="py-2 text-center space-y-5">
                {/* Celebration Hero Badge */}
                <div className="relative inline-block mx-auto mt-2">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-50">
                    <CheckCircle2 className="w-11 h-11 animate-bounce" />
                  </div>
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400 text-[9px] font-black uppercase tracking-wider shadow-sm border border-slate-700">
                    LUNAS
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-2xl font-black tracking-tight text-slate-900">
                    Pembayaran Berhasil!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {chargeData.orderId?.startsWith("WAPLY-ADDON") || isAddonMode ? (
                      <>
                        Terima kasih! Addon{" "}
                        <strong className="text-slate-900">
                          {selectedAddonIds
                            .map((id) => availableAddons.find((a) => a.id === id)?.name)
                            .filter(Boolean)
                            .join(", ") || "Top-Up Kuota"}
                        </strong>{" "}
                        Anda telah aktif dan kuota langsung ditambahkan ke akun Anda.
                      </>
                    ) : (
                      <>
                        Terima kasih! Paket <strong className="text-slate-900">Waply {currentPlan.name}</strong> Anda telah aktif. Kuota pesan & akses API gateway langsung dapat digunakan sekarang.
                      </>
                    )}
                  </p>
                </div>

                {/* Digital Receipt Card */}
                <div className="p-5 bg-slate-50/90 rounded-3xl border border-slate-200/90 text-xs space-y-3.5 text-left shadow-xs relative overflow-hidden">
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

                  {/* Email Notification Badge */}
                  {customerEmail && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 font-medium">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Rincian invoice & bukti bayar resmi dikirimkan ke Email: <strong>{customerEmail}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Unlocked Benefits Quick Pills */}
                {chargeData.orderId?.startsWith("WAPLY-ADDON") || isAddonMode ? (
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                    {(() => {
                      const addedDev = selectedAddonIds.reduce((sum, id) => {
                        const a = availableAddons.find((item) => item.id === id);
                        return sum + (a?.type === "DEVICE" ? a.amount : 0);
                      }, 0);
                      const addedMsg = selectedAddonIds.reduce((sum, id) => {
                        const a = availableAddons.find((item) => item.id === id);
                        return sum + (a?.type === "MESSAGES" ? a.amount : 0);
                      }, 0);

                      return (
                        <>
                          <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                            <span>{addedDev > 0 ? `+${addedDev} Device` : "Slot Perangkat"}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                            <MessageSquare className="w-3.5 h-3.5 text-sky-600 mb-0.5" />
                            <span>{addedMsg > 0 ? `+${addedMsg.toLocaleString("id-ID")} Pesan` : "Kuota Pesan"}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                            <Zap className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                            <span>Aktif Instan</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                    <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                      <span>{currentPlan.maxDevices} Devices</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-600 mb-0.5" />
                      <span>
                        {currentPlan.monthlyMessages === -1
                          ? "Unlimited"
                          : currentPlan.monthlyMessages.toLocaleString("id-ID")}{" "}
                        Pesan
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                      <Server className="w-3.5 h-3.5 text-primary mb-0.5" />
                      <span>REST API Siap</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <Link
                    href="/dashboard"
                    className="btn btn-primary btn-block rounded-2xl text-white font-extrabold shadow-lg shadow-primary/25 gap-2 text-sm"
                  >
                    Buka Dashboard Gateway <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="btn btn-ghost btn-sm text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Lihat Riwayat & Invoice di Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              /* PENDING / INSTRUCTIONS STATE */
              <div className="space-y-5">
                {/* Expiry Mobile Banner */}
                <div className="sm:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-500" /> Batas Waktu Bayar:
                  </span>
                  <span className="font-mono text-sm">{timeRemaining}</span>
                </div>

                {/* Total Amount Box */}
                <div className="p-4 bg-slate-900 rounded-2xl text-white relative overflow-hidden shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Total Tagihan Pembayaran
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(chargeData.grossAmount.toString(), "amount")}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedAmount ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedAmount ? "Nominal Tersalin" : "Salin Nominal"}
                    </button>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
                    {formatIDR(chargeData.grossAmount)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Transfer tepat sesuai nominal hingga digit terakhir untuk verifikasi instan.
                  </p>
                </div>

                {/* 1. QRIS VIEW */}
                {chargeData.paymentType === "qris" && (
                  <div className="space-y-4 text-center">
                    <div className="p-5 bg-white border-2 border-slate-200 rounded-3xl inline-block shadow-md mx-auto relative group">
                      {chargeData.qrCodeUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={chargeData.qrCodeUrl}
                          alt="QRIS Code Waply"
                          width={224}
                          height={224}
                          className="w-56 h-56 object-contain mx-auto rounded-xl"
                        />
                      ) : chargeData.qrString ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                            chargeData.qrString
                          )}`}
                          alt="QRIS Code Waply"
                          width={224}
                          height={224}
                          className="w-56 h-56 object-contain mx-auto rounded-xl"
                        />
                      ) : (
                        <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-100 rounded-xl text-xs text-slate-400 font-medium gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                          Memuat QRIS...
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <QrCode className="w-3.5 h-3.5" /> QRIS Nasional (Semua Bank & E-Wallet)
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Buka BCA Mobile, Livin Mandiri, BRImo, BNI Mobile, GoPay, OVO, Dana, atau ShopeePay lalu scan QR di atas.
                      </p>
                    </div>

                    {chargeData.qrCodeUrl && (
                      <a
                        href={chargeData.qrCodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        download="QRIS-Waply.png"
                        className="btn btn-outline btn-xs gap-1.5 rounded-xl text-slate-700 font-bold"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh Gambar QRIS
                      </a>
                    )}
                  </div>
                )}

                {/* 2. VIRTUAL ACCOUNT VIEW (BCA, BRI, BNI, PERMATA) */}
                {chargeData.vaNumber && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-600" />
                          <span className="font-extrabold text-slate-800">
                            {chargeData.bank?.toUpperCase() === "BCA" && "BCA Virtual Account"}
                            {chargeData.bank?.toUpperCase() === "BRI" && "BRI (BRIVA)"}
                            {chargeData.bank?.toUpperCase() === "BNI" && "BNI Virtual Account"}
                            {chargeData.bank?.toUpperCase() === "PERMATA" && "Permata Virtual Account"}
                            {chargeData.bank?.toUpperCase() === "CIMB" && "CIMB Virtual Account"}
                            {!["BCA", "BRI", "BNI", "PERMATA", "CIMB"].includes(chargeData.bank?.toUpperCase() || "") &&
                              `${chargeData.bank?.toUpperCase()} Virtual Account`}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase font-mono">
                          {chargeData.bank || "VA"}
                        </span>
                      </div>

                      {/* VA Display Box */}
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Nomor Virtual Account
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-900 select-all break-all leading-tight">
                          {formatVaNumber(chargeData.vaNumber)}
                        </div>
                      </div>

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(chargeData.vaNumber!, "va")}
                        className={`btn btn-sm btn-block rounded-xl font-extrabold gap-1.5 transition-all shadow-xs ${
                          copiedVa
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
                            : "btn-primary text-white"
                        }`}
                      >
                        {copiedVa ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedVa ? "Nomor VA Berhasil Disalin!" : "Salin Nomor Virtual Account"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. MANDIRI BILL VIEW */}
                {chargeData.billerCode && chargeData.billKey && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-600" />
                          <span className="font-extrabold text-slate-800">Mandiri Bill Payment</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase font-mono">
                          MANDIRI
                        </span>
                      </div>

                      {/* Biller Code */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
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
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
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
                  </div>
                )}

                {/* 4. GOPAY DEEPLINK VIEW */}
                {chargeData.deeplinkUrl && (
                  <div className="pt-2 text-center space-y-3">
                    <a
                      href={chargeData.deeplinkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-block rounded-2xl text-white font-extrabold shadow-md gap-2"
                    >
                      <Smartphone className="w-4 h-4" /> Buka Aplikasi GoPay Sekarang
                    </a>
                  </div>
                )}

                {/* COLLAPSIBLE PAYMENT INSTRUCTIONS ACCORDION */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                  <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-primary" /> Panduan Cara Pembayaran
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveInstructionTab("mbanking")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          activeInstructionTab === "mbanking"
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        m-Banking
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveInstructionTab("ibanking")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          activeInstructionTab === "ibanking"
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Internet
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveInstructionTab("atm")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          activeInstructionTab === "atm"
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ATM
                      </button>
                    </div>
                  </div>

                  <div className="p-4 text-xs text-slate-600 bg-white">
                    {/* BCA Instructions */}
                    {chargeData.bank?.toUpperCase() === "BCA" && (
                      <>
                        {activeInstructionTab === "mbanking" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Buka aplikasi <strong>BCA Mobile</strong> & login m-BCA.</li>
                            <li>Pilih menu <strong>m-Transfer</strong> &gt; <strong>BCA Virtual Account</strong>.</li>
                            <li>Masukkan nomor Virtual Account di atas & klik <strong>Send</strong>.</li>
                            <li>Periksa nama penerima <strong>WAPLY / MIDTRANS</strong> dan total nominal.</li>
                            <li>Masukkan <strong>PIN m-BCA</strong> Anda. Transaksi selesai & gateway langsung aktif.</li>
                          </ol>
                        )}
                        {activeInstructionTab === "ibanking" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Login ke <strong>KlikBCA Individual</strong> (https://ibank.klikbca.com).</li>
                            <li>Pilih menu <strong>Transfer Dana</strong> &gt; <strong>Transfer ke BCA Virtual Account</strong>.</li>
                            <li>Masukkan nomor Virtual Account di atas lalu klik <strong>Lanjutkan</strong>.</li>
                            <li>Masukkan respon <strong>KeyBCA APPLI 1</strong> lalu klik <strong>Kirim</strong>.</li>
                          </ol>
                        )}
                        {activeInstructionTab === "atm" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Masukkan <strong>Kartu ATM BCA</strong> & PIN Anda.</li>
                            <li>Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>Ke Rek BCA Virtual Account</strong>.</li>
                            <li>Masukkan nomor Virtual Account di atas lalu tekan <strong>Benar</strong>.</li>
                            <li>Konfirmasi jumlah dan rincian transaksi lalu selesaikan pembayaran.</li>
                          </ol>
                        )}
                      </>
                    )}

                    {/* Mandiri Instructions */}
                    {chargeData.bank?.toUpperCase() === "MANDIRI" && (
                      <>
                        {activeInstructionTab === "mbanking" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Buka aplikasi <strong>Livin&apos; by Mandiri</strong> & login.</li>
                            <li>Pilih menu <strong>Bayar</strong> &gt; cari <strong>Midtrans / Waply</strong> (Kode: {chargeData.billerCode}).</li>
                            <li>Masukkan <strong>Bill Key / Nomor Pembayaran</strong>: {chargeData.billKey}.</li>
                            <li>Konfirmasi detail pembayaran lalu masukkan <strong>PIN Livin&apos;</strong> Anda.</li>
                          </ol>
                        )}
                        {activeInstructionTab === "ibanking" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Login ke <strong>Mandiri Online</strong>.</li>
                            <li>Pilih menu <strong>Bayar</strong> &gt; <strong>Multi Payment</strong>.</li>
                            <li>Pilih penyedia jasa <strong>Midtrans</strong> lalu masukkan Bill Key.</li>
                            <li>Konfirmasi dengan Token Mandiri Anda.</li>
                          </ol>
                        )}
                        {activeInstructionTab === "atm" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Masukkan Kartu ATM Mandiri & PIN.</li>
                            <li>Pilih <strong>Bayar/Beli</strong> &gt; <strong>Lainnya</strong> &gt; <strong>Multi Payment</strong>.</li>
                            <li>Masukkan Kode Perusahaan ({chargeData.billerCode}) & Bill Key ({chargeData.billKey}).</li>
                            <li>Konfirmasi pembayaran lalu tekan <strong>Ya</strong>.</li>
                          </ol>
                        )}
                      </>
                    )}

                    {/* BRI Instructions */}
                    {chargeData.bank?.toUpperCase() === "BRI" && (
                      <>
                        {activeInstructionTab === "mbanking" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Buka aplikasi <strong>BRImo</strong> & login.</li>
                            <li>Pilih menu <strong>Tagihan / Pembayaran</strong> &gt; <strong>BRIVA</strong>.</li>
                            <li>Masukkan nomor BRIVA di atas lalu klik <strong>Lanjutkan</strong>.</li>
                            <li>Periksa data transaksi dan masukkan <strong>PIN BRImo</strong> Anda.</li>
                          </ol>
                        )}
                        {activeInstructionTab === "ibanking" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Login ke <strong>Internet Banking BRI</strong>.</li>
                            <li>Pilih menu <strong>Pembayaran</strong> &gt; <strong>BRIVA</strong>.</li>
                            <li>Masukkan nomor BRIVA dan konfirmasi dengan token m-Token.</li>
                          </ol>
                        )}
                        {activeInstructionTab === "atm" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
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
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Buka aplikasi <strong>BNI Mobile Banking</strong> & login.</li>
                            <li>Pilih menu <strong>Pembayaran</strong> &gt; <strong>Virtual Account Billing</strong>.</li>
                            <li>Pilih Tab <strong>Input Baru</strong> lalu masukkan nomor Virtual Account.</li>
                            <li>Konfirmasi transaksi dan masukkan <strong>Password Transaksi</strong>.</li>
                          </ol>
                        )}
                        {activeInstructionTab === "ibanking" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Login ke <strong>BNI Internet Banking</strong>.</li>
                            <li>Pilih <strong>Transaksi</strong> &gt; <strong>Virtual Account Billing</strong>.</li>
                            <li>Masukkan nomor Virtual Account dan otorisasi dengan token BNI.</li>
                          </ol>
                        )}
                        {activeInstructionTab === "atm" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Masukkan Kartu ATM BNI & PIN.</li>
                            <li>Pilih <strong>Menu Lain</strong> &gt; <strong>Pembayaran</strong> &gt; <strong>Menu Berikutnya</strong> &gt; <strong>Virtual Account Billing</strong>.</li>
                            <li>Masukkan nomor Virtual Account di atas lalu selesaikan transaksi.</li>
                          </ol>
                        )}
                      </>
                    )}

                    {/* QRIS Instructions */}
                    {chargeData.paymentType === "qris" && (
                      <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                        <li>Buka aplikasi mobile banking atau e-wallet pilihan Anda (BCA Mobile, Livin&apos;, BRImo, GoPay, OVO, Dana, dll).</li>
                        <li>Pilih menu <strong>Scan QRIS / Bayar</strong>.</li>
                        <li>Arahkan kamera ke QR Code di atas (atau unggah dari galeri jika diunduh).</li>
                        <li>Periksa nominal tagihan & nama merchant <strong>Waply Gateway</strong>.</li>
                        <li>Konfirmasi dan masukkan PIN transaksi Anda. Verifikasi akan terdeteksi otomatis dalam 1-3 detik.</li>
                      </ol>
                    )}
                  </div>
                </div>

                {/* Status Indicator Bar */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="font-bold text-slate-700">Menunggu Pembayaran...</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Sinkronisasi Otomatis Tiap 3 Detik
                  </span>
                </div>

                {/* In-Modal Feedback Notice */}
                {syncNotice && (
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150 ${
                      syncNotice.type === "warning"
                        ? "bg-amber-50/90 border-amber-200 text-amber-900"
                        : syncNotice.type === "error"
                        ? "bg-rose-50/90 border-rose-200 text-rose-900"
                        : "bg-sky-50/90 border-sky-200 text-sky-900"
                    }`}
                  >
                    <div className="flex items-center justify-between font-extrabold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
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

                {/* Manual Action Buttons */}
                <div className="flex items-center justify-between pt-1 gap-2">
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
                              "Pembayaran belum terverifikasi oleh gateway. Jika Anda baru saja menyelesaikan transfer, mohon tunggu 5-15 detik agar sistem perbankan mengirim webhook konfirmasi ke gateway. Halaman akan otomatis beralih setelah lunas.",
                          });
                        }
                      } catch {
                        setSyncNotice({
                          type: "error",
                          title: "Gagal Menghubungi Server",
                          message:
                            "Koneksi terputus saat memeriksa status. Sistem tetap akan mencoba sinkronisasi otomatis di latar belakang.",
                        });
                      } finally {
                        setSyncChecking(false);
                      }
                    }}
                    className="btn btn-outline btn-sm rounded-xl text-xs font-bold gap-1.5 flex-1 shadow-xs"
                  >
                    {syncChecking ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Memeriksa...
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
                    className="btn btn-ghost btn-sm text-xs text-slate-400 hover:text-slate-700 font-semibold"
                  >
                    Tutup / Bayar Nanti
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
