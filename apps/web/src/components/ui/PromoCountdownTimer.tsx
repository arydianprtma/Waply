"use client";

import React from "react";
import { Timer } from "lucide-react";
import { PlanDiscountStatus } from "@/lib/billing-types";

interface PromoCountdownTimerProps {
  status: PlanDiscountStatus;
  variant?: "badge" | "card" | "minimal";
  className?: string;
}

export function PromoCountdownTimer({
  status,
  variant = "badge",
  className = "",
}: PromoCountdownTimerProps) {
  if (!status.hasSchedule || !status.hasTimer || !status.isDiscountActive) {
    return null;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");
  const { remainingDays, remainingHours, remainingMinutes, remainingSeconds, isUrgentCountdown } = status;

  if (variant === "minimal") {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg border shadow-2xs ${
          isUrgentCountdown
            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
            : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
        } ${className}`}
      >
        <Timer className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>Sisa {status.countdownFormatted}</span>
      </span>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`p-3 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isUrgentCountdown
            ? "bg-gradient-to-r from-rose-50/90 via-orange-50/50 to-rose-50/90 border-rose-200 text-rose-950 dark:from-rose-950/30 dark:via-slate-900 dark:to-rose-950/30 dark:border-rose-900/60 dark:text-rose-100"
            : "bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-200/60 dark:border-slate-700 shadow-2xs text-rose-600 dark:text-rose-400">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>{isUrgentCountdown ? "Flash Promo Berakhir Segera" : "Masa Berlaku Promo"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Selesaikan pesanan sebelum batas promo berakhir
            </p>
          </div>
        </div>

        {/* Tactile Digital Timer Display */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {remainingDays > 0 && (
            <>
              <div className="flex flex-col items-center">
                <span className="font-mono font-black text-xs px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-900 dark:text-white min-w-[28px] text-center">
                  {remainingDays}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Hari</span>
              </div>
              <span className="font-bold text-slate-400 pb-3">:</span>
            </>
          )}

          <div className="flex flex-col items-center">
            <span className="font-mono font-black text-xs px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-900 dark:text-white min-w-[28px] text-center">
              {pad(remainingHours)}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Jam</span>
          </div>

          <span className="font-bold text-slate-400 pb-3">:</span>

          <div className="flex flex-col items-center">
            <span className="font-mono font-black text-xs px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-900 dark:text-white min-w-[28px] text-center">
              {pad(remainingMinutes)}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Mnt</span>
          </div>

          <span className="font-bold text-slate-400 pb-3">:</span>

          <div className="flex flex-col items-center">
            <span className="font-mono font-black text-xs px-2 py-1 rounded-lg bg-rose-600 text-white shadow-2xs border border-rose-500 min-w-[28px] text-center">
              {pad(remainingSeconds)}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-rose-500 mt-0.5">Dtk</span>
          </div>
        </div>
      </div>
    );
  }

  // Default: variant === "badge" (Compact tactile pill for pricing cards & modals)
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shadow-2xs transition-all ${
        isUrgentCountdown
          ? "bg-rose-50/90 border-rose-200/80 text-rose-950 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-100"
          : "bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
      } ${className}`}
    >
      <div className="flex items-center gap-1">
        <Timer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-rose-800 dark:text-rose-300">
          Sisa
        </span>
      </div>

      <div className="flex items-center gap-1 font-mono text-[11px] font-black">
        {remainingDays > 0 && (
          <>
            <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs">
              {remainingDays}h
            </span>
            <span className="text-slate-300 dark:text-slate-600 font-bold">:</span>
          </>
        )}

        <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs">
          {pad(remainingHours)}
        </span>
        <span className="text-slate-300 dark:text-slate-600 font-bold">:</span>
        <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs">
          {pad(remainingMinutes)}
        </span>
        <span className="text-slate-300 dark:text-slate-600 font-bold">:</span>
        <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white border border-rose-500 shadow-2xs">
          {pad(remainingSeconds)}
        </span>
      </div>
    </div>
  );
}
