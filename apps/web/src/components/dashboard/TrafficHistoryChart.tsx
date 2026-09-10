"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TrafficHistoryItem {
  date: string;
  dayLabel: string;
  outbound: number;
  inbound: number;
  total: number;
}

interface TrafficHistoryChartProps {
  trafficHistory?: TrafficHistoryItem[];
  loading?: boolean;
  timeRange: "24h" | "7d" | "30d";
  setTimeRange: (range: "24h" | "7d" | "30d") => void;
}

export default function TrafficHistoryChart({
  trafficHistory = [],
  loading = false,
  timeRange,
  setTimeRange,
}: TrafficHistoryChartProps) {
  return (
    <div className="lg:col-span-3 bg-white border border-slate-200/90 shadow-sm p-5 sm:p-6 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Volume Pesan WhatsApp (Inbound vs Outbound)
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistik pengiriman broadcast/notifikasi vs pesan interaksi bot yang diterima
          </p>
        </div>

        {/* Filter Rentang Waktu */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 self-start sm:self-auto">
          {(
            [
              { id: "24h", label: "24 Jam" },
              { id: "7d", label: "7 Hari" },
              { id: "30d", label: "30 Hari" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTimeRange(t.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeRange === t.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legends */}
      <div className="flex items-center gap-4 text-xs font-semibold pt-1">
        <span className="flex items-center gap-1.5 text-emerald-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Outbound (Kirim)
        </span>
        <span className="flex items-center gap-1.5 text-blue-700">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Inbound (Terima)
        </span>
      </div>

      <div className="h-64 sm:h-72 w-full pt-1">
        {loading ? (
          <div className="h-full bg-slate-100/80 rounded-xl animate-pulse" />
        ) : trafficHistory && trafficHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trafficHistory}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorClientOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorClientInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
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
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  borderRadius: "0.75rem",
                  border: "none",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.15)",
                }}
              />
              <Area
                type="monotone"
                dataKey="outbound"
                name="Outbound (Kirim)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorClientOutbound)"
              />
              <Area
                type="monotone"
                dataKey="inbound"
                name="Inbound (Terima)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorClientInbound)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
            Belum ada data traffic pada periode ini
          </div>
        )}
      </div>
    </div>
  );
}
