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
} from "lucide-react";
import { ConnectDeviceModal } from "@/components/devices/ConnectDeviceModal";

interface SessionData {
  id: string;
  name: string;
  phoneNumber?: string;
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "BANNED_DETECTED";
  lastConnectedAt?: string;
  lastError?: string;
}

export default function DevicesPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
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

  const handleDisconnect = async (sessionId: string) => {
    const isConfirmed = await confirm({
      title: "Putuskan Perangkat",
      message: "Apakah Anda yakin ingin memutuskan dan menghapus sesi WhatsApp ini?",
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Devices</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Kelola nomor WhatsApp yang terhubung ke gateway Baileys Sendora.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-primary gap-2 shadow-md shadow-primary/25"
        >
          <Plus className="w-4 h-4" />
          Connect WhatsApp Baru
        </button>
      </div>

      {/* Device List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-base-content/60">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Memuat daftar device dari Gateway...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="card bg-base-100 border border-base-200 p-12 text-center rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-4 text-base-content/40">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg">Belum Ada WhatsApp Terhubung</h3>
          <p className="text-sm text-base-content/60 mt-1 max-w-md mx-auto">
            Hubungkan nomor WhatsApp pertama Anda untuk mulai mengirim pesan via API dan mengaktifkan automasi.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary btn-sm md:btn-md gap-2 shadow-md shadow-primary/25 mx-auto mt-6"
          >
            <Plus className="w-4 h-4" /> Hubungkan Sekarang (Scan QR)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((device) => {
            const isConnected = device.status === "CONNECTED";
            const isBanned = device.status === "BANNED_DETECTED";

            return (
              <div
                key={device.id}
                className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-6 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                          isConnected
                            ? "bg-emerald-500/15 text-emerald-600"
                            : isBanned
                            ? "bg-rose-500/15 text-rose-600"
                            : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">
                          {device.phoneNumber ? `+${device.phoneNumber}` : device.name}
                        </h3>
                        <p className="text-xs text-base-content/60">{device.name}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                        isConnected
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
                          : isBanned
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25"
                      }`}
                    >
                      {device.status}
                    </span>
                  </div>

                  <div className="divider my-4"></div>

                  <div className="space-y-2.5 text-xs text-base-content/70">
                    <div className="flex justify-between">
                      <span>Status Warmup:</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> Stage 1 (Cold)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Safety Delay:</span>
                      <span className="font-semibold">4 – 12 detik</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Session ID:</span>
                      <code className="bg-base-200 px-2 py-0.5 rounded text-[11px] font-mono">
                        {device.id}
                      </code>
                    </div>
                    {device.lastConnectedAt && (
                      <div className="flex justify-between">
                        <span>Terhubung Pada:</span>
                        <span className="font-semibold">
                          {new Date(device.lastConnectedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-actions justify-end mt-6 gap-2">
                  <button
                    onClick={() => handleDisconnect(device.id)}
                    disabled={actionLoading === device.id}
                    className="btn btn-xs btn-error btn-outline gap-1 px-3"
                  >
                    {actionLoading === device.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
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
