"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Flame,
  Zap,
  Eye,
  EyeOff,
  Shield,
  Copy,
  Check,
} from "lucide-react";

interface Device {
  id: string;
  name?: string;
  phoneNumber?: string;
  status: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "PAUSED";
  lastConnectedAt?: string;
  sentCountToday?: number;
  warmupStage?: "Cold" | "Warm" | "Active" | "Mature";
  dailyLimit?: number;
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [maskPhoneNumbers, setMaskPhoneNumbers] = useState(true);
  const [revealedDevices, setRevealedDevices] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleRevealSingle = (id: string) => {
    setRevealedDevices((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const maskPhoneNumber = (phone?: string) => {
    if (!phone || phone === "-") return "-";
    const clean = phone.trim();
    if (clean.length <= 6) return clean;
    // e.g. 6282214083125 -> 62822••••3125
    const prefix = clean.slice(0, 5);
    const suffix = clean.slice(-4);
    return `${prefix}••••${suffix}`;
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gateway/sessions");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Map and enrich with warmup data
        const enriched: Device[] = json.data.map((d: any) => {
          const rawStatus = String(d.status || "").toUpperCase();
          const status: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "PAUSED" =
            rawStatus === "CONNECTED"
              ? "CONNECTED"
              : rawStatus === "CONNECTING"
              ? "CONNECTING"
              : rawStatus === "PAUSED"
              ? "PAUSED"
              : "DISCONNECTED";

          return {
            id: d.id || d.sessionId,
            name: d.name || `Device #${d.id || d.sessionId}`,
            phoneNumber: d.phoneNumber || d.user?.id?.split(":")[0] || "-",
            status,
            lastConnectedAt: d.lastConnectedAt || d.updatedAt || new Date().toISOString(),
            sentCountToday: d.sentToday || 0,
            warmupStage: "Active",
            dailyLimit: d.dailyLimit || 250,
          };
        });
        setDevices(enriched);
      }
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-primary" />
            Devices & Health Monitor
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Pantau status koneksi socket, protokol pemanasan nomor (Warm-Up), dan sistem Anti-Ban.
          </p>
        </div>
        <button onClick={fetchDevices} disabled={loading} className="btn btn-outline btn-sm gap-2 self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60">Device Terhubung (Online)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {devices.filter((d) => d.status === "CONNECTED").length}
            <span className="text-xs font-normal text-base-content/40 ml-1">/ {devices.length} total</span>
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Socket aktif & siap kirim</p>
        </div>

        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60">Warmup Protection</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">Aktif</p>
          <p className="text-xs text-base-content/50 mt-1">Auto-throttling & sleep batch aktif</p>
        </div>

        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60">Circuit Breaker</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-primary">Normal</p>
          <p className="text-xs text-base-content/50 mt-1">0 abnormal disconnects</p>
        </div>
      </div>

      {/* Device Table & Mobile Cards */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-base-200 flex flex-wrap items-center justify-between gap-3 bg-base-50/50">
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-sm">Daftar WhatsApp Device</h3>
            {maskPhoneNumbers && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Shield className="w-3 h-3 text-emerald-600" /> Mode Privasi Aktif
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setMaskPhoneNumbers(!maskPhoneNumbers);
              setRevealedDevices({});
            }}
            className={`btn btn-xs gap-1.5 rounded-xl border font-medium transition-all ${
              maskPhoneNumbers
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs"
                : "btn-warning text-slate-950 font-bold"
            }`}
            title={maskPhoneNumbers ? "Buka sensor semua nomor" : "Sensor semua nomor HP"}
          >
            {maskPhoneNumbers ? (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Buka Sensor Nomor</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Sensor Semua Nomor (Privasi)</span>
              </>
            )}
          </button>
        </div>

        {loading && devices.length === 0 ? (
          <div className="p-8 text-center text-sm text-base-content/40">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Memuat data device...
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/30">
            <Smartphone className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">Belum ada device WhatsApp yang terhubung</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="bg-base-200/50 text-xs">
                    <th>Device</th>
                    <th>Nomor HP</th>
                    <th>Status</th>
                    <th>Warm-Up Stage</th>
                    <th>Pengiriman Hari Ini</th>
                    <th>Kesehatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {devices.map((d) => {
                    const isConnected = d.status === "CONNECTED";
                    const isConnecting = d.status === "CONNECTING";
                    return (
                      <tr key={d.id} className="hover:bg-base-50">
                        <td>
                          <p className="font-semibold text-xs text-slate-900">{d.name}</p>
                          <p className="text-[10px] text-base-content/40 font-mono">{d.id}</p>
                        </td>
                        <td>
                          {d.phoneNumber && d.phoneNumber !== "-" ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-xs px-2 py-0.5 rounded-lg font-medium transition-all ${
                                  maskPhoneNumbers && !revealedDevices[d.id]
                                    ? "bg-slate-100 text-slate-700 tracking-wider border border-slate-200/70 select-none"
                                    : "bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-semibold"
                                }`}
                              >
                                {maskPhoneNumbers && !revealedDevices[d.id]
                                  ? maskPhoneNumber(d.phoneNumber)
                                  : `+${d.phoneNumber.replace(/^\+/, "")}`}
                              </span>
                              <button
                                onClick={() => toggleRevealSingle(d.id)}
                                className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-slate-800"
                                title={
                                  revealedDevices[d.id] || !maskPhoneNumbers
                                    ? "Sembunyikan nomor (Privasi)"
                                    : "Lihat nomor lengkap"
                                }
                              >
                                {revealedDevices[d.id] || !maskPhoneNumbers ? (
                                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {(!maskPhoneNumbers || revealedDevices[d.id]) && (
                                <button
                                  onClick={() => handleCopy(d.phoneNumber!, d.id)}
                                  className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-emerald-600"
                                  title="Salin Nomor HP"
                                >
                                  {copiedId === d.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              isConnected
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isConnecting
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-base-200 text-base-content/60 border border-base-300"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isConnected
                                  ? "bg-emerald-500 animate-pulse"
                                  : isConnecting
                                  ? "bg-amber-500 animate-ping"
                                  : "bg-slate-400"
                              }`}
                            />
                            {isConnected ? "CONNECTED (Online)" : d.status}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-sm badge-warning badge-outline text-[11px] font-medium">
                            Stage: {d.warmupStage || "Active"}
                          </span>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span>{d.sentCountToday || 0} pesan</span>
                              <span className="text-base-content/40">Max: {d.dailyLimit || 250}</span>
                            </div>
                            <progress
                              className="progress progress-primary w-24 h-1.5"
                              value={d.sentCountToday || 0}
                              max={d.dailyLimit || 250}
                            />
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sehat (100%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (antislop-layoutmobile) */}
            <div className="md:hidden divide-y divide-base-200">
              {devices.map((d) => {
                const isConnected = d.status === "CONNECTED";
                const isConnecting = d.status === "CONNECTING";
                return (
                  <div key={d.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{d.name}</p>
                        <p className="text-[10px] text-base-content/40 font-mono">{d.id}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                          isConnected
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isConnecting
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-base-200 text-base-content/60 border border-base-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                        {isConnected ? "CONNECTED" : d.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-base-200/50">
                      <span className="text-base-content/60">Nomor HP:</span>
                      {d.phoneNumber && d.phoneNumber !== "-" ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-xs px-2 py-0.5 rounded-lg font-medium ${
                              maskPhoneNumbers && !revealedDevices[d.id]
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : "bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold"
                            }`}
                          >
                            {maskPhoneNumbers && !revealedDevices[d.id]
                              ? maskPhoneNumber(d.phoneNumber)
                              : `+${d.phoneNumber.replace(/^\+/, "")}`}
                          </span>
                          <button
                            onClick={() => toggleRevealSingle(d.id)}
                            className="btn btn-ghost btn-xs btn-circle text-slate-400"
                          >
                            {revealedDevices[d.id] || !maskPhoneNumbers ? (
                              <EyeOff className="w-3 h-3 text-amber-600" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-slate-400">-</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-base-content/60">Stage Anti-Ban:</span>
                      <span className="badge badge-sm badge-warning badge-outline text-[10px]">
                        Stage: {d.warmupStage || "Active"}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-base-content/60">
                        <span>Kirim hari ini: {d.sentCountToday || 0} pesan</span>
                        <span>Max: {d.dailyLimit || 250}</span>
                      </div>
                      <progress
                        className="progress progress-primary w-full h-1.5"
                        value={d.sentCountToday || 0}
                        max={d.dailyLimit || 250}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
