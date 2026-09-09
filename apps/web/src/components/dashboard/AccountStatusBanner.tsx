"use client";
import { useState } from "react";
import { ShieldAlert, AlertTriangle, X, Mail } from "lucide-react";
import { useUserSession } from "@/lib/use-user-session";

export function AccountStatusBanner() {
  const { user } = useUserSession();
  const [dismissed, setDismissed] = useState(false);

  // If dismissed or if user is banned/suspended, full AccountLockedScreen is rendered by DashboardContentGuard
  if (dismissed || !user || !user.status || user.status === "ACTIVE" || user.status === "BANNED" || user.status === "SUSPENDED") {
    return null;
  }

  const isBanned = user.status === "BANNED";
  const userStatus = {
    status: user.status,
    banReason: user.banReason,
  };

  return (
    <div className={`mb-6 rounded-2xl p-4 flex items-start justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 border ${
      isBanned
        ? "bg-rose-50 border-rose-300 text-rose-900"
        : "bg-amber-50 border-amber-300 text-amber-900"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isBanned ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
        }`}>
          {isBanned ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold">
            {isBanned ? "Akun Anda Diblokir (Banned)" : "Akun Anda Ditangguhkan Sementara (Suspended)"}
          </h4>
          <p className="text-xs opacity-90">
            {isBanned
              ? "Akun Anda telah dinonaktifkan oleh administrator karena melanggar ketentuan layanan."
              : "Akun Anda saat ini dalam status penangguhan sementara. Beberapa fitur dibatasi."}
          </p>
          {userStatus.banReason && (
            <div className="p-2 rounded-lg bg-white/70 border border-rose-200 text-xs font-mono mt-1">
              <strong>Alasan:</strong> {userStatus.banReason}
            </div>
          )}
          <p className="text-[11px] opacity-75 mt-1">
            Jika Anda merasa ini adalah kesalahan, silakan hubungi tim bantuan Waply di <strong>support@waply.id</strong>.
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors shrink-0"
        title="Tutup Notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
