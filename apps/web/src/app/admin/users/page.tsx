"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  Zap,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Trash2,
} from "lucide-react";
import type { ManagedUser, UserAccountStatus } from "@/lib/admin-users";
import type { Plan } from "@/lib/billing-types";
import { ModalPortal } from "@/components/ui/ModalPortal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribed: 0,
    freeUsers: 0,
    bannedUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Action Modals
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusActionType, setStatusActionType] = useState<"SUSPENDED" | "BANNED">("BANNED");
  const [statusReason, setStatusReason] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("STARTER");
  const [planDurationDays, setPlanDurationDays] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (planFilter !== "ALL") params.set("plan", planFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setStats(json.data.stats);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openStatusModal = (user: ManagedUser, type: "SUSPENDED" | "BANNED") => {
    setSelectedUser(user);
    setStatusActionType(type);
    setStatusReason("");
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (
    userId: string,
    status: UserAccountStatus,
    reason?: string
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          userId,
          status,
          banReason: reason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setStatusModalOpen(false);
        setStatusReason("");
        setSelectedUser(null);
        fetchUsers();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_plan",
          userId: selectedUser.id,
          planId: selectedPlanId,
          durationDays: planDurationDays,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setPlanModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_user",
          userId: selectedUser.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Pengguna ${selectedUser.name} berhasil dihapus.`);
        setDeleteModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showToast(json.error || "Gagal menghapus pengguna");
      }
    } catch {
      showToast("Terjadi kesalahan sistem saat menghapus user");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
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
            <Users className="w-6 h-6 text-primary" /> Manajemen Pengguna
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data akun, status akses (Ban/Suspend), serta pemberian paket berlangganan user.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="btn btn-outline btn-sm gap-2 rounded-xl text-slate-700 hover:bg-slate-100 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total User</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalUsers}</div>
          <span className="text-[11px] text-slate-500">Semua akun terdaftar di sistem</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Berlangganan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.activeSubscribed}</div>
          <span className="text-[11px] text-slate-500">Starter, Business, Pro aktif</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Free Trial</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.freeUsers}</div>
          <span className="text-[11px] text-slate-500">Pengguna paket gratis</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Banned / Suspend</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.bannedUsers}</div>
          <span className="text-[11px] text-slate-500">Akun terkunci / diblokir</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari user, email, atau ID..."
            className="input input-bordered input-sm w-full pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            className="select select-bordered select-sm text-xs rounded-xl"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif (Active)</option>
            <option value="SUSPENDED">Ditangguhkan (Suspended)</option>
            <option value="BANNED">Diblokir (Banned)</option>
          </select>

          <select
            className="select select-bordered select-sm text-xs rounded-xl"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="ALL">Semua Paket</option>
            <option value="FREE">Free Trial</option>
            <option value="STARTER">Starter</option>
            <option value="BUSINESS">Business</option>
            <option value="PRO">Pro</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th>Pengguna</th>
                <th>Status Akun</th>
                <th>Paket Layanan</th>
                <th>Penggunaan</th>
                <th>Terdaftar</th>
                <th className="text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="text-xs text-slate-500 mt-2 font-medium">Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">Tidak ada user ditemukan</p>
                    <p className="text-xs mt-0.5">Coba ubah kata kunci pencarian atau filter status.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isBanned = u.status === "BANNED";
                  const isSuspended = u.status === "SUSPENDED";
                  const isAdmin = u.role === "admin";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Column */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdmin
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : isBanned
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                              {isAdmin && (
                                <span className="badge badge-primary badge-xs text-[9px] font-extrabold">ADMIN</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">{u.email}</div>
                            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                              <span>ID: {u.id.length > 18 ? `${u.id.slice(0, 16)}...` : u.id}</span>
                              <button
                                onClick={() => copyToClipboard(u.id, u.id)}
                                className="hover:text-primary"
                                title="Salin ID User"
                              >
                                {copiedId === u.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : u.status === "SUSPENDED"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {u.status === "ACTIVE"
                              ? "Aktif (Active)"
                              : u.status === "SUSPENDED"
                              ? "Ditangguhkan"
                              : "Diblokir (Banned)"}
                          </span>
                          {u.banReason && (
                            <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={u.banReason}>
                              Alasan: {u.banReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Plan Column */}
                      <td>
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold uppercase border ${
                            u.planId === "PRO"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : u.planId === "BUSINESS"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : u.planId === "STARTER"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {u.planId}
                          </span>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Status: <strong className={u.planStatus === "ACTIVE" ? "text-emerald-600" : "text-slate-600"}>{u.planStatus}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Usage Column */}
                      <td>
                        <div className="space-y-0.5 text-slate-600 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.messagesUsed.toLocaleString()} pesan</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.devicesCount} devices</span>
                          </div>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td>
                        <div className="text-slate-600 text-[11px]">
                          <div>{new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                          <span className="text-[10px] text-slate-400">
                            {u.lastLoginAt ? `Login: ${new Date(u.lastLoginAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Belum pernah"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Assign Plan Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSelectedPlanId(u.planId || "STARTER");
                              setPlanModalOpen(true);
                            }}
                            className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 gap-1 rounded-lg"
                            title="Ubah Paket Berlangganan"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Ubah Paket</span>
                          </button>

                          {/* Status Actions */}
                          {u.status === "ACTIVE" ? (
                            <>
                              <button
                                onClick={() => openStatusModal(u, "SUSPENDED")}
                                className="btn btn-ghost btn-xs text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Tangguhkan Akun (Suspend)"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => openStatusModal(u, "BANNED")}
                                className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Blokir Permanen (Ban)"
                              >
                                Ban
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(u.id, "ACTIVE")}
                              className="btn btn-ghost btn-xs text-emerald-600 hover:bg-emerald-50 gap-1 rounded-lg font-bold"
                              title="Buka Blokir & Aktifkan Kembali"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Aktifkan
                            </button>
                          )}

                          {/* Delete User Button (for non-super-admins) */}
                          {!isAdmin && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setDeleteModalOpen(true);
                              }}
                              className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg gap-1"
                              title="Hapus Akun Pengguna Permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline font-bold">Hapus</span>
                            </button>
                          )}
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

      {/* MODAL: Suspend / Ban Akun User dengan Input Alasan Wajib */}
      {statusModalOpen && selectedUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 my-auto relative z-10">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div
                  className={`flex items-center gap-2 font-black text-base ${
                    statusActionType === "BANNED" ? "text-rose-600" : "text-amber-600"
                  }`}
                >
                  {statusActionType === "BANNED" ? (
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                  )}
                  <span>
                    {statusActionType === "BANNED"
                      ? "Blokir Akun Pengguna (Ban)"
                      : "Tangguhkan Akun Pengguna (Suspend)"}
                  </span>
                </div>
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-slate-400"
                >
                  ✕
                </button>
              </div>

              {/* User Card Summary */}
              <div
                className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                  statusActionType === "BANNED"
                    ? "bg-rose-50/70 border-rose-200 text-rose-950"
                    : "bg-amber-50/70 border-amber-200 text-amber-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">{selectedUser.name}</span>
                  <span className="badge badge-sm font-bold bg-white/80 border-slate-200 text-slate-700">
                    Paket: {selectedUser.planId}
                  </span>
                </div>
                <div className="text-slate-600 font-medium">{selectedUser.email}</div>
                <div className="text-[10px] text-slate-400 font-mono">ID: {selectedUser.id}</div>
              </div>

              {/* Notice */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {statusActionType === "BANNED"
                  ? "Tindakan ini akan memblokir total akses pengguna. Seluruh koneksi WhatsApp, pesan broadcast, dan API Key akan langsung dinonaktifkan."
                  : "Tindakan ini akan menangguhkan akun pengguna sementara waktu sampai diaktifkan kembali."}
              </p>

              {/* Preset Quick Reasons */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Pilih Alasan Cepat (Preset) atau Ketik Sendiri:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Pelanggaran aturan sistem Sendora",
                    "Spamming & Broadcast tanpa persetujuan",
                    "Terdeteksi anomali bot abuse / DDoS traffic",
                    "Penggunaan nomor tidak valid / melanggar ToS",
                    "Keterlambatan pembayaran tagihan langganan",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStatusReason(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all text-left ${
                        statusReason === preset
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Textarea Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Isi Alasan Penonaktifan (Wajib):</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Akan ditampilkan ke pengguna
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full text-xs font-medium leading-relaxed rounded-xl focus:outline-primary"
                  placeholder="Ketik alasan penonaktifan akun secara jelas dan spesifik..."
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  required
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !statusReason.trim()}
                  onClick={() =>
                    handleUpdateStatus(selectedUser.id, statusActionType, statusReason.trim())
                  }
                  className={`btn btn-sm gap-2 rounded-xl font-bold text-white shadow-md ${
                    statusActionType === "BANNED"
                      ? "btn-error shadow-rose-600/20"
                      : "btn-warning shadow-amber-600/20"
                  }`}
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : statusActionType === "BANNED" ? (
                    <UserX className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {statusActionType === "BANNED"
                    ? "Konfirmasi Blokir Akun"
                    : "Konfirmasi Suspend Akun"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Assign / Ubah Paket User */}
      {planModalOpen && selectedUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <Zap className="w-5 h-5 text-primary" /> Ubah Paket Layanan User
                </div>
                <button
                  onClick={() => setPlanModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-slate-400"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{selectedUser.name}</div>
                <div className="text-slate-500">{selectedUser.email}</div>
                <div className="text-[11px] text-primary font-bold mt-1">
                  Paket Saat Ini: {selectedUser.planId} ({selectedUser.planStatus})
                </div>
              </div>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Pilih Paket Layanan Baru:</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full text-xs rounded-xl"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                  >
                    <option value="FREE">FREE TRIAL (100 Pesan, 1 Device)</option>
                    <option value="STARTER">STARTER (5.000 Pesan, 2 Devices)</option>
                    <option value="BUSINESS">BUSINESS (25.000 Pesan, 5 Devices)</option>
                    <option value="PRO">PRO (100.000 Pesan, 10 Devices)</option>
                  </select>
                </div>

                {selectedPlanId !== "FREE" && (
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs">Masa Aktif Berlangganan:</span>
                    </label>
                    <select
                      className="select select-bordered select-sm w-full text-xs rounded-xl"
                      value={planDurationDays}
                      onChange={(e) => setPlanDurationDays(Number(e.target.value))}
                    >
                      <option value={7}>7 Hari (1 Minggu)</option>
                      <option value={30}>30 Hari (1 Bulan)</option>
                      <option value={90}>90 Hari (3 Bulan)</option>
                      <option value={365}>365 Hari (1 Tahun)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleUpdatePlan}
                  className="btn btn-primary btn-sm gap-2 rounded-xl"
                >
                  {actionLoading ? <span className="loading loading-spinner loading-xs" /> : <CheckCircle2 className="w-4 h-4" />}
                  Simpan & Aktifkan Paket
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Hapus Akun User Permanen */}
      {deleteModalOpen && selectedUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-rose-600">
                  <Trash2 className="w-5 h-5" /> Hapus Akun Pengguna
                </div>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="btn btn-ghost btn-circle btn-xs text-slate-400"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200/70 text-xs space-y-1">
                <div className="font-bold text-rose-950 text-sm">{selectedUser.name}</div>
                <div className="text-rose-700 font-medium">{selectedUser.email}</div>
                <div className="text-[11px] text-rose-600 font-mono mt-0.5">ID: {selectedUser.id}</div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Peringatan Tindakan Permanen
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Tindakan ini akan menghapus akun pengguna secara permanen dari sistem Sendora. Sesi login akun ini akan segera dihentikan dan data pendaftarannya dihapus.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteUser}
                  className="btn btn-error btn-sm gap-2 rounded-xl font-bold"
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Ya, Hapus Akun Permanen
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
