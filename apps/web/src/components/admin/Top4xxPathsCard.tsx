"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  AlertTriangle,
  FileCode,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
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
        return { label: ".env Probe", color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900" };
      case "API_MISMATCH":
        return { label: "API Typo", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900" };
      case "ADMIN_SCAN":
        return { label: "Admin Scan", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900" };
      case "SOURCE_LEAK":
        return { label: "Source Probe", color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900" };
      default:
        return { label: "404 Path", color: "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" };
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Top 4xx Paths
            </h3>
            {summary && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                {summary.totalHits} Total Hits
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Jalur URL & endpoint tidak ditemukan yang paling sering dicari atau di-scan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchScans();
            }}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors text-xs flex items-center gap-1"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari path URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Semua" },
            { id: "ENV_LEAK_PROBE", label: ".env Probe" },
            { id: "API_MISMATCH", label: "API Typo" },
            { id: "ADMIN_SCAN", label: "Admin Scan" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Path List (Exact Look of the user screenshot) */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px] overflow-y-auto pr-1">
        {loading && paths.length === 0 ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredPaths.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-medium">
            Tidak ada path 4xx yang cocok dengan filter pencarian.
          </div>
        ) : (
          filteredPaths.map((item, idx) => {
            const catBadge = getCategoryBadge(item.category);
            return (
              <div
                key={item.path + idx}
                onClick={() => setSelectedItem(selectedItem?.path === item.path ? null : item)}
                className="py-2.5 px-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer group flex items-center justify-between gap-4"
              >
                {/* Left: Path string */}
                <div className="min-w-[150px] sm:min-w-[220px] max-w-[260px] sm:max-w-[340px] truncate flex items-center gap-2">
                  <span className="font-mono text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {item.path}
                  </span>
                  <span className={`hidden md:inline-block px-1.5 py-0.2 text-[9px] font-bold rounded border shrink-0 ${catBadge.color}`}>
                    {catBadge.label}
                  </span>
                </div>

                {/* Middle: Horizontal Progress Bar with blue dot accent */}
                <div className="flex-1 max-w-[280px] hidden sm:flex items-center">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden relative">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500 relative"
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    >
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-900" />
                    </div>
                  </div>
                </div>

                {/* Right: Hit Count */}
                <div className="flex items-center gap-2 shrink-0 text-right min-w-[45px]">
                  <span className="font-bold font-mono text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                    {item.count.toLocaleString()}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${selectedItem?.path === item.path ? "rotate-90 text-blue-600" : ""}`} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Accordion for Selected Path */}
      {selectedItem && (
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 rounded-xl space-y-2 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between font-semibold text-blue-950 dark:text-blue-200">
            <span className="flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              Detail Aktivitas: {selectedItem.path}
            </span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              Terakhir dilihat: {new Date(selectedItem.lastSeen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <span className="text-[10px] text-slate-500 block font-medium">HTTP Method</span>
              <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{selectedItem.method}</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <span className="text-[10px] text-slate-500 block font-medium">Status Code</span>
              <span className="font-bold font-mono text-rose-600">{selectedItem.lastStatusCode} Not Found</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <span className="text-[10px] text-slate-500 block font-medium">Kategori Probe</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">{getCategoryBadge(selectedItem.category).label}</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <span className="text-[10px] text-slate-500 block font-medium">Recent IP Probers</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px] truncate block">
                {selectedItem.recentIps.length > 0 ? selectedItem.recentIps.join(", ") : "127.0.0.1"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
