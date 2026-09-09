"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Headphones,
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  User,
  Sparkles,
  Phone,
  Mail,
  Zap,
  Volume2,
} from "lucide-react";
import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/support-tickets";
import { useUserSession } from "@/lib/use-user-session";
import { playTicketNotificationSound } from "@/lib/admin-tickets-context";

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  TECHNICAL: "Kendala Teknis",
  BILLING: "Pembayaran",
  APPEAL: "Banding Akun",
  FEATURE: "Fitur & API",
  OTHER: "Lainnya",
};

const CATEGORY_COLORS: Record<TicketCategory, { bg: string; text: string; border: string }> = {
  TECHNICAL: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  BILLING: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  APPEAL: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  FEATURE: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  OTHER: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
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

export default function AdminTicketsPage() {
  const { user } = useUserSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTickets = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/tickets?scope=all");
      const json = await res.json();
      if (json.success) {
        setTickets(json.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat tiket admin:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Live Auto Polling for new incoming tickets every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const copyTicketId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      (t.userName && t.userName.toLowerCase().includes(search.toLowerCase())) ||
      (t.userPhone && t.userPhone.includes(search)) ||
      t.messages.some((m) => m.message.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    const matchCategory = categoryFilter === "ALL" || t.category === categoryFilter;

    return matchSearch && matchStatus && matchPriority && matchCategory;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    urgent: tickets.filter((t) => t.priority === "URGENT" && t.status !== "RESOLVED" && t.status !== "CLOSED").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900 text-emerald-400">
              <Headphones className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            Manajemen Tiket Bantuan & CS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau dan tanggapi kendala teknis serta permohonan banding akun pengguna Waply.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => playTicketNotificationSound()}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer flex items-center gap-2 text-xs font-bold"
            title="Uji coba suara lonceng notifikasi tiket"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Tes Suara</span>
          </button>

          <button
            onClick={() => fetchTickets()}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-xs cursor-pointer flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Total Tiket
          </span>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Respon
          </span>
          <div className="text-2xl font-black text-blue-600">{stats.open}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Sedang Ditangani
          </span>
          <div className="text-2xl font-black text-amber-600">{stats.inProgress}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider block flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selesai
          </span>
          <div className="text-2xl font-black text-emerald-600">{stats.resolved}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider block flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Urgensi Mendesak
          </span>
          <div className="text-2xl font-black text-rose-600">{stats.urgent}</div>
        </div>
      </div>

      {/* Search & Multi Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ID tiket, subjek, email/nama pelapor, atau isi pesan..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="OPEN">Menunggu Respon</option>
            <option value="IN_PROGRESS">Sedang Ditangani</option>
            <option value="RESOLVED">Selesai</option>
            <option value="CLOSED">Ditutup</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            <option value="ALL">Semua Urgensi</option>
            <option value="URGENT">Mendesak (URGENT)</option>
            <option value="HIGH">Tinggi (HIGH)</option>
            <option value="MEDIUM">Sedang (MEDIUM)</option>
            <option value="LOW">Rendah (LOW)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="TECHNICAL">Kendala Teknis</option>
            <option value="BILLING">Pembayaran</option>
            <option value="APPEAL">Banding Akun</option>
            <option value="FEATURE">Fitur & API</option>
            <option value="OTHER">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Memuat daftar tiket pengguna...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-800">Tidak Ada Tiket Masuk</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== "ALL" || priorityFilter !== "ALL" || categoryFilter !== "ALL"
                ? "Tidak ada tiket yang cocok dengan kriteria filter pencarian."
                : "Belum ada tiket bantuan yang diajukan oleh pengguna."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const status = STATUS_BADGES[ticket.status] || STATUS_BADGES.OPEN;
              const categoryColor = CATEGORY_COLORS[ticket.category] || CATEGORY_COLORS.OTHER;
              const priority = PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.MEDIUM;
              const lastMsg = ticket.messages[ticket.messages.length - 1];

              return (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-all group block cursor-pointer"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={(e) => copyTicketId(e, ticket.id)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md hover:text-primary transition-colors"
                        title="Salin ID Tiket"
                      >
                        <span>{ticket.id}</span>
                        {copiedId === ticket.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>

                      {ticket.unreadByAdmin && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          Baru
                        </span>
                      )}

                      {ticket.handlingMode === "AI" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                          AI
                        </span>
                      ) : ticket.escalatedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                          Butuh CS
                        </span>
                      ) : null}

                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
                      >
                        {CATEGORY_LABELS[ticket.category]}
                      </span>

                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${priority.bg} ${priority.text} ${priority.border}`}
                      >
                        {priority.label}
                      </span>

                      <span className="text-[11px] font-bold text-slate-700">
                        {ticket.userName || ticket.userEmail}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors truncate">
                      {ticket.subject}
                    </h4>

                    {lastMsg && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        <strong className="text-slate-700">
                          {lastMsg.senderRole === "admin" || lastMsg.senderRole === "support"
                            ? "Admin: "
                            : lastMsg.senderRole === "ai"
                            ? "AI Assistant: "
                            : "User: "}
                        </strong>
                        {lastMsg.message}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>Dibuat: {new Date(ticket.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span>•</span>
                      <span>{ticket.messages.length} Pesan</span>
                      {ticket.userPhone && (
                        <>
                          <span>•</span>
                          <span className="font-mono font-bold text-slate-600">{ticket.userPhone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${status.bg} ${status.text} ${status.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-black text-primary group-hover:translate-x-0.5 transition-transform">
                      <span>Buka Resolusi</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
