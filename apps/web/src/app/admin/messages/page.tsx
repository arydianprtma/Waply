"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Copy,
  Check,
} from "lucide-react";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [maskPhoneNumbers, setMaskPhoneNumbers] = useState(true);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleRevealSingle = (id: string) => {
    setRevealedIds((prev) => ({
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
    const prefix = clean.slice(0, 5);
    const suffix = clean.slice(-4);
    return `${prefix}••••${suffix}`;
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (json.success && json.data.recentMessages) {
        setMessages(json.data.recentMessages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filtered = messages.filter(
    (m) =>
      m.recipient?.toLowerCase().includes(search.toLowerCase()) ||
      m.content?.toLowerCase().includes(search.toLowerCase()) ||
      m.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-primary" />
            Message Logs Global
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Riwayat log pesan masuk (inbound) dan keluar (outbound) dari semua device.
          </p>
        </div>
        <button onClick={fetchMessages} disabled={loading} className="btn btn-outline btn-sm gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Cari nomor penerima, isi pesan, atau ID..."
              className="input input-bordered input-sm pl-9 w-full rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-base-content/50 whitespace-nowrap">
            Total: <b>{filtered.length}</b> pesan
          </span>
        </div>

        <div className="flex items-center gap-2">
          {maskPhoneNumbers && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Shield className="w-3 h-3 text-emerald-600" /> Mode Privasi Aktif
            </span>
          )}
          <button
            onClick={() => {
              setMaskPhoneNumbers(!maskPhoneNumbers);
              setRevealedIds({});
            }}
            className={`btn btn-xs gap-1.5 rounded-xl border font-medium transition-all ${
              maskPhoneNumbers
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs"
                : "btn-warning text-slate-950 font-bold"
            }`}
            title={maskPhoneNumbers ? "Buka sensor nomor" : "Sensor nomor HP (Privasi)"}
          >
            {maskPhoneNumbers ? (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Buka Sensor</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Sensor Nomor (Privasi)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-base-content/40">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Memuat pesan...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/30">
            <MessageSquare className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">Belum ada pesan tercatat</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200/50 text-xs">
                  <th>ID Pesan</th>
                  <th>Penerima / Pengirim</th>
                  <th>Arah</th>
                  <th>Isi Pesan</th>
                  <th>Status</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {filtered.map((m) => {
                  const rawPhone = m.recipient || m.from || "";
                  const isRevealed = revealedIds[m.id];
                  return (
                    <tr key={m.id} className="hover:bg-base-50">
                      <td className="font-mono text-[11px] text-base-content/50">{m.id}</td>
                      <td>
                        {rawPhone ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono text-xs px-2 py-0.5 rounded-lg font-medium transition-all ${
                                maskPhoneNumbers && !isRevealed
                                  ? "bg-slate-100 text-slate-700 tracking-wider border border-slate-200/70 select-none"
                                  : "bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-semibold"
                              }`}
                            >
                              {maskPhoneNumbers && !isRevealed
                                ? maskPhoneNumber(rawPhone)
                                : rawPhone}
                            </span>
                            <button
                              onClick={() => toggleRevealSingle(m.id)}
                              className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-slate-800"
                              title={
                                isRevealed || !maskPhoneNumbers
                                  ? "Sembunyikan nomor"
                                  : "Lihat nomor lengkap"
                              }
                            >
                              {isRevealed || !maskPhoneNumbers ? (
                                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {(!maskPhoneNumbers || isRevealed) && (
                              <button
                                onClick={() => handleCopy(rawPhone, m.id)}
                                className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-emerald-600"
                                title="Salin Nomor"
                              >
                                {copiedId === m.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.direction === "INBOUND"
                            ? "bg-sky-500/10 text-sky-600"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {m.direction || "OUTBOUND"}
                      </span>
                    </td>
                    <td className="max-w-xs truncate text-xs text-base-content/80">
                      {m.content || m.message || "-"}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.status === "SENT" || m.status === "DELIVERED" || m.status === "READ"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : m.status === "FAILED"
                            ? "bg-error/10 text-error"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {m.status === "SENT" || m.status === "DELIVERED" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : m.status === "FAILED" ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {m.status || "SENT"}
                      </span>
                    </td>
                    <td className="text-xs text-base-content/40 whitespace-nowrap">
                      {new Date(m.sentAt || m.createdAt || Date.now()).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
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
