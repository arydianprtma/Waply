"use client";

import { useState, useEffect } from "react";
import {
  ScrollText,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Bot,
  Send,
  Radio,
  Clock,
  Filter,
} from "lucide-react";
import clsx from "clsx";

interface UserLog {
  id: string;
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  category: "WEBHOOK" | "AUTOREPLY" | "MESSAGES" | "GATEWAY" | "BROADCAST" | "SYSTEM";
  title: string;
  message: string;
  details?: string | null;
  target?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  time: string;
}

export default function UserLogsPage() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch user logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtering
  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "ALL" && log.level !== filterLevel) return false;
    if (filterCategory !== "ALL" && log.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = log.title.toLowerCase().includes(q);
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchTarget = log.target?.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchTarget && !matchDetails) return false;
    }
    return true;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> ERROR
          </span>
        );
      case "WARN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> WARN
          </span>
        );
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> SUCCESS
          </span>
        );
      case "INFO":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "WEBHOOK":
        return <Globe className="w-3.5 h-3.5 text-indigo-500" />;
      case "AUTOREPLY":
        return <Bot className="w-3.5 h-3.5 text-cyan-500" />;
      case "MESSAGES":
        return <Send className="w-3.5 h-3.5 text-emerald-500" />;
      case "BROADCAST":
        return <Radio className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <ScrollText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-primary" />
            System & Activity Logs
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Pantau jejak eksekusi webhook, respons bot auto-reply, riwayat broadcast, dan status pengiriman pesan.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn btn-outline btn-sm gap-2 self-start sm:self-auto rounded-xl shadow-2xs"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh Log
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-2xs">
          <p className="text-xs text-base-content/60 font-medium">Total Aktivitas</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{logs.length}</p>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-2xs">
          <p className="text-xs text-emerald-600 font-medium">Sukses</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {logs.filter((l) => l.level === "SUCCESS" || l.level === "INFO").length}
          </p>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-2xs">
          <p className="text-xs text-amber-600 font-medium">Peringatan / Warn</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {logs.filter((l) => l.level === "WARN").length}
          </p>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-2xs">
          <p className="text-xs text-rose-600 font-medium">Error / Gagal</p>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {logs.filter((l) => l.level === "ERROR").length}
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Cari pesan, nomor, atau target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-base-content/60">
              <Filter className="w-3.5 h-3.5" />
              <span>Kategori:</span>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="select select-bordered select-xs rounded-lg text-xs"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="WEBHOOK">Webhook</option>
              <option value="AUTOREPLY">Auto-Reply</option>
              <option value="MESSAGES">Pesan</option>
              <option value="BROADCAST">Broadcast</option>
            </select>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="select select-bordered select-xs rounded-lg text-xs"
            >
              <option value="ALL">Semua Level</option>
              <option value="SUCCESS">Sukses (SUCCESS)</option>
              <option value="INFO">Info (INFO)</option>
              <option value="WARN">Peringatan (WARN)</option>
              <option value="ERROR">Gagal (ERROR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-base-content/40">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Memuat aktivitas log...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/30">
            <ScrollText className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">Belum ada riwayat log yang sesuai kriteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200/50 text-xs">
                  <th>Waktu</th>
                  <th>Level</th>
                  <th>Kategori</th>
                  <th>Aktivitas & Pesan</th>
                  <th>Target / Penerima</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const logDate = new Date(log.time);
                  const formattedTime = logDate.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  const formattedDate = logDate.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                  });

                  return (
                    <tr key={log.id} className="hover:bg-base-50/70 group">
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Clock className="w-3 h-3 text-base-content/40" />
                          <span className="font-semibold text-slate-800">{formattedTime}</span>
                        </div>
                        <p className="text-[10px] text-base-content/40">{formattedDate}</p>
                      </td>

                      <td>{getLevelBadge(log.level)}</td>

                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-base-200/70 text-slate-700">
                          {getCategoryIcon(log.category)}
                          {log.category}
                        </span>
                      </td>

                      <td className="max-w-xs sm:max-w-md">
                        <p className="font-semibold text-xs text-slate-900 truncate">{log.title}</p>
                        <p className="text-[11px] text-base-content/60 truncate mt-0.5">{log.message}</p>
                        {isExpanded && log.details && (
                          <div className="mt-2 p-2.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                            <div className="flex justify-between items-center pb-1 border-b border-slate-800 mb-1">
                              <span className="text-[9px] text-slate-400 font-sans uppercase">Payload / Detail Response</span>
                              <button
                                onClick={() => handleCopy(log.details!, log.id)}
                                className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                              >
                                {copiedId === log.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                Salin
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap break-all">{log.details}</pre>
                          </div>
                        )}
                      </td>

                      <td className="text-xs font-mono text-slate-600">
                        {log.target ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {log.target}
                          </span>
                        ) : (
                          <span className="text-base-content/30">-</span>
                        )}
                      </td>

                      <td>
                        {log.statusCode ? (
                          <span
                            className={clsx(
                              "font-mono text-xs px-2 py-0.5 rounded-md font-bold",
                              log.statusCode >= 200 && log.statusCode < 300
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            )}
                          >
                            HTTP {log.statusCode}
                          </span>
                        ) : (
                          <span className="text-[11px] text-base-content/40">-</span>
                        )}
                      </td>

                      <td className="text-right">
                        {log.details ? (
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="btn btn-ghost btn-xs rounded-lg gap-1 text-slate-600"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" /> Tutup
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" /> Detail
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-base-content/30 pr-2">N/A</span>
                        )}
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
