"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Lock,
  UserX,
  FileWarning,
  Loader2,
  X,
} from "lucide-react";
import { SecurityConfig, SecurityViolationLog } from "@/lib/security-guard";

const PRESET_KEYWORDS = [
  "slot gacor",
  "judol",
  "judi online",
  "maxwin",
  "pragmatic play",
  "zeus slot",
  "togel online",
  "bandar togel",
  "poker online",
  "pinjol tanpa ktp",
  "pinjol ilegal",
  "dana kaget tipu",
  "transfer bca fiktif",
  "phishing login",
  "hack whatsapp",
  "sadap wa",
  "situs bokep",
  "video viral 18+",
];

export default function AdminSecurityPage() {
  const [config, setConfig] = useState<SecurityConfig>({
    enabled: true,
    action: "REJECT",
    autoSuspendThreshold: 3,
    blockedKeywords: [],
  });
  const [logs, setLogs] = useState<SecurityViolationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/security");
      const json = await res.json();
      if (json.success && json.data) {
        setConfig(json.data.config);
        setLogs(json.data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch security data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddKeyword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newKeyword.trim().toLowerCase();
    if (!clean) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_keyword", keyword: clean }),
      });
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
        setNewKeyword("");
        showToast(json.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKeyword = async (keyword: string) => {
    try {
      const res = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_keyword", keyword }),
      });
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
        showToast(`Kata "${keyword}" telah dihapus`);
      }
    } catch {}
  };

  const handleToggleEnabled = async () => {
    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    try {
      await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_config", config: updated }),
      });
      showToast(
        updated.enabled
          ? "Firewall Keamanan Diaktifkan"
          : "Firewall Keamanan Dinonaktifkan"
      );
    } catch {}
  };

  const handleApplyPresets = async () => {
    const merged = Array.from(
      new Set([...config.blockedKeywords, ...PRESET_KEYWORDS])
    );
    const updated = { ...config, blockedKeywords: merged };
    setConfig(updated);
    try {
      await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_config", config: updated }),
      });
      showToast("Preset anti-judol & phishing berhasil dimuat");
    } catch {}
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
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            Keamanan & Global Keyword Firewall
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Lindungi reputasi server Waply dengan memblokir pengiriman pesan phishing, judi online, & penipuan
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="btn btn-outline btn-sm gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Firewall Status & Control Banner */}
      <div className="p-6 rounded-3xl bg-base-100 border border-base-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              config.enabled
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {config.enabled ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-base-content">
                Filter Kata Kunci Global (Platform-wide)
              </h3>
              <span
                className={`badge badge-sm font-bold text-[10px] ${
                  config.enabled ? "badge-success text-white" : "badge-error text-white"
                }`}
              >
                {config.enabled ? "PROTEKSI AKTIF" : "NONAKTIF"}
              </span>
            </div>
            <p className="text-xs text-base-content/60 mt-1 max-w-xl leading-relaxed">
              Setiap pesan keluar (via REST API maupun Broadcast Massal) yang mengandung kata terlarang akan langsung dibatalkan sistem dengan kode <code className="font-mono text-rose-500 font-semibold">KEYWORD_BLOCKED</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleToggleEnabled}
            className={`btn btn-sm ${
              config.enabled
                ? "btn-error btn-outline"
                : "btn-success text-white"
            }`}
          >
            {config.enabled ? "Matikan Firewall" : "Aktifkan Firewall"}
          </button>
        </div>
      </div>

      {/* Keyword Manager Card */}
      <div className="p-6 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-base-200">
          <div>
            <h2 className="text-base font-bold text-base-content flex items-center gap-2">
              <span>Daftar Kata Kunci Terlarang</span>
              <span className="badge badge-primary badge-sm font-mono text-[10px] font-bold">
                {config.blockedKeywords.length} Kata
              </span>
            </h2>
            <p className="text-xs text-base-content/60 mt-0.5">
              Pencocokan kata dilakukan secara otomatis dan case-insensitive.
            </p>
          </div>

          <button
            onClick={handleApplyPresets}
            className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 gap-1.5 h-7 px-3 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Muat Preset Anti-Judol & Phishing
          </button>
        </div>

        {/* Add Input */}
        <form onSubmit={handleAddKeyword} className="flex gap-2">
          <input
            type="text"
            placeholder="Tambah kata terlarang baru (misal: slot maxwin, pinjol ilegal)..."
            className="input input-bordered input-sm flex-1 text-xs"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving || !newKeyword.trim()}
            className="btn btn-primary btn-sm gap-1.5 px-4"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Tambah
          </button>
        </form>

        {/* Badges / Chips Grid */}
        <div className="flex flex-wrap gap-2 pt-2">
          {config.blockedKeywords.length === 0 ? (
            <div className="text-xs text-base-content/40 italic py-4">
              Belum ada kata kunci terlarang yang didaftarkan.
            </div>
          ) : (
            config.blockedKeywords.map((kw) => (
              <div
                key={kw}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 group hover:border-rose-500/40 transition-colors"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                  title="Hapus kata ini"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-base-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FileWarning className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-base-content">
                Log Upaya Pelanggaran & Blokir Pesan
              </h2>
              <p className="text-xs text-base-content/60">
                Riwayat pesan yang ditolak oleh sistem keamanan Waply
              </p>
            </div>
          </div>
          <span className="badge badge-ghost text-xs font-mono">
            {logs.length} Log
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-base-content/60">Memuat log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center space-y-1">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-xs text-base-content">Sistem Bersih</h4>
            <p className="text-[11px] text-base-content/50">
              Belum ada upaya pengiriman pesan yang melanggar kata terlarang.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead className="bg-base-200/50 text-[11px] font-bold text-base-content/70 uppercase">
                <tr>
                  <th className="py-3.5 pl-6">Waktu</th>
                  <th>Akun Pengirim</th>
                  <th>Penerima</th>
                  <th>Kata Terdeteksi</th>
                  <th>Cuplikan Pesan</th>
                  <th className="text-right pr-6">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-xs font-sans">
                {logs.map((lg) => (
                  <tr key={lg.id} className="hover:bg-base-200/30">
                    <td className="py-3 pl-6 font-mono text-[11px] text-base-content/60">
                      {new Date(lg.timestamp).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td>
                      <div className="font-bold text-base-content">
                        {lg.userName || "User"}
                      </div>
                      <div className="text-[10px] text-base-content/50">
                        {lg.userEmail || "-"}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-base-content/80">
                      {lg.recipientPhone || "-"}
                    </td>
                    <td>
                      <span className="badge badge-error badge-sm font-mono text-[10px] font-bold text-white">
                        {lg.matchedKeyword}
                      </span>
                    </td>
                    <td className="max-w-xs truncate text-[11px] text-base-content/70 font-mono">
                      {lg.snippet}
                    </td>
                    <td className="text-right pr-6">
                      <span className="badge badge-ghost text-[10px] font-bold">
                        {lg.actionTaken}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
