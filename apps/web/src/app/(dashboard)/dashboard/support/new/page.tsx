"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import type { TicketCategory, TicketPriority } from "@/lib/support-tickets";
import { useUserSession } from "@/lib/use-user-session";

export default function CreateTicketPage() {
  const router = useRouter();
  const { user } = useUserSession();

  const isAccountLocked = user?.status === "BANNED" || user?.status === "SUSPENDED";

  const [subject, setSubject] = useState(
    isAccountLocked ? `Permohonan Banding Akun ${user?.email || ""}` : ""
  );
  const [category, setCategory] = useState<TicketCategory>(
    isAccountLocked ? "APPEAL" : "TECHNICAL"
  );
  const [priority, setPriority] = useState<TicketPriority>(
    isAccountLocked ? "HIGH" : "MEDIUM"
  );
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setFormError("Subjek dan pesan kendala wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          priority,
          phone: phone.trim() || undefined,
          message: message.trim(),
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        router.push(`/dashboard/support/${json.data.id}`);
      } else {
        setFormError(json.error || "Gagal membuat tiket bantuan.");
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan koneksi ke server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Back Button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/support"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-primary transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pusat Bantuan</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Buka Tiket Bantuan Baru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Jelaskan kendala Anda secara rinci agar tim customer support dapat membantu dengan cepat.
          </p>
        </div>
      </div>

      {isAccountLocked && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <span className="font-black">Formulir Pengajuan Banding Akun</span>
            <p className="opacity-90">
              Akun Anda saat ini berstatus {user?.status}. Silakan jelaskan permohonan peninjauan kembali akun Anda pada formulir di bawah ini.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Form + Tips Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Subjek / Judul Kendala <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Webhook callback tidak masuk / Kendala koneksi device"
                className="w-full text-xs font-semibold px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
              />
            </div>

            {/* Category & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Kategori Kendala
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full text-xs font-semibold px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                >
                  <option value="TECHNICAL">Kendala Teknis & Gateway</option>
                  <option value="BILLING">Pembayaran & Paket</option>
                  <option value="APPEAL">Peninjauan / Banding Akun</option>
                  <option value="FEATURE">Pertanyaan Fitur & API</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Tingkat Urgensi
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full text-xs font-semibold px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                >
                  <option value="LOW">Rendah (Pertanyaan umum)</option>
                  <option value="MEDIUM">Sedang (Kendala standar)</option>
                  <option value="HIGH">Tinggi (Operasional terganggu)</option>
                  <option value="URGENT">Mendesak (Sistem down total)</option>
                </select>
              </div>
            </div>

            {/* WhatsApp Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Nomor WhatsApp Anda (Opsional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890 (Untuk notifikasi atau chat kilat via WA)"
                className="w-full text-xs px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
              />
            </div>

            {/* Message Details */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Deskripsi Kendala Lengkap <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Jelaskan secara terperinci apa yang terjadi, langkah yang sudah Anda coba, atau pesan error yang muncul di layar..."
                rows={6}
                className="w-full text-xs px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-xs leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <Link
                href="/dashboard/support"
                className="px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !message.trim()}
                className="px-6 py-3 rounded-2xl bg-primary text-white text-xs font-black hover:bg-primary/90 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Kirim & Buka Ruang Chat</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Info & Tips Sidebar */}
        <div className="space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-lg">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black">Tips Agar Cepat Ditangani</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sertakan informasi spesifik seperti ID Device, nomor tujuan broadcast, atau respon JSON error agar tim CS dapat langsung memeriksa log server.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Respon rata-rata &lt; 5 menit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>CS Aktif Setiap Hari 08:00 - 22:00</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Bantuan Langsung
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Memerlukan respon mendesak? Anda juga dapat langsung menghubungi WhatsApp Customer Support resmi kami.
            </p>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Customer%20Support%20Waply%2C%20saya%20memerlukan%20bantuan%20teknis."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-emerald-200"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Chat WhatsApp CS</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
