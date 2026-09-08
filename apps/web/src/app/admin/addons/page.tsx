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
  Tag,
  ShieldAlert,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { AddonItem, AddonType } from "@/lib/addon-types";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useConfirm, useAlert } from "@/components/confirm-dialog";

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DEVICE" | "MESSAGES">("ALL");

  // Modal State
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
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

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.id) {
      await showAlert({
        title: "Data Belum Lengkap",
        message: "Mohon lengkapi ID dan Nama Addon.",
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
        title: "Kesalahan Sistem",
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
      message: `Apakah Anda yakin ingin menghapus addon "${item.name}"? Addon ini tidak akan muncul lagi di halaman order dan billing.`,
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
    if (!grantData.userId || !grantData.addonId) {
      await showAlert({
        title: "Data Tidak Lengkap",
        message: "ID User dan Addon wajib dipilih.",
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
        showToast("Addon berhasil diberikan ke akun pengguna!");
        setGrantModalOpen(false);
      } else {
        await showAlert({
          title: "Gagal Memberikan Addon",
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

  const filteredAddons = addons.filter((a) => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalDeviceAddons = addons.filter((a) => a.type === "DEVICE").length;
  const totalMessageAddons = addons.filter((a) => a.type === "MESSAGES").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast */}
      {toastMsg && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-success text-white text-xs font-bold shadow-lg">
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Plus className="w-6 h-6 text-primary" />
            Kelola Addon & Top-Up Ekstra
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi paket tambahan WhatsApp Device dan Kuota Pengiriman Chat untuk pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setGrantData({
                userId: "",
                addonId: addons[0]?.id || "",
                customAmount: 1,
              });
              setGrantModalOpen(true);
            }}
            className="btn btn-sm btn-outline text-slate-700 border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-primary" />
            Suntik Addon ke User
          </button>
          <button
            onClick={handleOpenCreate}
            className="btn btn-sm btn-primary text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Addon Baru
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Addon</span>
          <div className="text-2xl font-black text-slate-900">{addons.length}</div>
          <span className="text-[10px] text-slate-400">Katalog addon terdaftar</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Aktif di Order</span>
          <div className="text-2xl font-black text-emerald-600">{addons.filter((a) => a.isActive).length}</div>
          <span className="text-[10px] text-slate-400">Dapat dibeli pelanggan</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Addon Device</span>
          <div className="text-2xl font-black text-blue-600">{totalDeviceAddons}</div>
          <span className="text-[10px] text-slate-400">Slot WhatsApp device</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Addon Kuota Chat</span>
          <div className="text-2xl font-black text-indigo-600">{totalMessageAddons}</div>
          <span className="text-[10px] text-slate-400">Top-up kuota pesan</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari nama addon, ID, atau deskripsi..."
            className="input input-bordered input-sm w-full pl-9 text-xs rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Tipe:
          </div>
          <div className="join">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`btn btn-xs join-item ${typeFilter === "ALL" ? "btn-active btn-primary text-white font-bold" : "btn-ghost"}`}
            >
              Semua
            </button>
            <button
              onClick={() => setTypeFilter("DEVICE")}
              className={`btn btn-xs join-item ${typeFilter === "DEVICE" ? "btn-active btn-primary text-white font-bold" : "btn-ghost"}`}
            >
              Device
            </button>
            <button
              onClick={() => setTypeFilter("MESSAGES")}
              className={`btn btn-xs join-item ${typeFilter === "MESSAGES" ? "btn-active btn-primary text-white font-bold" : "btn-ghost"}`}
            >
              Kuota Chat
            </button>
          </div>
        </div>
      </div>

      {/* Addons Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
          <span className="loading loading-spinner loading-md text-primary mb-2" />
          <p className="text-xs text-slate-400 font-medium">Memuat katalog addon...</p>
        </div>
      ) : filteredAddons.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Tidak Ada Addon</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Belum ada addon yang sesuai dengan filter pencarian. Anda dapat membuat addon baru dengan tombol di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAddons.map((addon) => {
            const isDevice = addon.type === "DEVICE";
            return (
              <div
                key={addon.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs ${
                          isDevice ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {isDevice ? <Smartphone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900">{addon.name}</h4>
                          {addon.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
                              {addon.badge}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">{addon.id}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        addon.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {addon.isActive ? "● Aktif" : "○ Nonaktif"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                    {addon.description || (isDevice ? `Tambahan ${addon.amount} slot WhatsApp device.` : `Top-up ${addon.amount.toLocaleString("id-ID")} kuota pesan WhatsApp.`)}
                  </p>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Kapasitas Ekstra</span>
                      <span className="font-black text-slate-900">
                        {isDevice ? `+${addon.amount} Device` : `+${addon.amount.toLocaleString("id-ID")} Pesan`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Harga Pembelian</span>
                      <span className="font-black text-emerald-600 font-mono text-sm">
                        {formatIDR(addon.price)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    Tipe: <strong className="text-slate-600 uppercase">{addon.type}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(addon)}
                      className="btn btn-xs btn-ghost text-slate-600 hover:text-primary rounded-lg font-bold gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAddon(addon)}
                      className="btn btn-xs btn-ghost text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Hapus Addon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create/Edit Addon */}
      {modalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  {isEditing ? "Edit Addon" : "Buat Addon Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-slate-400"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAddon} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ID Addon (Unik, Huruf Kapital):</label>
                  <input
                    type="text"
                    disabled={isEditing}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                    placeholder="Contoh: ADDON_DEV_10"
                    className="input input-bordered input-sm w-full font-mono font-bold uppercase rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Addon:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: +10 WhatsApp Device"
                    className="input input-bordered input-sm w-full rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tipe Addon:</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as AddonType })}
                      className="select select-bordered select-sm w-full rounded-xl"
                    >
                      <option value="DEVICE">WhatsApp Device Slot</option>
                      <option value="MESSAGES">Kuota Pengiriman Chat</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Jumlah/Kapasitas Tambahan:</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="input input-bordered input-sm w-full rounded-xl font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Harga Pembelian (IDR):</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="input input-bordered input-sm w-full rounded-xl font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Badge Promo (Opsional):</label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Contoh: Populer, Hemat"
                      className="input input-bordered input-sm w-full rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deskripsi Singkat:</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi detail apa yang didapatkan user..."
                    className="textarea textarea-bordered textarea-sm w-full rounded-xl"
                    rows={2}
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <span className="label-text font-bold text-slate-700">Tampilkan & Aktifkan di Halaman Checkout</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs"
                  >
                    {saving ? "Menyimpan..." : "Simpan Addon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Grant User Addon Modal */}
      {grantModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  Suntik Addon Langsung ke Akun User
                </h3>
                <button
                  type="button"
                  onClick={() => setGrantModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-slate-400"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGrantUserAddon} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ID User atau Email Pengguna:</label>
                  <input
                    type="text"
                    value={grantData.userId}
                    onChange={(e) => setGrantData({ ...grantData, userId: e.target.value })}
                    placeholder="Contoh: 692aece5-... atau user@email.com"
                    className="input input-bordered input-sm w-full rounded-xl font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Paket Addon:</label>
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
                    className="select select-bordered select-sm w-full rounded-xl"
                  >
                    {addons.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type === "DEVICE" ? `+${a.amount} Device` : `+${a.amount.toLocaleString("id-ID")} Pesan`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah/Kapasitas Tambahan:</label>
                  <input
                    type="number"
                    min={1}
                    value={grantData.customAmount}
                    onChange={(e) => setGrantData({ ...grantData, customAmount: Number(e.target.value) })}
                    className="input input-bordered input-sm w-full rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setGrantModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs"
                  >
                    {saving ? "Memproses..." : "Aktifkan ke User"}
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
