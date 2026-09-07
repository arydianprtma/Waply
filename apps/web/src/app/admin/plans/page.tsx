"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
  Smartphone,
  MessageSquare,
  ShieldCheck,
  Check,
  RefreshCw,
  Sparkles,
  Lock,
  Code2,
  Bot,
  Radio,
  Flame,
  Users,
  Calendar,
} from "lucide-react";
import { Plan, PlanFeatureAccess, FEATURE_ACCESS_CATEGORIES } from "@/lib/billing-types";
import { ModalPortal } from "@/components/ui/ModalPortal";

const DEFAULT_ACCESS: PlanFeatureAccess = {
  devices: true,
  warmupHealth: true,
  broadcast: true,
  contacts: true,
  sendMessage: true,
  messageLogs: true,
  templatesSpintax: true,
  blacklistDnd: true,
  autoReply: true,
  apiDocs: true,
  apiKeys: true,
  webhooks: true,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<"all" | "day" | "month" | "year">("all");

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeletePlan, setTargetDeletePlan] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenDelete = (p: Plan) => {
    setTargetDeletePlan(p);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDeletePlan) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/plans?id=${targetDeletePlan.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Paket ${targetDeletePlan.name} berhasil dihapus`);
        setDeleteModalOpen(false);
        setTargetDeletePlan(null);
        if (editingId === targetDeletePlan.id) {
          setModalOpen(false);
        }
        fetchPlans();
      } else {
        showToast(`Gagal menghapus: ${json.error || "Terjadi kesalahan"}`);
      }
    } catch {
      showToast("Terjadi kesalahan saat menghapus paket");
    } finally {
      setDeleting(false);
    }
  };

  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    price: number;
    hasDiscount: boolean;
    originalPrice: number;
    discountPercent: number;
    discountBadge: string;
    period: "month" | "week" | "year" | "day";
    maxDevices: number;
    monthlyMessages: number;
    isUnlimitedMessages: boolean;
    featuresText: string;
    access: PlanFeatureAccess;
    isPopular: boolean;
    isActive: boolean;
    watermarkEnabled: boolean;
  }>({
    id: "",
    name: "",
    price: 99000,
    hasDiscount: false,
    originalPrice: 129000,
    discountPercent: 23,
    discountBadge: "DISKON 23%",
    period: "month",
    maxDevices: 3,
    monthlyMessages: 10000,
    isUnlimitedMessages: false,
    featuresText: "3 WhatsApp Devices\n10.000 Pesan / bulan\nKeyword Auto Reply\nBroadcast Campaign",
    access: DEFAULT_ACCESS,
    isPopular: false,
    isActive: true,
    watermarkEnabled: false,
  });

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/plans");
      const json = await res.json();
      if (json.success) {
        setPlans(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      id: "CUSTOM_PLAN",
      name: "Paket Kustom",
      price: 99000,
      hasDiscount: false,
      originalPrice: 129000,
      discountPercent: 23,
      discountBadge: "",
      period: "month",
      maxDevices: 3,
      monthlyMessages: 10000,
      isUnlimitedMessages: false,
      featuresText: "3 WhatsApp Devices\n10.000 Pesan / bulan\nKeyword Auto Reply\nBroadcast Campaign",
      access: { ...DEFAULT_ACCESS },
      isPopular: false,
      isActive: true,
      watermarkEnabled: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Plan) => {
    setEditingId(p.id);
    const hasDisc = Boolean(p.originalPrice && p.originalPrice > p.price);
    const calcPercent = hasDisc
      ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
      : 0;

    setFormData({
      id: p.id,
      name: p.name,
      price: p.price,
      hasDiscount: hasDisc,
      originalPrice: p.originalPrice || Math.round(p.price * 1.25),
      discountPercent: p.discountPercent || calcPercent,
      discountBadge: p.discountBadge || (calcPercent > 0 ? `DISKON ${calcPercent}%` : ""),
      period: p.period || "month",
      maxDevices: p.maxDevices,
      monthlyMessages: p.monthlyMessages,
      isUnlimitedMessages: p.monthlyMessages === -1,
      featuresText: p.features.join("\n"),
      access: p.access || { ...DEFAULT_ACCESS },
      isPopular: Boolean(p.isPopular),
      isActive: p.isActive !== false,
      watermarkEnabled: p.watermarkEnabled ?? (p.id === "FREE" || p.price === 0),
    });
    setModalOpen(true);
  };

  const handleAutoGenerateBullets = () => {
    const periodLabel =
      formData.period === "day"
        ? "hari"
        : formData.period === "week"
        ? "minggu"
        : formData.period === "year"
        ? "tahun"
        : "bulan";
    const bullets = [
      `${formData.maxDevices} WhatsApp Device${formData.maxDevices > 1 ? "s" : ""}`,
      `${formData.isUnlimitedMessages ? "Unlimited" : formData.monthlyMessages.toLocaleString("id-ID")} Pesan / ${periodLabel}`,
    ];

    FEATURE_ACCESS_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        if (formData.access[item.key as keyof PlanFeatureAccess]) {
          bullets.push(item.label);
        }
      });
    });

    setFormData({
      ...formData,
      featuresText: bullets.join("\n"),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<Plan> = {
        id: formData.id,
        name: formData.name,
        price: formData.price,
        originalPrice: formData.hasDiscount ? formData.originalPrice : undefined,
        discountPercent: formData.hasDiscount ? formData.discountPercent : undefined,
        discountBadge: formData.hasDiscount && formData.discountBadge ? formData.discountBadge : undefined,
        period: formData.period,
        maxDevices: formData.maxDevices,
        monthlyMessages: formData.isUnlimitedMessages ? -1 : formData.monthlyMessages,
        features: formData.featuresText.split("\n").filter(Boolean),
        access: formData.access,
        isPopular: formData.isPopular,
        isActive: formData.isActive,
        watermarkEnabled: formData.watermarkEnabled,
      };

      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setModalOpen(false);
        fetchPlans();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    const updated = { ...plan, isActive: !plan.isActive };
    try {
      await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      showToast(`Status paket ${plan.name} diperbarui`);
      fetchPlans();
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success text-xs font-bold py-2.5 px-4 shadow-xl rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-primary" /> Layanan & Paket Berlangganan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi paket SaaS, batas kuota chat/bulan, batas WhatsApp device, serta hak akses fitur menu.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchPlans}
            className="btn btn-outline btn-sm gap-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary btn-sm gap-2 rounded-xl shadow-md shadow-primary/25"
          >
            <Plus className="w-4 h-4" />
            Buat Paket Baru
          </button>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 gap-1 text-xs">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterCategory === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({plans.length})
          </button>
          <button
            onClick={() => setFilterCategory("day")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              filterCategory === "day"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-warning" /> Harian ({plans.filter((p) => p.period === "day").length})
          </button>
          <button
            onClick={() => setFilterCategory("month")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              filterCategory === "month"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-primary" /> Bulanan ({plans.filter((p) => (p.period || "month") === "month").length})
          </button>
          <button
            onClick={() => setFilterCategory("year")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
              filterCategory === "year"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-emerald-500" /> Tahunan ({plans.filter((p) => p.period === "year").length})
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Menampilkan {
            plans.filter((p) => {
              if (filterCategory === "all") return true;
              return (p.period || "month") === filterCategory;
            }).length
          } dari {plans.length} paket
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-4 text-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-xs text-slate-500 mt-3 font-medium">Memuat konfigurasi layanan...</p>
          </div>
        ) : (
          plans
            .filter((p) => {
              if (filterCategory === "all") return true;
              return (p.period || "month") === filterCategory;
            })
            .map((p) => {
            const isFree = p.price === 0;
            const access = p.access || DEFAULT_ACCESS;

            return (
              <div
                key={p.id}
                className={`card bg-white border rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg ${
                  p.isPopular
                    ? "border-primary ring-2 ring-primary/20 shadow-md"
                    : p.isActive === false
                    ? "border-slate-200 opacity-60 bg-slate-50"
                    : "border-slate-200/90 shadow-xs"
                }`}
              >
                {/* Header & Badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold text-slate-400 uppercase">
                      ID: {p.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {p.isPopular && (
                        <span className="badge badge-primary badge-xs py-2 px-2 text-[10px] font-bold">
                          Best Seller
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.isActive !== false
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-200 text-slate-600 border-slate-300"
                      }`}>
                        {p.isActive !== false ? "Aktif" : "Nonaktif"}
                      </span>
                      {p.watermarkEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                          <Sparkles className="w-2.5 h-2.5" /> Watermark ON
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-slate-50 text-slate-500 border-slate-200">
                          White-Label
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                      {p.discountBadge ? (
                        <span className="badge badge-error text-white font-extrabold text-[10px] shadow-xs">
                          {p.discountBadge}
                        </span>
                      ) : p.discountPercent ? (
                        <span className="badge badge-error text-white font-extrabold text-[10px] shadow-xs">
                          -{p.discountPercent}%
                        </span>
                      ) : null}
                    </div>

                    {p.originalPrice && p.originalPrice > p.price && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 line-through font-semibold">
                          Rp {p.originalPrice.toLocaleString("id-ID")}
                        </span>
                        {p.discountPercent && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Diskon {p.discountPercent}%
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">
                        {isFree ? "Gratis" : `Rp ${p.price.toLocaleString("id-ID")}`}
                      </span>
                      {!isFree && (
                        <span className="text-xs text-slate-500 font-medium">
                          /{" "}
                          {p.period === "day"
                            ? "hari"
                            : p.period === "week"
                            ? "minggu"
                            : p.period === "year"
                            ? "tahun"
                            : "bulan"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Limits Badge Box */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <MessageSquare className="w-3.5 h-3.5 text-primary" /> Kuota Chat:
                      </span>
                      <span className="font-bold">
                        {p.monthlyMessages === -1
                          ? "Unlimited"
                          : `${p.monthlyMessages.toLocaleString()} / ${
                              p.period === "day"
                                ? "hari"
                                : p.period === "week"
                                ? "minggu"
                                : p.period === "year"
                                ? "thn"
                                : "bln"
                            }`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Smartphone className="w-3.5 h-3.5 text-primary" /> Batas Device:
                      </span>
                      <span className="font-bold">{p.maxDevices} WhatsApp</span>
                    </div>
                  </div>

                  {/* Feature Checklist Tags */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Hak Akses Fitur Dashboard:
                    </span>
                    <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
                      {FEATURE_ACCESS_CATEGORIES.flatMap((c) => c.items).map((item, idx) => {
                        let isEnabled = Boolean(access[item.key as keyof PlanFeatureAccess]);
                        if (item.key === "apiKeys" && access.apiAccess !== undefined) {
                          isEnabled = Boolean(access.apiKeys || access.apiAccess);
                        }
                        if (item.key === "contacts" && access.contactsUnlimited !== undefined) {
                          isEnabled = Boolean(access.contacts || access.contactsUnlimited);
                        }
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-[11px] ${
                              isEnabled
                                ? "text-slate-800 font-medium bg-emerald-50/50"
                                : "text-slate-400 line-through bg-slate-50 opacity-60"
                            }`}
                          >
                            <span className="truncate pr-2">{item.label}</span>
                            {isEnabled ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-bold shrink-0" />
                            ) : (
                              <span className="text-[10px] text-slate-400 shrink-0">Lock</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`btn btn-xs rounded-xl ${
                      p.isActive !== false ? "btn-ghost text-slate-500 hover:text-rose-600" : "btn-outline btn-success"
                    }`}
                  >
                    {p.isActive !== false ? "Nonaktifkan" : "Aktifkan"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenDelete(p)}
                      title="Hapus Paket"
                      className="btn btn-ghost btn-sm rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="btn btn-primary btn-sm rounded-xl gap-1.5 px-3 font-bold shadow-xs cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Form Buat / Edit Layanan */}
      {modalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <Layers className="w-5 h-5 text-primary" />
                {editingId ? `Edit Layanan: ${formData.name}` : "Buat Paket Layanan Baru"}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="btn btn-ghost btn-circle btn-xs text-slate-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ID Paket */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">ID Paket (Kode Unik)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm font-mono uppercase"
                    placeholder="MISAL: STARTER / PRO_VIP"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    required
                  />
                </div>

                {/* Nama Paket */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Nama Paket</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    placeholder="Contoh: Paket Starter Pro"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Harga */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Harga (Rp)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="input input-bordered input-sm"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                  />
                </div>

                {/* Periode */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Periode Tagihan</span>
                  </label>
                  <select
                    className="select select-bordered select-sm text-xs rounded-xl"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                  >
                    <option value="day">Per Hari (Harian / 1 Hari)</option>
                    <option value="week">Per Minggu (7 Hari)</option>
                    <option value="month">Per Bulan (30 Hari)</option>
                    <option value="year">Per Tahun (365 Hari)</option>
                  </select>
                </div>

                {/* Batas Devices */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Maksimal WhatsApp Device</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    className="input input-bordered input-sm"
                    value={formData.maxDevices}
                    onChange={(e) => setFormData({ ...formData, maxDevices: Number(e.target.value) })}
                    required
                  />
                </div>

                {/* Kuota Pesan */}
                <div className="form-control">
                  <label className="label py-1 flex items-center justify-between">
                    <span className="label-text font-bold text-xs">
                      Kuota Pesan ({formData.period === "day" ? "Harian" : formData.period === "week" ? "Mingguan" : formData.period === "year" ? "Tahunan" : "Bulanan"})
                    </span>
                    <label className="label-text-alt flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-xs"
                        checked={formData.isUnlimitedMessages}
                        onChange={(e) => setFormData({ ...formData, isUnlimitedMessages: e.target.checked })}
                      />
                      <span className="text-[11px] font-semibold text-primary">Unlimited</span>
                    </label>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    disabled={formData.isUnlimitedMessages}
                    className="input input-bordered input-sm disabled:opacity-50"
                    placeholder="Contoh: 10000"
                    value={formData.isUnlimitedMessages ? "" : formData.monthlyMessages}
                    onChange={(e) => setFormData({ ...formData, monthlyMessages: Number(e.target.value) })}
                    required={!formData.isUnlimitedMessages}
                  />
                </div>
              </div>

              {/* ── Diskon & Promo Settings ─────────────────────────────── */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-error checkbox-xs"
                      checked={formData.hasDiscount}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const orig = formData.originalPrice || Math.round(formData.price * 1.25);
                        const disc = Math.max(1, Math.round(((orig - formData.price) / orig) * 100));
                        setFormData({
                          ...formData,
                          hasDiscount: checked,
                          originalPrice: orig,
                          discountPercent: disc,
                          discountBadge: checked ? `DISKON ${disc}%` : "",
                        });
                      }}
                    />
                    <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-600" /> Aktifkan Diskon / Harga Coret Promo
                    </span>
                  </label>
                  {formData.hasDiscount && (
                    <span className="badge badge-error text-white font-bold text-[10px]">
                      Hemat {formData.discountPercent}%
                    </span>
                  )}
                </div>

                {formData.hasDiscount && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-rose-200/60">
                    <div className="form-control">
                      <label className="label py-0.5">
                        <span className="label-text font-bold text-[11px] text-rose-900">Harga Asli (Coret)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className="input input-bordered input-xs bg-white text-xs"
                        placeholder="Misal: 199000"
                        value={formData.originalPrice}
                        onChange={(e) => {
                          const orig = Number(e.target.value);
                          const disc = orig > formData.price ? Math.round(((orig - formData.price) / orig) * 100) : 0;
                          setFormData({
                            ...formData,
                            originalPrice: orig,
                            discountPercent: disc,
                            discountBadge: `DISKON ${disc}%`,
                          });
                        }}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label py-0.5">
                        <span className="label-text font-bold text-[11px] text-rose-900">Diskon (%)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        className="input input-bordered input-xs bg-white text-xs"
                        value={formData.discountPercent}
                        onChange={(e) => {
                          const pct = Number(e.target.value);
                          const orig = Math.round(formData.price / (1 - pct / 100));
                          setFormData({
                            ...formData,
                            discountPercent: pct,
                            originalPrice: orig,
                            discountBadge: `DISKON ${pct}%`,
                          });
                        }}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label py-0.5">
                        <span className="label-text font-bold text-[11px] text-rose-900">Teks Badge Promo</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-xs bg-white text-xs"
                        placeholder="Contoh: DISKON 25% / FLASH SALE"
                        value={formData.discountBadge}
                        onChange={(e) => setFormData({ ...formData, discountBadge: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Watermark Pesan Setting ─────────────────────────────── */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  formData.watermarkEnabled
                    ? "bg-amber-50/80 border-amber-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning checkbox-sm mt-0.5"
                      checked={formData.watermarkEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, watermarkEnabled: e.target.checked })
                      }
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Sertakan Watermark Pesan (Footer Promosi)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Jika diaktifkan, seluruh pesan keluar dari akun pengguna paket ini akan disisipkan watermark footer (misal: untuk Paket Free / Trial). Nonaktifkan untuk Paket Berbayar (White-Label murni).
                      </p>
                    </div>
                  </label>
                  <span
                    className={`badge text-[10px] font-bold shrink-0 ${
                      formData.watermarkEnabled
                        ? "badge-warning"
                        : "badge-ghost text-slate-500 bg-white border-slate-200"
                    }`}
                  >
                    {formData.watermarkEnabled ? "Watermark Aktif" : "White-Label"}
                  </span>
                </div>
              </div>

              {/* Checklist Hak Akses Fitur */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 block">
                    Checklist Hak Akses Menu & Fitur Dashboard:
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Sesuai menu User Dashboard
                  </span>
                </div>

                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  {FEATURE_ACCESS_CATEGORIES.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
                        {cat.category}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {cat.items.map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2.5 text-xs font-medium cursor-pointer p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                          >
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-xs rounded-md"
                              checked={Boolean(formData.access[item.key as keyof PlanFeatureAccess])}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  access: {
                                    ...formData.access,
                                    [item.key]: e.target.checked,
                                  },
                                })
                              }
                            />
                            <span className="text-slate-800">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bullets Fitur Display */}
              <div className="form-control">
                <div className="flex items-center justify-between py-1">
                  <span className="label-text font-bold text-xs text-slate-800">
                    Poin Fitur Display (1 Baris = 1 Bullet):
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoGenerateBullets}
                    className="btn btn-ghost btn-xs text-primary font-bold gap-1 hover:bg-primary/10 rounded-lg"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Sync dari Checklist
                  </button>
                </div>
                <textarea
                  className="textarea textarea-bordered text-xs"
                  rows={3}
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  />
                  <span>Tandai sebagai Paket Populer (Best Seller)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-sm"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Status Aktif & Tersedia untuk Dibeli</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        const plan = plans.find((p) => p.id === editingId);
                        if (plan) handleOpenDelete(plan);
                      }}
                      className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 gap-1.5 rounded-xl text-xs cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Hapus Paket
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-ghost btn-sm rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary btn-sm gap-2 rounded-xl cursor-pointer"
                  >
                    {saving ? <span className="loading loading-spinner loading-xs" /> : <CheckCircle2 className="w-4 h-4" />}
                    Simpan Paket Layanan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}

    {/* MODAL: Konfirmasi Hapus Layanan */}
    {deleteModalOpen && targetDeletePlan && (
      <ModalPortal>
        <div className="fixed inset-0 z-[999999] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Hapus Paket Layanan?</h3>
                <p className="text-xs text-slate-500">Tindakan ini permanen.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus paket <b className="text-slate-900">{targetDeletePlan.name}</b> (ID: <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{targetDeletePlan.id}</code>)? Paket ini tidak akan lagi muncul di katalog harga atau halaman checkout.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTargetDeletePlan(null);
                }}
                className="btn btn-ghost btn-sm rounded-xl text-slate-600 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="btn btn-error btn-sm text-white gap-2 rounded-xl cursor-pointer"
              >
                {deleting ? <span className="loading loading-spinner loading-xs" /> : <Trash2 className="w-4 h-4" />}
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}
  </div>
);
}
