"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  Smartphone,
  MessageSquare,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  RefreshCw,
  SlidersHorizontal,
  X,
  Check,
  Power,
  PackagePlus,
  RotateCcw,
} from "lucide-react";
import { AddonItem, AddonType } from "@/lib/addon-types";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useConfirm, useAlert } from "@/components/confirm-dialog";

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DEVICE" | "MESSAGES">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal Create/Edit State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    type: AddonType;
    amount: number;
    price: number;
    description: string;
    badge: string;
    isActive: boolean;
  }>({
    id: "",
    name: "",
    type: "DEVICE",
    amount: 1,
    price: 25000,
    description: "",
    badge: "",
    isActive: true,
  });

  // Grant User Addon Modal State
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantData, setGrantData] = useState<{
    userId: string;
    addonId: string;
    customAmount: number;
  }>({
    userId: "",
    addonId: "",
    customAmount: 1,
  });

  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const confirm = useConfirm();
  const showAlert = useAlert();

  const fetchAddons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/addons");
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.addons)) {
        setAddons(json.data.addons);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modalOpen) setModalOpen(false);
        if (grantModalOpen) setGrantModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, grantModalOpen]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      id: `ADDON_${Date.now()}`,
      name: "",
      type: "DEVICE",
      amount: 1,
      price: 25000,
      description: "",
      badge: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: AddonItem) => {
    setIsEditing(true);
    setFormData({
      id: item.id,
      name: item.name,
      type: item.type,
      amount: item.amount,
      price: item.price,
      description: item.description || "",
      badge: item.badge || "",
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (item: AddonItem) => {
    setTogglingId(item.id);
    try {
      const updatedItem = { ...item, isActive: !item.isActive };
      const res = await fetch("/api/admin/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Addon ${item.name} berhasil ${!item.isActive ? "diaktifkan" : "dinonaktifkan"}`);
        await fetchAddons();
      } else {
        showToast(json.error || "Gagal mengubah status addon", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal mengubah status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.id.trim()) {
      await showAlert({
        title: "Data Belum Lengkap",
        message: "Mohon lengkapi ID dan Nama Addon.",
        variant: "warning",
      });
      return;
    }

    if (formData.amount <= 0 || formData.price < 0) {
      await showAlert({
        title: "Nilai Tidak Valid",
        message: "Kapasitas minimal 1 dan harga tidak boleh bernilai negatif.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        showToast(isEditing ? "Addon berhasil diperbarui" : "Addon baru berhasil ditambahkan");
        setModalOpen(false);
        await fetchAddons();
      } else {
        await showAlert({
          title: "Gagal Menyimpan Addon",
          message: json.error || "Terjadi kesalahan saat menyimpan addon.",
          variant: "danger",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Kesalahan Jaringan",
        message: err.message || "Gagal menghubungi server.",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddon = async (item: AddonItem) => {
    const ok = await confirm({
      title: "Hapus Addon Ini?",
      message: `Apakah Anda yakin ingin menghapus addon "${item.name}"? Addon ini tidak akan muncul lagi di halaman order dan billing pelanggan.`,
      confirmText: "Ya, Hapus Addon",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/addons?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Addon berhasil dihapus");
        await fetchAddons();
      } else {
        await showAlert({
          title: "Gagal Menghapus",
          message: json.error || "Gagal menghapus addon.",
          variant: "danger",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Gagal Menghapus",
        message: err.message || "Kesalahan jaringan.",
        variant: "danger",
      });
    }
  };

  const handleGrantUserAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantData.userId.trim() || !grantData.addonId) {
      await showAlert({
        title: "Data Tidak Lengkap",
        message: "ID User atau Email Pengguna dan Addon wajib dipilih.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/addons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant",
          userId: grantData.userId.trim(),
          addonId: grantData.addonId,
          customAmount: grantData.customAmount,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Addon berhasil ditambahkan ke akun pengguna!");
        setGrantModalOpen(false);
      } else {
        await showAlert({
          title: "Gagal Menambahkan Addon",
          message: json.error || "Terjadi kesalahan.",
          variant: "danger",
        });
      }
    } catch (err: any) {
      await showAlert({
        title: "Kesalahan",
        message: err.message || "Gagal memproses request.",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filter addons
  const filteredAddons = addons.filter((a) => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    if (statusFilter === "ACTIVE" && !a.isActive) return false;
    if (statusFilter === "INACTIVE" && a.isActive) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.badge && a.badge.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalDeviceAddons = addons.filter((a) => a.type === "DEVICE").length;
  const totalMessageAddons = addons.filter((a) => a.type === "MESSAGES").length;
  const activeCount = addons.filter((a) => a.isActive).length;

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast toast-top toast-end z-50">
          <div
            className={`alert ${
              toastMsg.type === "success" ? "alert-success text-white" : "alert-error text-white"
            } text-xs font-bold shadow-lg rounded-2xl flex items-center gap-2`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <PackagePlus className="w-6 h-6 text-primary flex-shrink-0" />
            Katalog Addon & Top-Up Ekstra
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasi paket tambahan slot WhatsApp Device dan kuota chat untuk pelanggan.
          </p>
        </div>

        {/* Header Action Buttons with >=44px mobile touch targets */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setGrantData({
                userId: "",
                addonId: addons[0]?.id || "",
                customAmount: 1,
              });
              setGrantModalOpen(true);
            }}
            className="min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Berikan Manual ke User</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2 shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Buat Addon Baru</span>
          </button>
        </div>
      </div>

      {/* Metric / Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Addon
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {addons.length}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Semua item terdaftar
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Aktif di Order
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Dapat dibeli pelanggan
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            Addon Device
          </span>
          <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {totalDeviceAddons}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Slot koneksi WhatsApp
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Addon Kuota Chat
          </span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {totalMessageAddons}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Top-up pesan WhatsApp
          </span>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input with >=44px touch height */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari nama, ID, deskripsi, atau badge..."
            className="w-full min-h-[44px] pl-9 pr-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { id: "ALL", label: "Semua Tipe" },
              { id: "DEVICE", label: "Device" },
              { id: "MESSAGES", label: "Kuota Chat" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id as any)}
                className={`min-h-[34px] px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  typeFilter === t.id
                    ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { id: "ALL", label: "Semua" },
              { id: "ACTIVE", label: "Aktif" },
              { id: "INACTIVE", label: "Nonaktif" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id as any)}
                className={`min-h-[34px] px-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === s.id
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchAddons}
            title="Refresh Data"
            className="min-h-[38px] min-w-[38px] p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Loading / Empty / Addons Cards */}
      {loading ? (
        <div className="p-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <span className="loading loading-spinner loading-md text-primary mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat katalog addon...</p>
        </div>
      ) : addons.length === 0 ? (
        /* First-run Empty State (0 Addons in DB) */
        <div className="p-12 sm:p-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-300 flex items-center justify-center mx-auto">
            <PackagePlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
              Katalog Addon Masih Kosong
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Anda belum membuat paket addon. Pelanggan dapat membeli slot WhatsApp Device atau kuota chat ekstra jika Anda menambahkannya di sini.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="min-h-[44px] px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Addon Pertama</span>
          </button>
        </div>
      ) : filteredAddons.length === 0 ? (
        /* Filtered Empty State */
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">
            Tidak Ada Addon yang Cocok
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Tidak ditemukan addon dengan filter & kata kunci yang Anda masukkan.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      ) : (
        /* Responsive Card Grid with Reflow on Mobile */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAddons.map((addon) => {
            const isDevice = addon.type === "DEVICE";
            const isToggling = togglingId === addon.id;

            return (
              <div
                key={addon.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border ${
                  addon.isActive
                    ? "border-slate-200 dark:border-slate-700/80 shadow-xs"
                    : "border-slate-200/60 dark:border-slate-800 opacity-75"
                } p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-600 transition-all`}
              >
                <div className="space-y-3">
                  {/* Card Top: Icon, Name, Badge, Active Toggle */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isDevice
                            ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900"
                            : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900"
                        }`}
                      >
                        {isDevice ? (
                          <Smartphone className="w-5 h-5" />
                        ) : (
                          <MessageSquare className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {addon.name}
                          </h4>
                          {addon.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {addon.badge}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          {addon.id}
                        </p>
                      </div>
                    </div>

                    {/* Quick Active/Inactive Toggle Button (>=40px hit area) */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(addon)}
                      disabled={isToggling}
                      title={addon.isActive ? "Klik untuk Nonaktifkan" : "Klik untuk Aktifkan"}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                        addon.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          addon.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      <span>{addon.isActive ? "Aktif" : "Nonaktif"}</span>
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[36px] line-clamp-2">
                    {addon.description ||
                      (isDevice
                        ? `Tambahan ${addon.amount} slot WhatsApp device.`
                        : `Top-up ${addon.amount.toLocaleString("id-ID")} kuota pesan WhatsApp.`)}
                  </p>

                  {/* Spec Info Box */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
                        Kapasitas Tambahan
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {isDevice
                          ? `+${addon.amount} WhatsApp Device`
                          : `+${addon.amount.toLocaleString("id-ID")} Kuota Pesan`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
                        Harga Jual
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        {formatIDR(addon.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Type & Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/80 text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tipe:{" "}
                    <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                      {isDevice ? "Perangkat" : "Pesan"}
                    </strong>
                  </span>

                  {/* Action Buttons with >=40px tap target */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(addon)}
                      className="min-h-[38px] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAddon(addon)}
                      className="min-h-[38px] min-w-[38px] p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      title="Hapus Addon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create & Edit Addon */}
      {modalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-primary" />
                  <span>{isEditing ? "Edit Data Addon" : "Buat Addon Baru"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[36px] min-w-[36px] p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddon} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    ID Addon (Unik, Huruf Kapital):
                  </label>
                  <input
                    type="text"
                    disabled={isEditing}
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        id: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                      })
                    }
                    placeholder="Contoh: ADDON_DEV_10 atau ADDON_MSG_50K"
                    className="w-full min-h-[44px] px-3 font-mono font-bold uppercase rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    ID unik digunakan sebagai identifier sistem saat checkout dan invoicing.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Nama Addon:
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: +10 WhatsApp Device atau +50.000 Kuota Pesan"
                    className="w-full min-h-[44px] px-3 font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Tipe Addon:
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as AddonType })
                      }
                      className="w-full min-h-[44px] px-3 font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="DEVICE">WhatsApp Device Slot</option>
                      <option value="MESSAGES">Kuota Pesan WhatsApp</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Jumlah / Kapasitas:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: Number(e.target.value) })
                      }
                      className="w-full min-h-[44px] px-3 font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Harga Jual (IDR):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: Number(e.target.value) })
                      }
                      className="w-full min-h-[44px] px-3 font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Badge Promo (Opsional):
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Contoh: Populer, Hemat 15%"
                      className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Deskripsi Detail (Opsional):
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan manfaat yang didapatkan pelanggan saat membeli addon ini..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    rows={2}
                  />
                </div>

                {/* Active Checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="checkbox checkbox-primary checkbox-sm rounded-md"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Tampilkan dan aktifkan di halaman checkout pelanggan
                    </span>
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {saving && <span className="loading loading-spinner loading-xs" />}
                    <span>{saving ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Simpan Addon"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Grant User Addon Manual */}
      {grantModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span>Berikan Addon Manual ke User</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setGrantModalOpen(false)}
                  className="min-h-[36px] min-w-[36px] p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGrantUserAddon} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    ID User atau Email Pengguna:
                  </label>
                  <input
                    type="text"
                    value={grantData.userId}
                    onChange={(e) => setGrantData({ ...grantData, userId: e.target.value })}
                    placeholder="Contoh: usr_12345 atau user@domain.com"
                    className="w-full min-h-[44px] px-3 font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Kapasitas akan langsung diinjeksikan ke kuota akun WhatsApp Gateway user tersebut.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Pilih Paket Addon:
                  </label>
                  <select
                    value={grantData.addonId}
                    onChange={(e) => {
                      const selected = addons.find((a) => a.id === e.target.value);
                      setGrantData({
                        ...grantData,
                        addonId: e.target.value,
                        customAmount: selected?.amount || 1,
                      });
                    }}
                    className="w-full min-h-[44px] px-3 font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      Pilih Addon dari Katalog
                    </option>
                    {addons.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type === "DEVICE" ? `+${a.amount} Device` : `+${a.amount.toLocaleString("id-ID")} Pesan`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Kapasitas Tambahan yang Diberikan:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={grantData.customAmount}
                    onChange={(e) =>
                      setGrantData({ ...grantData, customAmount: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] px-3 font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setGrantModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving || !grantData.addonId}
                    className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {saving && <span className="loading loading-spinner loading-xs" />}
                    <span>{saving ? "Memproses..." : "Aktifkan ke User"}</span>
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
