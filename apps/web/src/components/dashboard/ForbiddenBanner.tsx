"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ShieldAlert, X } from "lucide-react";

export function ForbiddenBanner() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "forbidden") {
      setShow(true);
      // Clean query parameter from browser address bar
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  }, [searchParams]);

  if (!show) return null;

  return (
    <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-900">403 Akses Ditolak</h4>
          <p className="text-xs text-rose-700 mt-0.5">
            Halaman Admin Panel dan fiturnya hanya dapat diakses oleh akun dengan Role <strong>Super Admin</strong>.
          </p>
        </div>
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-rose-500 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-100 transition-colors"
        title="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
