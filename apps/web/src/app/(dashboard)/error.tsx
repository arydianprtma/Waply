"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Gagal Memuat Dashboard
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Terjadi kesalahan sementara pada modul dashboard. Silakan muat ulang komponen ini.
          </p>
          {error?.message && (
            <div className="p-3 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-600 text-left overflow-x-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary btn-sm rounded-xl text-white font-bold gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Ulang
          </button>
          <Link
            href="/dashboard"
            className="btn btn-outline btn-sm rounded-xl text-slate-700 font-bold gap-2"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
