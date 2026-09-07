"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
} from "lucide-react";

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
  quota: {
    planId: "FREE",
    planName: "Free Trial",
    maxMessages: 100,
    isUnlimitedMessages: false,
    usedMessages: 0,
    remainingMessages: 100,
    maxDevices: 1,
    usedDevices: 0,
    remainingDevices: 1,
  },
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

/** Simple inline SVG bar chart */
function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const BAR_W = 28;
  const GAP = 8;
  const H = 80;
  const totalW = data.length * (BAR_W + GAP);

  return (
    <svg
      viewBox={`0 0 ${totalW} ${H + 24}`}
      className="w-full"
      style={{ height: H + 24 }}
    >
      {data.map((d, i) => {
        const barH = Math.max(4, (d.count / maxVal) * H);
        const x = i * (BAR_W + GAP);
        const y = H - barH;
        const label = d.date.slice(5); // "MM-DD"
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={BAR_W}
              height={barH}
              rx={5}
              className="fill-primary/70"
            />
            {/* Hover tooltip via title */}
            <title>
              {d.date}: {d.count} pesan
            </title>
            <text
              x={x + BAR_W / 2}
              y={H + 14}
              textAnchor="middle"
              fontSize={9}
              className="fill-base-content/40"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const quota = data.quota || EMPTY.quota!;

  const metricCards = [
    {
      label: "Sisa Kuota Pesan",
      value: quota.isUnlimitedMessages
        ? "Unlimited"
        : `${quota.remainingMessages.toLocaleString("id-ID")} Pesan`,
      sub: quota.isUnlimitedMessages
        ? "Kirim pesan tanpa batas"
        : `Sisa dari total ${quota.maxMessages.toLocaleString("id-ID")} pesan (${quota.usedMessages} terpakai)`,
      icon: MessageSquare,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      highlight: true,
    },
    {
      label: "Slot Device WhatsApp",
      value: `${quota.usedDevices} / ${quota.maxDevices} Device`,
      sub: quota.remainingDevices > 0 ? `Tersedia ${quota.remainingDevices} slot lagi` : "Batas kuota device tercapai",
      icon: Smartphone,
      color: "text-sky-600",
      bg: "bg-sky-500/10",
    },
    {
      label: "Pesan Hari Ini",
      value: fmt(data.messagesToday),
      sub: `${fmt(data.totalMessages)} total pesan terkirim`,
      icon: Send,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Kontak",
      value: fmt(data.totalContacts),
      sub: "Kontak buku telepon terdaftar",
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-500/10",
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
          <p className="text-sm text-base-content/60 mt-1">
            Pantau performa gateway, aktivitas pesan, sisa kuota, dan status device Anda.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="btn btn-ghost btn-sm gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/dashboard/devices"
            className="btn btn-primary btn-sm md:btn-md gap-2 shadow-sm shadow-primary/20"
          >
            <Smartphone className="w-4 h-4" />
            Connect Device
          </Link>
          <Link
            href="/dashboard/messages/send"
            className="btn btn-outline btn-sm md:btn-md gap-2"
          >
            <Send className="w-4 h-4" />
            Kirim Pesan
          </Link>
        </div>
      </div>

      {/* Quota & Subscription Status Banner */}
      {data.quota && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/50">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Plan badge and Overview */}
            <div className="space-y-2 max-w-md">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Paket: {data.quota.planName}
                </span>
                {data.quota.planId === "FREE" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Sparkles className="w-3 h-3" />
                    Trial
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Sisa Kuota & Kapasitas Layanan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Pantau sisa kuota pesan WhatsApp dan batasan slot device yang terhubung pada akun Anda.
              </p>
            </div>

            {/* Middle: Quota Progress Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 lg:max-w-xl">
              {/* Message Quota Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    Sisa Kuota Pesan
                  </span>
                  <span className="text-xs font-extrabold text-emerald-300">
                    {data.quota.isUnlimitedMessages
                      ? "Unlimited"
                      : `${data.quota.remainingMessages.toLocaleString("id-ID")} / ${data.quota.maxMessages.toLocaleString("id-ID")}`}
                  </span>
                </div>

                {/* Progress bar */}
                {!data.quota.isUnlimitedMessages && (
                  <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (data.quota.usedMessages / data.quota.maxMessages) > 0.85
                          ? "bg-gradient-to-r from-amber-500 to-rose-500"
                          : "bg-gradient-to-r from-emerald-500 to-teal-400"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((data.quota.usedMessages / (data.quota.maxMessages || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>
                    {data.quota.isUnlimitedMessages
                      ? `${data.quota.usedMessages} pesan terkirim`
                      : `Terpakai: ${data.quota.usedMessages} (${Math.round((data.quota.usedMessages / (data.quota.maxMessages || 1)) * 100)}%)`}
                  </span>
                  <span>
                    {data.quota.isUnlimitedMessages
                      ? "Tanpa Batas"
                      : `Sisa: ${data.quota.remainingMessages} pesan`}
                  </span>
                </div>
              </div>

              {/* Device Quota Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                    Slot Device WhatsApp
                  </span>
                  <span className="text-xs font-extrabold text-sky-300">
                    {data.quota.usedDevices} / {data.quota.maxDevices} Device
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      data.quota.usedDevices >= data.quota.maxDevices
                        ? "bg-gradient-to-r from-amber-500 to-rose-500"
                        : "bg-gradient-to-r from-sky-400 to-blue-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((data.quota.usedDevices / (data.quota.maxDevices || 1)) * 100))}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>
                    {data.quota.usedDevices >= data.quota.maxDevices
                      ? "Slot Penuh"
                      : `Sisa: ${data.quota.remainingDevices} slot`}
                  </span>
                  <span>Batas: {data.quota.maxDevices} device</span>
                </div>
              </div>
            </div>

            {/* Right: Upgrade CTA Button */}
            <div className="flex lg:flex-col items-center justify-end shrink-0">
              <Link
                href="/dashboard/billing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Upgrade Paket</span>
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
              className="bg-white border border-slate-200/80 shadow-sm p-6 rounded-2xl transition-all hover:shadow-md"
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
        {/* Bar Chart — 7-day message trend */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 shadow-sm p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Tren Pesan (7 Hari Terakhir)</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Jumlah pesan terkirim per hari
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          {loading ? (
            <div className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ) : data.messageTrend.every((d) => d.count === 0) ? (
            <div className="h-28 flex items-center justify-center text-xs text-slate-400 font-medium">
              Belum ada data pesan terkirim
            </div>
          ) : (
            <BarChart data={data.messageTrend} />
          )}
        </div>

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
