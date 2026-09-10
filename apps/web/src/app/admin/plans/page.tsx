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
  X,
  RefreshCw,
  Sparkles,
  Lock,
  Code2,
  Bot,
  Radio,
  Flame,
  Users,
  Calendar,
  Timer,
  Clock,
  Hourglass,
} from "lucide-react";
import { 
  Plan, 
  PlanFeatureAccess, 
  FEATURE_ACCESS_CATEGORIES, 
  DEFAULT_FREE_ACCESS,
  getPlanDiscountStatus,
} from "@/lib/billing-types";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { PromoCountdownTimer } from "@/components/ui/PromoCountdownTimer";

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

function getPlanFeaturesWithStatus(plan: Plan) {
  const currentAccess = plan.access || {
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

  const list: { key: string; label: string; included: boolean }[] = [];

  FEATURE_ACCESS_CATEGORIES.forEach((cat) => {
    cat.items.forEach((item) => {
      const isIncluded = Boolean(currentAccess[item.key as keyof PlanFeatureAccess]);
      list.push({
        key: item.key,
        label: item.label,
        included: isIncluded,
      });
    });
  });

  return list;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [filterCategory, setFilterCategory] = useState<"all" | "day" | "month" | "year">("all");

  // Live 1-second interval for real-time countdown preview
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeletePlan, setTargetDeletePlan] = useState<Plan | null>(null);

  const handleOpenDelete = (p: Plan) => {
    setTargetDeletePlan(p);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDeletePlan) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/plans?id=${encodeURIComponent(targetDeletePlan.id)}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Paket ${targetDeletePlan.name} berhasil dihapus`);
        setDeleteModalOpen(false);
        setTargetDeletePlan(null);
        if (editingId === targetDeletePlan.id) {
          setModalOpen(false);
        }
        await fetchPlans();
      } else {
        showToast(`Gagal: ${json.error || "Gagal menghapus paket"}`);
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
    price: number | string;
    hasDiscount: boolean;
    originalPrice: number | string;
    discountPercent: number | string;
    discountBadge: string;
    discountStartDate: string | null;
    discountEndDate: string | null;
    period: "month" | "year" | "week" | "day";
    maxDevices: number | string;
    monthlyMessages: number | string;
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
    discountStartDate: null,
    discountEndDate: null,
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
      const res = await fetch("/api/admin/plans", { cache: "no-store" });
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
      originalPrice: "",
      discountPercent: "",
      discountBadge: "",
      discountStartDate: null,
      discountEndDate: null,
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
      originalPrice: hasDisc ? (p.originalPrice || "") : "",
      discountPercent: hasDisc ? (p.discountPercent || calcPercent) : "",
      discountBadge: hasDisc ? (p.discountBadge || `DISKON ${calcPercent}%`) : "",
      discountStartDate: p.discountStartDate || null,
      discountEndDate: p.discountEndDate || null,
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
    const numDevices = Number(formData.maxDevices) || 1;
    const numMessages = Number(formData.monthlyMessages) || 0;
    const bullets = [
      `${numDevices} WhatsApp Device${numDevices > 1 ? "s" : ""}`,
      `${formData.isUnlimitedMessages ? "Unlimited" : numMessages.toLocaleString("id-ID")} Pesan / ${periodLabel}`,
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
      const cleanPrice = formData.price === "" ? 0 : Number(formData.price) || 0;
      const cleanOrig = formData.hasDiscount && formData.originalPrice !== "" ? Number(formData.originalPrice) || 0 : undefined;
      const cleanDisc = formData.hasDiscount && formData.discountPercent !== "" ? Number(formData.discountPercent) || 0 : undefined;
      const cleanDevices = formData.maxDevices === "" ? 1 : Math.max(1, Number(formData.maxDevices) || 1);
      const cleanMessages = formData.isUnlimitedMessages ? -1 : (formData.monthlyMessages === "" ? 0 : Number(formData.monthlyMessages) || 0);

      const payload: Partial<Plan> = {
        id: formData.id,
        name: formData.name,
        price: cleanPrice,
        originalPrice: cleanOrig && cleanOrig > 0 ? cleanOrig : undefined,
        discountPercent: cleanDisc && cleanDisc > 0 ? cleanDisc : undefined,
        discountBadge: formData.hasDiscount && formData.discountBadge ? formData.discountBadge : undefined,
        discountStartDate: formData.hasDiscount && formData.discountStartDate ? formData.discountStartDate : undefined,
        discountEndDate: formData.hasDiscount && formData.discountEndDate ? formData.discountEndDate : undefined,
        period: formData.period,
        maxDevices: cleanDevices,
        monthlyMessages: cleanMessages,
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
        showToast(json.message || "Paket berhasil disimpan");
        setModalOpen(false);
        fetchPlans();
      } else {
        showToast(`Gagal: ${json.error || "Gagal menyimpan paket"}`);
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan paket");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    const updated = { ...plan, isActive: !plan.isActive };
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Status paket ${plan.name} diperbarui`);
        fetchPlans();
      } else {
        showToast(json.error || "Gagal memperbarui status paket");
      }
    } catch {
      showToast("Terjadi kesalahan saat memperbarui paket");
    }
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
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 gap-1 text-xs">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterCategory === "all"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua Paket ({plans.length})
          </button>
          <button
            onClick={() => setFilterCategory("day")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterCategory === "day"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Harian ({plans.filter((p) => p.period === "day").length})
          </button>
          <button
            onClick={() => setFilterCategory("month")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterCategory === "month"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Bulanan ({plans.filter((p) => (p.period || "month") === "month").length})
          </button>
          <button
            onClick={() => setFilterCategory("year")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterCategory === "year"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-sky-600" /> Tahunan ({plans.filter((p) => p.period === "year").length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <span className="font-bold text-slate-900">{
            plans.filter((p) => {
              if (filterCategory === "all") return true;
              return (p.period || "month") === filterCategory;
            }).length
          }</span> dari {plans.length} paket
        </div>
      </div>

      {/* Plan Grid: Spacious 3-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-16">
            <span className="loading loading-spinner loading-lg text-emerald-600" />
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
            const periodLabel =
              p.period === "day"
                ? "hari"
                : p.period === "week"
                ? "minggu"
                : p.period === "year"
                ? "tahun"
                : "bulan";

            return (
              <div
                key={p.id}
                className={`bg-white border rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                  p.isPopular
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                    : p.isActive === false
                    ? "border-slate-200 opacity-60 bg-slate-50/70"
                    : "border-slate-200/90 shadow-xs"
                }`}
              >
                {/* Top Section */}
                <div className="space-y-4">
                  {/* Header Meta: ID & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase truncate">
                      ID: {p.id}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {p.isPopular && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs whitespace-nowrap">
                          Best Seller
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                        p.isActive !== false
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {p.isActive !== false ? "Aktif" : "Nonaktif"}
                      </span>
                      {p.watermarkEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">
                          Watermark ON
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-slate-50 text-slate-600 border-slate-200 whitespace-nowrap">
                          White-Label
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plan Name & Price */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                      {p.discountBadge ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[10px] whitespace-nowrap">
                          {p.discountBadge}
                        </span>
                      ) : p.discountPercent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[10px] whitespace-nowrap">
                          -{p.discountPercent}%
                        </span>
                      ) : null}
                    </div>

                    {p.originalPrice && p.originalPrice > p.price && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-slate-400 line-through font-semibold">
                          Rp {p.originalPrice.toLocaleString("id-ID")}
                        </span>
                        {p.discountPercent && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Diskon {p.discountPercent}%
                          </span>
                        )}
                        {(() => {
                          const status = getPlanDiscountStatus(p, nowMs);
                          if (status.hasSchedule && status.hasTimer && status.isDiscountActive) {
                            return <PromoCountdownTimer status={status} variant="badge" />;
                          }
                          if (status.hasSchedule && status.isUpcoming) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Clock className="w-3 h-3" />
                                <span>Terjadwal</span>
                              </span>
                            );
                          }
                          if (status.hasSchedule && status.isExpired) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                Expired
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {isFree ? "Gratis" : `Rp ${p.price.toLocaleString("id-ID")}`}
                      </span>
                      {!isFree && (
                        <span className="text-xs text-slate-500 font-medium">
                          / {periodLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Limits Badge Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Kuota Chat:
                      </span>
                      <span className="font-bold font-mono text-slate-900">
                        {p.monthlyMessages === -1
                          ? "Unlimited"
                          : `${p.monthlyMessages.toLocaleString("id-ID")} pesan / ${periodLabel}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Batas Device:
                      </span>
                      <span className="font-bold font-mono text-slate-900">{p.maxDevices} WhatsApp</span>
                    </div>
                  </div>

                  {/* Feature Highlights List */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Fitur &amp; Kemampuan Paket:
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {getPlanFeaturesWithStatus(p).map((feat, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 leading-snug ${
                            feat.included
                              ? "text-slate-800 font-medium"
                              : "text-slate-400 opacity-50"
                          }`}
                        >
                          {feat.included ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 font-bold shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className={`text-[11px] ${feat.included ? "" : "line-through"}`}>
                            {feat.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`btn btn-xs rounded-xl transition-colors cursor-pointer ${
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
                      className="btn btn-primary btn-sm rounded-xl gap-1.5 px-3.5 font-bold shadow-xs cursor-pointer"
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
          <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10">
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
                  <div className="flex items-center justify-between py-1">
                    <label className="label-text font-bold text-xs">Harga (Rp)</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, price: 0, hasDiscount: false, watermarkEnabled: true })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        formData.price === 0 || formData.price === "0"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {formData.price === 0 || formData.price === "0" ? "✓ Paket Gratis" : "Set Gratis (Rp 0)"}
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input input-bordered input-sm font-semibold"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => {
                      let raw = e.target.value.replace(/[^\d]/g, "");
                      if (/^0\d+/.test(raw)) raw = raw.replace(/^0+/, "");
                      const newPrice = raw === "" ? 0 : Number(raw);
                      let updatedOrig = Number(formData.originalPrice) || 0;
                      let updatedDisc = Number(formData.discountPercent) || 0;

                      if (formData.hasDiscount) {
                        if (updatedOrig && updatedOrig > newPrice) {
                          updatedDisc = Math.round(((updatedOrig - newPrice) / updatedOrig) * 100);
                        } else if (updatedDisc > 0) {
                          updatedOrig = Math.round(newPrice / (1 - updatedDisc / 100));
                        }
                      }

                      setFormData({
                        ...formData,
                        price: raw,
                        originalPrice: updatedOrig || "",
                        discountPercent: updatedDisc || "",
                        discountBadge: formData.hasDiscount && updatedDisc > 0 ? `DISKON ${updatedDisc}%` : formData.discountBadge,
                      });
                    }}
                    onBlur={() => {
                      if (formData.price === "") {
                        setFormData((prev) => ({ ...prev, price: 0 }));
                      }
                    }}
                    required
                  />
                  {(formData.price === 0 || formData.price === "0") && (
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1">
                      Paket ini diatur sebagai Paket Gratis (Free Trial / Rp 0)
                    </span>
                  )}
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
                    type="text"
                    inputMode="numeric"
                    className="input input-bordered input-sm"
                    placeholder="1"
                    value={formData.maxDevices}
                    onChange={(e) => {
                      let raw = e.target.value.replace(/[^\d]/g, "");
                      if (/^0\d+/.test(raw)) raw = raw.replace(/^0+/, "");
                      setFormData({ ...formData, maxDevices: raw });
                    }}
                    onBlur={() => {
                      if (!formData.maxDevices || Number(formData.maxDevices) < 1) {
                        setFormData((prev) => ({ ...prev, maxDevices: 1 }));
                      }
                    }}
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
                    type="text"
                    inputMode="numeric"
                    disabled={formData.isUnlimitedMessages}
                    className="input input-bordered input-sm disabled:opacity-50"
                    placeholder="Contoh: 10000"
                    value={formData.isUnlimitedMessages ? "" : formData.monthlyMessages}
                    onChange={(e) => {
                      let raw = e.target.value.replace(/[^\d]/g, "");
                      if (/^0\d+/.test(raw)) raw = raw.replace(/^0+/, "");
                      setFormData({ ...formData, monthlyMessages: raw });
                    }}
                    onBlur={() => {
                      if (formData.monthlyMessages === "" && !formData.isUnlimitedMessages) {
                        setFormData((prev) => ({ ...prev, monthlyMessages: 0 }));
                      }
                    }}
                    required={!formData.isUnlimitedMessages}
                  />
                </div>
              </div>

              {/* ── Diskon & Promo Settings ─────────────────────────────── */}
              <div className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                formData.hasDiscount
                  ? "bg-slate-50/90 border-slate-300/80 shadow-xs"
                  : "bg-slate-50/50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm rounded-md"
                      checked={formData.hasDiscount}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const currPrice = Number(formData.price) || 0;
                        const orig = formData.originalPrice && Number(formData.originalPrice) > currPrice
                          ? Number(formData.originalPrice)
                          : 0;
                        const disc = orig > currPrice ? Math.round(((orig - currPrice) / orig) * 100) : 0;
                        setFormData({
                          ...formData,
                          hasDiscount: checked,
                          originalPrice: orig || "",
                          discountPercent: disc || "",
                          discountBadge: checked && disc > 0 ? `DISKON ${disc}%` : "",
                        });
                      }}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-500" /> Diskon & Harga Coret Promo
                      </span>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Tampilkan harga coret dan countdown waktu promo
                      </p>
                    </div>
                  </label>
                  {formData.hasDiscount && Number(formData.discountPercent) > 0 && (
                    <span className="badge badge-sm bg-rose-50 border-rose-200 text-rose-700 font-bold text-[11px] px-2 py-0.5">
                      Hemat {formData.discountPercent}%
                    </span>
                  )}
                </div>

                {formData.hasDiscount && (
                  <div className="space-y-3.5 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Harga Asli */}
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text font-bold text-xs text-slate-700">
                            Harga Normal (Coret)
                          </span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="input input-bordered input-sm bg-white text-xs"
                          placeholder="Misal: 79000"
                          value={formData.originalPrice}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/[^\d]/g, "");
                            if (/^0\d+/.test(raw)) raw = raw.replace(/^0+/, "");
                            const orig = raw === "" ? 0 : Number(raw);
                            const currPrice = Number(formData.price) || 0;
                            const disc = orig > currPrice ? Math.round(((orig - currPrice) / orig) * 100) : 0;
                            setFormData({
                              ...formData,
                              originalPrice: raw,
                              discountPercent: disc || "",
                              discountBadge: disc > 0 ? `DISKON ${disc}%` : formData.discountBadge,
                            });
                          }}
                        />
                      </div>

                      {/* Teks Badge */}
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text font-bold text-xs text-slate-700">Teks Badge Promo</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered input-sm bg-white text-xs"
                          placeholder="Misal: PROMO SPESIAL / FLASH SALE"
                          value={formData.discountBadge}
                          onChange={(e) => setFormData({ ...formData, discountBadge: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Diskon % + Presets */}
                    <div className="form-control">
                      <div className="flex items-center justify-between flex-wrap gap-1.5 py-1">
                        <label className="label-text font-bold text-xs text-slate-700">
                          Persentase Diskon (%)
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-medium">Preset cepat:</span>
                          {[10, 20, 25, 50, 70].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                let newPrice = Number(formData.price) || 0;
                                let newOrig = Number(formData.originalPrice) || 0;
                                if (newOrig && newOrig > 0) {
                                  newPrice = Math.round((newOrig * (1 - preset / 100)) / 100) * 100;
                                } else if (newPrice > 0) {
                                  newOrig = Math.round((newPrice / (1 - preset / 100)) / 1000) * 1000;
                                }
                                const finalDisc = newOrig > newPrice ? Math.round(((newOrig - newPrice) / newOrig) * 100) : preset;
                                setFormData({
                                  ...formData,
                                  discountPercent: finalDisc,
                                  price: newPrice,
                                  originalPrice: newOrig || "",
                                  discountBadge: `DISKON ${finalDisc}%`,
                                });
                              }}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs cursor-pointer"
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="input input-bordered input-sm bg-white text-xs"
                        placeholder="0"
                        value={formData.discountPercent}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/[^\d]/g, "");
                          if (/^0\d+/.test(raw)) raw = raw.replace(/^0+/, "");
                          const pct = Math.min(100, raw === "" ? 0 : Number(raw));
                          let newPrice = Number(formData.price) || 0;
                          let newOrig = Number(formData.originalPrice) || 0;

                          if (newOrig && newOrig > 0) {
                            newPrice = Math.round((newOrig * (1 - pct / 100)) / 100) * 100;
                          } else if (newPrice > 0 && pct > 0 && pct < 100) {
                            newOrig = Math.round((newPrice / (1 - pct / 100)) / 1000) * 1000;
                          }

                          setFormData({
                            ...formData,
                            discountPercent: raw === "" ? "" : pct,
                            price: newPrice,
                            originalPrice: newOrig || "",
                            discountBadge: pct > 0 ? `DISKON ${pct}%` : "",
                          });
                        }}
                      />
                    </div>

                    {/* Jadwal Masa Berlaku Promo & Countdown Setting */}
                    <div className="pt-3 border-t border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5 text-slate-500" /> Jadwal & Masa Berlaku Diskon
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Otomatis countdown saat sisa &le; 24 jam
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Tanggal Mulai */}
                        <div className="form-control">
                          <label className="label py-0.5">
                            <span className="label-text font-semibold text-[10px] text-slate-600">Tanggal Mulai (Opsional)</span>
                          </label>
                          <input
                            type="datetime-local"
                            className="input input-bordered input-sm bg-white text-xs font-mono"
                            value={formData.discountStartDate || ""}
                            onChange={(e) => setFormData({ ...formData, discountStartDate: e.target.value || null })}
                          />
                        </div>

                        {/* Tanggal Berakhir */}
                        <div className="form-control">
                          <label className="label py-0.5">
                            <span className="label-text font-semibold text-[10px] text-slate-600">Tanggal Berakhir (Batas Promo)</span>
                          </label>
                          <input
                            type="datetime-local"
                            className="input input-bordered input-sm bg-white text-xs font-mono"
                            value={formData.discountEndDate || ""}
                            onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value || null })}
                          />
                        </div>
                      </div>

                      {/* Quick Date Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-slate-500 font-semibold">Preset durasi:</span>
                        {[
                          { label: "+24 Jam (1 Hari)", hours: 24 },
                          { label: "+48 Jam (2 Hari)", hours: 48 },
                          { label: "+3 Hari", hours: 72 },
                          { label: "+7 Hari", hours: 168 },
                          { label: "+14 Hari", hours: 336 },
                          { label: "+30 Hari", hours: 720 },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              const end = new Date(Date.now() + preset.hours * 60 * 60 * 1000);
                              const formatLocal = (d: Date) => {
                                const pad = (n: number) => n.toString().padStart(2, "0");
                                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                              };
                              setFormData({
                                ...formData,
                                discountStartDate: formData.discountStartDate || formatLocal(now),
                                discountEndDate: formatLocal(end),
                              });
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                        {(formData.discountStartDate || formData.discountEndDate) && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, discountStartDate: null, discountEndDate: null })}
                            className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-rose-600 transition-colors ml-auto cursor-pointer"
                          >
                            Reset Jadwal
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Unified Live Preview & Status Card */}
                    {(() => {
                      const tempStatus = getPlanDiscountStatus(
                        {
                          price: formData.price,
                          originalPrice: formData.originalPrice,
                          discountPercent: formData.discountPercent,
                          discountBadge: formData.discountBadge,
                          discountStartDate: formData.discountStartDate,
                          discountEndDate: formData.discountEndDate,
                        },
                        nowMs
                      );

                      const hasValidDiscount = formData.originalPrice > 0 && formData.originalPrice > formData.price;

                      return (
                        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-2xs space-y-2">
                          {/* Price comparison row */}
                          {hasValidDiscount ? (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="line-through text-slate-400 font-medium text-xs">
                                  Rp {formData.originalPrice.toLocaleString("id-ID")}
                                </span>
                                <span className="badge badge-sm bg-rose-50 border-rose-200 text-rose-700 font-bold text-[10px]">
                                  {formData.discountBadge || `HEMAT ${formData.discountPercent}%`}
                                </span>
                                <span className="text-slate-400 text-xs">→</span>
                                <span className="font-extrabold text-slate-900 text-sm">
                                  Rp {formData.price.toLocaleString("id-ID")}
                                </span>
                              </div>
                              <span className="text-[11px] text-emerald-600 font-semibold">
                                Hemat Rp {(formData.originalPrice - formData.price).toLocaleString("id-ID")} ({formData.discountPercent}%)
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500">
                              Masukkan <strong>Harga Normal (Coret)</strong> lebih tinggi dari harga paket untuk mengaktifkan diskon.
                            </div>
                          )}

                          {/* Schedule status row */}
                          {tempStatus.hasSchedule && (
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                              {tempStatus.isUpcoming && (
                                <div className="flex items-center gap-1.5 text-blue-700 text-[11px]">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span>Mulai aktif pada <strong>{tempStatus.startDateFormatted}</strong></span>
                                </div>
                              )}

                              {tempStatus.isExpired && (
                                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                  <Hourglass className="w-3.5 h-3.5 shrink-0" />
                                  <span>Promo berakhir ({tempStatus.endDateFormatted}). Berlaku harga normal.</span>
                                </div>
                              )}

                              {tempStatus.isDiscountActive && (
                                <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                                    <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                    <span>
                                      Berakhir: <strong>{tempStatus.endDateFormatted}</strong>
                                    </span>
                                  </div>
                                  {tempStatus.hasTimer && (
                                    <PromoCountdownTimer status={tempStatus} variant="badge" />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
