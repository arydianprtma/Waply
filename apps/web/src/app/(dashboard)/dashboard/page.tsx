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
} from "lucide-react";

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

  const metricCards = [
    {
      label: "Pesan Hari Ini",
      value: fmt(data.messagesToday),
      sub: `${fmt(data.totalMessages)} total`,
      icon: MessageSquare,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Kontak",
      value: fmt(data.totalContacts),
      sub: "Kontak terdaftar",
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-500/10",
    },
    {
      label: "Broadcast",
      value: fmt(data.totalBroadcasts),
      sub: `${data.activeBroadcasts} sedang berjalan`,
      icon: Radio,
      color: "text-violet-600",
      bg: "bg-violet-500/10",
    },
    {
      label: "Aturan Auto-Reply",
      value: fmt(data.totalAutoReplies),
      sub: `${data.activeAutoReplies} aktif`,
      icon: Bot,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
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
            Pantau performa gateway, aktivitas pesan, dan status keamanan device Anda.
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
