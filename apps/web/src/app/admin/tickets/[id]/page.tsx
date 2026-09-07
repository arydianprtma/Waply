"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  User,
  Zap,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/support-tickets";
import { useUserSession } from "@/lib/use-user-session";

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  TECHNICAL: "Kendala Teknis & Gateway",
  BILLING: "Pembayaran & Berlangganan",
  APPEAL: "Peninjauan / Banding Akun",
  FEATURE: "Pertanyaan Fitur & API",
  OTHER: "Lainnya",
};

const STATUS_BADGES: Record<TicketStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  OPEN: { label: "Menunggu Respon", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  IN_PROGRESS: { label: "Sedang Ditangani", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  RESOLVED: { label: "Selesai", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  CLOSED: { label: "Ditutup", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
};

const PRIORITY_BADGES: Record<TicketPriority, { label: string; bg: string; text: string; border: string }> = {
  LOW: { label: "Rendah", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  MEDIUM: { label: "Sedang", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  HIGH: { label: "Tinggi", bg: "bg-orange-50", text: "text-orange-700 font-bold", border: "border-orange-200" },
  URGENT: { label: "Mendesak", bg: "bg-rose-50", text: "text-rose-700 font-extrabold", border: "border-rose-200" },
};

const PRESET_REPLIES = [
  "Halo kak, laporan Anda sedang kami investigasi oleh tim teknis.",
  "Halo kak, kendala sudah berhasil kami atasi. Silakan dicoba kembali ya.",
  "Mohon kirimkan detail ID Device atau tangkapan layar pesan error.",
  "Permohonan banding akun Anda telah kami tinjau dan akun sudah aktif kembali.",
];

export default function AdminTicketDetailPage() {
  const params = useParams();
  const ticketId = params?.id as string;
  const router = useRouter();
  const { user } = useUserSession();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(0);
  const isInitialLoadedRef = useRef<boolean>(false);

  const scrollToBottom = (smooth = true) => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  const fetchTicketDetail = useCallback(async (silent = false) => {
    if (!ticketId) return;
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/tickets/${ticketId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTicket(json.data);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetail();
  }, [fetchTicketDetail]);

  // Live Auto Polling every 2 seconds
  useEffect(() => {
    if (!ticketId) return;
    const interval = setInterval(() => {
      fetchTicketDetail(true);
    }, 2000);
    return () => clearInterval(interval);
  }, [ticketId, fetchTicketDetail]);

  // Smart internal scroll: only scroll when new messages arrive or on first load
  useEffect(() => {
    if (!ticket?.messages) return;
    const currentCount = ticket.messages.length;

    if (!isInitialLoadedRef.current && currentCount > 0) {
      isInitialLoadedRef.current = true;
      prevMsgCountRef.current = currentCount;
      setTimeout(() => scrollToBottom(false), 50);
      return;
    }

    if (currentCount > prevMsgCountRef.current) {
      prevMsgCountRef.current = currentCount;
      setTimeout(() => scrollToBottom(true), 50);
    }
  }, [ticket?.messages]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyMessage.trim() || sendingReply || !ticket) return;

    const msg = replyMessage.trim();
    setReplyMessage("");
    setSendingReply(true);

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTicket(json.data);
        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch (err) {
      console.error("Gagal mengirim balasan:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!ticket) return;
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTicket(json.data);
      }
    } catch (err) {
      console.error("Gagal mengubah status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePriority = async (priority: TicketPriority) => {
    if (!ticket) return;
    try {
      setUpdatingPriority(true);
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTicket(json.data);
      }
    } catch (err) {
      console.error("Gagal mengubah prioritas:", err);
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticket) return;
    if (!confirm(`Hapus tiket "${ticket.subject}" secara permanen?`)) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        router.push("/admin/tickets");
      }
    } catch (err) {
      console.error("Gagal menghapus tiket:", err);
    } finally {
      setDeleting(false);
    }
  };

  const copyTicketId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading && !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Memuat ruang resolusi tiket bantuan...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-800">Tiket Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">
          Tiket bantuan dengan ID tersebut tidak ditemukan.
        </p>
        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Manajemen Tiket</span>
        </Link>
      </div>
    );
  }

  const cleanPhone = ticket.userPhone ? ticket.userPhone.replace(/[^0-9]/g, "") : "";
  const waTarget = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone;

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Sticky Header Bar */}
      <div className="sticky -top-3.5 sm:-top-6 lg:-top-8 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm transition-all">
        <div className="space-y-1">
          <Link
            href="/admin/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-primary transition-colors mb-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Tiket Admin</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {ticket.subject}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                STATUS_BADGES[ticket.status].bg
              } ${STATUS_BADGES[ticket.status].text} ${STATUS_BADGES[ticket.status].border}`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_BADGES[ticket.status].dot}`} />
              {STATUS_BADGES[ticket.status].label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
            <button
              onClick={copyTicketId}
              className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 hover:text-primary transition-colors bg-slate-100 px-2 py-0.5 rounded-md cursor-pointer"
            >
              <span>{ticket.id}</span>
              {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
            <span>•</span>
            <span>Pelapor: <strong className="text-slate-700">{ticket.userName || ticket.userEmail}</strong></span>
            <span>•</span>
            <span>{new Date(ticket.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
          {ticket.status !== "RESOLVED" ? (
            <button
              onClick={() => handleUpdateStatus("RESOLVED")}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tandai Selesai</span>
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus("IN_PROGRESS")}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Buka Kembali</span>
            </button>
          )}

          <button
            onClick={handleDeleteTicket}
            disabled={deleting}
            className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Hapus Tiket"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Messenger (Left) + Sticky Admin Controls & User Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Chat Resolution Room (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col h-[580px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Chat Header Status (Pinned at top) */}
          <div className="px-5 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">Ruang Resolusi Dukungan CS & Pengguna</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Live Auto-Polling 2 Detik
            </span>
          </div>

          {/* Quick Preset Replies Toolbar (Pinned under chat header) */}
          <div className="px-5 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar shrink-0">
            <div className="flex items-center gap-1.5 text-slate-500 font-black text-[11px] shrink-0">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Template:</span>
            </div>
            {PRESET_REPLIES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setReplyMessage(preset)}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary/50 hover:bg-slate-50 text-[11px] text-slate-700 font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                {preset.slice(0, 30)}...
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
            {ticket.messages.map((msg, idx) => {
              const isAdmin = msg.senderRole === "admin" || msg.senderRole === "support";
              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3 max-w-[85%] ${
                    isAdmin ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                      isAdmin
                        ? "bg-slate-900 text-emerald-400"
                        : "bg-primary text-white"
                    }`}
                  >
                    {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`flex items-center gap-2 ${
                        isAdmin ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-[11px] font-bold text-slate-700">
                        {isAdmin ? `${msg.senderName || "Admin CS"} (Anda)` : ticket.userName || ticket.userEmail}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${
                        isAdmin
                          ? "bg-slate-900 text-slate-100 rounded-tr-none font-medium"
                          : "bg-white text-slate-800 border border-slate-200 rounded-tl-none font-medium"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Reply Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply();
              }}
              className="flex items-center gap-2"
            >
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                rows={1}
                placeholder="Tulis tanggapan atau instruksi solusi untuk pengguna... (Enter untuk kirim)"
                className="flex-1 text-xs px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-xs max-h-32"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyMessage.trim()}
                className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 disabled:opacity-40 transition-all shadow-md cursor-pointer shrink-0"
                title="Kirim Balasan Admin"
              >
                {sendingReply ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Admin Controls & User Info Sidebar (1 Col - Sticky on Desktop) */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-16">
          {/* Status & Priority Management */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Pengaturan Tiket
            </h3>

            {/* Status Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Status Penanganan
              </label>
              <select
                value={ticket.status}
                onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                disabled={updatingStatus}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="OPEN">Menunggu Respon (OPEN)</option>
                <option value="IN_PROGRESS">Sedang Ditangani (IN_PROGRESS)</option>
                <option value="RESOLVED">Selesai (RESOLVED)</option>
                <option value="CLOSED">Ditutup (CLOSED)</option>
              </select>
            </div>

            {/* Priority Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Tingkat Urgensi
              </label>
              <select
                value={ticket.priority}
                onChange={(e) => handleUpdatePriority(e.target.value as TicketPriority)}
                disabled={updatingPriority}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="LOW">Rendah (LOW)</option>
                <option value="MEDIUM">Sedang (MEDIUM)</option>
                <option value="HIGH">Tinggi (HIGH)</option>
                <option value="URGENT">Mendesak (URGENT)</option>
              </select>
            </div>

            {/* Category Info */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Kategori Kendala
              </label>
              <span className="font-extrabold text-slate-800 block">
                {CATEGORY_LABELS[ticket.category]}
              </span>
            </div>
          </div>

          {/* User Information Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Informasi Pelapor
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-800 truncate" title={ticket.userEmail}>
                  {ticket.userEmail}
                </span>
              </div>

              {ticket.userName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-700">{ticket.userName}</span>
                </div>
              )}

              {ticket.userPhone ? (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono font-bold text-slate-800">{ticket.userPhone}</span>
                  </div>
                  <a
                    href={`https://wa.me/${waTarget}?text=Halo%20kak%2C%20terkait%20tiket%20bantuan%20Sendora%20ID%20${ticket.id}%20mengenai%20${encodeURIComponent(
                      ticket.subject
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-emerald-200"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hubungi via WhatsApp</span>
                  </a>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 italic">
                  Pengguna tidak mencantumkan nomor WhatsApp.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
