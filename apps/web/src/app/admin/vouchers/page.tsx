"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  Copy,
  Check,
  Percent,
  Sparkles,
  Layers,
  ArrowUpDown,
  Filter,
  RefreshCw,
  AlertCircle,
  Tag,
  DollarSign,
  Users,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useConfirm } from "@/components/confirm-dialog";
import { Voucher, DiscountType } from "@/lib/vouchers";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "Selamanya (Tanpa Batas)";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED">("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [minOrderAmount, setMinOrderAmount] = useState<string>("0");
  const [applicablePlans, setApplicablePlans] = useState<string[]>(["ALL"]);
  const [applicablePeriods, setApplicablePeriods] = useState<string[]>(["ALL"]);
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [validFrom, setValidFrom] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const confirm = useConfirm();

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vouchers");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setVouchers(json.data);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const openCreateModal = () => {
    setEditingVoucher(null);
    setCode("");
    setName("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue(10);
    setMaxDiscountAmount("");
    setMinOrderAmount("0");
    setApplicablePlans(["ALL"]);
    setApplicablePeriods(["ALL"]);
    setUsageLimit("");
    const today = new Date().toISOString().slice(0, 10);
    setValidFrom(today);
    setValidUntil("");
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Voucher) => {
    setEditingVoucher(v);
    setCode(v.code);
    setName(v.name);
    setDescription(v.description || "");
    setDiscountType(v.discountType);
    setDiscountValue(v.discountValue);
    setMaxDiscountAmount(v.maxDiscountAmount ? String(v.maxDiscountAmount) : "");
    setMinOrderAmount(v.minOrderAmount ? String(v.minOrderAmount) : "0");
    setApplicablePlans(v.applicablePlans || ["ALL"]);
    setApplicablePeriods(v.applicablePeriods || ["ALL"]);
    setUsageLimit(v.usageLimit ? String(v.usageLimit) : "");
    setValidFrom(v.validFrom ? v.validFrom.slice(0, 10) : "");
    setValidUntil(v.validUntil ? v.validUntil.slice(0, 10) : "");
    setIsActive(v.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleanCode) {
      setFormError("Kode voucher wajib diisi");
      return;
    }
    if (!name.trim()) {
      setFormError("Nama promo wajib diisi");
      return;
    }
    if (Number(discountValue) <= 0) {
      setFormError("Nilai diskon harus lebih dari 0");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingVoucher ? editingVoucher.id : undefined,
        code: cleanCode,
        name: name.trim(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
        applicablePlans,
        applicablePeriods,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        validFrom: validFrom ? new Date(validFrom).toISOString() : new Date().toISOString(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        isActive,
      };

      const res = await fetch("/api/admin/vouchers", {
        method: editingVoucher ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error || "Gagal menyimpan voucher");
        return;
      }

      setIsModalOpen(false);
      fetchVouchers();
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (v: Voucher) => {
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id: v.id }),
      });
      if (res.ok) {
        setVouchers((prev) =>
          prev.map((item) => (item.id === v.id ? { ...item, isActive: !item.isActive } : item))
        );
      }
    } catch {}
  };

  const handleDelete = async (v: Voucher) => {
    const isOk = await confirm({
      title: "Hapus Voucher",
      message: `Apakah Anda yakin ingin menghapus voucher "${v.code}" (${v.name})? Voucher yang dihapus tidak dapat dipulihkan.`,
      confirmText: "Ya, Hapus Voucher",
      cancelText: "Batal",
      variant: "danger",
    });

    if (!isOk) return;

    try {
      const res = await fetch(`/api/admin/vouchers?id=${v.id}`, { method: "DELETE" });
      if (res.ok) {
        setVouchers((prev) => prev.filter((item) => item.id !== v.id));
      }
    } catch {}
  };

  const handleCopyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.isActive).length;
    const totalUsed = vouchers.reduce((acc, v) => acc + (v.usedCount || 0), 0);
    return { total, active, totalUsed };
  }, [vouchers]);

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    const now = new Date();
    return vouchers.filter((v) => {
      const matchesSearch =
        v.code.toLowerCase().includes(search.toLowerCase()) ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.description && v.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      const isExpired = v.validUntil && new Date(v.validUntil) < now;

      if (filterStatus === "ACTIVE") return v.isActive && !isExpired;
      if (filterStatus === "INACTIVE") return !v.isActive;
      if (filterStatus === "EXPIRED") return isExpired;
      return true;
    });
  }, [vouchers, search, filterStatus]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Manajemen Voucher & Promo
            </h1>
            <span className="badge badge-primary font-bold text-xs">Vouchers Engine</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Buat kode promo, atur potongan harga persentase atau nominal, dan batasi kuota penggunaan pelanggan.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchVouchers}
            disabled={loading}
            className="btn btn-ghost btn-sm gap-2 border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="btn btn-primary btn-sm md:btn-md gap-2 shadow-sm shadow-primary/20 font-bold"
          >
            <Plus className="w-4 h-4" />
            Tambah Voucher Baru
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Voucher</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">kode terdaftar</span>
          </div>
        </div>

        <div className="card bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Voucher Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{stats.active}</span>
            <span className="text-xs text-slate-500 font-medium">siap digunakan</span>
          </div>
        </div>

        <div className="card bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Klaim / Digunakan</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-violet-600">{stats.totalUsed}x</span>
            <span className="text-xs text-slate-500 font-medium">klaim checkout</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode promo, nama, atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm w-full pl-9 rounded-xl border-slate-200 bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
            {(
              [
                { id: "ALL", label: "Semua" },
                { id: "ACTIVE", label: "Aktif" },
                { id: "INACTIVE", label: "Nonaktif" },
                { id: "EXPIRED", label: "Kedaluwarsa" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === tab.id
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="table table-md w-full">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th>Kode & Promo</th>
                <th>Nilai Diskon</th>
                <th>Syarat Pembelian</th>
                <th>Target Paket</th>
                <th>Penggunaan</th>
                <th>Masa Berlaku</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="loading loading-spinner loading-md text-primary mx-auto"></div>
                    <p className="text-xs text-slate-500 mt-2">Memuat daftar voucher...</p>
                  </td>
                </tr>
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-700">Tidak ada voucher ditemukan</p>
                    <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci atau filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const isExpired = v.validUntil && new Date(v.validUntil) < new Date();
                  const isLimitReached = v.usageLimit && v.usageLimit > 0 && v.usedCount >= v.usageLimit;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code & Name */}
                      <td>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 tracking-wide">
                              {v.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(v.code)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
                              title="Salin Kode Voucher"
                            >
                              {copiedCode === v.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                          {v.description && (
                            <div className="text-xs text-slate-500 line-clamp-1">{v.description}</div>
                          )}
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {v.discountType === "PERCENTAGE" ? (
                            <span className="text-primary">{v.discountValue}% OFF</span>
                          ) : (
                            <span className="text-emerald-600">{formatIDR(v.discountValue)}</span>
                          )}
                        </div>
                        {v.discountType === "PERCENTAGE" && v.maxDiscountAmount && (
                          <div className="text-[11px] text-slate-500">
                            Max: {formatIDR(v.maxDiscountAmount)}
                          </div>
                        )}
                      </td>

                      {/* Minimum Order */}
                      <td>
                        <div className="text-xs font-semibold text-slate-800">
                          {v.minOrderAmount && v.minOrderAmount > 0 ? (
                            <span>Min. {formatIDR(v.minOrderAmount)}</span>
                          ) : (
                            <span className="text-slate-400">Tanpa Minimum</span>
                          )}
                        </div>
                      </td>

                      {/* Target Plans */}
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {v.applicablePlans.includes("ALL") ? (
                            <span className="badge badge-ghost badge-sm text-[10px] font-bold">Semua Paket</span>
                          ) : (
                            v.applicablePlans.map((p) => (
                              <span key={p} className="badge badge-info badge-outline badge-sm text-[10px] font-bold">
                                {p}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td>
                        <div className="space-y-1 min-w-[90px]">
                          <div className="text-xs font-bold text-slate-900">
                            {v.usedCount}{" "}
                            <span className="text-slate-400 font-normal">
                              / {v.usageLimit ? `${v.usageLimit}x` : "∞"}
                            </span>
                          </div>
                          {v.usageLimit && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isLimitReached ? "bg-rose-500" : "bg-primary"
                                }`}
                                style={{
                                  width: `${Math.min(100, (v.usedCount / v.usageLimit) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Validity */}
                      <td>
                        <div className="text-xs space-y-0.5">
                          <div className="text-slate-700 font-medium">{formatDate(v.validUntil)}</div>
                          {isExpired && (
                            <span className="badge badge-error badge-xs text-[9px] font-bold text-white">
                              Kedaluwarsa
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="toggle toggle-success toggle-sm"
                            checked={v.isActive}
                            onChange={() => handleToggle(v)}
                            title={v.isActive ? "Aktif" : "Nonaktif"}
                          />
                          <span
                            className={`text-xs font-bold ${
                              v.isActive ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            {v.isActive ? "Aktif" : "Off"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(v)}
                            className="btn btn-ghost btn-xs text-slate-600 hover:text-slate-900"
                            title="Edit Voucher"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            className="btn btn-ghost btn-xs text-rose-500 hover:bg-rose-50"
                            title="Hapus Voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">
                      {editingVoucher ? "Edit Voucher Promo" : "Tambah Voucher Promo Baru"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Konfigurasikan kode kupon dan aturan diskon checkout
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSave} className="p-6 space-y-5">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Kode Kupon (Unik) *</label>
                    <input
                      type="text"
                      placeholder="CONTOH: PROMO2026"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="input input-bordered input-sm w-full font-mono font-bold uppercase rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nama Promo *</label>
                    <input
                      type="text"
                      placeholder="Diskon Spesial Launching"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input input-bordered input-sm w-full font-bold rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Deskripsi Ringkas</label>
                  <input
                    type="text"
                    placeholder="Potongan harga 10% untuk semua paket"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tipe Diskon</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                      className="select select-bordered select-sm w-full rounded-xl font-bold"
                    >
                      <option value="PERCENTAGE">Persentase (%)</option>
                      <option value="FIXED">Potongan Tetap (Rp)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Nilai Diskon {discountType === "PERCENTAGE" ? "(%)" : "(Rp)"} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder={discountType === "PERCENTAGE" ? "10" : "15000"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="input input-bordered input-sm w-full font-bold rounded-xl"
                      required
                    />
                  </div>

                  {discountType === "PERCENTAGE" && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">
                        Maksimal Potongan IDR (Opsional / Kosongkan jika tanpa batas)
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 50000"
                        value={maxDiscountAmount}
                        onChange={(e) => setMaxDiscountAmount(e.target.value)}
                        className="input input-bordered input-sm w-full rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Minimum Order & Usage Limit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Minimal Pembelian (Rp)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      className="input input-bordered input-sm w-full rounded-xl font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Kuota Pemakaian (Kosongkan = Tanpa Batas)
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 100"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className="input input-bordered input-sm w-full rounded-xl font-medium"
                    />
                  </div>
                </div>

                {/* Target Plans */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Berlaku Untuk Paket</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "ALL", label: "Semua Paket" },
                      { id: "STARTER", label: "Starter" },
                      { id: "BUSINESS", label: "Business" },
                      { id: "PRO", label: "Pro" },
                    ].map((p) => {
                      const isSel = applicablePlans.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (p.id === "ALL") {
                              setApplicablePlans(["ALL"]);
                            } else {
                              const withoutAll = applicablePlans.filter((x) => x !== "ALL");
                              if (isSel) {
                                const next = withoutAll.filter((x) => x !== p.id);
                                setApplicablePlans(next.length === 0 ? ["ALL"] : next);
                              } else {
                                setApplicablePlans([...withoutAll, p.id]);
                              }
                            }
                          }}
                          className={`btn btn-xs rounded-lg font-bold ${
                            isSel ? "btn-primary" : "btn-ghost border border-slate-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Validity Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tanggal Mulai Berlaku</label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="input input-bordered input-sm w-full rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Tanggal Kedaluwarsa (Opsional)
                    </label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="input input-bordered input-sm w-full rounded-xl"
                    />
                  </div>
                </div>

                {/* Status Active Toggle */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Status Voucher Langsung Aktif</div>
                    <div className="text-[11px] text-slate-500">
                      Pelanggan dapat langsung memasukkan kode ini pada halaman checkout.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost btn-sm rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary btn-sm px-6 rounded-xl font-bold gap-2 shadow-md shadow-primary/20"
                  >
                    {saving && <span className="loading loading-spinner loading-xs"></span>}
                    {editingVoucher ? "Perbarui Voucher" : "Simpan Voucher Baru"}
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
