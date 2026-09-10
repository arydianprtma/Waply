"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  Loader2,
  Users,
  Send,
} from "lucide-react";
import { SystemBroadcastCampaign } from "@/lib/admin-broadcasts";

export default function AdminBroadcastsPage() {
  const [campaigns, setCampaigns] = useState<SystemBroadcastCampaign[]>([]);
  const [summary, setSummary] = useState({
    totalCampaigns: 0,
    runningCount: 0,
    pausedCount: 0,
    completedCount: 0,
    totalRecipientsQueued: 0,
    totalSent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/broadcasts");
      const json = await res.json();
      if (json.success && json.data) {
        setCampaigns(json.data.campaigns || []);
        setSummary(json.data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch broadcasts:", err);
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

  const handleAction = async (id: string, action: "pause" | "cancel") => {
    setActionLoading(`${action}-${id}`);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchData();
      } else {
        showToast(json.error || "Gagal mengubah status broadcast");
      }
    } catch {
      showToast("Terjadi kesalahan sistem saat mengubah status broadcast");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    return (
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.userName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.userEmail || "").toLowerCase().includes(search.toLowerCase())
    );
  });

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
            <Megaphone className="w-6 h-6 text-primary" />
            Supervisi Broadcast Massal Platform
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Pantau seluruh kampanye broadcast pesan massal yang sedang aktif di seluruh sistem pengguna
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-base-content/60">Sedang Berjalan</div>
            <div className="text-lg font-extrabold text-base-content font-mono mt-0.5">
              {summary.runningCount} Kampanye
            </div>
            <div className="text-[11px] text-primary font-semibold mt-0.5">
              Status Running
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <PauseCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-base-content/60">Dijeda Sementara</div>
            <div className="text-lg font-extrabold text-base-content font-mono mt-0.5">
              {summary.pausedCount} Kampanye
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
              Status Paused
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-base-content/60">Total Target Kontak</div>
            <div className="text-lg font-extrabold text-base-content font-mono mt-0.5">
              {summary.totalRecipientsQueued.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Total Antrean Kontak
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-base-content/60">Pesan Terkirim</div>
            <div className="text-lg font-extrabold text-base-content font-mono mt-0.5">
              {summary.totalSent.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-base-content/50 mt-0.5">
              Berhasil Sampai
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Cari Judul Kampanye atau Pengguna..."
            className="input input-bordered input-sm w-full pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-xs text-base-content/60">Memuat data broadcast...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Megaphone className="w-12 h-12 text-base-content/20 mx-auto" />
            <h3 className="font-bold text-sm text-base-content">Belum ada broadcast aktif</h3>
            <p className="text-xs text-base-content/50 max-w-sm mx-auto">
              Seluruh broadcast yang dijalankan oleh user akan muncul dan dapat diawasi di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead className="bg-base-200/50 text-[11px] font-bold text-base-content/70 uppercase">
                <tr>
                  <th className="py-3.5 pl-6">Kampanye & Waktu</th>
                  <th>Akun Pemilik</th>
                  <th>Progres Pengiriman</th>
                  <th>Status</th>
                  <th className="text-right pr-6">Kontrol Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-xs">
                {filteredCampaigns.map((c) => {
                  const percent =
                    c.totalRecipients > 0
                      ? Math.round((c.sentCount / c.totalRecipients) * 100)
                      : 0;
                  return (
                    <tr key={c.id} className="hover:bg-base-200/30">
                      <td className="py-3 pl-6">
                        <div className="font-bold text-base-content">{c.name}</div>
                        <div className="font-mono text-[10px] text-base-content/50 mt-0.5">
                          ID: {c.id} • {new Date(c.createdAt).toLocaleDateString("id-ID")}
                        </div>
                      </td>

                      <td>
                        <div className="font-bold text-base-content">{c.userName}</div>
                        <div className="text-[11px] text-base-content/50">{c.userEmail}</div>
                      </td>

                      <td className="w-64">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span>{c.sentCount} / {c.totalRecipients} ({percent}%)</span>
                          {c.failedCount > 0 && (
                            <span className="text-rose-500 font-bold">{c.failedCount} Gagal</span>
                          )}
                        </div>
                        <progress
                          className="progress progress-primary w-full h-1.5"
                          value={percent}
                          max="100"
                        ></progress>
                      </td>

                      <td>
                        <span
                          className={`badge badge-sm font-bold text-[10px] ${
                            c.status === "RUNNING"
                              ? "badge-primary text-primary-content animate-pulse"
                              : c.status === "PAUSED"
                              ? "badge-warning text-white"
                              : c.status === "COMPLETED"
                              ? "badge-success text-white"
                              : "badge-ghost text-base-content/50"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === "RUNNING" && (
                            <button
                              onClick={() => handleAction(c.id, "pause")}
                              disabled={actionLoading === `pause-${c.id}`}
                              className="btn btn-warning btn-xs gap-1 font-semibold"
                              title="Jeda Paksa Broadcast Ini"
                            >
                              <PauseCircle className="w-3.5 h-3.5" />
                              Pause
                            </button>
                          )}

                          {(c.status === "RUNNING" || c.status === "PAUSED") && (
                            <button
                              onClick={() => handleAction(c.id, "cancel")}
                              disabled={actionLoading === `cancel-${c.id}`}
                              className="btn btn-error btn-outline btn-xs gap-1 font-semibold"
                              title="Batalkan Selamanya Broadcast Ini"
                            >
                              <StopCircle className="w-3.5 h-3.5" />
                              Batalkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
