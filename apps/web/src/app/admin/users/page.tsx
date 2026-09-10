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
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Globe,
  Ban,
  X,
} from "lucide-react";
import type { ManagedUser, UserAccountStatus } from "@/lib/admin-users";
import { ModalPortal } from "@/components/ui/ModalPortal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribed: 0,
    freeUsers: 0,
    bannedUsers: 0,
    duplicateIpUsers: 0,
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
  const [availablePlans, setAvailablePlans] = useState<Record<string, any>>({});

  // IP Ban Modal
  const [banIpModalOpen, setBanIpModalOpen] = useState(false);
  const [targetIpToBan, setTargetIpToBan] = useState<string | null>(null);
  const [ipBanReason, setIpBanReason] = useState("Spam multi-akun free trial dari IP yang sama");

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/plans")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setAvailablePlans(json.data);
        }
      })
      .catch(() => {});
  }, []);

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

  const openBanIpModal = (ip: string) => {
    setTargetIpToBan(ip);
    setIpBanReason("Spam multi-akun free trial dari IP yang sama");
    setBanIpModalOpen(true);
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

  const handleBanByIp = async () => {
    if (!targetIpToBan) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ban_by_ip",
          ip: targetIpToBan,
          banReason: ipBanReason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setBanIpModalOpen(false);
        setTargetIpToBan(null);
        fetchUsers();
      } else {
        showToast(json.error || "Gagal memblokir IP");
      }
    } catch {
      showToast("Terjadi kesalahan saat memproses blokir IP");
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
          <div className="alert alert-success text-xs font-bold py-2.5 px-4 shadow-xl rounded-xl flex items-center gap-2 text-white">
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
            Pantau data akun, aktivitas IP & anti-spam multi-akun, serta status paket berlangganan pengguna.
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total User</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalUsers}</div>
          <span className="text-[11px] text-slate-400">Semua akun sistem</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Berlangganan</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.activeSubscribed}</div>
          <span className="text-[11px] text-slate-400">Paket berbayar aktif</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Free Trial</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.freeUsers}</div>
          <span className="text-[11px] text-slate-400">Paket trial gratis</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Banned / Suspend</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.bannedUsers}</div>
          <span className="text-[11px] text-slate-400">Akun terblokir</span>
        </div>

        {/* Duplicate IP Multi-Account Alert Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === "DUPLICATE_IP" ? "ALL" : "DUPLICATE_IP")}
          className={`p-4 rounded-xl border shadow-xs space-y-1.5 cursor-pointer transition-all ${
            statusFilter === "DUPLICATE_IP"
              ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400/30"
              : stats.duplicateIpUsers > 0
              ? "bg-amber-50/70 border-amber-200 hover:bg-amber-100/60"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Duplikat IP</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800">{stats.duplicateIpUsers}</div>
          <span className="text-[11px] text-amber-700 font-medium">
            {stats.duplicateIpUsers > 0 ? "Klik untuk filter spam" : "Tidak ada anomali"}
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari user, email, ID, atau IP..."
            className="input input-bordered input-sm w-full pl-9 text-xs rounded-xl"
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
            <option value="DUPLICATE_IP">Duplikat IP (Potensi Spam Free Trial)</option>
          </select>

          <select
            className="select select-bordered select-sm text-xs rounded-xl"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="ALL">Semua Paket</option>
            <option value="FREE">Free Trial</option>
            {Object.values(availablePlans)
              .filter((p: any) => p.id !== "FREE")
              .map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.id}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Desktop User Table View */}
      <div className="hidden md:block rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3.5 pl-5">Pengguna</th>
                <th className="py-3.5">IP & Keamanan</th>
                <th className="py-3.5">Status Akun</th>
                <th className="py-3.5">Paket & Penggunaan</th>
                <th className="py-3.5">Terdaftar</th>
                <th className="py-3.5 pr-5 text-right min-w-[220px]">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="text-xs text-slate-500 mt-2 font-medium">Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-500" />
                    <p className="font-bold text-slate-700">Tidak ada pengguna ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter status.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isBanned = u.status === "BANNED";
                  const isSuspended = u.status === "SUSPENDED";
                  const isAdmin = u.role === "admin";
                  const ipAddress = u.lastLoginIp || u.registeredIp || "127.0.0.1";
                  const isDuplicateIp = (u.duplicateIpCount || 0) > 1;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* User Column */}
                      <td className="pl-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                              isAdmin
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : isBanned
                                ? "bg-rose-100 text-rose-700"
                                : isSuspended
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              u.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 max-w-[220px]">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-slate-900 text-sm truncate">{u.name}</span>
                              {isAdmin && (
                                <span className="badge badge-primary badge-xs text-[9px] font-extrabold shrink-0">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate">{u.email}</div>
                            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                              <span className="truncate">ID: {u.id.length > 14 ? `${u.id.slice(0, 12)}...` : u.id}</span>
                              <button
                                onClick={() => copyToClipboard(u.id, u.id)}
                                className="hover:text-primary shrink-0"
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

                      {/* IP Address & Anti-Spam Security Column */}
                      <td className="py-4">
                        <div className="space-y-1 max-w-[200px]">
                          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200/80 max-w-full">
                            <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px]" title={ipAddress}>
                              {ipAddress}
                            </span>
                            <button
                              onClick={() => copyToClipboard(ipAddress, `ip-${u.id}`)}
                              className="hover:text-primary text-slate-400 shrink-0"
                              title="Salin Alamat IP"
                            >
                              {copiedId === `ip-${u.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {isDuplicateIp && !isAdmin && (
                            <div>
                              <button
                                onClick={() => setSearch(ipAddress)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                                title={`Ada ${u.duplicateIpCount} akun terdaftar dari IP ini. Klik untuk melihat semuanya.`}
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{u.duplicateIpCount} Akun (IP Sama)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-4">
                        <div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                              u.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : u.status === "SUSPENDED"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {u.status === "ACTIVE"
                              ? "Aktif"
                              : u.status === "SUSPENDED"
                              ? "Ditangguhkan"
                              : "Diblokir"}
                          </span>
                          {u.banReason && (
                            <p className="text-[10px] text-rose-600 mt-1 max-w-[160px] truncate" title={u.banReason}>
                              Alasan: {u.banReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Plan & Usage Column */}
                      <td className="py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                                u.planId.includes("PRO")
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : u.planId.includes("BUSINESS") || u.planId.includes("ENTERPRISE")
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : u.planId === "FREE"
                                  ? "bg-slate-100 text-slate-600 border-slate-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {availablePlans[u.planId]?.name || u.planId}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                u.planStatus === "ACTIVE"
                                  ? "text-emerald-600"
                                  : u.planStatus === "EXPIRED"
                                  ? "text-rose-500"
                                  : "text-slate-400"
                              }`}
                            >
                              ({u.planStatus})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-slate-400" />
                              {u.messagesUsed.toLocaleString()} pesan
                            </span>
                            <span className="flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              {u.devicesCount} devices
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-4">
                        <div className="text-slate-600 text-[11px] space-y-0.5">
                          <div className="font-medium">
                            {new Date(u.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {u.lastLoginAt
                              ? `Login: ${new Date(u.lastLoginAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : "Belum pernah login"}
                          </div>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 pr-5 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20 shadow-xs">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Super Admin
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            {/* Assign Plan Button */}
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setSelectedPlanId(u.planId || "STARTER");
                                setPlanModalOpen(true);
                              }}
                              className="btn btn-xs btn-outline rounded-lg text-primary border-primary/30 hover:bg-primary hover:text-white font-bold gap-1"
                              title="Ubah Paket Berlangganan"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Paket</span>
                            </button>

                            {/* Status Actions */}
                            {u.status === "ACTIVE" ? (
                              <>
                                <button
                                  onClick={() => openStatusModal(u, "SUSPENDED")}
                                  className="btn btn-xs btn-ghost text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg font-bold"
                                  title="Tangguhkan Akun (Suspend)"
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() => openStatusModal(u, "BANNED")}
                                  className="btn btn-xs btn-ghost text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-bold"
                                  title="Blokir Permanen (Ban)"
                                >
                                  Ban
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(u.id, "ACTIVE")}
                                className="btn btn-xs btn-ghost text-emerald-700 bg-emerald-50 hover:bg-emerald-100 gap-1 rounded-lg font-bold"
                                title="Buka Blokir & Aktifkan Kembali"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Aktifkan</span>
                              </button>
                            )}

                            {/* Quick Ban All Accounts By IP if duplicate detected */}
                            {isDuplicateIp && ipAddress !== "127.0.0.1" && (
                              <button
                                onClick={() => openBanIpModal(ipAddress)}
                                className="btn btn-xs btn-ghost text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg gap-1 font-bold"
                                title={`Blokir seluruh ${u.duplicateIpCount} akun dari IP ini`}
                              >
                                <Ban className="w-3 h-3" />
                                <span>Ban IP</span>
                              </button>
                            )}

                            {/* Delete User Button */}
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setDeleteModalOpen(true);
                              }}
                              className="btn btn-xs btn-ghost text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Hapus Akun Pengguna Permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile User Card View (for Smartphones & Small Tablets) */}
      <div className="block md:hidden space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <span className="loading loading-spinner loading-md text-primary mb-2" />
            <p className="text-xs font-semibold">Memuat data pengguna...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-500" />
            <p className="font-bold text-slate-700">Tidak ada pengguna ditemukan</p>
          </div>
        ) : (
          users.map((u) => {
            const isBanned = u.status === "BANNED";
            const isSuspended = u.status === "SUSPENDED";
            const isAdmin = u.role === "admin";
            const ipAddress = u.lastLoginIp || u.registeredIp || "127.0.0.1";
            const isDuplicateIp = (u.duplicateIpCount || 0) > 1;

            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3"
              >
                {/* Mobile Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                        isAdmin
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : isBanned
                          ? "bg-rose-100 text-rose-700"
                          : isSuspended
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        u.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-slate-900 text-sm truncate">{u.name}</span>
                        {isAdmin && (
                          <span className="badge badge-primary badge-xs text-[9px] font-extrabold shrink-0">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                      u.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : u.status === "SUSPENDED"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {u.status === "ACTIVE"
                      ? "Aktif"
                      : u.status === "SUSPENDED"
                      ? "Suspend"
                      : "Banned"}
                  </span>
                </div>

                {/* Mobile Card Details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Paket:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-extrabold text-slate-800">
                        {availablePlans[u.planId]?.name || u.planId}
                      </span>
                      <span className={`text-[10px] font-bold ${u.planStatus === "ACTIVE" ? "text-emerald-600" : "text-slate-400"}`}>
                        ({u.planStatus})
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Penggunaan:</span>
                    <span className="font-semibold text-slate-700">{u.messagesUsed} pesan / {u.devicesCount} dev</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono text-[10px]">
                    <span className="text-slate-600 truncate max-w-[180px]">IP: {ipAddress}</span>
                    <span className="text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>

                {/* Mobile Card Actions */}
                {!isAdmin && (
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setSelectedPlanId(u.planId || "STARTER");
                        setPlanModalOpen(true);
                      }}
                      className="btn btn-xs btn-outline rounded-lg text-primary border-primary/30 font-bold gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Paket</span>
                    </button>

                    {u.status === "ACTIVE" ? (
                      <>
                        <button
                          onClick={() => openStatusModal(u, "SUSPENDED")}
                          className="btn btn-xs btn-ghost text-amber-700 bg-amber-50 rounded-lg font-bold"
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => openStatusModal(u, "BANNED")}
                          className="btn btn-xs btn-ghost text-rose-700 bg-rose-50 rounded-lg font-bold"
                        >
                          Ban
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(u.id, "ACTIVE")}
                        className="btn btn-xs btn-ghost text-emerald-700 bg-emerald-50 rounded-lg font-bold gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Aktifkan</span>
                      </button>
                    )}

                    {isDuplicateIp && ipAddress !== "127.0.0.1" && (
                      <button
                        onClick={() => openBanIpModal(ipAddress)}
                        className="btn btn-xs btn-ghost text-rose-700 bg-rose-50 rounded-lg font-bold gap-1"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Ban IP</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setDeleteModalOpen(true);
                      }}
                      className="btn btn-xs btn-ghost text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Suspend / Ban Akun User */}
      {statusModalOpen && selectedUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 my-auto relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div
                  className={`flex items-center gap-2 font-bold text-base ${
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
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Card Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{selectedUser.name}</span>
                  <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                    Paket: {selectedUser.planId}
                  </span>
                </div>
                <div className="text-slate-600 font-medium">{selectedUser.email}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>ID: {selectedUser.id}</span>
                  <span>IP: {selectedUser.lastLoginIp || "127.0.0.1"}</span>
                </div>
              </div>

              {/* Notice */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {statusActionType === "BANNED"
                  ? "Tindakan ini akan memblokir akses pengguna. Seluruh koneksi WhatsApp, broadcast, dan API Key akan langsung dinonaktifkan."
                  : "Tindakan ini akan menangguhkan akun pengguna sementara waktu sampai diaktifkan kembali."}
              </p>

              {/* Preset Quick Reasons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Pilih Alasan Cepat atau Ketik Sendiri:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Spam multi-akun free trial dari IP yang sama",
                    "Pelanggaran aturan sistem Waply",
                    "Spamming & Broadcast tanpa persetujuan",
                    "Terdeteksi anomali bot abuse / traffic",
                    "Penggunaan nomor tidak valid / melanggar ToS",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStatusReason(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors text-left ${
                        statusReason === preset
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Textarea Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>Isi Alasan Penonaktifan (Wajib):</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Ditampilkan saat login
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full text-xs font-medium leading-relaxed rounded-xl focus:outline-slate-900"
                  placeholder="Ketik alasan penonaktifan akun secara jelas..."
                  rows={2}
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
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !statusReason.trim()}
                  onClick={() =>
                    handleUpdateStatus(selectedUser.id, statusActionType, statusReason.trim())
                  }
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl text-white shadow-xs transition-colors flex items-center gap-1.5 ${
                    statusActionType === "BANNED"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : statusActionType === "BANNED" ? (
                    <UserX className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {statusActionType === "BANNED"
                      ? "Konfirmasi Blokir Akun"
                      : "Konfirmasi Suspend Akun"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Blokir Seluruh Akun dari IP Tertentu (Bulk Ban IP) */}
      {banIpModalOpen && targetIpToBan && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-base text-rose-600">
                  <Ban className="w-5 h-5" /> Blokir Massal IP (Anti-Spam)
                </div>
                <button
                  onClick={() => setBanIpModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="font-mono text-sm">{targetIpToBan}</span>
                </div>
                <p className="text-slate-600 leading-relaxed mt-1">
                  Seluruh akun non-admin yang terdaftar atau login dari alamat IP ini akan diblokir serentak.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Alasan Pemblokiran IP:
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full text-xs rounded-xl"
                  value={ipBanReason}
                  onChange={(e) => setIpBanReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBanIpModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !ipBanReason.trim()}
                  onClick={handleBanByIp}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Ban className="w-3.5 h-3.5" />
                  )}
                  <span>Blokir Seluruh Akun IP Ini</span>
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
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <Zap className="w-5 h-5 text-primary" /> Ubah Paket Layanan User
                </div>
                <button
                  onClick={() => setPlanModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{selectedUser.name}</div>
                <div className="text-slate-500">{selectedUser.email}</div>
                <div className="text-[11px] text-primary font-bold mt-1">
                  Paket Saat Ini: {availablePlans[selectedUser.planId]?.name || selectedUser.planId} ({selectedUser.planStatus})
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-slate-700">Pilih Paket Layanan Baru:</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full text-xs rounded-xl"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                  >
                    <option value="FREE">FREE TRIAL (100 Pesan, 1 Device)</option>
                    {Object.values(availablePlans)
                      .filter((p: any) => p.id !== "FREE")
                      .map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.id} ({p.isUnlimitedMessages ? "Unlimited" : p.monthlyMessages?.toLocaleString()} Pesan, {p.maxDevices} Devices)
                        </option>
                      ))}
                    {/* Fallback default options if availablePlans is not loaded yet */}
                    {!availablePlans["STARTER"] && !availablePlans["DAILY_STARTER"] && (
                      <>
                        <option value="STARTER">STARTER (5.000 Pesan, 2 Devices)</option>
                        <option value="BUSINESS">BUSINESS (25.000 Pesan, 5 Devices)</option>
                        <option value="PRO">PRO (100.000 Pesan, 10 Devices)</option>
                      </>
                    )}
                  </select>
                </div>

                {selectedPlanId !== "FREE" && (
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs text-slate-700">Masa Aktif Berlangganan:</span>
                    </label>
                    <select
                      className="select select-bordered select-sm w-full text-xs rounded-xl"
                      value={planDurationDays}
                      onChange={(e) => setPlanDurationDays(Number(e.target.value))}
                    >
                      <option value={7}>7 Hari (1 Minggu)</option>
                      <option value={30}>30 Hari (1 Bulan)</option>
                      <option value={90}>90 Hari (3 Bulan)</option>
                      <option value={180}>180 Hari (6 Bulan)</option>
                      <option value={365}>365 Hari (1 Tahun)</option>
                      <option value={730}>730 Hari (2 Tahun)</option>
                      <option value={1095}>1095 Hari (3 Tahun)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleUpdatePlan}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {actionLoading ? <span className="loading loading-spinner loading-xs" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Simpan & Aktifkan Paket</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: Hapus Akun User Permanen (Refactored Clean antislop-ui) */}
      {deleteModalOpen && selectedUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Hapus Akun Pengguna</span>
                </div>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{selectedUser.name}</span>
                  <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                    {selectedUser.planId}
                  </span>
                </div>
                <div className="text-slate-600 font-medium">{selectedUser.email}</div>
                <div className="text-[10px] text-slate-400 font-mono">ID: {selectedUser.id}</div>
              </div>

              {/* Warning Notice */}
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  Tindakan ini tidak dapat dibatalkan
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Akun akan dihapus secara permanen dari sistem Waply. Sesi aktif akan dihentikan dan seluruh data terkait akan dihapus.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteUser}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Hapus Akun Permanen</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
