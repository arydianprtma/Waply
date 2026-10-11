"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

export interface ReconnectDeviceData {
  id: string;
  name: string;
  phoneNumber?: string;
}

interface ConnectDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reconnectDevice?: ReconnectDeviceData | null;
}

export function ConnectDeviceModal({
  isOpen,
  onClose,
  onSuccess,
  reconnectDevice,
}: ConnectDeviceModalProps) {
  const [deviceName, setDeviceName] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("IDLE");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((sid: string) => {
    stopPolling();

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
            stopPolling();

            // Fetch session info to get phoneNumber
            const infoRes = await fetch(`/api/gateway/sessions/${sid}/status`);
            const infoJson = await infoRes.json();
            if (infoJson.success && infoJson.data?.phoneNumber) {
              setPhoneNumber(infoJson.data.phoneNumber);
            }

            setTimeout(() => {
              if (onSuccessRef.current) {
                onSuccessRef.current();
              }
            }, 1800);
          }
        }
      } catch (err) {
        console.error("Error polling QR status:", err);
      }
    }, 1500);
  }, [stopPolling]);

  const initSession = useCallback(async (sid: string, name: string, isReconnect: boolean, phone?: string) => {
    setLoading(true);
    setErrorMsg(null);
    setQrDataUrl(null);
    setStatus("INITIALIZING");
    setSessionId(sid);
    if (phone) setPhoneNumber(phone);

    try {
      const res = await fetch("/api/gateway/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sid,
          name: name || "WhatsApp Device",
          reconnect: isReconnect,
          phoneNumber: phone,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Gagal menginisialisasi sesi WhatsApp");
      }

      setStatus("WAITING_QR");
      startPolling(sid);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("IDLE");
    } finally {
      setLoading(false);
    }
  }, [startPolling]);

  useEffect(() => {
    if (isOpen) {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      if (reconnectDevice) {
        const targetName = reconnectDevice.name || "WhatsApp Device";
        setDeviceName(targetName);
        setSessionId(reconnectDevice.id);
        setPhoneNumber(reconnectDevice.phoneNumber || null);
        initSession(
          reconnectDevice.id,
          targetName,
          true,
          reconnectDevice.phoneNumber
        );
      } else {
        setDeviceName("");
        setSessionId(null);
        setPhoneNumber(null);
        setQrDataUrl(null);
        setStatus("IDLE");
        setErrorMsg(null);
      }
    } else {
      hasInitializedRef.current = false;
      stopPolling();
    }
  }, [isOpen, reconnectDevice?.id]);

  useEffect(() => {
    return () => {
      hasInitializedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const handleModalClose = () => {
    hasInitializedRef.current = false;
    stopPolling();
    setSessionId(null);
    setQrDataUrl(null);
    setStatus("IDLE");
    setPhoneNumber(null);
    setErrorMsg(null);
    onClose();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) return;
    const newSessionId = `dev_${Date.now()}`;
    await initSession(newSessionId, deviceName.trim(), false);
  };

  const handleRetry = () => {
    if (sessionId) {
      initSession(sessionId, deviceName, Boolean(reconnectDevice), phoneNumber || undefined);
    }
  };

  if (!isOpen) return null;

  const isReconnectMode = Boolean(reconnectDevice);
  const displayPhone = phoneNumber || reconnectDevice?.phoneNumber;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
        <div className="card w-full max-w-lg bg-base-100 shadow-2xl border border-base-300 relative max-h-[92vh] overflow-y-auto">
          {/* Close Button with 44px min touch target */}
          <button
            onClick={handleModalClose}
            className="btn btn-ghost btn-circle w-11 h-11 min-w-[44px] min-h-[44px] absolute right-3 top-3 text-base-content/60 hover:text-base-content"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="card-body p-6 md:p-8">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-2 pr-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                {isReconnectMode ? (
                  <RefreshCw className="w-5 h-5 text-primary" />
                ) : (
                  <Smartphone className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">
                  {isReconnectMode ? "Hubungkan Ulang WhatsApp" : "Hubungkan WhatsApp"}
                </h2>
                <p className="text-xs text-base-content/70 mt-0.5 truncate">
                  {isReconnectMode
                    ? displayPhone
                      ? `Scan QR untuk nomor: +${displayPhone.replace(/^\+/, "")}`
                      : `Scan QR untuk perangkat: ${deviceName || "Device"}`
                    : "Scan QR Code menggunakan WhatsApp di ponsel Anda"}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="alert alert-error text-xs py-2.5 my-2 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{errorMsg}</span>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="btn btn-xs btn-outline min-h-[32px] font-semibold"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Reconnect Banner info */}
            {isReconnectMode && displayPhone && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  Target Nomor:{" "}
                  <strong className="font-mono text-emerald-950 font-bold">
                    +{displayPhone.replace(/^\+/, "")}
                  </strong>{" "}
                  ({deviceName})
                </div>
              </div>
            )}

            {/* IDLE state for new device creation */}
            {status === "IDLE" && !isReconnectMode && (
              <form onSubmit={handleFormSubmit} className="space-y-4 mt-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-xs text-slate-700">
                      Nama Perangkat / Label
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: CS Toko Online, Notifikasi Order"
                    className="input input-bordered w-full h-11 text-sm"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/50 text-[11px]">
                      Beri label untuk memudahkan identifikasi nomor di dashboard.
                    </span>
                  </label>
                </div>

                <div className="p-3.5 rounded-xl bg-base-200/60 border border-base-300 text-xs text-base-content/70 space-y-1">
                  <div className="font-semibold text-base-content flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Anti-Ban Warmup Mode Aktif
                  </div>
                  <p className="text-[11px]">
                    Nomor baru otomatis dibatasi bertahap berbasis kuota harian dengan jeda pengetikan alami (4-12 detik).
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block min-h-[44px] h-11 gap-2 shadow-sm shadow-primary/25 mt-4"
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

            {/* INITIALIZING / WAITING_QR state */}
            {(status === "INITIALIZING" || status === "WAITING_QR") && (
              <div className="text-center py-4 space-y-4">
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
                    <p className="text-xs font-semibold text-base-content/80 mt-3 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      Menunggu scan dari WhatsApp di ponsel...
                    </p>
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                    <p className="text-sm font-semibold">
                      {isReconnectMode
                        ? "Menghubungkan ulang ke engine WhatsApp..."
                        : "Menghasilkan QR Code autentikasi Waply..."}
                    </p>
                    <p className="text-xs text-base-content/50 mt-1">Harap tunggu beberapa saat.</p>
                  </div>
                )}

                <div className="text-xs text-base-content/75 text-left bg-base-200/50 p-3.5 rounded-xl space-y-1.5 border border-base-300/50">
                  <div className="font-semibold text-base-content">Langkah-langkah Scan:</div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>
                      Buka aplikasi WhatsApp di HP{" "}
                      {displayPhone ? (
                        <strong className="font-mono text-slate-900">
                          +{displayPhone.replace(/^\+/, "")}
                        </strong>
                      ) : (
                        "Anda"
                      )}.
                    </li>
                    <li>
                      Ketuk Menu (titik tiga) atau Pengaturan &gt; <strong>Perangkat Tertaut (Linked Devices)</strong>.
                    </li>
                    <li>
                      Ketuk <strong>Tautkan Perangkat (Link a Device)</strong> dan arahkan kamera ke QR Code di atas.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* CONNECTED state */}
            {status === "CONNECTED" && (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-success">WhatsApp Berhasil Terhubung!</h3>
                {phoneNumber && (
                  <p className="text-sm font-semibold text-base-content/80 font-mono">
                    Nomor: +{phoneNumber.replace(/^\+/, "")}
                  </p>
                )}
                <p className="text-xs text-base-content/50">
                  Sesi telah tersimpan dan aktif di gateway. Menutup dialog...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
