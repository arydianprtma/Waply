"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Sparkles,
  CheckCheck,
  ArrowUpRight,
  MessageCircle,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/tickets");
      const json = await res.json();
      if (json.success) {
        setTickets(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Real-time polling while detail chat modal is open
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
        console.error("Live poll ticket error:", err);
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
        fetchTickets(true);
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

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket || !replyMessage.trim() || sendingReply) return;

    const messageText = replyMessage.trim();
    setReplyMessage("");

    // Optimistic local message append
    const tempMsg = {
      id: `temp_${Date.now()}`,
      ticketId: selectedTicket.id,
      senderId: user?.id || "usr_current",
      senderName: user?.name || "Anda (Pengguna)",
      senderEmail: user?.email || "",
      senderRole: "user" as const,
      message: messageText,
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
        body: JSON.stringify({ message: messageText }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedTicket(json.data);
        fetchTickets(true);
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
        fetchTickets(true);
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
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Account Lock Notification Banner */}
      {isAccountLocked && (
        <div className={`p-5 rounded-3xl border shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          user?.status === "BANNED"
            ? "bg-rose-50/90 border-rose-200 text-rose-950"
            : "bg-amber-50/90 border-amber-200 text-amber-950"
        }`}>
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              user?.status === "BANNED" ? "bg-rose-100 text-rose-600 border border-rose-200" : "bg-amber-100 text-amber-600 border border-amber-200"
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black tracking-tight">
                {user?.status === "BANNED"
                  ? "Akses Akun Anda Sedang Dinonaktifkan (Banned)"
                  : "Akses Akun Anda Sedang Ditangguhkan (Suspended)"}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                Anda saat ini berada di <strong>Pusat Bantuan Resmi</strong>. Anda dapat membuat tiket banding baru atau melanjutkan komunikasi chat dengan customer support di bawah ini.
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
            className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all shrink-0 shadow-md shadow-primary/20 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Banding Cepat</span>
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl overflow-hidden">
        {/* Decorative background lights */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Customer Support Standby 24/7</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pusat Dukungan & Tiket Bantuan
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Dapatkan bantuan teknis, panduan WhatsApp Gateway API, permohonan banding akun, dan konsultasi kuota dari tim ahli Sendora.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError("");
              setCreateModalOpen(true);
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2.5 self-start md:self-auto cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Buka Tiket Baru</span>
          </button>
        </div>
      </div>

      {/* 3 Quick Help Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* WhatsApp CS Card */}
        <div className="group p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">WhatsApp CS Resmi</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Fast
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Chat interaktif instan untuk kendala darurat, respon rata-rata &lt; 5 menit.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Customer%20Support%20Sendora%2C%20saya%20memerlukan%20bantuan%20teknis%20terkait%20gateway."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-emerald-200"
          >
            <span>Hubungi WhatsApp CS</span>
            <ArrowUpRight className="w-4 h-4 opacity-70" />
          </a>
        </div>

        {/* Email Helpdesk Card */}
        <div className="group p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Email Helpdesk</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Kirim log error, laporan bug teknis, atau lampiran berkas resmi ke <strong>support@sendora.id</strong>.
              </p>
            </div>
          </div>
          <a
            href="mailto:support@sendora.id?subject=Pertanyaan%20Dukungan%20Sendora"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span>Kirim Email Tiket</span>
          </a>
        </div>

        {/* API Docs & Troubleshooting */}
        <div className="group p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Dokumentasi & API</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Panduan lengkap integrasi REST API, webhook payload, tips anti-ban, dan cURL / Node.js SDK.
              </p>
            </div>
          </div>
          <Link
            href="/docs"
            className="w-full py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-purple-200"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Buka Dokumentasi</span>
          </Link>
        </div>
      </div>

      {/* Segmented Status Tabs & Metric Counters */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
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
            Menunggu Respon ({tickets.filter((t) => t.status === "OPEN").length})
          </button>
          <button
            onClick={() => setStatusFilter("IN_PROGRESS")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === "IN_PROGRESS"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sedang Ditangani ({tickets.filter((t) => t.status === "IN_PROGRESS").length})
          </button>
          <button
            onClick={() => setStatusFilter("RESOLVED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === "RESOLVED"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Selesai ({resolvedTickets})
          </button>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            onClick={() => fetchTickets()}
            className="p-2 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ticket List Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search header inside card */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID tiket atau subjek kendala..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <span className="text-xs font-bold text-slate-400 shrink-0">
            Menampilkan {filteredTickets.length} dari {totalTickets} tiket
          </span>
        </div>

        {/* Table / List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto text-primary" />
              <p className="text-xs font-semibold">Memuat riwayat tiket bantuan Anda...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                <Headphones className="w-8 h-8 opacity-70" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-base font-black text-slate-800">Tidak Ada Tiket Ditemukan</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {search || statusFilter !== "ALL" || categoryFilter !== "ALL"
                    ? "Tidak ada tiket yang cocok dengan filter pencarian Anda."
                    : "Anda belum memiliki tiket bantuan. Silakan klik tombol Buka Tiket Baru jika memerlukan bantuan."}
                </p>
              </div>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setCategoryFilter("ALL");
                  setCreateModalOpen(true);
                }}
                className="btn btn-primary btn-sm rounded-xl gap-2 font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Buka Tiket Sekarang
              </button>
            </div>
          ) : (
            <table className="table w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/40">
                  <th className="py-3.5 pl-6">ID Tiket</th>
                  <th className="py-3.5">Subjek & Kategori</th>
                  <th className="py-3.5">Prioritas</th>
                  <th className="py-3.5">Status Penanganan</th>
                  <th className="py-3.5">Update Terakhir</th>
                  <th className="py-3.5 pr-6 text-right">Ruang Chat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTickets.map((t) => {
                  const statusInfo = STATUS_BADGES[t.status];
                  const priorityInfo = PRIORITY_BADGES[t.priority];
                  const categoryInfo = CATEGORY_COLORS[t.category];

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Ticket ID */}
                      <td className="pl-6">
                        <div className="flex items-center gap-1.5 font-mono font-black text-slate-800">
                          <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 group-hover:border-primary/30 transition-colors">
                            {t.id}
                          </span>
                          <button
                            onClick={() => handleCopyId(t.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Salin ID Tiket"
                          >
                            {copiedId === t.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Subject & Category */}
                      <td>
                        <div className="space-y-1.5 max-w-md py-1">
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
                            {t.unreadByUser && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black animate-pulse">
                                Respon CS Baru!
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

                      {/* Status */}
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                          <span className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`} />
                          {statusInfo.label}
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

                      {/* Action */}
                      <td className="pr-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setDetailModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Buka Chat</span>
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-none">
                      Buka Tiket Bantuan CS
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kirimkan pertanyaan atau kendala Anda ke tim teknis Sendora
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                    placeholder="Contoh: Kendala Webhook callback / Pertanyaan Upgrade Paket"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                  />
                </div>

                {/* Category & Priority Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kategori Bantuan
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
                      <option value="HIGH">Tinggi (Operasional terganggu)</option>
                      <option value="URGENT">Mendesak (Sistem down total)</option>
                    </select>
                  </div>
                </div>

                {/* WhatsApp Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor WhatsApp (Opsional untuk konfirmasi cepat via WA)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Deskripsi Kendala Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Jelaskan secara rinci kendala yang Anda alami atau pertanyaan Anda..."
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
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 active:scale-95 shadow-md shadow-primary/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {submitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Kirim Tiket Sekarang</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Detail Tiket & Chat Thread UI (Premium Messenger Layout) */}
      {detailModalOpen && selectedTicket && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full h-[88vh] max-h-[740px] flex flex-col shadow-2xl relative text-left animate-in zoom-in-95 duration-150 overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/90 backdrop-blur-md">
                <div className="space-y-1.5 max-w-[70%] sm:max-w-[78%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                      {selectedTicket.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${CATEGORY_COLORS[selectedTicket.category].bg} ${CATEGORY_COLORS[selectedTicket.category].text} ${CATEGORY_COLORS[selectedTicket.category].border}`}>
                      {CATEGORY_LABELS[selectedTicket.category]}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_BADGES[selectedTicket.status].bg} ${STATUS_BADGES[selectedTicket.status].text} ${STATUS_BADGES[selectedTicket.status].border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BADGES[selectedTicket.status].dot} animate-pulse`} />
                      {STATUS_BADGES[selectedTicket.status].label}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    {selectedTicket.subject}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                    <button
                      onClick={handleResolveTicket}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                      title="Tandai tiket telah selesai teratasi"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tandai Selesai</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Timeline (Subtle grid texture for high-end feel) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                {selectedTicket.messages.map((m, idx) => {
                  const isUser = m.senderRole === "user";

                  return (
                    <div
                      key={m.id || idx}
                      className={`flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-150 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {/* CS Verified Avatar */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 shadow-md border border-slate-700 mt-1">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[84%] sm:max-w-[76%] rounded-3xl p-4 shadow-sm space-y-1.5 ${
                          isUser
                            ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-xs shadow-emerald-600/10"
                            : "bg-white border border-slate-200/90 text-slate-900 rounded-tl-xs shadow-slate-200/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[11px] pb-1 border-b border-black/5">
                          <span className={`font-extrabold flex items-center gap-1 ${isUser ? "text-emerald-100" : "text-slate-900"}`}>
                            {!isUser && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                            {isUser ? "Anda (Pengguna)" : "Sendora Support CS"}
                          </span>
                          <span className={`text-[10px] font-mono flex items-center gap-1 ${isUser ? "text-emerald-200" : "text-slate-400"}`}>
                            {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            {isUser && <CheckCheck className="w-3.5 h-3.5 text-emerald-200 inline" />}
                          </span>
                        </div>
                        <p className={`text-xs whitespace-pre-wrap leading-relaxed ${isUser ? "text-white" : "text-slate-700"}`}>
                          {m.message}
                        </p>
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-slate-300/60 mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Form */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder="Tulis balasan pesan untuk customer support (tekan Enter untuk kirim)..."
                    className="flex-1 text-xs px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="px-5 py-3 rounded-2xl bg-primary text-white font-black text-xs hover:bg-primary/90 active:scale-95 disabled:opacity-50 shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    {sendingReply ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
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
