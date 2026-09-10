"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  Trash2,
  Loader2,
  Database,
  Radio,
  ExternalLink,
  Info,
} from "lucide-react";
import { SystemTelemetry } from "@/lib/admin-telemetry";

export default function AdminTelemetryPage() {
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/admin/telemetry");
      const json = await res.json();
      if (json.success && json.data) {
        setTelemetry(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return;
    const timer = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCleanMemory = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "gc" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchTelemetry();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (d > 0) parts.push(`${d} hari`);
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0 || parts.length === 0) parts.push(`${m} menit`);
    return parts.join(" ");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success text-xs font-bold py-2.5 px-4 shadow-xl rounded-xl flex items-center gap-2 text-white">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-primary" />
            Server Telemetry & Worker Health
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Pantau performa CPU, RAM, koneksi Gateway WhatsApp, dan kesehatan node server secara real-time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-base-content/70">
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-Refresh (6s)</span>
          </label>

          <button
            onClick={fetchTelemetry}
            className="btn btn-outline btn-sm gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Perbarui
          </button>
        </div>
      </div>

      {loading && !telemetry ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-xs text-base-content/60">Mengumpulkan telemetri sistem...</p>
        </div>
      ) : telemetry ? (
        <>
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gateway Worker Card */}
            <div className="p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-base-content">WhatsApp Gateway Worker</h3>
                    <div className="font-mono text-[10px] text-base-content/50">
                      Port 3002 (Internal)
                    </div>
                  </div>
                </div>
                <span
                  className={`badge badge-sm font-bold text-[10px] ${
                    telemetry.gateway.status === "ONLINE"
                      ? "badge-success text-white"
                      : "badge-error text-white"
                  }`}
                >
                  {telemetry.gateway.status}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-base-200/50 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Latensi HTTP:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {telemetry.gateway.latencyMs}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Sesi Terhubung:</span>
                  <span className="font-mono font-bold text-base-content">
                    {telemetry.gateway.activeSessionsCount} Device
                  </span>
                </div>
              </div>
            </div>

            {/* RAM Memory Card */}
            <div className="p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-base-content">Penggunaan RAM VPS</h3>
                    <div className="font-mono text-[10px] text-base-content/50">
                      {formatBytes(telemetry.server.usedMemBytes)} / {formatBytes(telemetry.server.totalMemBytes)}
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-base-content">
                  {telemetry.server.memoryUsagePercent}%
                </span>
              </div>

              <div className="space-y-1">
                <progress
                  className="progress progress-primary w-full h-2"
                  value={telemetry.server.memoryUsagePercent}
                  max="100"
                ></progress>
                <div className="flex justify-between text-[10px] text-base-content/50 font-mono">
                  <span>Free: {formatBytes(telemetry.server.freeMemBytes)}</span>
                  <span>Total: {formatBytes(telemetry.server.totalMemBytes)}</span>
                </div>
              </div>
            </div>

            {/* Node Process Heap */}
            <div className="p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-base-content">Node.js Process Memory</h3>
                    <div className="font-mono text-[10px] text-base-content/50">
                      PID: {telemetry.process.pid} (RSS: {formatBytes(telemetry.process.rssBytes)})
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCleanMemory}
                  disabled={actionLoading}
                  className="btn btn-ghost btn-xs h-7 px-2 font-semibold text-primary hover:bg-primary/10 gap-1"
                  title="Bersihkan Memory Pool Node"
                >
                  <Trash2 className="w-3 h-3" />
                  Clean
                </button>
              </div>

              <div className="space-y-1">
                <progress
                  className="progress progress-warning w-full h-2"
                  value={telemetry.process.heapUsagePercent}
                  max="100"
                ></progress>
                <div className="flex justify-between text-[10px] text-base-content/50 font-mono">
                  <span>Heap: {formatBytes(telemetry.process.heapUsedBytes)}</span>
                  <span>Allocated: {formatBytes(telemetry.process.heapTotalBytes)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Details Specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Info */}
            <div className="p-6 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-base-200">
                <Server className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-sm text-base-content">Spesifikasi Host Server (VPS)</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-base-200/40 space-y-0.5">
                  <div className="text-base-content/50 text-[11px]">Hostname</div>
                  <div className="font-bold font-mono text-base-content truncate">
                    {telemetry.server.hostname}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-base-200/40 space-y-0.5">
                  <div className="text-base-content/50 text-[11px]">OS & Arsitektur</div>
                  <div className="font-bold font-mono text-base-content truncate">
                    {telemetry.server.platform} ({telemetry.server.arch})
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-base-200/40 space-y-0.5">
                  <div className="text-base-content/50 text-[11px]">Uptime Server</div>
                  <div className="font-bold text-base-content">
                    {formatUptime(telemetry.server.uptimeSeconds)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-base-200/40 space-y-0.5">
                  <div className="text-base-content/50 text-[11px]">Node.js Runtime</div>
                  <div className="font-bold font-mono text-base-content">
                    {telemetry.server.nodeVersion}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-base-200/40 space-y-0.5 col-span-2">
                  <div className="text-base-content/50 text-[11px]">CPU Model & Cores</div>
                  <div className="font-bold text-base-content flex items-center justify-between">
                    <span className="truncate">{telemetry.server.cpuModel}</span>
                    <span className="badge badge-primary badge-sm font-mono shrink-0 ml-2">
                      {telemetry.server.cpuCores} Cores
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage & Data Footprint */}
            <div className="p-6 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-base-200">
                <Database className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-sm text-base-content">Kapasitas Data & Registri Lokal</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-base-200/40 space-y-0.5">
                  <div className="text-base-content/50 text-[11px]">Total Ukuran Data</div>
                  <div className="font-bold font-mono text-base-content">
                    {formatBytes(telemetry.storage.dataDirSizeBytes)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-base-200/40 space-y-0.5">
                  <div className="text-base-content/50 text-[11px]">Jumlah User Terdaftar</div>
                  <div className="font-bold font-mono text-base-content">
                    {telemetry.storage.usersCount} Akun
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-base-200/40 space-y-0.5 col-span-2">
                  <div className="text-base-content/50 text-[11px]">Jumlah Riwayat Invoice</div>
                  <div className="font-bold font-mono text-base-content">
                    {telemetry.storage.invoicesCount} Record Invoice
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Rekomendasi Operasional:</strong> Gunakan menu <em>Backup Center</em> secara berkala untuk mengekspor snapshot registri data sebelum melakukan upgrade versi aplikasi.
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
