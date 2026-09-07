"use client";

import { useState, useEffect } from "react";
import {
  ScrollText,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Bot,
  Send,
  Radio,
  Server,
} from "lucide-react";
import { useConfirm, useAlert } from "@/components/confirm-dialog";

interface FormattedSystemLog {
  id: string;
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  category: "WEBHOOK" | "AUTOREPLY" | "MESSAGES" | "GATEWAY" | "SYSTEM";
  title: string;
  message: string;
  details?: string | null;
  target?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  time: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<FormattedSystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const confirm = useConfirm();
  const showAlert = useAlert();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
    const isConfirmed = await confirm({
      title: "Bersihkan Riwayat Log",
      message: "Apakah Anda yakin ingin menghapus seluruh riwayat log sistem dan webhook? Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Bersihkan Log",
      variant: "danger",
    });
    if (!isConfirmed) return;

    setClearing(true);
    try {
      const res = await fetch("/api/admin/logs", { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setLogs([]);
        await showAlert({
          title: "Log Berhasil Dibersihkan",
          message: "Seluruh riwayat log sistem telah dihapus dengan aman.",
          variant: "success",
        });
      }
    } catch (err) {
      await showAlert({
        title: "Gagal Membersihkan Log",
        message: (err as Error).message || "Terjadi kesalahan jaringan",
        variant: "danger",
      });
    } finally {
      setClearing(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === "ALL" || log.level === filterLevel;
    const matchesCategory = filterCategory === "ALL" || log.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.title.toLowerCase().includes(q) ||
      log.message.toLowerCase().includes(q) ||
      (log.target && log.target.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q));

    return matchesLevel && matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "WEBHOOK":
        return <Globe className="w-3.5 h-3.5 text-sky-600" />;
      case "AUTOREPLY":
        return <Bot className="w-3.5 h-3.5 text-purple-600" />;
      case "MESSAGES":
        return <Send className="w-3.5 h-3.5 text-emerald-600" />;
      case "GATEWAY":
        return <Radio className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Server className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-emerald-600" />
            System & Gateway Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau log peristiwa pengiriman webhook, respons bot auto-reply, dan status engine WhatsApp secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              disabled={clearing || loading}
              className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-xl gap-1.5 font-medium text-xs shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bersihkan Log
            </button>
          )}

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn btn-outline btn-sm rounded-xl gap-2 text-slate-700 hover:text-slate-900 border-slate-300 font-medium text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari event webhook, nomor tujuan, URL, atau isi pesan..."
              className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs bg-slate-50/50 focus:bg-white border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Level Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Semua Log" },
              { id: "WARN", label: "Peringatan" },
              { id: "ERROR", label: "Error" },
              { id: "INFO", label: "Info" },
              { id: "SUCCESS", label: "Sukses" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterLevel(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  filterLevel === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Kategori:</span>
          {[
            { id: "ALL", label: "Semua Kategori" },
            { id: "WEBHOOK", label: "Webhook" },
            { id: "AUTOREPLY", label: "Auto-Reply" },
            { id: "MESSAGES", label: "Pesan" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                filterCategory === cat.id
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Container */}
      <div className="bg-white border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2.5" />
            <p className="text-sm font-medium">Memuat riwayat log sistem...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-900">
              {logs.length === 0 ? "Sistem Berjalan Normal" : "Tidak Ada Log yang Cocok"}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {logs.length === 0
                ? "Tidak ada pesan kegagalan, webhook error, atau peringatan socket."
                : "Coba ubah kata kunci pencarian atau sesuaikan filter level di atas."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const isError = log.level === "ERROR";
              const isWarn = log.level === "WARN";
              const isSuccess = log.level === "SUCCESS" || log.level === "INFO";
              const isExpanded = expandedLogId === log.id;

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Level Icon Box */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                          isError
                            ? "bg-rose-50 text-rose-600 border-rose-200/70"
                            : isWarn
                            ? "bg-amber-50 text-amber-600 border-amber-200/70"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200/70"
                        }`}
                      >
                        {isError ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                            {getCategoryIcon(log.category)}
                            {log.title}
                          </span>

                          {log.statusCode && (
                            <span
                              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                log.statusCode >= 200 && log.statusCode < 300
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : log.statusCode === 404
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-rose-50 text-rose-800 border-rose-200"
                              }`}
                            >
                              HTTP {log.statusCode}
                            </span>
                          )}

                          {log.durationMs && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {log.durationMs}ms
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {log.message}
                        </p>

                        {log.target && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[11px] text-slate-400 font-medium">Target:</span>
                            <code className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/70 truncate max-w-xs sm:max-w-md">
                              {log.target}
                            </code>
                            <button
                              onClick={() => handleCopy(log.target!, log.id)}
                              className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-emerald-600 h-6 w-6"
                              title="Salin Target / URL"
                            >
                              {copiedId === log.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 space-y-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isError
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : isWarn
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.time).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {log.details && (
                    <div className="pl-11 pt-1">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="btn btn-ghost btn-xs gap-1 text-[11px] text-slate-500 hover:text-slate-900 px-1.5 font-medium"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> Sembunyikan Detail Response
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> Lihat Detail Payload / Error Response
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                          <pre className="whitespace-pre-wrap">{log.details}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
