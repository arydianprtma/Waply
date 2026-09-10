"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Download,
  Plus,
  RefreshCw,
  CheckCircle2,
  FileArchive,
  Clock,
  ShieldCheck,
  HardDrive,
  Loader2,
} from "lucide-react";
import { BackupMetadata } from "@/lib/admin-backup";

export default function AdminBackupPage() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup");
      const json = await res.json();
      if (json.success && json.data) {
        setBackups(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch backups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchBackups();
      } else {
        showToast(json.error || "Gagal membuat snapshot backup");
      }
    } catch {
      showToast("Terjadi kesalahan sistem saat membuat backup");
    } finally {
      setCreating(false);
    }
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
            <Database className="w-6 h-6 text-primary" />
            Pusat Backup & Data Snapshot
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Ekspor dan amankan seluruh data registri akun, langganan, invoice, dan konfigurasi platform Waply
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="btn btn-primary btn-sm gap-2"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Buat Backup Baru
        </button>
      </div>

      {/* Info Card */}
      <div className="p-6 rounded-3xl bg-base-100 border border-base-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-base-content">
              Snapshot Data Otomatis & Terisolasi
            </h3>
            <p className="text-xs text-base-content/60 mt-0.5 leading-relaxed max-w-xl">
              File snapshot mencakup seluruh data: <code className="font-mono text-primary font-semibold">plans.json</code>, <code className="font-mono text-primary font-semibold">subscription.json</code>, <code className="font-mono text-primary font-semibold">users_registry.json</code>, <code className="font-mono text-primary font-semibold">invoices.json</code>, <code className="font-mono text-primary font-semibold">security_config.json</code>, dan tiket bantuan.
            </p>
          </div>
        </div>

        <button
          onClick={fetchBackups}
          disabled={loading}
          className="btn btn-outline btn-sm gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Backup List Table */}
      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-base-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileArchive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-base-content">
                Riwayat Snapshot Backup Tersimpan
              </h2>
              <p className="text-xs text-base-content/60">
                Klik tombol download untuk mengunduh arsip JSON ke perangkat Anda
              </p>
            </div>
          </div>
          <span className="badge badge-ghost text-xs font-mono">
            {backups.length} Snapshot
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-base-content/60">Memuat riwayat backup...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <HardDrive className="w-12 h-12 text-base-content/20 mx-auto" />
            <h3 className="font-bold text-sm text-base-content">Belum ada snapshot backup</h3>
            <p className="text-xs text-base-content/50 max-w-sm mx-auto">
              Klik tombol &quot;Buat Backup Baru&quot; di atas untuk membuat arsip data perdana Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead className="bg-base-200/50 text-[11px] font-bold text-base-content/70 uppercase">
                <tr>
                  <th className="py-3.5 pl-6">ID Snapshot</th>
                  <th>Waktu Dibuat</th>
                  <th>Ukuran Arsip</th>
                  <th>Isi Berkas Data</th>
                  <th className="text-right pr-6">Unduh Berkas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-xs">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-base-200/30">
                    <td className="py-3 pl-6 font-mono font-bold text-base-content">
                      {b.id}
                    </td>

                    <td className="text-base-content/70">
                      {new Date(b.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="font-mono font-semibold text-emerald-600">
                      {b.totalSizeFormatted}
                    </td>

                    <td>
                      <span className="badge badge-ghost badge-sm text-[10px] font-mono">
                        {b.totalFiles} modul JSON
                      </span>
                    </td>

                    <td className="text-right pr-6">
                      <a
                        href={`/api/admin/backup?download=${b.id}`}
                        download={`${b.id}.json`}
                        className="btn btn-outline btn-xs gap-1.5 font-semibold text-primary hover:btn-primary"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download (.json)
                      </a>
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
