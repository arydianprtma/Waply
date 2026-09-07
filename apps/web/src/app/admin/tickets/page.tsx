"use client";

import { useState, useEffect, useCallback } from "react";
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
    text: "Halo, pastikan endpoint webhook Anda siap menerima POST request dengan response 200 OK. Anda juga dapat melihat dokumentasi lengkap di menu Dokumentasi API.",
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

  // Delete Modal
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tickets?scope=all");
      const json = await res.json();
      if (json.success) {
        setTickets(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin tickets:", err);
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

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReply.trim()) return;

    try {
      setSendingReply(true);
      const res = await fetch(`/api/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: adminReply }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedTicket(json.data);
        setAdminReply("");
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to send admin reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
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
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdatePriority = async (ticketId: string, newPriority: TicketPriority) => {
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
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to update priority:", err);
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
        fetchTickets();
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
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Headphones className="w-4 h-4" />
            <span>Helpdesk & Support Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Tiket Bantuan & CS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola, respon percakapan, dan tindak lanjuti permohonan bantuan dari seluruh pengguna Sendora.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="btn btn-outline btn-sm sm:btn-md rounded-2xl gap-2 font-bold border-slate-300 text-slate-700 hover:bg-slate-100 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Total Tiket Masuk</span>
            <span className="text-2xl font-black text-slate-900">{totalTickets}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-600 block uppercase tracking-wider">Menunggu Respon</span>
            <span className="text-2xl font-black text-blue-600">{openCount}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 block uppercase tracking-wider">Sedang Ditangani</span>
            <span className="text-2xl font-black text-amber-600">{inProgressCount}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 block uppercase tracking-wider">Tiket Selesai</span>
            <span className="text-2xl font-black text-emerald-600">{resolvedCount}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ticket Management Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID tiket, nama user, email, subjek..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">Semua Status</option>
              <option value="OPEN">Menunggu Respon ({openCount})</option>
              <option value="IN_PROGRESS">Sedang Ditangani ({inProgressCount})</option>
              <option value="RESOLVED">Selesai</option>
              <option value="CLOSED">Ditutup</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              className="text-xs font-bold px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
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

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-xs font-medium">Memuat data tiket admin...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Headphones className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Tidak Ada Tiket Ditemukan</p>
            </div>
          ) : (
            <table className="table w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th>ID & Status</th>
                  <th>Pengguna</th>
                  <th>Subjek & Kategori</th>
                  <th>Prioritas</th>
                  <th>Update Terakhir</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTickets.map((t) => {
                  const statusInfo = STATUS_BADGES[t.status];
                  const priorityInfo = PRIORITY_BADGES[t.priority];

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID & Status */}
                      <td>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                            <span>{t.id}</span>
                            <button
                              onClick={() => handleCopyId(t.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                              title="Salin ID"
                            >
                              {copiedId === t.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User Info */}
                      <td>
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{t.userName}</span>
                          <span className="text-[11px] text-slate-500 block">{t.userEmail}</span>
                          {t.userPhone && (
                            <span className="text-[10px] text-emerald-700 font-mono block">
                              WA: {t.userPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Subject & Category */}
                      <td>
                        <div className="space-y-1 max-w-xs">
                          <span
                            className="font-bold text-slate-900 block truncate hover:text-primary transition-colors cursor-pointer"
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
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </td>

                      {/* Updated At */}
                      <td className="text-slate-500 text-[11px]">
                        <div>{new Date(t.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTicket(t);
                              setDetailModalOpen(true);
                            }}
                            className="btn btn-primary btn-xs rounded-lg gap-1 font-bold text-white shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Respon</span>
                          </button>

                          <button
                            onClick={() => {
                              setDeleteTicketId(t.id);
                              setDeleteModalOpen(true);
                            }}
                            className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-lg p-1.5"
                            title="Hapus Tiket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL: Detail & Admin Response Thread */}
      {detailModalOpen && selectedTicket && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full h-[90vh] max-h-[780px] flex flex-col shadow-2xl relative text-left animate-in zoom-in-95 duration-150 overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-slate-50/70">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      {selectedTicket.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORY_COLORS[selectedTicket.category]}`}>
                      {CATEGORY_LABELS[selectedTicket.category]}
                    </span>
                    {/* Priority Selector */}
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as TicketPriority)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="LOW">Prioritas: Low</option>
                      <option value="MEDIUM">Prioritas: Medium</option>
                      <option value="HIGH">Prioritas: High</option>
                      <option value="URGENT">Prioritas: Urgent</option>
                    </select>

                    {/* Status Selector */}
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as TicketStatus)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="OPEN">Status: Open</option>
                      <option value="IN_PROGRESS">Status: In Progress</option>
                      <option value="RESOLVED">Status: Resolved</option>
                      <option value="CLOSED">Status: Closed</option>
                    </select>
                  </div>
                  <h3 className="text-base font-black text-slate-900 line-clamp-1">
                    {selectedTicket.subject}
                  </h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>Oleh: <strong>{selectedTicket.userName}</strong> ({selectedTicket.userEmail})</span>
                    {selectedTicket.userPhone && (
                      <a
                        href={`https://wa.me/${selectedTicket.userPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> WA Pengguna
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
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
                  const isSupport = m.senderRole === "admin" || m.senderRole === "support";

                  return (
                    <div
                      key={m.id || idx}
                      className={`flex gap-3 ${isSupport ? "justify-end" : "justify-start"}`}
                    >
                      {/* User Avatar */}
                      {!isSupport && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-3xl p-4 shadow-xs space-y-1.5 ${
                          isSupport
                            ? "bg-slate-900 text-white rounded-tr-none"
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[11px] pb-1 border-b border-black/10">
                          <span className={`font-bold ${isSupport ? "text-primary-focus text-emerald-400" : "text-slate-800"}`}>
                            {isSupport ? "Sendora CS (Admin)" : m.senderName || selectedTicket.userName}
                          </span>
                          <span className={`text-[10px] ${isSupport ? "text-slate-400" : "text-slate-400"}`}>
                            {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className={`text-xs whitespace-pre-wrap leading-relaxed ${isSupport ? "text-slate-100" : "text-slate-700"}`}>
                          {m.message}
                        </p>
                      </div>

                      {/* Support Avatar */}
                      {isSupport && (
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs mt-1">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Preset Replies */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  <span className="font-bold text-slate-400 shrink-0 uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" /> Template:
                  </span>
                  {QUICK_REPLIES.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAdminReply(q.text)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-primary/40 hover:bg-primary/5 text-slate-700 font-semibold shrink-0 transition-colors"
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
                      placeholder="Tulis respon resmi sebagai Sendora Support Staff..."
                      rows={2}
                      className="flex-1 text-xs px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !adminReply.trim()}
                      className="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-primary/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all self-end"
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
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
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
                  className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20"
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
