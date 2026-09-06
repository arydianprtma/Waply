"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  Radio,
  Bot,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
  ScrollText,
  Activity,
  Cpu,
  Server,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  UserCheck,
  Smartphone,
  Flame,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface AdminStats {
  overview: {
    totalUsers?: number;
    activeSubscribedUsers?: number;
    freeUsers?: number;
    bannedUsers?: number;
    totalMessages: number;
    messagesToday: number;
    totalContacts: number;
    totalBroadcasts: number;
    activeBroadcasts: number;
    totalAutoReplies: number;
    activeAutoReplies: number;
    totalTemplates: number;
    totalWebhookLogs: number;
    totalInvoices: number;
    paidInvoices: number;
    totalRevenue: number;
    mrr?: number;
    blacklistCount: number;
    botTriggerCount: number;
  };
  systemHealth: {
    gatewayOnline: boolean;
    latencyMs: number;
    activeDevices: number;
    totalDevices: number;
    uptimeSeconds: number;
    queueThroughput: string;
    nodeMemoryMb: number;
  };
  trafficHistory: {
    date: string;
    dayLabel: string;
    outbound: number;
    inbound: number;
    total: number;
  }[];
  planDistribution: Record<string, number>;
  topSenders: {
    id: string;
    name: string;
    email: string;
    planId: string;
    messagesUsed: number;
    devicesCount: number;
    status: string;
  }[];
  recentUsers: any[];
  recentInvoices: any[];
  systemLogs: any[];
  autoReplyLogs: any[];
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "#94a3b8",
  STARTER: "#38bdf8",
  PRO: "#10b981",
  BUSINESS: "#8b5cf6",
  ENTERPRISE: "#f59e0b",
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
}

function formatUptime(sec: number): string {
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  if (days > 0) return `${days}h ${hours}j ${mins}m`;
  if (hours > 0) return `${hours}j ${mins}m`;
  return `${mins} menit`;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${timeRange}`);
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (e) {
      console.error("Failed to load admin stats:", e);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const ov = stats?.overview;
  const sh = stats?.systemHealth;

  const cards = [
    {
      label: "Total User Terdaftar",
      value: ov?.totalUsers ?? 0,
      sub: `${ov?.activeSubscribedUsers ?? 0} berlangganan aktif`,
      icon: Users,
      color: "bg-primary/10 text-primary",
      link: "/admin/users",
    },
    {
      label: "Total Revenue (PAID)",
      value: formatIDR(ov?.totalRevenue ?? 0),
      sub: `MRR: ${formatIDR(ov?.mrr ?? 0)}`,
      icon: CreditCard,
      color: "bg-emerald-500/10 text-emerald-600",
      link: "/admin/plans",
    },
    {
      label: "Pesan Hari Ini",
      value: (ov?.messagesToday ?? 0).toLocaleString("id-ID"),
      sub: `${(ov?.totalMessages ?? 0).toLocaleString("id-ID")} total terkirim`,
      icon: MessageSquare,
      color: "bg-sky-500/10 text-sky-600",
      link: "/admin/messages",
    },
    {
      label: "Total Kontak Terdata",
      value: (ov?.totalContacts ?? 0).toLocaleString("id-ID"),
      sub: "Di seluruh buku telepon",
      icon: Users,
      color: "bg-indigo-500/10 text-indigo-600",
      link: "/admin/users",
    },
    {
      label: "Bot & Auto-Reply",
      value: (ov?.botTriggerCount ?? 0).toLocaleString("id-ID"),
      sub: `${ov?.activeAutoReplies ?? 0} aturan aktif`,
      icon: Bot,
      color: "bg-violet-500/10 text-violet-600",
      link: "/admin/logs",
    },
    {
      label: "Kampanye Broadcast",
      value: ov?.totalBroadcasts ?? 0,
      sub: `${ov?.activeBroadcasts ?? 0} antrean berjalan`,
      icon: Radio,
      color: "bg-amber-500/10 text-amber-600",
      link: "/admin/announcements",
    },
    {
      label: "Blacklist / DND",
      value: ov?.blacklistCount ?? 0,
      sub: "Nomor diblokir",
      icon: ShieldCheck,
      color: "bg-rose-500/10 text-rose-600",
      link: "/admin/devices",
    },
    {
      label: "Template Pesan",
      value: ov?.totalTemplates ?? 0,
      sub: "Template spintax",
      icon: ScrollText,
      color: "bg-cyan-500/10 text-cyan-600",
      link: "/admin/announcements",
    },
  ];

  // Pie chart data for Plan Distribution
  const pieData = Object.entries(stats?.planDistribution || {}).map(([name, value]) => ({
    name,
    value,
    color: PLAN_COLORS[name] || "#94a3b8",
  })).filter((item) => item.value > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header + Global Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Admin Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau performa traffic, revenue, pengguna aktif, dan kesehatan engine WhatsApp secara real-time.
          </p>
        </div>

        {/* Filter Rentang Waktu */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs max-w-full overflow-x-auto">
          <div className="flex items-center gap-1 px-2 text-xs font-bold text-slate-400">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Rentang:</span>
          </div>
          {(
            [
              { id: "24h", label: "24 Jam" },
              { id: "7d", label: "7 Hari" },
              { id: "30d", label: "30 Hari" },
              { id: "all", label: "Semua" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeRange === t.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={fetchStats}
            title="Muat Ulang Data"
            className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-slate-700 ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* POIN 2: WhatsApp Engine & System Health Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Engine Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sh?.gatewayOnline ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gateway Engine</div>
              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${sh?.gatewayOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                {sh?.gatewayOnline ? "Online & Ready" : "Offline / Unreachable"}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
            {sh?.latencyMs ? `${sh.latencyMs}ms` : (sh?.gatewayOnline ? "< 10ms" : "-")}
          </span>
        </div>

        {/* WhatsApp Devices Ratio */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Device WhatsApp</div>
              <div className="text-sm font-extrabold text-slate-900">
                {sh?.activeDevices ?? 0} / {sh?.totalDevices ?? 0} Connected
              </div>
            </div>
          </div>
          <Link
            href="/admin/devices"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            Lihat <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Queue & Throughput */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Throughput Rate</div>
              <div className="text-sm font-extrabold text-slate-900">
                {sh?.queueThroughput || "0 msg/s"}
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${sh?.gatewayOnline ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-500"}`}>
            {sh?.gatewayOnline ? "Engine Ready" : "Standby"}
          </span>
        </div>

        {/* Server Memory & Uptime */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Memory & Uptime</div>
              <div className="text-sm font-extrabold text-slate-900">
                {sh?.nodeMemoryMb || 0} MB <span className="text-xs text-slate-400 font-normal">/ {formatUptime(sh?.uptimeSeconds || 0)}</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
            Stable
          </span>
        </div>
      </div>

      {/* Core Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.link}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-primary/40 hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-500 font-bold">{card.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              {loading ? (
                <div className="h-6 w-20 bg-slate-100 rounded animate-pulse my-1" />
              ) : (
                <p className="text-xl font-black text-slate-900 tracking-tight">{card.value}</p>
              )}
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* POIN 1: Grafik & Visualisasi Tren (Traffic Volume & User Plan Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Message Volume Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Volume Pesan WhatsApp (Inbound vs Outbound)
              </div>
              <p className="text-xs text-slate-500">
                Statistik pengiriman broadcast/notifikasi vs pesan interaksi bot yang diterima
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Outbound (Kirim)
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 rounded-full bg-blue-500" /> Inbound (Terima)
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {mounted && stats?.trafficHistory ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.trafficHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="dayLabel"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "16px",
                      border: "none",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#e2e8f0" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="outbound"
                    name="Pesan Terkirim"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorOutbound)"
                  />
                  <Area
                    type="monotone"
                    dataKey="inbound"
                    name="Pesan Diterima"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorInbound)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Memuat grafik data...
              </div>
            )}
          </div>
        </div>

        {/* Right: User Plan Distribution (1 col) */}
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Distribusi Paket Pengguna
            </div>
            <p className="text-xs text-slate-500">
              Perbandingan komposisi tier langganan pengguna
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {mounted && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">Tidak ada data paket</div>
            )}
          </div>

          {/* Breakdown progress bar list */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {Object.entries(stats?.planDistribution || {}).map(([plan, count]) => {
              const total = stats?.overview.totalUsers || 1;
              const pct = Math.round((count / total) * 100);
              const color = PLAN_COLORS[plan] || "#94a3b8";
              return (
                <div key={plan} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {plan}
                    </span>
                    <span>{count} user ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* POIN 4: Top Active Consumers & Recent Registered Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Active Senders */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm text-slate-900">Pengguna Paling Aktif (Top Senders)</h3>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              Kelola User <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.topSenders && stats.topSenders.length > 0 ? (
              stats.topSenders.map((u, idx) => (
                <div key={u.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0
                        ? "bg-amber-100 text-amber-800"
                        : idx === 1
                        ? "bg-slate-200 text-slate-800"
                        : idx === 2
                        ? "bg-orange-100 text-orange-800"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-2">
                        {u.name}
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                          u.planId === "PRO"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : u.planId === "BUSINESS"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {u.planId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-slate-900">
                      {u.messagesUsed.toLocaleString("id-ID")} <span className="text-[10px] text-slate-400 font-normal">pesan</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400">
                      {u.devicesCount} Device WhatsApp
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">Belum ada data aktivitas pesan</div>
            )}
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">User Baru Terdaftar</h3>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              Semua User ({ov?.totalUsers || 0}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((u) => (
                <div key={u.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.status === "BANNED"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      {u.status === "BANNED" ? "BANNED" : u.planId || "FREE"}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{timeAgo(u.createdAt)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">Belum ada user terdaftar</div>
            )}
          </div>
        </div>
      </div>

      {/* System Logs + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Logs */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-700" />
              <h3 className="font-extrabold text-sm text-slate-900">System Activity & Warnings</h3>
            </div>
            <Link
              href="/admin/logs"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              Lihat Detail Logs <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !stats?.systemLogs.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500" />
              <p className="text-xs font-bold">Semua sistem beroperasi normal tanpa peringatan</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {stats.systemLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 px-6 py-3 hover:bg-slate-50/70 transition-colors">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 mt-0.5 ${
                      log.level === "ERROR"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {log.level}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 truncate">{log.message}</p>
                    <p className="text-[10px] text-slate-400">{timeAgo(log.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Riwayat Pembayaran & Invoice</h3>
            </div>
            <Link
              href="/admin/plans"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              Kelola Paket <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !stats?.recentInvoices.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <CreditCard className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs">Belum ada transaksi invoice</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 transition-colors">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">Paket {inv.planId}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {inv.orderId ? inv.orderId.slice(0, 24) : inv.id}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{formatIDR(inv.amount)}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
