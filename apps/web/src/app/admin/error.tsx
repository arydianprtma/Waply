"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard, ShieldCheck } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Kendala Panel Admin
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Terjadi kendala saat memuat data panel admin. Silakan coba muat ulang atau kembali ke menu admin overview.
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
            Coba Lagi
          </button>
          <Link
            href="/admin"
            className="btn btn-outline btn-sm rounded-xl text-slate-700 font-bold gap-2"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Admin Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
