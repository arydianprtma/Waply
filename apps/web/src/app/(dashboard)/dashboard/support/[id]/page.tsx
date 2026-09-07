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
  Clock,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  User,
  CheckCheck,
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

export default function UserTicketDetailPage() {
  const params = useParams();
  const ticketId = params?.id as string;
  const router = useRouter();
  const { user } = useUserSession();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

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
      // ignore silent fetch errors
    } finally {
      if (!silent) setLoading(false);
    }
  }, [ticketId]);

  // Initial load
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

    const messageText = replyMessage.trim();
    setReplyMessage("");
    setSendingReply(true);

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
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

  const handleToggleStatus = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      setStatusUpdating(true);
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTicket(json.data);
      }
    } catch (err) {
      console.error("Gagal memperbarui status tiket:", err);
    } finally {
      setStatusUpdating(false);
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
        <p className="text-xs font-semibold text-slate-500">Memuat ruang chat tiket bantuan...</p>
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
          Tiket bantuan dengan ID tersebut tidak ditemukan atau Anda tidak memiliki akses.
        </p>
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pusat Bantuan</span>
        </Link>
      </div>
    );
  }

  const isResolvedOrClosed = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Sticky Header Bar */}
      <div className="sticky -top-3.5 sm:-top-6 lg:-top-8 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm transition-all">
        <div className="space-y-1">
          <Link
            href="/dashboard/support"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-primary transition-colors mb-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Tiket</span>
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
            <span>Dibuat: {new Date(ticket.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" ? (
            <button
              onClick={() => handleToggleStatus("RESOLVED")}
              disabled={statusUpdating}
              className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Tandai Selesai</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus("OPEN")}
              disabled={statusUpdating}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Buka Kembali Tiket</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Chat Messenger + Sticky Info Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Chat Room Area (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col h-[560px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Chat Header Status (Pinned at top of card) */}
          <div className="px-5 sm:px-6 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">Ruang Komunikasi Customer Support</span>
            </div>
            <span className="text-[11px] text-slate-600 font-medium">
              Live Auto-Update Aktif
            </span>
          </div>

          {/* Messages Stream */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
            {ticket.messages.map((msg, idx) => {
              const isUser = msg.senderRole === "user";
              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                      isUser
                        ? "bg-primary text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`flex items-center gap-2 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-[11px] font-bold text-slate-700">
                        {isUser ? "Anda" : msg.senderName || "Sendora Support"}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${
                        isUser
                          ? "bg-primary text-white rounded-tr-none font-medium"
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
            {isResolvedOrClosed ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-600 font-semibold">
                  Tiket ini telah ditandai selesai. Kirim pesan baru untuk membuka kembali obrolan.
                </span>
              </div>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply();
              }}
              className="mt-2 flex items-center gap-2"
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
                placeholder="Tulis balasan atau penjelasan tambahan... (Enter untuk kirim)"
                className="flex-1 text-xs px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-xs max-h-32"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyMessage.trim()}
                className="p-3 rounded-2xl bg-primary text-white hover:bg-primary/90 active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-primary/25 cursor-pointer shrink-0"
                title="Kirim Pesan"
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

        {/* Right Info Sidebar (1 Col - Sticky on Desktop) */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-16">
          {/* Metadata Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Rincian Tiket
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Kategori</span>
                <span className="font-extrabold text-slate-800">
                  {CATEGORY_LABELS[ticket.category]}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Urgensi / Prioritas</span>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                    PRIORITY_BADGES[ticket.priority].bg
                  } ${PRIORITY_BADGES[ticket.priority].text} ${PRIORITY_BADGES[ticket.priority].border}`}
                >
                  {PRIORITY_BADGES[ticket.priority].label}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Status Penanganan</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    STATUS_BADGES[ticket.status].bg
                  } ${STATUS_BADGES[ticket.status].text} ${STATUS_BADGES[ticket.status].border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BADGES[ticket.status].dot}`} />
                  {STATUS_BADGES[ticket.status].label}
                </span>
              </div>

              {ticket.userPhone && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Nomor WhatsApp</span>
                  <span className="font-mono font-bold text-slate-700">{ticket.userPhone}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                <div>
                  Dibuat:{" "}
                  <span className="font-semibold text-slate-700">
                    {new Date(ticket.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  Update Terakhir:{" "}
                  <span className="font-semibold text-slate-700">
                    {new Date(ticket.updatedAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick WA CS Assistance */}
          <div className="bg-emerald-50/60 rounded-3xl border border-emerald-200 p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-black text-emerald-950 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Butuh Respon Cepat?</span>
            </h4>
            <p className="text-emerald-900/80 leading-relaxed text-[11px]">
              Jika kendala bersifat sangat mendesak, Anda dapat meneruskan ID tiket ini ke WhatsApp CS kami:
            </p>
            <a
              href={`https://wa.me/6281234567890?text=Halo%20Sendora%20CS%2C%20saya%20sudah%20membuka%20tiket%20bantuan%20dengan%20ID%20${ticket.id}%20mengenai%20${encodeURIComponent(
                ticket.subject
              )}.%20Mohon%20bantuannya.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Hubungi WA CS</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
