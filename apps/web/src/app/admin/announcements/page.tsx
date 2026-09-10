"use client";

import { useState, useEffect, useCallback } from "react";
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
  Users,
  Eye,
  Check,
  X,
  Radio,
  Clock,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  Power,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "URGENT";
  targetAudience: "ALL" | "FREE" | "PAID";
  isPinned: boolean;
  isActive: boolean;
  isPopup?: boolean;
  popupActionText?: string;
  popupActionUrl?: string;
  popupImage?: string;
  popupImageRatio?: "16:9" | "1:1" | "4:3" | "AUTO";
  popupImageLayout?: "TOP" | "SIDE";
  createdAt: string;
  updatedAt: string;
  readBy?: string[];
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterAudience, setFilterAudience] = useState<string>("ALL");

  // Create/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formType, setFormType] = useState<"INFO" | "WARNING" | "SUCCESS" | "URGENT">("INFO");
  const [formTarget, setFormTarget] = useState<"ALL" | "FREE" | "PAID">("ALL");
  const [formPinned, setFormPinned] = useState(false);
  const [formActive, setFormActive] = useState(true);
  const [formIsPopup, setFormIsPopup] = useState(false);
  const [formPopupActionText, setFormPopupActionText] = useState("");
  const [formPopupActionUrl, setFormPopupActionUrl] = useState("");
  const [formPopupImage, setFormPopupImage] = useState("");
  const [formPopupImageRatio, setFormPopupImageRatio] = useState<"16:9" | "1:1" | "4:3" | "AUTO">("16:9");
  const [formPopupImageLayout, setFormPopupImageLayout] = useState<"TOP" | "SIDE">("SIDE");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteAnnouncement, setTargetDeleteAnnouncement] = useState<AnnouncementItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAnnouncements(json.data);
      }
    } catch {
      showToast("Gagal memuat daftar pengumuman", "error");
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
    setFormIsPopup(false);
    setFormPopupActionText("");
    setFormPopupActionUrl("");
    setFormPopupImage("");
    setFormPopupImageRatio("16:9");
    setFormPopupImageLayout("SIDE");
    setImageError(false);
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
    setFormIsPopup(item.isPopup ?? false);
    setFormPopupActionText(item.popupActionText || "");
    setFormPopupActionUrl(item.popupActionUrl || "");
    setFormPopupImage(item.popupImage || "");
    setFormPopupImageRatio(item.popupImageRatio || "16:9");
    setFormPopupImageLayout(item.popupImageLayout || "SIDE");
    setImageError(false);
    setShowModal(true);
  };

  const handleToggleActive = async (item: AnnouncementItem) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          isActive: !item.isActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          item.isActive
            ? `Pengumuman "${item.title}" dinonaktifkan`
            : `Pengumuman "${item.title}" sekarang aktif tayang`
        );
        fetchAnnouncements();
      } else {
        showToast(json.error || "Gagal mengubah status pengumuman", "error");
      }
    } catch {
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageError(false);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/announcements/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setFormPopupImage(json.url);
      } else {
        showToast(json.error || "Gagal mengunggah gambar", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat mengunggah gambar", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        type: formType,
        targetAudience: formTarget,
        isPinned: formPinned,
        isActive: formActive,
        isPopup: formIsPopup,
        popupActionText: formPopupActionText.trim(),
        popupActionUrl: formPopupActionUrl.trim(),
        popupImage: formPopupImage.trim(),
        popupImageRatio: formPopupImageRatio,
        popupImageLayout: formPopupImageLayout,
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
        showToast(
          editingId
            ? "Pengumuman berhasil diperbarui"
            : "Pengumuman berhasil dipublikasikan"
        );
        fetchAnnouncements();
      } else {
        showToast(json.error || "Gagal menyimpan pengumuman", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat memproses data", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (item: AnnouncementItem) => {
    setTargetDeleteAnnouncement(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDeleteAnnouncement) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/announcements?id=${targetDeleteAnnouncement.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Pengumuman "${targetDeleteAnnouncement.title}" berhasil dihapus`);
        setDeleteModalOpen(false);
        setTargetDeleteAnnouncement(null);
        fetchAnnouncements();
      } else {
        showToast(json.error || "Gagal menghapus pengumuman", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menghapus", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = announcements.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query);
    const matchesType = filterType === "ALL" || item.type === filterType;
    const matchesAudience = filterAudience === "ALL" || item.targetAudience === filterAudience;
    return matchesSearch && matchesType && matchesAudience;
  });

  const totalAnnouncements = announcements.length;
  const activeCount = announcements.filter((a) => a.isActive).length;
  const pinnedCount = announcements.filter((a) => a.isPinned).length;
  const infoCount = announcements.filter((a) => a.type === "INFO").length;
  const promoCount = announcements.filter((a) => a.type === "SUCCESS").length;
  const warningCount = announcements.filter((a) => a.type === "WARNING").length;
  const urgentCount = announcements.filter((a) => a.type === "URGENT").length;

  const getTypeMeta = (type: AnnouncementItem["type"]) => {
    switch (type) {
      case "URGENT":
        return {
          label: "Penting",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
          borderAccent: "border-l-rose-500",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
        };
      case "WARNING":
        return {
          label: "Perhatian",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
          borderAccent: "border-l-amber-500",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
        };
      case "SUCCESS":
        return {
          label: "Promo & Rilis",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
          borderAccent: "border-l-emerald-500",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
        };
      default:
        return {
          label: "Informasi",
          badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
          borderAccent: "border-l-sky-500",
          icon: <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
        };
    }
  };

  const getAudienceLabel = (aud: AnnouncementItem["targetAudience"]) => {
    switch (aud) {
      case "FREE":
        return "Free User";
      case "PAID":
        return "Pro User";
      default:
        return "Semua User";
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
              toastMsg.type === "success"
                ? "bg-emerald-950 text-emerald-100 border-emerald-800"
                : "bg-rose-950 text-rose-100 border-rose-800"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
            <button
              onClick={() => setToastMsg(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
            <Megaphone className="w-3.5 h-3.5 text-slate-500" />
            Broadcast & Notifikasi
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Pengumuman Sistem
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-xl leading-relaxed">
            Siarkan pengumuman pembaruan, promo khusus, pemeliharaan, atau info darurat secara terpusat ke panel notifikasi pengguna.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openCreateModal}
            className="btn btn-primary btn-sm md:btn-md gap-2 rounded-xl font-bold text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Pengumuman Baru
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Pengumuman</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalAnnouncements}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Semua riwayat pengumuman</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Sedang Tayang (Aktif)</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tampil di dashboard user</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Disematkan (Pinned)</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pinnedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Prioritas di urutan teratas</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Pin className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul atau isi pengumuman..."
              className="input input-bordered input-sm w-full pl-9 pr-8 text-xs rounded-xl focus:border-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Secondary Audience Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
              <Users className="w-3.5 h-3.5" />
              <span>Target:</span>
            </div>
            <select
              className="select select-bordered select-sm text-xs rounded-xl font-medium"
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
            >
              <option value="ALL">Semua Audiens</option>
              <option value="FREE">Hanya Free User</option>
              <option value="PAID">Hanya Pro User</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {[
            { id: "ALL", label: "Semua", count: totalAnnouncements },
            { id: "INFO", label: "Informasi", count: infoCount },
            { id: "SUCCESS", label: "Promo & Rilis", count: promoCount },
            { id: "WARNING", label: "Perhatian", count: warningCount },
            { id: "URGENT", label: "Penting", count: urgentCount },
          ].map((cat) => {
            const isActive = filterType === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterType(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Announcements Content List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="loading loading-spinner loading-md mb-2 text-primary" />
            <p className="text-xs font-semibold">Memuat daftar pengumuman...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-25 text-slate-500" />
            <p className="text-sm font-bold text-slate-700">Tidak ada pengumuman ditemukan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || filterType !== "ALL" || filterAudience !== "ALL"
                ? "Coba ubah kata kunci pencarian atau sesuaikan filter di atas."
                : "Belum ada pengumuman yang dibuat. Klik tombol 'Buat Pengumuman Baru' untuk memulai."}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const meta = getTypeMeta(item.type);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all p-5 ${
                  item.isActive
                    ? `border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm border-l-4 ${meta.borderAccent}`
                    : "border-slate-200/70 bg-slate-50/60 opacity-75 border-l-4 border-l-slate-300"
                }`}
              >
                {/* Header Row: Badges & Timestamps */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Category Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${meta.badgeClass}`}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>

                    {/* Pinned Badge */}
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />
                        Disematkan
                      </span>
                    )}

                    {/* Pop-up Badge */}
                    {item.isPopup && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Pop-up Modal
                      </span>
                    )}

                    {/* Audience Badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                      <Users className="w-3 h-3 text-slate-500" />
                      {getAudienceLabel(item.targetAudience)}
                    </span>
                  </div>

                  {/* Date & Active Pill */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-[11px] font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(item.createdAt)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                        item.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.isActive ? "● Aktif Tayang" : "○ Draft / Nonaktif"}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Content & Optional Thumbnail */}
                <div className="py-3.5 flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-line line-clamp-3">
                      {item.message}
                    </p>

                    {/* CTA Action Preview if available */}
                    {item.popupActionText && (
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold">
                          <ExternalLink className="w-3.5 h-3.5 text-primary" />
                          <span>Tombol CTA:</span>
                          <span className="text-primary font-bold">{item.popupActionText}</span>
                          {item.popupActionUrl && (
                            <span className="text-slate-400 text-[11px] font-mono">
                              ({item.popupActionUrl})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Banner Preview if exists */}
                  {item.popupImage && (
                    <div className="shrink-0 w-full md:w-36 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.popupImage}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold p-1 text-center leading-tight">
                        <span>{item.popupImageRatio || "16:9"}</span>
                        <span className="text-[9px] text-purple-200">
                          {item.popupImageLayout === "SIDE" ? "Layout Samping" : "Layout Atas"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Row: Readers count & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      Dibaca oleh: <b className="font-bold text-slate-800">{item.readBy?.length || 0} user</b>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`btn btn-xs rounded-lg font-bold gap-1 ${
                        item.isActive
                          ? "btn-ghost text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                          : "btn-ghost text-emerald-700 hover:bg-emerald-50"
                      }`}
                      title={item.isActive ? "Klik untuk nonaktifkan" : "Klik untuk tayangkan"}
                    >
                      <Power className="w-3 h-3" />
                      <span>{item.isActive ? "Nonaktifkan" : "Tayangkan"}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="btn btn-xs btn-outline rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 font-bold gap-1"
                    >
                      <Edit className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => openDeleteModal(item)}
                      className="btn btn-xs btn-outline rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 font-bold gap-1"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && targetDeleteAnnouncement && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">Hapus Pengumuman?</h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus pengumuman{" "}
                  <b className="text-slate-800">"{targetDeleteAnnouncement.title}"</b>? Pesan ini akan dihapus permanen dari sistem dan notifikasi seluruh pengguna.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setTargetDeleteAnnouncement(null);
                  }}
                  disabled={deleting}
                  className="btn btn-ghost btn-sm rounded-xl font-bold flex-1 text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="btn btn-error btn-sm rounded-xl font-bold flex-1 text-white gap-2"
                >
                  {deleting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{deleting ? "Menghapus..." : "Ya, Hapus"}</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Create / Edit Modal Dialog */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-7 shadow-2xl border border-slate-200 space-y-5 my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Megaphone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Konfigurasikan informasi, audiens target, dan banner siaran.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost btn-circle btn-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Judul */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-700">
                      Judul Pengumuman <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembaruan Gateway v2.0 atau Promo Akhir Bulan"
                    className="input input-bordered input-sm font-semibold rounded-xl text-xs focus:border-slate-400"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Pesan */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-700">
                      Isi Pesan Pengumuman <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <textarea
                    placeholder="Ketik rincian pesan pengumuman untuk disiarkan..."
                    className="textarea textarea-bordered text-xs font-medium h-28 leading-relaxed rounded-xl focus:border-slate-400"
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    required
                  />
                </div>

                {/* Grid Type & Target */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-slate-700">Tipe / Kategori</span>
                    </label>
                    <select
                      className="select select-bordered select-sm font-semibold text-xs rounded-xl"
                      value={formType}
                      onChange={(e: any) => setFormType(e.target.value)}
                    >
                      <option value="INFO">Informasi Umum (Info)</option>
                      <option value="SUCCESS">Promo & Rilis Fitur (Success)</option>
                      <option value="WARNING">Perhatian / Maintenance (Warning)</option>
                      <option value="URGENT">Penting & Darurat (Urgent)</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-slate-700">Target Audiens</span>
                    </label>
                    <select
                      className="select select-bordered select-sm font-semibold text-xs rounded-xl"
                      value={formTarget}
                      onChange={(e: any) => setFormTarget(e.target.value)}
                    >
                      <option value="ALL">Semua Pengguna (All Users)</option>
                      <option value="FREE">Hanya Free Trial User</option>
                      <option value="PAID">Hanya Pengguna Pro / Berlangganan</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Options Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="label cursor-pointer justify-start gap-2.5 p-0 select-none bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-xs rounded-md"
                        checked={formPinned}
                        onChange={(e) => setFormPinned(e.target.checked)}
                      />
                      <div>
                        <span className="label-text font-bold text-xs text-slate-900 block">
                          Sematkan (Pin to Top)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Tampil prioritas di daftar teratas
                        </span>
                      </div>
                    </label>

                    <label className="label cursor-pointer justify-start gap-2.5 p-0 select-none bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-xs rounded-md"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                      />
                      <div>
                        <span className="label-text font-bold text-xs text-slate-900 block">
                          Langsung Tayang (Published)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Langsung tampil ke pengguna
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Pop-up Modal Option */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="label cursor-pointer justify-start gap-2.5 p-0 select-none">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-secondary checkbox-xs rounded-md"
                        checked={formIsPopup}
                        onChange={(e) => setFormIsPopup(e.target.checked)}
                      />
                      <div>
                        <span className="label-text font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          Tampilkan sebagai Jendela Pop-up Modal
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Muncul otomatis sebagai pop-up promosi/pengumuman saat user login ke dashboard
                        </span>
                      </div>
                    </label>

                    {formIsPopup && (
                      <div className="mt-3.5 pl-6 space-y-3.5 border-l-2 border-purple-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label py-0.5">
                              <span className="label-text font-bold text-[11px] text-slate-700">Teks Tombol CTA</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Ambil Promo Sekarang"
                              className="input input-bordered input-xs font-semibold rounded-lg text-xs"
                              value={formPopupActionText}
                              onChange={(e) => setFormPopupActionText(e.target.value)}
                            />
                          </div>
                          <div className="form-control">
                            <label className="label py-0.5">
                              <span className="label-text font-bold text-[11px] text-slate-700">Link Tujuan CTA (URL)</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: /dashboard/billing atau https://..."
                              className="input input-bordered input-xs font-semibold rounded-lg text-xs"
                              value={formPopupActionUrl}
                              onChange={(e) => setFormPopupActionUrl(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Image Banner Section */}
                        <div className="space-y-2">
                          <label className="label py-0.5">
                            <span className="label-text font-bold text-[11px] text-slate-700">
                              Gambar Banner Pop-up (Opsional)
                            </span>
                          </label>

                          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                            <label className="btn btn-outline btn-xs gap-1.5 rounded-lg border-slate-300 font-bold shrink-0 cursor-pointer hover:bg-slate-100">
                              {uploadingImage ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                <Upload className="w-3.5 h-3.5 text-primary" />
                              )}
                              <span>{uploadingImage ? "Mengunggah..." : "Upload File Gambar"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingImage}
                                onChange={handleImageUpload}
                              />
                            </label>

                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder="Atau tempel URL gambar langsung (https://...jpg / .png)"
                                className="input input-bordered input-xs font-semibold rounded-lg text-xs w-full pl-7"
                                value={formPopupImage}
                                onChange={(e) => {
                                  setFormPopupImage(e.target.value);
                                  setImageError(false);
                                }}
                              />
                              <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
                            </div>

                            {formPopupImage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormPopupImage("");
                                  setImageError(false);
                                }}
                                className="btn btn-ghost btn-xs text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 text-[11px]"
                              >
                                Hapus
                              </button>
                            )}
                          </div>

                          {/* Aspect Ratio Selector */}
                          <div className="space-y-1.5 pt-1">
                            <label className="label py-0">
                              <span className="label-text font-bold text-[11px] text-slate-700">Rasio Gambar:</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {[
                                { id: "16:9", label: "16:9 (Landscape)" },
                                { id: "1:1", label: "1:1 (Persegi)" },
                                { id: "4:3", label: "4:3 (Standar)" },
                                { id: "AUTO", label: "Auto (Asli)" },
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setFormPopupImageRatio(opt.id as any)}
                                  className={`py-1.5 px-2 rounded-lg text-center border transition-all text-xs ${
                                    formPopupImageRatio === opt.id
                                      ? "bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-xs"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Layout Selector: Side vs Top */}
                          <div className="space-y-1.5 pt-1">
                            <label className="label py-0">
                              <span className="label-text font-bold text-[11px] text-slate-700">Tata Letak Gambar pada Pop-up:</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setFormPopupImageLayout("SIDE")}
                                className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                                  formPopupImageLayout === "SIDE"
                                    ? "bg-purple-50/90 border-purple-400 text-purple-900 shadow-xs ring-1 ring-purple-400/40"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border flex items-center justify-center ${
                                    formPopupImageLayout === "SIDE"
                                      ? "border-purple-600 bg-purple-600"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {formPopupImageLayout === "SIDE" && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold leading-tight">Di Samping (Side-by-Side)</p>
                                    <span className="px-1.5 py-0.2 bg-purple-200/60 text-purple-800 text-[9px] font-extrabold rounded">
                                      Disarankan
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                                    Gambar di kolom kiri & pesan di kolom kanan. Rapi & modern pada desktop/tablet.
                                  </p>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFormPopupImageLayout("TOP")}
                                className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                                  formPopupImageLayout === "TOP"
                                    ? "bg-purple-50/90 border-purple-400 text-purple-900 shadow-xs ring-1 ring-purple-400/40"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border flex items-center justify-center ${
                                    formPopupImageLayout === "TOP"
                                      ? "border-purple-600 bg-purple-600"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {formPopupImageLayout === "TOP" && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold leading-tight">Di Atas (Top Banner)</p>
                                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                                    Banner horizontal penuh di bagian atas modal dengan teks konten di bawahnya.
                                  </p>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Live Image Preview */}
                          {formPopupImage && (
                            <div className="mt-2 p-2.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                <span>Preview Banner ({formPopupImageRatio} - {formPopupImageLayout === "SIDE" ? "Samping" : "Atas"}):</span>
                                {imageError ? (
                                  <span className="text-rose-500 flex items-center gap-1 font-bold">
                                    <AlertCircle className="w-3 h-3" /> Gagal Memuat
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 flex items-center gap-1 font-bold">
                                    <Check className="w-3 h-3" /> Gambar Valid
                                  </span>
                                )}
                              </div>

                              <div
                                className={`relative w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-200 flex items-center justify-center ${
                                  formPopupImageRatio === "16:9"
                                    ? "aspect-[16/9]"
                                    : formPopupImageRatio === "1:1"
                                    ? "aspect-square max-w-[220px] mx-auto"
                                    : formPopupImageRatio === "4:3"
                                    ? "aspect-[4/3] max-w-[260px] mx-auto"
                                    : "max-h-48 w-auto mx-auto"
                                }`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={formPopupImage}
                                  alt="Preview Banner"
                                  className={`w-full h-full ${
                                    formPopupImageRatio === "AUTO" ? "object-contain max-h-48" : "object-cover"
                                  } rounded-xl ${imageError ? "hidden" : "block"}`}
                                  onLoad={() => setImageError(false)}
                                  onError={() => setImageError(true)}
                                />
                                {imageError && (
                                  <div className="p-3 text-center text-rose-600 text-xs font-medium space-y-1">
                                    <p className="font-bold">Gagal memuat URL gambar</p>
                                    <p className="text-[10px] text-slate-400">
                                      Pastikan URL langsung menuju file gambar (.jpg / .png / .webp).
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Footer Action Buttons */}
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost btn-sm rounded-xl font-bold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formTitle.trim() || !formMessage.trim()}
                    className="btn btn-primary btn-sm rounded-xl gap-2 font-bold px-5 text-white"
                  >
                    {submitting ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Megaphone className="w-4 h-4" />
                    )}
                    <span>{editingId ? "Simpan Perubahan" : "Siarkan Sekarang"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
