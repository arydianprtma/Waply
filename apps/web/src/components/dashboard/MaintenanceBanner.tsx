"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Wrench, X, RefreshCw } from "lucide-react";
import { useUserSession } from "@/lib/use-user-session";

export function MaintenanceBanner() {
  const { user } = useUserSession();
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string; allowAdminBypass?: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkMaintenance = () => {
    fetch("/api/system/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.maintenance) {
          setMaintenance(data.maintenance);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    checkMaintenance();
    // Poll maintenance status every 60 seconds to avoid spamming dev server
    const interval = setInterval(checkMaintenance, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!maintenance || !maintenance.enabled) {
    return null;
  }

  // If user is Admin, show an admin info pill
  if (user?.role === "admin") {
    return (
      <div className="mb-4 rounded-2xl py-2 px-4 bg-amber-50 border border-amber-300 text-amber-900 shadow-xs flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>
            <strong>Mode Maintenance Sedang Aktif:</strong> Pengguna reguler saat ini dibatasi oleh pesan pemeliharaan.
          </span>
        </div>
        <a
          href="/admin/settings"
          className="btn btn-xs bg-amber-200 hover:bg-amber-300 text-amber-950 border-none font-bold rounded-lg"
        >
          Kelola di Settings
        </a>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-3xl p-5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border-2 border-amber-400 text-amber-950 shadow-md animate-in fade-in slide-in-from-top-3 duration-300 flex items-start justify-between">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
          <Wrench className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-extrabold text-amber-950">
              Pemberitahuan: Sistem Sedang Dalam Pemeliharaan
            </h4>
            <span className="badge badge-warning text-amber-950 badge-sm font-extrabold px-2.5">
              MAINTENANCE MODE
            </span>
          </div>
          <p className="text-xs md:text-sm text-amber-900 leading-relaxed font-medium">
            {maintenance.message || "Sistem sedang dalam proses pemeliharaan terjadwal untuk peningkatan performa server. Beberapa fitur mungkin dibatasi sementara."}
          </p>
          <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-800 font-semibold">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Status diperbarui secara real-time. Halaman akan aktif kembali otomatis setelah selesai.</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-800 hover:text-amber-950 p-1.5 rounded-xl hover:bg-amber-200/60 transition-colors shrink-0"
        title="Tutup Notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
