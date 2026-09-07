"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Headphones,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Send,
  ExternalLink,
  Mail,
  Copy,
  Check,
  RefreshCw,
  X,
  ChevronRight,
  BookOpen,
  User,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/support-tickets";
import { useUserSession } from "@/lib/use-user-session";
import Link from "next/link";

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  TECHNICAL: "Kendala Teknis & Gateway",
  BILLING: "Pembayaran & Berlangganan",
  APPEAL: "Peninjauan / Banding Akun",
  FEATURE: "Pertanyaan Fitur & API",
  OTHER: "Lainnya",
};

const CATEGORY_COLORS: Record<TicketCategory, string> = {
  TECHNICAL: "bg-blue-50 text-blue-700 border-blue-200",
  BILLING: "bg-emerald-50 text-emerald-700 border-emerald-200",
  APPEAL: "bg-amber-50 text-amber-700 border-amber-200",
  FEATURE: "bg-purple-50 text-purple-700 border-purple-200",
  OTHER: "bg-slate-50 text-slate-700 border-slate-200",
};

const STATUS_BADGES: Record<TicketStatus, { label: string; color: string }> = {
  OPEN: { label: "Menunggu Respon", color: "bg-blue-100 text-blue-800 border-blue-200" },
  IN_PROGRESS: { label: "Sedang Ditangani", color: "bg-amber-100 text-amber-800 border-amber-200" },
  RESOLVED: { label: "Selesai", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CLOSED: { label: "Ditutup", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const PRIORITY_BADGES: Record<TicketPriority, { label: string; color: string }> = {
  LOW: { label: "Rendah", color: "bg-slate-100 text-slate-600" },
  MEDIUM: { label: "Sedang", color: "bg-blue-50 text-blue-700" },
  HIGH: { label: "Tinggi", color: "bg-orange-50 text-orange-700 font-bold" },
  URGENT: { label: "Mendesak", color: "bg-rose-100 text-rose-700 font-extrabold" },
};

export default function UserSupportPage() {
  const { user } = useUserSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("TECHNICAL");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Reply state
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tickets");
      const json = await res.json();
      if (json.success) {
        setTickets(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setFormError("Subjek dan pesan wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          category,
          priority,
          phone,
          message,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSubject("");
        setMessage("");
        setPhone("");
        setCreateModalOpen(false);
        fetchTickets();
        if (json.data) {
          setSelectedTicket(json.data);
          setDetailModalOpen(true);
        }
      } else {
        setFormError(json.error || "Gagal membuat tiket");
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setSendingReply(true);
      const res = await fetch(`/api/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedTicket(json.data);
        setReplyMessage("");
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedTicket(json.data);
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to resolve ticket:", err);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      search === "" ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchCategory = categoryFilter === "ALL" || t.category === categoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  const totalTickets = tickets.length;
  const activeTickets = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED").length;

  const isAccountLocked = user?.status === "BANNED" || user?.status === "SUSPENDED";

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Account Lock Notification Banner */}
      {isAccountLocked && (
        <div className={`p-4 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          user?.status === "BANNED"
            ? "bg-rose-50 border-rose-200 text-rose-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              user?.status === "BANNED" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-black">
                {user?.status === "BANNED"
                  ? "Akun Anda Sedang Diblokir (Banned)"
                  : "Akun Anda Sedang Ditangguhkan (Suspended)"}
              </h4>
              <p className="text-[11px] sm:text-xs opacity-90 leading-relaxed">
                Anda berada di Ruang Pusat Bantuan. Anda dapat membuat tiket baru atau membalas pesan di bawah untuk mengajukan permohonan banding dan berkomunikasi langsung dengan customer support.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCategory("APPEAL");
              setPriority("HIGH");
              setSubject(`Permohonan Banding Akun ${user?.email}`);
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shrink-0 shadow-xs cursor-pointer"
          >
            + Ajukan Banding Cepat
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Headphones className="w-4 h-4" />
            <span>Pusat Dukungan & Bantuan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tiket Bantuan & CS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dapatkan respon cepat langsung dari tim teknis & customer support resmi Sendora.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError("");
            setCreateModalOpen(true);
          }}
          className="btn btn-primary btn-sm sm:btn-md rounded-2xl gap-2 font-bold shadow-lg shadow-primary/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buka Tiket Baru</span>
        </button>
      </div>

      {/* 3 Quick Help Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WhatsApp CS Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/10 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              Fast Response &bull; 08:00 - 22:00
            </div>
            <h3 className="text-lg font-black tracking-tight">WhatsApp CS Resmi</h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Konsultasi langsung dengan tim support via chat WhatsApp untuk kendala darurat.
            </p>
          </div>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Customer%20Support%20Sendora%2C%20saya%20memerlukan%20bantuan%20teknis%20terkait%20gateway."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Chat WhatsApp CS</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-auto" />
          </a>
        </div>

        {/* Email Helpdesk Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
              <Mail className="w-3 h-3" />
              Email Helpdesk 24/7
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">support@sendora.id</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kirimkan log error, lampiran berkas, atau invoice melalui jalur email helpdesk.
            </p>
          </div>
          <a
            href="mailto:support@sendora.id?subject=Pertanyaan%20Dukungan%20Sendora"
            className="w-full py-2.5 px-4 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span>Kirim Email Support</span>
          </a>
        </div>

        {/* API Docs & Troubleshooting */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
              <BookOpen className="w-3 h-3" />
              Self-Service Center
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Dokumentasi & FAQ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Panduan integrasi REST API, webhook, cURL, SDK Node.js, Python, dan tips anti-ban.
            </p>
          </div>
          <Link
            href="/docs"
            className="w-full py-2.5 px-4 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Buka Dokumentasi API</span>
          </Link>
        </div>
      </div>

      {/* Ticket Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Total Tiket</span>
            <span className="text-2xl font-black text-slate-900">{totalTickets}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 block uppercase tracking-wider">Tiket Aktif</span>
            <span className="text-2xl font-black text-slate-900">{activeTickets}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 block uppercase tracking-wider">Tiket Selesai</span>
            <span className="text-2xl font-black text-slate-900">{resolvedTickets}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ticket List Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID tiket atau subjek..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">Semua Status</option>
              <option value="OPEN">Menunggu Respon</option>
              <option value="IN_PROGRESS">Sedang Ditangani</option>
              <option value="RESOLVED">Selesai</option>
              <option value="CLOSED">Ditutup</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="TECHNICAL">Kendala Teknis</option>
              <option value="BILLING">Pembayaran & Paket</option>
              <option value="APPEAL">Peninjauan Akun</option>
              <option value="FEATURE">Fitur & API</option>
              <option value="OTHER">Lainnya</option>
            </select>

            <button
              onClick={fetchTickets}
              className="p-2 rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table / List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-xs font-medium">Memuat data tiket bantuan...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Headphones className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">Belum Ada Tiket Bantuan</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Jika Anda mengalami kendala teknis atau pertanyaan, silakan klik tombol &quot;Buka Tiket Baru&quot;.
                </p>
              </div>
            </div>
          ) : (
            <table className="table w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th>ID Tiket</th>
                  <th>Subjek & Kategori</th>
                  <th>Prioritas</th>
                  <th>Status</th>
                  <th>Pembaruan</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTickets.map((t) => {
                  const statusInfo = STATUS_BADGES[t.status];
                  const priorityInfo = PRIORITY_BADGES[t.priority];
                  const lastMessage = t.messages[t.messages.length - 1];

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Ticket ID */}
                      <td>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                          <span>{t.id}</span>
                          <button
                            onClick={() => handleCopyId(t.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            title="Salin ID Tiket"
                          >
                            {copiedId === t.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Subject & Category */}
                      <td>
                        <div className="space-y-1 max-w-md">
                          <span className="font-bold text-slate-900 block truncate hover:text-primary transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedTicket(t);
                              setDetailModalOpen(true);
                            }}
                          >
                            {t.subject}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORY_COLORS[t.category]}`}>
                              {CATEGORY_LABELS[t.category]}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {t.messages.length} pesan
                            </span>
                            {t.unreadByUser && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Ada balasan baru"></span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Updated At */}
                      <td className="text-slate-500 text-[11px]">
                        <div>{new Date(t.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="text-right">
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setDetailModalOpen(true);
                          }}
                          className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 rounded-lg gap-1 font-bold"
                        >
                          <span>Buka Chat</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: Buka Tiket Baru */}
      {createModalOpen && (
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
                      Buka Tiket Bantuan Baru
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kirimkan pertanyaan atau kendala ke tim support Sendora
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Subjek / Judul Kendala <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Device sering disconnected / Kendala Webhook"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Category & Priority Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kategori
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TicketCategory)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="TECHNICAL">Kendala Teknis & Gateway</option>
                      <option value="BILLING">Pembayaran & Paket</option>
                      <option value="APPEAL">Peninjauan / Banding Akun</option>
                      <option value="FEATURE">Pertanyaan Fitur & API</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tingkat Urgensi
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TicketPriority)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="LOW">Rendah (Pertanyaan umum)</option>
                      <option value="MEDIUM">Sedang (Kendala standar)</option>
                      <option value="HIGH">Tinggi (Mempengaruhi operasional)</option>
                      <option value="URGENT">Mendesak (Sistem down total)</option>
                    </select>
                  </div>
                </div>

                {/* WhatsApp Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor WhatsApp Kontak (Opsional untuk respon cepat)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Deskripsi Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Jelaskan kronologi kendala, pesan error yang muncul, atau langkah yang sudah dicoba..."
                    rows={4}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {submitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Kirim Tiket Bantuan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Detail Tiket & Chat Thread UI */}
      {detailModalOpen && selectedTicket && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full h-[85vh] max-h-[720px] flex flex-col shadow-2xl relative text-left animate-in zoom-in-95 duration-150 overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      {selectedTicket.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORY_COLORS[selectedTicket.category]}`}>
                      {CATEGORY_LABELS[selectedTicket.category]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_BADGES[selectedTicket.status].color}`}>
                      {STATUS_BADGES[selectedTicket.status].label}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-1">
                    {selectedTicket.subject}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                    <button
                      onClick={handleResolveTicket}
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      title="Tandai tiket telah selesai teratasi"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tandai Selesai</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
                {selectedTicket.messages.map((m, idx) => {
                  const isUser = m.senderRole === "user";

                  return (
                    <div
                      key={m.id || idx}
                      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {/* CS Avatar */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs mt-1">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`max-w-[82%] sm:max-w-[75%] rounded-3xl p-4 shadow-xs space-y-1.5 ${
                          isUser
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[11px] pb-1 border-b border-black/5">
                          <span className={`font-bold ${isUser ? "text-emerald-100" : "text-primary"}`}>
                            {isUser ? "Anda (Pengguna)" : "Sendora Customer Support"}
                          </span>
                          <span className={`text-[10px] ${isUser ? "text-emerald-200" : "text-slate-400"}`}>
                            {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className={`text-xs whitespace-pre-wrap leading-relaxed ${isUser ? "text-white" : "text-slate-700"}`}>
                          {m.message}
                        </p>
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Form */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Tulis balasan pesan untuk customer support..."
                    className="flex-1 text-xs px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    {sendingReply ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Kirim</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
