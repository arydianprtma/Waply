"use client";

import { useState, useEffect } from "react";
import { useConfirm, useAlert } from "@/components/confirm-dialog";
import {
  Smartphone,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Flame,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Send,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { ConnectDeviceModal } from "@/components/devices/ConnectDeviceModal";

interface SessionData {
  id: string;
  name: string;
  phoneNumber?: string;
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "BANNED_DETECTED";
  lastConnectedAt?: string;
  lastError?: string;
}

interface DeviceLimitInfo {
  maxDevices: number;
  currentCount: number;
  canAddMore: boolean;
  planName: string;
  planId: string;
}

export default function DevicesPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [limit, setLimit] = useState<DeviceLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const confirm = useConfirm();
  const showAlert = useAlert();

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/gateway/sessions");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSessions(json.data);
      }
      if (json.limit) {
        setLimit(json.limit);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenConnect = async () => {
    if (limit && !limit.canAddMore) {
      await showAlert({
        title: "Batas WhatsApp Device Penuh",
        message: `Paket Anda saat ini (${limit.planName}) hanya mendukung maksimal ${limit.maxDevices} WhatsApp Device. Silakan upgrade paket Anda untuk menghubungkan device tambahan.`,
        variant: "warning",
      });
      return;
    }
    setModalOpen(true);
  };

  const handleDisconnect = async (sessionId: string) => {
    const isConfirmed = await confirm({
      title: "Putuskan Perangkat WhatsApp",
      message: "Apakah Anda yakin ingin memutuskan dan menghapus sesi nomor WhatsApp ini dari gateway?",
      confirmText: "Ya, Putuskan Sesi",
      variant: "danger",
    });
    if (!isConfirmed) return;

    setActionLoading(sessionId);
    try {
      await fetch(`/api/gateway/sessions/${sessionId}`, { method: "DELETE" });
      await fetchSessions();
    } catch (err) {
      await showAlert({
        title: "Gagal Memutuskan Sesi",
        message: (err as Error).message || "Terjadi kesalahan pada jaringan",
        variant: "danger",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const isLimitReached = Boolean(limit && !limit.canAddMore);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">WhatsApp Devices</h1>
            {limit && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isLimitReached
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                {sessions.length} / {limit.maxDevices} Device ({limit.planName})
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Kelola nomor WhatsApp yang terhubung ke Sendora WhatsApp Gateway Engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="btn btn-ghost btn-sm gap-1.5 text-slate-600 hover:text-slate-900 px-2.5"
            title="Muat ulang daftar device"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs">Refresh</span>
          </button>

          {isLimitReached ? (
            <Link
              href="/dashboard/billing"
              className="btn btn-outline btn-sm gap-1.5 border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-xs"
            >
              <span>Tambah Slot Device</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : null}

          <button
            onClick={handleOpenConnect}
            className="btn btn-primary btn-sm gap-1.5 shadow-sm shadow-primary/20 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Connect WhatsApp Baru
          </button>
        </div>
      </div>

      {/* Limit Alert Card (Antislop Clean Alert) */}
      {isLimitReached && limit && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Batas Slot Perangkat Tercapai ({limit.maxDevices} dari {limit.maxDevices} Device)
              </p>
              <p className="text-xs text-amber-700/90 mt-0.5">
                Anda telah menggunakan seluruh kuota slot WhatsApp pada paket <strong>{limit.planName}</strong>. Upgrade ke paket yang lebih tinggi untuk menambah kuota device.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className="btn btn-sm bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs rounded-xl self-start sm:self-auto shrink-0 shadow-xs"
          >
            Lihat Pilihan Paket
          </Link>
        </div>
      )}

      {/* Device List Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Memuat daftar perangkat WhatsApp...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white border border-slate-200/90 p-12 text-center rounded-2xl shadow-sm max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Belum Ada WhatsApp Terhubung</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            Hubungkan nomor WhatsApp Anda untuk mulai mengirim pesan, broadcast, dan mengaktifkan bot auto-reply otomatis.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary btn-sm md:btn-md gap-2 shadow-sm shadow-primary/20 mx-auto mt-5"
          >
            <QrCode className="w-4 h-4" /> Hubungkan via Scan QR
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((device) => {
            const rawStatus = String(device.status || "").toUpperCase();
            const isConnected = rawStatus === "CONNECTED";
            const isBanned = rawStatus === "BANNED_DETECTED";
            const isConnecting = rawStatus === "CONNECTING";

            return (
              <div
                key={device.id}
                className="bg-white border border-slate-200/90 hover:border-emerald-500/60 shadow-sm hover:shadow-md transition-all rounded-2xl p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Device Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          isConnected
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                            : isBanned
                            ? "bg-rose-50 text-rose-600 border-rose-200/60"
                            : "bg-amber-50 text-amber-600 border-amber-200/60"
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base font-mono truncate">
                          {device.phoneNumber ? `+${device.phoneNumber.replace(/^\+/, "")}` : device.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono truncate">{device.name}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 border ${
                        isConnected
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isBanned
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConnected
                            ? "bg-emerald-500 animate-pulse"
                            : isConnecting
                            ? "bg-amber-500 animate-ping"
                            : "bg-rose-500"
                        }`}
                      />
                      {isConnected ? "Connected" : isConnecting ? "Connecting" : isBanned ? "Banned" : "Disconnected"}
                    </span>
                  </div>

                  {/* Device Spec / Status Items */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Status Warmup:</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-emerald-600" /> Stage 1 (Cold)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Safety Delay:</span>
                      <span className="font-semibold text-slate-800">4 – 12 detik</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Session ID:</span>
                      <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                        {device.id}
                      </code>
                    </div>
                    {device.lastConnectedAt && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Waktu Terhubung:</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(device.lastConnectedAt).toLocaleTimeString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href="/dashboard/messages/send"
                    className="btn btn-ghost btn-xs text-slate-700 hover:text-emerald-700 gap-1.5 font-medium"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim Pesan
                  </Link>

                  <button
                    onClick={() => handleDisconnect(device.id)}
                    disabled={actionLoading === device.id}
                    className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 gap-1 font-medium"
                  >
                    {actionLoading === device.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Device Slot Card (If user still has available slots) */}
          {!isLimitReached && (
            <div
              onClick={handleOpenConnect}
              className="border-2 border-dashed border-slate-200/90 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[220px] group shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-emerald-400 group-hover:bg-emerald-600 group-hover:text-white text-slate-500 flex items-center justify-center transition-all mb-3 shadow-xs">
                <Plus className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-800">
                Tambah Device WhatsApp
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Scan QR code baru untuk mengaktifkan slot nomor WhatsApp tambahan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Connect Modal */}
      <ConnectDeviceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchSessions();
        }}
      />
    </div>
  );
}

