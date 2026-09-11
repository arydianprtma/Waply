"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Search,
  ShieldAlert,
  ChevronRight,
  Info,
  Trash2,
  ExternalLink,
  Flame,
  Activity,
  Globe2,
} from "lucide-react";

export interface UrlScanItem {
  path: string;
  count: number;
  method: string;
  lastStatusCode: number;
  statusCodes: number[];
  lastSeen: string;
  firstSeen: string;
  recentIps: string[];
  category: "ENV_LEAK_PROBE" | "API_MISMATCH" | "ADMIN_SCAN" | "SOURCE_LEAK" | "COMMON_404";
  percentage: number;
}

export interface UrlScanSummary {
  totalHits: number;
  uniquePaths: number;
  envProbes: number;
  apiMismatches: number;
  topPath: string;
}

export function Top4xxPathsCard({ className = "" }: { className?: string }) {
  const [paths, setPaths] = useState<UrlScanItem[]>([]);
  const [summary, setSummary] = useState<UrlScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<UrlScanItem | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchScans = async () => {
    try {
      const res = await fetch("/api/admin/url-scans?limit=30");
      const json = await res.json();
      if (json.success && json.data) {
        setPaths(json.data.topPaths || []);
        setSummary(json.data.summary || null);
      }
    } catch (err) {
      console.error("Failed to fetch top 4xx paths:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Apakah Anda yakin ingin mereset seluruh riwayat pemindaian URL 4xx? Data akan mulai dihitung dari nol (0).")) {
      return;
    }
    setIsClearing(true);
    try {
      await fetch("/api/admin/url-scans", { method: "DELETE" });
      await fetchScans();
      setSelectedItem(null);
    } catch (err) {
      console.error("Failed to clear url scans:", err);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    fetchScans();
    const interval = setInterval(fetchScans, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredPaths = paths.filter((item) => {
    const matchesSearch = item.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (cat: UrlScanItem["category"]) => {
    switch (cat) {
      case "ENV_LEAK_PROBE":
        return {
          label: "Probe .env",
          className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        };
      case "API_MISMATCH":
        return {
          label: "Salah Endpoint",
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
      case "ADMIN_SCAN":
        return {
          label: "Scan Admin",
          className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
      case "SOURCE_LEAK":
        return {
          label: "Source Code",
          className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
      default:
        return {
          label: "404 Umum",
          className: "bg-base-200 text-base-content/70 border-base-300",
        };
    }
  };

  return (
    <div className={`bg-base-100 rounded-3xl border border-base-200 shadow-xs p-5 sm:p-6 space-y-5 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-200">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-base-content flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Top 4xx Paths (URL Probe & Scanner Tracker)
            </h2>
            {summary && (
              <span className="badge badge-neutral badge-sm font-mono text-[11px] font-bold">
                {summary.totalHits.toLocaleString("id-ID")} Total Permintaan
              </span>
            )}
          </div>
          <p className="text-xs text-base-content/60 leading-relaxed max-w-2xl">
            Merekam jalur URL yang sering dicoba dibuka oleh bot, pemindai keamanan, atau pengguna tetapi menghasilkan status <span className="font-mono font-semibold text-rose-500">404 Not Found</span>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchScans();
            }}
            disabled={loading}
            className="btn btn-ghost btn-sm border border-base-200 gap-1.5 min-h-[38px] text-xs font-semibold"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            disabled={isClearing || paths.length === 0}
            className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-500/10 border border-base-200 gap-1.5 min-h-[38px] text-xs font-semibold"
            title="Reset Riwayat ke 0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-200">
            <div className="text-[11px] font-semibold text-base-content/60">Total Upaya Akses</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-base-content mt-0.5">
              {summary.totalHits.toLocaleString("id-ID")}
              <span className="text-xs font-normal text-base-content/50 ml-1">hits</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-200">
            <div className="text-[11px] font-semibold text-base-content/60">Jalur Unik (Paths)</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-base-content mt-0.5">
              {summary.uniquePaths}
              <span className="text-xs font-normal text-base-content/50 ml-1">target</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Probe File .env</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {summary.envProbes}
              <span className="text-xs font-normal opacity-70 ml-1">serangan</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Salah Ketik API</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {summary.apiMismatches}
              <span className="text-xs font-normal opacity-70 ml-1">request</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari jalur path (misal: .env, /api, /wp-admin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm input-bordered w-full pl-9 text-xs rounded-xl h-9"
          />
        </div>

        {/* Category Pills with horizontal scroll on small screens */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: "Semua" },
            { id: "ENV_LEAK_PROBE", label: "Probe .env" },
            { id: "API_MISMATCH", label: "Salah API" },
            { id: "ADMIN_SCAN", label: "Scan Admin" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 min-h-[36px] flex items-center justify-center ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-content shadow-xs"
                  : "bg-base-200 hover:bg-base-300 text-base-content/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info notice about what the numbers mean */}
      <div className="p-3 rounded-2xl bg-base-200/40 border border-base-200 text-xs text-base-content/70 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-base-content">Arti Angka di Sebelah Kanan:</strong> Angka tersebut menunjukkan <span className="font-semibold text-base-content">Hit Count (frekuensi berapa kali URL dicoba diakses)</span>. Panjang bar horizontal menggambarkan persentase intensitas dibandingkan path terbanyak.
        </div>
      </div>

      {/* Main List Table / Rows */}
      <div className="border border-base-200 rounded-2xl overflow-hidden bg-base-100 divide-y divide-base-200">
        {loading && paths.length === 0 ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-base-200/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPaths.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <Globe2 className="w-8 h-8 text-base-content/30 mx-auto" />
            <p className="text-xs font-semibold text-base-content/70">
              Belum ada riwayat path 4xx yang cocok.
            </p>
            <p className="text-[11px] text-base-content/50 max-w-sm mx-auto">
              Ketika ada bot atau user yang membuka URL tidak valid (seperti .env atau typo endpoint), data akan muncul otomatis di sini secara real-time.
            </p>
          </div>
        ) : (
          filteredPaths.map((item) => {
            const catBadge = getCategoryBadge(item.category);
            const isSelected = selectedItem?.path === item.path;

            return (
              <div key={item.path} className="transition-colors">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedItem(isSelected ? null : item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedItem(isSelected ? null : item);
                    }
                  }}
                  className={`w-full p-3 sm:p-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-base-200/40 transition-colors cursor-pointer select-none ${
                    isSelected ? "bg-base-200/60" : ""
                  }`}
                >
                  {/* Left Column: Path & Category */}
                  <div className="flex items-center gap-2.5 min-w-0 sm:w-1/2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-base-content truncate group-hover:text-primary transition-colors">
                      {item.path}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border shrink-0 ${catBadge.className}`}
                    >
                      {catBadge.label}
                    </span>
                  </div>

                  {/* Middle: Clean Proportional Progress Bar */}
                  <div className="flex items-center gap-3 w-full sm:w-1/2 justify-between sm:justify-end">
                    <div className="flex-1 max-w-[200px] bg-base-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(item.percentage, 5)}%` }}
                      />
                    </div>

                    {/* Right: Hit Count with Clear Unit Label */}
                    <div className="flex items-center gap-2 shrink-0 text-right">
                      <span className="font-mono font-bold text-xs sm:text-sm text-base-content">
                        {item.count.toLocaleString("id-ID")}{" "}
                        <span className="text-[11px] font-normal text-base-content/60">
                          hits
                        </span>
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-base-content/40 transition-transform ${
                          isSelected ? "rotate-90 text-primary" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isSelected && (
                  <div className="p-4 bg-base-200/40 border-t border-base-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-base-content flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-primary" />
                        Log Rinci: {item.path}
                      </span>
                      <span className="text-[11px] text-base-content/60">
                        Terakhir dicoba: {new Date(item.lastSeen).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-base-100 p-2.5 rounded-xl border border-base-200">
                        <span className="text-[10px] text-base-content/50 block">HTTP Method</span>
                        <span className="font-mono font-bold text-base-content">{item.method}</span>
                      </div>
                      <div className="bg-base-100 p-2.5 rounded-xl border border-base-200">
                        <span className="text-[10px] text-base-content/50 block">Kode Response</span>
                        <span className="font-mono font-bold text-rose-500">{item.lastStatusCode} Not Found</span>
                      </div>
                      <div className="bg-base-100 p-2.5 rounded-xl border border-base-200">
                        <span className="text-[10px] text-base-content/50 block">Kategori</span>
                        <span className="font-bold text-base-content">{catBadge.label}</span>
                      </div>
                      <div className="bg-base-100 p-2.5 rounded-xl border border-base-200">
                        <span className="text-[10px] text-base-content/50 block">IP Terakhir</span>
                        <span className="font-mono text-[11px] text-base-content/80 truncate block">
                          {item.recentIps.length > 0 ? item.recentIps.join(", ") : "127.0.0.1"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
