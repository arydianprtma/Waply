"use client";

import { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface ConnectDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConnectDeviceModal({
  isOpen,
  onClose,
  onSuccess,
}: ConnectDeviceModalProps) {
  const [deviceName, setDeviceName] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("IDLE");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setQrDataUrl(null);
    setStatus("INITIALIZING");

    const newSessionId = `dev_${Date.now()}`;
    setSessionId(newSessionId);

    try {
      const res = await fetch("/api/gateway/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newSessionId, name: deviceName }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Gagal menginisialisasi sesi WhatsApp");
      }

      setStatus("WAITING_QR");
      startPolling(newSessionId);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("IDLE");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (sid: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/gateway/sessions/${sid}/qr`);
        const json = await res.json();

        if (json.success && json.data) {
          if (json.data.qrDataUrl) {
            setQrDataUrl(json.data.qrDataUrl);
          }

          if (json.data.status === "CONNECTED") {
            setStatus("CONNECTED");
            clearInterval(pollIntervalRef.current!);

            // Fetch session info to get phoneNumber
            const infoRes = await fetch(`/api/gateway/sessions/${sid}/status`);
            const infoJson = await infoRes.json();
            if (infoJson.success && infoJson.data?.phoneNumber) {
              setPhoneNumber(infoJson.data.phoneNumber);
            }

            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        }
      } catch (err) {
        console.error("Error polling QR status:", err);
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleModalClose = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setSessionId(null);
    setQrDataUrl(null);
    setStatus("IDLE");
    setPhoneNumber(null);
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
        <div className="card w-full max-w-lg bg-base-100 shadow-2xl border border-base-300 relative">
          {/* Close Button */}
          <button
            onClick={handleModalClose}
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/60"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="card-body p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Hubungkan WhatsApp</h2>
                <p className="text-xs text-base-content/60">
                  Scan QR Code menggunakan WhatsApp di ponsel Anda
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="alert alert-error text-xs py-2 my-3">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {status === "IDLE" && (
              <form onSubmit={startConnect} className="space-y-4 mt-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nama Perangkat / Label</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: CS Toko Online, Notifikasi Order"
                    className="input input-bordered w-full"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">
                      Beri nama untuk memudahkan identifikasi nomor di dashboard.
                    </span>
                  </label>
                </div>

                <div className="p-3.5 rounded-xl bg-base-200/60 border border-base-300 text-xs text-base-content/70 space-y-1">
                  <div className="font-semibold text-base-content flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Anti-Ban Warmup Mode Aktif:
                  </div>
                  <p className="text-[11px]">
                    Nomor baru akan otomatis dibatasi (Stage 1: Maks. 30 pesan/hari) dengan jeda pengetikan alami (4-12 detik).
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block gap-2 shadow-md shadow-primary/25 mt-4"
                  disabled={loading || !deviceName.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan Sesi...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Tampilkan QR Code
                    </>
                  )}
                </button>
              </form>
            )}

            {(status === "INITIALIZING" || status === "WAITING_QR") && (
              <div className="text-center py-6 space-y-4">
                {qrDataUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-primary/30 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64 rounded-lg object-contain"
                      />
                    </div>
                    <p className="text-xs font-semibold text-base-content/70 mt-4 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      Menunggu scan dari WhatsApp di ponsel...
                    </p>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                    <p className="text-sm font-semibold">Menghasilkan QR Code autentikasi Sendora Engine...</p>
                    <p className="text-xs text-base-content/50 mt-1">Harap tunggu beberapa detik.</p>
                  </div>
                )}

                <div className="text-xs text-base-content/60 text-left bg-base-200/50 p-3 rounded-xl space-y-1">
                  <div className="font-semibold text-base-content">Langkah-langkah Scan:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                    <li>Buka WhatsApp di ponsel Anda.</li>
                    <li>Ketuk Menu (titik tiga) atau Pengaturan &gt; <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                    <li>Ketuk <strong>Tautkan Perangkat (Link a Device)</strong> dan arahkan kamera ke QR Code di atas.</li>
                  </ol>
                </div>
              </div>
            )}

            {status === "CONNECTED" && (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-success">WhatsApp Berhasil Terhubung!</h3>
                {phoneNumber && (
                  <p className="text-sm font-semibold text-base-content/80">
                    Nomor: +{phoneNumber}
                  </p>
                )}
                <p className="text-xs text-base-content/50">
                  Sesi telah disimpan secara persisten. Menutup dialog...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
