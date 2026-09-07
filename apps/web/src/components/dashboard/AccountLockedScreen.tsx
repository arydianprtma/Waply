"use client";

import { ShieldAlert, AlertTriangle, LogOut, Mail, MessageSquare, Lock } from "lucide-react";
import { performLogout } from "@/lib/auth-logout";
import { CachedUser } from "@/lib/use-user-session";

interface AccountLockedScreenProps {
  user: CachedUser;
}

export function AccountLockedScreen({ user }: AccountLockedScreenProps) {
  const isBanned = user.status === "BANNED";

  const handleLogout = async () => {
    await performLogout("/login");
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Lock / Alert Icon */}
        <div
          className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-lg ${
            isBanned
              ? "bg-rose-100 text-rose-600 border border-rose-200 shadow-rose-500/10"
              : "bg-amber-100 text-amber-600 border border-amber-200 shadow-amber-500/10"
          }`}
        >
          {isBanned ? (
            <ShieldAlert className="w-10 h-10" />
          ) : (
            <Lock className="w-10 h-10" />
          )}
        </div>

        {/* Title & Status Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
            <span
              className={`w-2 h-2 rounded-full ${
                isBanned ? "bg-rose-500" : "bg-amber-500"
              } animate-pulse`}
            />
            {isBanned ? "Status: Akun Diblokir (Banned)" : "Status: Ditangguhkan (Suspended)"}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isBanned
              ? "Akses Akun Anda Telah Dinonaktifkan"
              : "Akses Akun Anda Sedang Ditangguhkan"}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {isBanned
              ? "Akun Anda dinonaktifkan oleh administrator karena terindikasi melanggar ketentuan layanan atau kebijakan penggunaan wajar."
              : "Akun Anda saat ini berada dalam status penangguhan sementara oleh administrator. Seluruh aktivitas gateway dibatasi."}
          </p>
        </div>

        {/* Reason Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
            Alasan Penonaktifan / Catatan Admin:
          </span>
          <p className="text-xs font-semibold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
            {user.banReason || "Pelanggaran terhadap syarat dan kebijakan sistem Sendora."}
          </p>
        </div>

        {/* Feature Lock Notice */}
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 text-rose-900 text-xs text-left flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Semua Fitur Telah Dikunci:</span>
            <p className="text-rose-800 text-[11px] leading-relaxed">
              Koneksi WhatsApp Gateway Baileys, pengiriman pesan broadcast massal, otomasi auto-reply, manajemen kontak, dan akses REST API Key telah diblokir secara total demi keamanan sistem.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="mailto:support@sendora.id?subject=Banding%20Akun%20Sendora%20(ID:%20"
            className="btn btn-outline btn-sm sm:btn-md rounded-2xl font-bold w-full sm:w-auto gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Mail className="w-4 h-4 text-primary" /> Hubungi Dukungan Support
          </a>

          <button
            onClick={handleLogout}
            className="btn btn-error btn-sm sm:btn-md rounded-2xl font-bold w-full sm:w-auto gap-2 text-white shadow-lg shadow-rose-600/20"
          >
            <LogOut className="w-4 h-4" /> Keluar dari Akun (Logout)
          </button>
        </div>
      </div>
    </div>
  );
}
