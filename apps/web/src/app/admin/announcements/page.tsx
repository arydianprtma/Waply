"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Flame,
  Users,
  Eye,
  Check,
  X,
  Radio,
  Clock,
} from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "URGENT";
  targetAudience: "ALL" | "FREE" | "PAID";
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  readBy?: string[];
}

export default function AdminAnnouncementsPage() {
  const [mounted, setMounted] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formType, setFormType] = useState<"INFO" | "WARNING" | "SUCCESS" | "URGENT">("INFO");
  const [formTarget, setFormTarget] = useState<"ALL" | "FREE" | "PAID">("ALL");
  const [formPinned, setFormPinned] = useState(false);
  const [formActive, setFormActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAnnouncements(json.data);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle("");
    setFormMessage("");
    setFormType("INFO");
    setFormTarget("ALL");
    setFormPinned(false);
    setFormActive(true);
    setShowModal(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormMessage(item.message);
    setFormType(item.type);
    setFormTarget(item.targetAudience);
    setFormPinned(item.isPinned);
    setFormActive(item.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        title: formTitle,
        message: formMessage,
        type: formType,
        targetAudience: formTarget,
        isPinned: formPinned,
        isActive: formActive,
      };

      if (editingId) {
        payload.id = editingId;
      }

      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setSuccessToast(editingId ? "Pengumuman berhasil diperbarui!" : "Pengumuman berhasil dipublikasikan ke seluruh pengguna!");
        setTimeout(() => setSuccessToast(null), 3500);
        fetchAnnouncements();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;

    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setSuccessToast("Pengumuman berhasil dihapus");
        setTimeout(() => setSuccessToast(null), 3000);
        fetchAnnouncements();
      }
    } catch {
      //
    }
  };

  const filtered = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalAnnouncements = announcements.length;
  const activeCount = announcements.filter((a) => a.isActive).length;
  const pinnedCount = announcements.filter((a) => a.isPinned).length;

  const getTypeBadge = (type: AnnouncementItem["type"]) => {
    switch (type) {
      case "URGENT":
        return {
          label: "Penting",
          color: "bg-rose-100 text-rose-800 border border-rose-300",
          icon: <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />,
        };
      case "WARNING":
        return {
          label: "Perhatian",
          color: "bg-amber-100 text-amber-800 border border-amber-300",
          icon: <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />,
        };
      case "SUCCESS":
        return {
          label: "Promo & Rilis",
          color: "bg-emerald-100 text-emerald-800 border border-emerald-300",
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />,
        };
      default:
        return {
          label: "Informasi",
          color: "bg-blue-100 text-blue-800 border border-blue-300",
          icon: <Info className="w-3 h-3 text-blue-600 shrink-0" />,
        };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            Broadcast Center
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Pengumuman Sistem
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
            Siarkan pengumuman pembaruan, promo spesial, maintenance, atau info penting secara instan ke notifikasi seluruh pengguna.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openCreateModal}
            className="btn btn-primary btn-sm md:btn-md gap-2 rounded-2xl font-bold shadow-lg shadow-emerald-600/25 text-white"
          >
            <Plus className="w-4 h-4" /> Buat Pengumuman Baru
          </button>
        </div>
      </div>

      {/* Success Toast Notification */}
      {successToast && (
        <div className="alert alert-success text-xs font-bold py-3 px-5 rounded-2xl border border-emerald-300 shadow-md text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalAnnouncements}</div>
            <div className="text-xs font-bold text-slate-500">Total Pengumuman</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{activeCount}</div>
            <div className="text-xs font-bold text-slate-500">Sedang Tayang (Aktif)</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            <Pin className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{pinnedCount}</div>
            <div className="text-xs font-bold text-slate-500">Disematkan (Pinned)</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari judul / isi pengumuman..."
            className="input input-bordered input-sm w-full pl-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: "Semua" },
            { id: "INFO", label: "Informasi" },
            { id: "SUCCESS", label: "Promo & Rilis" },
            { id: "WARNING", label: "Perhatian" },
            { id: "URGENT", label: "Penting" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filterType === type.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <div className="loading loading-spinner loading-md mb-2 text-primary" />
            <p className="text-xs font-semibold">Memuat daftar pengumuman...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold text-slate-600">Belum ada pengumuman ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol "Buat Pengumuman Baru" untuk mulai menyiarkan pesan ke pengguna.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <div
                key={item.id}
                className={`p-5 rounded-3xl bg-white border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.isActive ? "border-slate-200 shadow-xs hover:border-slate-300" : "border-slate-200/60 opacity-60 bg-slate-50"
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${badge.color}`}>
                      {badge.icon}
                      {badge.label}
                    </span>

                    {item.isPinned && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-current" /> Pinned
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                      Audiens: {item.targetAudience === "ALL" ? "Semua User" : item.targetAudience === "FREE" ? "Free User" : "Pro User"}
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 ml-auto md:ml-2">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      Dibaca oleh: <b className="text-slate-700 font-bold">{item.readBy?.length || 0} user</b>
                    </span>
                    <span className="flex items-center gap-1">
                      Status: <b className={item.isActive ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                        {item.isActive ? "● Aktif Tayang" : "○ Nonaktif (Draft)"}
                      </b>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => openEditModal(item)}
                    className="btn btn-ghost btn-sm rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    title="Edit Pengumuman"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-ghost btn-sm rounded-xl text-rose-600 hover:bg-rose-50"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {showModal &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto my-auto relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 font-bold text-lg text-slate-900">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <span>{editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}</span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost btn-circle btn-xs text-slate-400"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-700">Judul Pengumuman</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembaruan Gateway v2.0 atau Promo Akhir Bulan"
                    className="input input-bordered input-sm font-semibold rounded-xl text-xs"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-700">Isi Pesan Pengumuman</span>
                  </label>
                  <textarea
                    placeholder="Ketik rincian pesan pengumuman untuk seluruh pengguna..."
                    className="textarea textarea-bordered text-xs font-medium h-28 leading-relaxed rounded-xl"
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-slate-700">Tipe / Kategori:</span>
                    </label>
                    <select
                      className="select select-bordered select-sm font-semibold text-xs rounded-xl"
                      value={formType}
                      onChange={(e: any) => setFormType(e.target.value)}
                    >
                      <option value="INFO">INFO (Informasi Umum)</option>
                      <option value="SUCCESS">SUCCESS (Promo & Rilis)</option>
                      <option value="WARNING">WARNING (Peringatan / Pemeliharaan)</option>
                      <option value="URGENT">URGENT (Penting / Darurat)</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-slate-700">Target Audiens:</span>
                    </label>
                    <select
                      className="select select-bordered select-sm font-semibold text-xs rounded-xl"
                      value={formTarget}
                      onChange={(e: any) => setFormTarget(e.target.value)}
                    >
                      <option value="ALL">Semua Pengguna</option>
                      <option value="FREE">Pengguna Free Trial Saja</option>
                      <option value="PAID">Pengguna Pro / Berlangganan</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="label cursor-pointer justify-start gap-3 p-0 select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm rounded-md"
                      checked={formPinned}
                      onChange={(e) => setFormPinned(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-bold text-xs text-slate-900 block">
                        Sematkan Pengumuman (Pin to Top)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Selalu tampil di urutan paling atas daftar notifikasi
                      </span>
                    </div>
                  </label>

                  <label className="label cursor-pointer justify-start gap-3 p-0 select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm rounded-md"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-bold text-xs text-slate-900 block">
                        Langsung Tayang (Published)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Pengumuman langsung dikirimkan ke lonceng notifikasi pengguna
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost btn-sm font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formTitle || !formMessage}
                    className="btn btn-primary btn-sm gap-2 font-bold px-5 text-white"
                  >
                    {submitting ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Megaphone className="w-4 h-4" />
                    )}
                    {editingId ? "Simpan Perubahan" : "Siarkan Sekarang"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
