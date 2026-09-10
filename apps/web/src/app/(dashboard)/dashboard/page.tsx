"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  MessageSquare,
  Send,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Users,
  Bot,
  Radio,
  FileText,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
} from "lucide-react";

const TrafficHistoryChart = dynamic(
  () => import("@/components/dashboard/TrafficHistoryChart"),
  {
    ssr: false,
    loading: () => (
      <div className="lg:col-span-3 bg-white border border-slate-200/90 shadow-sm p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse" />
        <div className="h-64 sm:h-72 w-full bg-slate-100/80 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400 font-semibold">
          Memuat visual grafik...
        </div>
      </div>
    ),
  }
);

interface QuotaInfo {
  planId: string;
  planName: string;
  maxMessages: number;
  isUnlimitedMessages: boolean;
  usedMessages: number;
  remainingMessages: number;
  maxDevices: number;
  usedDevices: number;
  remainingDevices: number;
}

interface AnalyticsData {
  totalMessages: number;
  messagesToday: number;
  totalContacts: number;
  totalBroadcasts: number;
  activeBroadcasts: number;
  totalAutoReplies: number;
  activeAutoReplies: number;
  totalTemplates: number;
  totalWebhookLogs: number;
  messageTrend: { date: string; count: number }[];
  trafficHistory?: {
    date: string;
    dayLabel: string;
    outbound: number;
    inbound: number;
    total: number;
  }[];
  recentActivity: { type: string; label: string; time: string }[];
  quota?: QuotaInfo;
}

const EMPTY: AnalyticsData = {
  totalMessages: 0,
  messagesToday: 0,
  totalContacts: 0,
  totalBroadcasts: 0,
  activeBroadcasts: 0,
  totalAutoReplies: 0,
  activeAutoReplies: 0,
  totalTemplates: 0,
  totalWebhookLogs: 0,
  messageTrend: [],
  recentActivity: [],
};

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAnalytics = async (range = timeRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      //
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const metricCards = [
    {
      label: "Pesan Hari Ini",
      value: fmt(data.messagesToday),
      sub: `${fmt(data.totalMessages)} total terkirim`,
      icon: MessageSquare,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Kontak",
      value: fmt(data.totalContacts),
      sub: "Kontak terdaftar",
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      label: "Broadcast",
      value: fmt(data.totalBroadcasts),
      sub: `${data.activeBroadcasts} sedang berjalan`,
      icon: Radio,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Aturan Auto-Reply",
      value: fmt(data.totalAutoReplies),
      sub: `${data.activeAutoReplies} aturan aktif`,
      icon: Bot,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const quickLinks = [
    { href: "/dashboard/messages/send", label: "Kirim Pesan", icon: Send },
    { href: "/dashboard/broadcast", label: "Broadcast", icon: Radio },
    { href: "/dashboard/automation", label: "Auto-Reply", icon: Bot },
    { href: "/dashboard/templates", label: "Templates", icon: FileText },
    { href: "/dashboard/webhooks", label: "Webhooks", icon: Zap },
    { href: "/dashboard/devices", label: "Connect Device", icon: Smartphone },
  ];

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-1">
            Pantau performa gateway, aktivitas pesan, sisa kuota, dan status device Anda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="btn btn-ghost btn-sm gap-1.5 px-2.5"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs">Refresh</span>
          </button>
          <Link
            href="/dashboard/devices"
            className="btn btn-primary btn-sm gap-1.5 shadow-sm shadow-primary/20 text-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Connect Device
          </Link>
          <Link
            href="/dashboard/messages/send"
            className="btn btn-outline btn-sm gap-1.5 text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            Kirim Pesan
          </Link>
        </div>
      </div>

      {/* Quota & Subscription Status Card */}
      {data.quota && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Plan details */}
            <div className="space-y-1.5 max-w-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Paket: {data.quota.planName}
                </span>
                {data.quota.planId === "FREE" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Trial
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Kapasitas & Kuota Akun
              </h2>
              <p className="text-xs text-slate-500">
                Pantau sisa kuota pesan WhatsApp dan alokasi slot perangkat aktif pada akun Anda.
              </p>
            </div>

            {/* Middle: Quota Progress Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 lg:max-w-2xl">
              {/* Message Quota */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Sisa Kuota Pesan
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {data.quota.isUnlimitedMessages
                      ? "Unlimited"
                      : `${data.quota.remainingMessages.toLocaleString("id-ID")} / ${data.quota.maxMessages.toLocaleString("id-ID")}`}
                  </span>
                </div>

                {/* Progress bar */}
                {!data.quota.isUnlimitedMessages && (
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        (data.quota.usedMessages / (data.quota.maxMessages || 1)) > 0.85
                          ? "bg-rose-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(4, Math.round((data.quota.usedMessages / (data.quota.maxMessages || 1)) * 100)))}%`,
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>
                    {data.quota.isUnlimitedMessages
                      ? `${data.quota.usedMessages} terkirim`
                      : `${data.quota.usedMessages} terpakai (${Math.round((data.quota.usedMessages / (data.quota.maxMessages || 1)) * 100)}%)`}
                  </span>
                  <span>
                    {data.quota.isUnlimitedMessages
                      ? "Tanpa Batas"
                      : `Sisa: ${data.quota.remainingMessages} pesan`}
                  </span>
                </div>
              </div>

              {/* Device Quota */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-sky-600" />
                    Slot Device WhatsApp
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {data.quota.usedDevices} / {data.quota.maxDevices} Device
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      data.quota.usedDevices >= data.quota.maxDevices
                        ? "bg-amber-500"
                        : "bg-sky-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(data.quota.usedDevices > 0 ? 10 : 0, Math.round((data.quota.usedDevices / (data.quota.maxDevices || 1)) * 100)))}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>
                    {data.quota.usedDevices >= data.quota.maxDevices
                      ? "Semua slot terpakai"
                      : `${data.quota.remainingDevices} slot tersedia`}
                  </span>
                  <span>Batas: {data.quota.maxDevices} device</span>
                </div>
              </div>
            </div>

            {/* Right: Upgrade CTA Button */}
            <div className="flex lg:flex-col items-center justify-end shrink-0">
              <Link
                href="/dashboard/billing"
                className="btn btn-outline btn-sm md:btn-md border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 gap-2 text-slate-700 font-semibold text-xs md:text-sm"
              >
                <span>Kelola Paket</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200/80 shadow-sm p-4 sm:p-6 rounded-2xl transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shadow-inner`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                {loading ? (
                  <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {card.value}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Message Volume Area Chart (3 cols) */}
        <TrafficHistoryChart
          trafficHistory={data.trafficHistory}
          loading={loading}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
        />

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 shadow-sm p-6 rounded-2xl">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Aktivitas Terbaru</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data.recentActivity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-28 text-xs text-slate-400 font-medium">
              Belum ada aktivitas tercatat
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.recentActivity.map((act, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    act.type === "webhook"
                      ? "bg-violet-50 text-violet-600 border border-violet-100"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  }`}>
                    {act.type === "webhook" ? (
                      <Zap className="w-3.5 h-3.5" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-slate-800 font-medium truncate">{act.label}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{timeAgo(act.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Aksi Cepat
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all p-4 rounded-2xl text-center group shadow-sm"
              >
                <div className="w-11 h-11 mx-auto rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-2.5 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {link.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Summary Statistics Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Ringkasan Modul
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[
            { label: "Pustaka Template", value: `${data.totalTemplates} item`, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Log Webhook", value: `${data.totalWebhookLogs} log`, icon: Zap, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Total Pesan Terkirim", value: `${data.totalMessages} pesan`, icon: Send, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Bot Auto-Reply Aktif", value: `${data.activeAutoReplies} dari ${data.totalAutoReplies}`, icon: Bot, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 border border-slate-100`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 truncate">{stat.label}</p>
                  {loading ? (
                    <div className="h-4 w-12 bg-slate-100 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{stat.value}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
