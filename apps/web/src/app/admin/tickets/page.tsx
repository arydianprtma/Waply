"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Headphones,
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Send,
  User,
  ShieldCheck,
  RefreshCw,
  X,
  ChevronRight,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  Zap,
  ChevronDown,
  ArrowUpRight,
  CheckCheck,
  MessageCircle,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/support-tickets";
import Link from "next/link";

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  TECHNICAL: "Kendala Teknis & Gateway",
  BILLING: "Pembayaran & Berlangganan",
  APPEAL: "Peninjauan / Banding Akun",
  FEATURE: "Pertanyaan Fitur & API",
  OTHER: "Lainnya",
};

const CATEGORY_COLORS: Record<TicketCategory, { bg: string; text: string; border: string; dot: string }> = {
  TECHNICAL: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  BILLING: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  APPEAL: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  FEATURE: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  OTHER: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" },
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

const QUICK_REPLIES = [
  {
    title: "Sedang Diinvestigasi",
    text: "Halo, terima kasih telah menghubungi kami. Laporan kendala Anda saat ini sedang dalam proses investigasi oleh tim teknis kami. Mohon ditunggu sebentar ya.",
  },
  {
    title: "Masalah Teratasi",
    text: "Halo, kendala yang Anda laporkan telah berhasil diperbaiki dan seluruh sistem gateway beroperasi normal. Silakan dicoba kembali. Terima kasih atas kesabaran Anda.",
  },
  {
    title: "Banding Akun Disetujui",
    text: "Halo, permohonan peninjauan/banding akun Anda telah kami tinjau dan disetujui. Akun Anda telah diaktifkan kembali. Mohon untuk selalu mematuhi kebijakan anti-spam Sendora.",
  },
  {
    title: "Panduan Webhook/API",
    text: "Halo, pastikan endpoint webhook Anda siap menerima POST request dengan response HTTP 200 OK. Anda juga dapat melihat panduan lengkap di menu Dokumentasi API.",
  },
];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Detail / Response Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Delete Modal
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchTickets = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/tickets?scope=all");
      const json = await res.json();
      if (json.success) {
        setTickets(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin tickets:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    // Background polling every 8 seconds
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Live polling active ticket conversation every 2 seconds
  useEffect(() => {
    if (!detailModalOpen || !selectedTicket) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/${selectedTicket.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setSelectedTicket((prev) => {
            if (!prev) return json.data;
            if (
              prev.messages.length !== json.data.messages.length ||
              prev.status !== json.data.status ||
              prev.priority !== json.data.priority ||
              prev.updatedAt !== json.data.updatedAt
            ) {
              return json.data;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Live admin poll ticket error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [detailModalOpen, selectedTicket?.id]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (detailModalOpen && selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.messages?.length, detailModalOpen]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendAdminReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket || !adminReply.trim() || sendingReply) return;

    const replyText = adminReply.trim();
    setAdminReply("");

    // Optimistic local message append
    const tempMsg = {
      id: `temp_${Date.now()}`,
      ticketId: selectedTicket.id,
      senderId: "admin-master-sendora-01",
      senderName: "Sendora CS (Admin)",
      senderEmail: "support@sendora.id",
      senderRole: "support" as const,
      message: replyText,
      createdAt: new Date().toISOString(),
    };

    setSelectedTicket((prev) =>
      prev ? { ...prev, messages: [...prev.messages, tempMsg], updatedAt: new Date().toISOString() } : null
    );

    try {
      setSendingReply(true);
      const res = await fetch(`/api/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedTicket(json.data);
        fetchTickets(true);
      }
    } catch (err) {
      console.error("Failed to send admin reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    // Optimistic UI update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(json.data);
        }
        fetchTickets(true);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchTickets();
    }
  };

  const handleUpdatePriority = async (ticketId: string, newPriority: TicketPriority) => {
    // Optimistic UI update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, priority: newPriority, updatedAt: new Date().toISOString() } : t))
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, priority: newPriority } : null));
    }

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(json.data);
        }
        fetchTickets(true);
      }
    } catch (err) {
      console.error("Failed to update priority:", err);
      fetchTickets();
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTicketId) return;
    try {
      const res = await fetch(`/api/tickets/${deleteTicketId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setDeleteModalOpen(false);
        setDeleteTicketId(null);
        if (selectedTicket?.id === deleteTicketId) {
          setDetailModalOpen(false);
        }
        fetchTickets(true);
      }
    } catch (err) {
      console.error("Failed to delete ticket:", err);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      search === "" ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    const matchCategory = categoryFilter === "ALL" || t.category === categoryFilter;

    return matchSearch && matchStatus && matchPriority && matchCategory;
  });

  const totalTickets = tickets.length;
  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Headphones className="w-4 h-4" />
            <span>Customer Service & Helpdesk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Tiket Bantuan & CS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola, respon tiket percakapan pengguna, dan proses permohonan banding akun secara terpadu.
          </p>
        </div>

        <button
          onClick={() => fetchTickets()}
          className="btn btn-outline btn-sm sm:btn-md rounded-2xl gap-2 font-bold border-slate-300 text-slate-700 hover:bg-slate-100 self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Tiket Masuk</span>
            <span className="text-2xl font-black text-slate-900">{totalTickets}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-blue-200/80 shadow-xs flex items-center justify-between bg-blue-50/20">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Menunggu Respon</span>
            <span className="text-2xl font-black text-blue-700">{openCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-amber-200/80 shadow-xs flex items-center justify-between bg-amber-50/20">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Sedang Ditangani</span>
            <span className="text-2xl font-black text-amber-700">{inProgressCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-emerald-200/80 shadow-xs flex items-center justify-between bg-emerald-50/20">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Tiket Selesai</span>
            <span className="text-2xl font-black text-emerald-700">{resolvedCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Segmented Filter Tabs & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({totalTickets})
          </button>
          <button
            onClick={() => setStatusFilter("OPEN")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === "OPEN"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Menunggu Respon ({openCount})
          </button>
          <button
            onClick={() => setStatusFilter("IN_PROGRESS")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === "IN_PROGRESS"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sedang Ditangani ({inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter("RESOLVED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === "RESOLVED"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Selesai ({resolvedCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="URGENT">Mendesak (Urgent)</option>
            <option value="HIGH">Tinggi (High)</option>
            <option value="MEDIUM">Sedang (Medium)</option>
            <option value="LOW">Rendah (Low)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="TECHNICAL">Kendala Teknis</option>
            <option value="BILLING">Pembayaran & Paket</option>
            <option value="APPEAL">Peninjauan Akun</option>
            <option value="FEATURE">Fitur & API</option>
            <option value="OTHER">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Ticket Management Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Search bar header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID tiket, nama user, email, subjek kendala..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <span className="text-xs font-bold text-slate-400 shrink-0">
            Total {filteredTickets.length} tiket ditemukan
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto text-primary" />
              <p className="text-xs font-semibold">Memuat data tiket helpdesk admin...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                <Headphones className="w-8 h-8 opacity-70" />
              </div>
              <h4 className="text-base font-black text-slate-800">Tidak Ada Tiket</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Saat ini tidak ada tiket yang memerlukan penanganan atau sesuai filter pencarian.
              </p>
            </div>
          ) : (
            <table className="table w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/40">
                  <th className="py-3.5 pl-6">ID & Status</th>
                  <th className="py-3.5">Pengguna / Pemohon</th>
                  <th className="py-3.5">Subjek & Kategori</th>
                  <th className="py-3.5">Prioritas</th>
                  <th className="py-3.5">Update Terakhir</th>
                  <th className="py-3.5 pr-6 text-right">Aksi Respon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTickets.map((t) => {
                  const statusInfo = STATUS_BADGES[t.status];
                  const priorityInfo = PRIORITY_BADGES[t.priority];
                  const categoryInfo = CATEGORY_COLORS[t.category];

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* ID & Status */}
                      <td className="pl-6">
                        <div className="space-y-1.5 py-1">
                          <div className="flex items-center gap-1.5 font-mono font-black text-slate-800">
                            <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 group-hover:border-primary/30 transition-colors">
                              {t.id}
                            </span>
                            <button
                              onClick={() => handleCopyId(t.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Salin ID"
                            >
                              {copiedId === t.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User Info */}
                      <td>
                        <div className="space-y-1">
                          <span className="font-extrabold text-slate-900 block text-sm">{t.userName}</span>
                          <span className="text-[11px] text-slate-500 block">{t.userEmail}</span>
                          {t.userPhone && (
                            <a
                              href={`https://wa.me/${t.userPhone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>WA: {t.userPhone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Subject & Category */}
                      <td>
                        <div className="space-y-1.5 max-w-xs py-1">
                          <span
                            className="font-bold text-slate-900 block truncate group-hover:text-primary transition-colors cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedTicket(t);
                              setDetailModalOpen(true);
                            }}
                          >
                            {t.subject}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${categoryInfo.bg} ${categoryInfo.text} ${categoryInfo.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${categoryInfo.dot}`} />
                              {CATEGORY_LABELS[t.category]}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {t.messages.length} pesan
                            </span>
                            {t.unreadByAdmin && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black animate-pulse">
                                Respon Baru!
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td>
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}>
                          {priorityInfo.label}
                        </span>
                      </td>

                      {/* Updated At */}
                      <td className="text-slate-500 text-[11px]">
                        <div className="font-semibold text-slate-700">
                          {new Date(t.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTicket(t);
                              setDetailModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20 active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Buka Chat</span>
                          </button>

                          <button
                            onClick={() => {
                              setDeleteTicketId(t.id);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Tiket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: Detail & Admin Response Thread (High-End Messenger Layout) */}
      {detailModalOpen && selectedTicket && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full h-[90vh] max-h-[780px] flex flex-col shadow-2xl relative text-left animate-in zoom-in-95 duration-150 overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-slate-50/90 backdrop-blur-md">
                <div className="space-y-1.5 max-w-[75%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                      {selectedTicket.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${CATEGORY_COLORS[selectedTicket.category].bg} ${CATEGORY_COLORS[selectedTicket.category].text} ${CATEGORY_COLORS[selectedTicket.category].border}`}>
                      {CATEGORY_LABELS[selectedTicket.category]}
                    </span>

                    {/* Dynamic Priority Selector Badge */}
                    <div className="relative inline-flex items-center">
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as TicketPriority)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-xl border appearance-none pr-6 cursor-pointer transition-all shadow-xs ${
                          selectedTicket.priority === "URGENT"
                            ? "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200"
                            : selectedTicket.priority === "HIGH"
                            ? "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
                            : selectedTicket.priority === "MEDIUM"
                            ? "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                        }`}
                        title="Ubah Tingkat Prioritas Tiket"
                      >
                        <option value="LOW">Prioritas: Rendah (Low)</option>
                        <option value="MEDIUM">Prioritas: Sedang (Medium)</option>
                        <option value="HIGH">Prioritas: Tinggi (High)</option>
                        <option value="URGENT">Prioritas: Mendesak (Urgent)</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-current opacity-70 absolute right-2 pointer-events-none" />
                    </div>

                    {/* Dynamic Status Selector Badge */}
                    <div className="relative inline-flex items-center">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as TicketStatus)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-xl border appearance-none pr-6 cursor-pointer transition-all shadow-xs ${
                          selectedTicket.status === "OPEN"
                            ? "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
                            : selectedTicket.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                            : selectedTicket.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                        }`}
                        title="Ubah Status Penanganan Tiket"
                      >
                        <option value="OPEN">Status: Menunggu Respon (Open)</option>
                        <option value="IN_PROGRESS">Status: Sedang Ditangani (In Progress)</option>
                        <option value="RESOLVED">Status: Selesai (Resolved)</option>
                        <option value="CLOSED">Status: Ditutup (Closed)</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-current opacity-70 absolute right-2 pointer-events-none" />
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900 truncate">
                    {selectedTicket.subject}
                  </h3>

                  <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
                    <span>Pemohon: <strong>{selectedTicket.userName}</strong> ({selectedTicket.userEmail})</span>
                    {selectedTicket.userPhone && (
                      <a
                        href={`https://wa.me/${selectedTicket.userPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                      >
                        <Phone className="w-3 h-3" /> Chat WhatsApp Langsung
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                {selectedTicket.messages.map((m, idx) => {
                  const isSupport = m.senderRole === "admin" || m.senderRole === "support";

                  return (
                    <div
                      key={m.id || idx}
                      className={`flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-150 ${isSupport ? "justify-end" : "justify-start"}`}
                    >
                      {/* User Avatar */}
                      {!isSupport && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-slate-300/60 mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-3xl p-4 shadow-sm space-y-1.5 ${
                          isSupport
                            ? "bg-slate-900 text-white rounded-tr-xs shadow-slate-900/10"
                            : "bg-white border border-slate-200/90 text-slate-900 rounded-tl-xs shadow-slate-200/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[11px] pb-1 border-b border-black/10">
                          <span className={`font-extrabold flex items-center gap-1.5 ${isSupport ? "text-emerald-400" : "text-slate-900"}`}>
                            {isSupport && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                            {isSupport ? "Sendora CS (Admin)" : m.senderName || selectedTicket.userName}
                          </span>
                          <span className={`text-[10px] font-mono flex items-center gap-1 ${isSupport ? "text-slate-400" : "text-slate-400"}`}>
                            {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            {isSupport && <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline" />}
                          </span>
                        </div>
                        <p className={`text-xs whitespace-pre-wrap leading-relaxed ${isSupport ? "text-slate-100" : "text-slate-700"}`}>
                          {m.message}
                        </p>
                      </div>

                      {/* Support Avatar */}
                      {isSupport && (
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 shadow-md border border-slate-700 mt-1">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Preset Replies Carousel */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/70 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[10px] scrollbar-none">
                  <span className="font-extrabold text-slate-400 shrink-0 uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" /> Template Cepat:
                  </span>
                  {QUICK_REPLIES.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAdminReply(q.text)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-primary hover:bg-primary/5 hover:text-primary text-slate-700 font-bold shrink-0 transition-all cursor-pointer shadow-2xs"
                    >
                      {q.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Input Form */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendAdminReply} className="space-y-2">
                  <div className="flex gap-2">
                    <textarea
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendAdminReply();
                        }
                      }}
                      placeholder="Tulis respon resmi sebagai Sendora Support Staff (tekan Enter untuk kirim, Shift+Enter untuk baris baru)..."
                      rows={2}
                      className="flex-1 text-xs px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !adminReply.trim()}
                      className="px-6 py-2.5 rounded-2xl bg-primary text-white font-black text-xs hover:bg-primary/90 active:scale-95 disabled:opacity-50 shadow-md shadow-primary/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all self-end"
                    >
                      {sendingReply ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Kirim</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Konfirmasi Hapus Tiket */}
      {deleteModalOpen && deleteTicketId && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 space-y-4 shadow-2xl text-center animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">Hapus Tiket Bantuan?</h3>
                <p className="text-xs text-slate-500">
                  Seluruh riwayat pesan percakapan pada tiket <strong>{deleteTicketId}</strong> akan dihapus permanen dari sistem.
                </p>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 cursor-pointer active:scale-95"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
