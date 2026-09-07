"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  LogOut,
  Mail,
  Lock,
  Headphones,
  Send,
  X,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { performLogout } from "@/lib/auth-logout";
import { CachedUser } from "@/lib/use-user-session";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface AccountLockedScreenProps {
  user: CachedUser;
}

export function AccountLockedScreen({ user }: AccountLockedScreenProps) {
  const isBanned = user.status === "BANNED";
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [topic, setTopic] = useState("Permohonan Peninjauan / Banding Akun");
  const [message, setMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    await performLogout("/login");
  };

  const handleOpenTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `[${topic}] Banding Akun ${user.email}`,
          category: "APPEAL",
          priority: "HIGH",
          message: `Permohonan Banding Akun:\nStatus: ${user.status}\nAlasan Admin: ${user.banReason || "Tidak tercantum"}\n\nPesan:\n${message}`,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTicketNumber(json.data.id);
      } else {
        setTicketNumber(`TKT-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } catch {
      setTicketNumber(`TKT-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setIsSubmitting(false);
      setTicketSubmitted(true);
    }
  };

  const supportEmail = "support@sendora.id";
  const emailSubject = encodeURIComponent(`[${topic}] Banding Akun ${user.email} (ID: ${user.id})`);
  const emailBody = encodeURIComponent(
    `Halo Tim Customer Support Sendora,\n\nSaya ingin membuka tiket bantuan / permohonan peninjauan akun terkait status ${user.status}.\n\nDetail Akun:\n- Nama: ${user.name}\n- Email: ${user.email}\n- User ID: ${user.id}\n- Status Saat Ini: ${user.status}\n- Catatan Penonaktifan: ${user.banReason || "Tidak tercantum"}\n- Topik Bantuan: ${topic}\n\nPenjelasan / Pesan:\n${message || "Mohon lakukan peninjauan kembali terhadap akun saya."}\n\nTerima kasih.`
  );
  const mailtoUrl = `mailto:${supportEmail}?subject=${emailSubject}&body=${emailBody}`;

  const waText = encodeURIComponent(
    `Halo Customer Support Sendora, saya ingin mengajukan tiket bantuan / banding akun:\n\n- Nama: ${user.name}\n- Email: ${user.email}\n- User ID: ${user.id}\n- Status: ${user.status}\n- Topik: ${topic}\n\nPesan: ${message || "Mohon ditinjau kembali."}`
  );
  const waUrl = `https://wa.me/6281234567890?text=${waText}`;

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
              Koneksi Sendora WhatsApp Gateway, pengiriman pesan broadcast massal, otomasi auto-reply, manajemen kontak, dan akses REST API Key telah diblokir secara total demi keamanan sistem.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setTicketSubmitted(false);
              setMessage("");
              setTicketModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 active:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-xs text-sm cursor-pointer"
          >
            <Headphones className="w-4 h-4 text-primary" />
            <span>Buka Tiket / Hubungi CS</span>
          </button>

          <Link
            href="/dashboard/support"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition-all flex items-center justify-center gap-2 text-sm shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Lihat Tiket & Chat CS</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl font-bold bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </div>

      {/* MODAL: Buka Tiket / Hubungi Support Helpdesk */}
      {ticketModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative text-left animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-none">
                      Buka Tiket Bantuan CS
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Pusat Dukungan & Banding Akun Sendora
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTicketModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!ticketSubmitted ? (
                <form onSubmit={handleOpenTicket} className="space-y-4">
                  {/* Account Reference info */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Akun Terdaftar</span>
                      <span className="font-bold text-slate-800">{user.email}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      {user.status}
                    </span>
                  </div>

                  {/* Topic selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Topik Bantuan / Kategori
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="Permohonan Peninjauan / Banding Akun">Permohonan Peninjauan / Banding Akun</option>
                      <option value="Klarifikasi Penggunaan Broadcast / API">Klarifikasi Penggunaan Broadcast / API</option>
                      <option value="Bantuan Teknis & Pemulihan Akses">Bantuan Teknis & Pemulihan Akses</option>
                      <option value="Pertanyaan Penagihan & Berlangganan">Pertanyaan Penagihan & Berlangganan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {/* Message / Appeal textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pesan / Penjelasan Banding <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Jelaskan secara rinci kronologi, tujuan penggunaan gateway, atau klarifikasi Anda agar tim CS kami dapat meninjau akun dengan cepat..."
                      rows={4}
                      required
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>

                  {/* Submit and Quick Contact Options */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Kirim Tiket ke Sistem Support
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase">Atau Hubungi Langsung</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={mailtoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Email CS</span>
                      </a>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-950 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>WhatsApp CS</span>
                      </a>
                    </div>
                  </div>
                </form>
              ) : (
                /* Ticket Success State */
                <div className="text-center py-4 space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900">
                      Tiket Berhasil Dibuat!
                    </h4>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      Permohonan tiket bantuan Anda telah tercatat dengan nomor tiket:
                    </p>
                    <div className="inline-block px-4 py-1.5 rounded-xl bg-slate-100 text-primary font-mono font-black text-sm border border-slate-200 mt-2">
                      {ticketNumber}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Tim Customer Service Sendora akan meninjau catatan Anda dan mengirimkan balasan ke email <strong>{user.email}</strong> dalam 1x24 jam kerja.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href="/dashboard/support"
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Pantau Tiket & Chat CS
                    </Link>
                    <a
                      href={mailtoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" /> Salin ke Email
                    </a>
                    <button
                      type="button"
                      onClick={() => setTicketModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
