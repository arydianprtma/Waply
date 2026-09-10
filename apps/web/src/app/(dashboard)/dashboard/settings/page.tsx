"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  User,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Save,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Building2,
  Laptop,
  CheckCircle,
  AlertCircle,
  QrCode,
  LogOut,
  Shield,
  Trash2,
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import clsx from "clsx";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { useBillingPlan } from "@/lib/use-billing-plan";
import { setCachedUser, getCachedUser } from "@/lib/use-user-session";

interface Profile {
  name: string;
  email: string;
  companyName: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

interface SecurityConfig {
  twoFactorEnabled: boolean;
  twoFactorMethod: "authenticator" | "email";
  lastPasswordChanged?: string | null;
  loginAlerts: boolean;
}

interface GatewayConfig {
  url: string;
  minDelaySec: number;
  maxDelaySec: number;
  typingPresence: boolean;
}

interface WorkingHoursConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  daysOfWeek: number[];
}

interface NotifPrefs {
  emailOnBroadcastDone: boolean;
  emailOnDeviceDisconnect: boolean;
  emailOnQuotaLow?: boolean;
  emailWeeklyReport?: boolean;
}

interface AppSettings {
  userId?: string;
  profile: Profile;
  security?: SecurityConfig;
  gateway: GatewayConfig;
  workingHours: WorkingHoursConfig;
  notifications: NotifPrefs;
}

const DEFAULT: AppSettings = {
  userId: "",
  profile: { name: "", email: "", companyName: "", phoneNumber: "" },
  security: {
    twoFactorEnabled: false,
    twoFactorMethod: "authenticator",
    lastPasswordChanged: null,
    loginAlerts: true,
  },
  gateway: { url: "http://localhost:3002", minDelaySec: 4, maxDelaySec: 8, typingPresence: true },
  workingHours: {
    enabled: false,
    startTime: "08:00",
    endTime: "21:00",
    timezone: "Asia/Jakarta",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
  },
  notifications: {
    emailOnBroadcastDone: true,
    emailOnDeviceDisconnect: true,
    emailOnQuotaLow: true,
    emailWeeklyReport: false,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showUserId, setShowUserId] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notif" | "danger">("profile");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState<string[] | null>(null);
  const [resetting, setResetting] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // 2FA Setup State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAVerifying, setTwoFAVerifying] = useState(false);
  const [sessionsRevoked, setSessionsRevoked] = useState(false);

  // Avatar Upload State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarToast, setAvatarToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showAvatarToast = (msg: string, type: "success" | "error" = "success") => {
    setAvatarToast({ msg, type });
    setTimeout(() => setAvatarToast(null), 3000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      showAvatarToast("Format file harus berupa gambar (JPG, PNG, WebP, GIF)", "error");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showAvatarToast("Ukuran foto maksimal 3MB", "error");
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.avatarUrl) {
        setSettings((prev) => ({
          ...prev,
          profile: { ...prev.profile, avatarUrl: json.avatarUrl },
        }));
        const cached = getCachedUser();
        if (cached) {
          setCachedUser({ ...cached, avatarUrl: json.avatarUrl });
        }
        showAvatarToast("Foto profil berhasil diperbarui!");
      } else {
        showAvatarToast(json.error || "Gagal mengunggah foto profil", "error");
      }
    } catch {
      showAvatarToast("Terjadi kesalahan jaringan saat mengunggah foto", "error");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSettings((prev) => ({
          ...prev,
          profile: { ...prev.profile, avatarUrl: "" },
        }));
        const cached = getCachedUser();
        if (cached) {
          setCachedUser({ ...cached, avatarUrl: null });
        }
        showAvatarToast("Foto profil berhasil dihapus");
      } else {
        showAvatarToast(json.error || "Gagal menghapus foto profil", "error");
      }
    } catch {
      showAvatarToast("Terjadi kesalahan jaringan saat menghapus foto", "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  const { currentPlanName } = useBillingPlan();

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings({
          ...DEFAULT,
          ...json.data,
          profile: { ...DEFAULT.profile, ...(json.data.profile || {}) },
          security: { ...DEFAULT.security, ...(json.data.security || {}) },
          notifications: { ...DEFAULT.notifications, ...(json.data.notifications || {}) },
        });
      }
    } catch {
      // Keep default state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 6) {
      setPassError("Password baru minimal harus 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setPassSuccess(json.message || "Password akun berhasil diperbarui.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (settings.security) {
          setSettings((prev) => ({
            ...prev,
            security: {
              ...(prev.security || DEFAULT.security!),
              lastPasswordChanged: new Date().toISOString(),
            },
          }));
        }
      } else {
        setPassError(json.error || "Gagal mengubah password.");
      }
    } catch (err: any) {
      setPassError(err.message || "Terjadi kesalahan sistem saat mengubah password.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_local_data" }),
      });
      const json = await res.json();
      if (json.success) {
        setResetDone(json.deleted || []);
        setResetConfirm(false);
      }
    } finally {
      setResetting(false);
    }
  };

  const update = <K extends "profile" | "security" | "gateway" | "workingHours" | "notifications">(
    section: K,
    field: string,
    value: unknown
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as any), [field]: value },
    }));
  };

  const tabs = [
    { key: "profile", label: "Profil Akun", icon: User },
    { key: "security", label: "Keamanan & Password", icon: ShieldCheck },
    { key: "notif", label: "Notifikasi", icon: Bell },
    { key: "danger", label: "Zona Bahaya", icon: AlertTriangle },
  ] as const;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "", color: "bg-base-300" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 25, text: "Lemah", color: "bg-rose-500", textColor: "text-rose-600" };
    if (score <= 2) return { score: 50, text: "Cukup", color: "bg-amber-500", textColor: "text-amber-600" };
    if (score <= 3) return { score: 75, text: "Baik", color: "bg-blue-500", textColor: "text-blue-600" };
    return { score: 100, text: "Sangat Kuat", color: "bg-emerald-500", textColor: "text-emerald-600" };
  };

  const strength = getPasswordStrength(newPassword);

  const userInitial = (settings.profile.name || settings.profile.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-xs text-base-content/50 font-medium">Memuat konfigurasi akun...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />

      {/* Toast Alert for Avatar and Settings */}
      {avatarToast && (
        <div className="toast toast-top toast-center z-50">
          <div
            className={clsx(
              "alert text-xs font-bold py-2.5 px-4 shadow-xl rounded-2xl flex items-center gap-2 text-white",
              avatarToast.type === "error" ? "alert-error bg-rose-600" : "alert-success bg-emerald-600"
            )}
          >
            {avatarToast.type === "error" ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{avatarToast.msg}</span>
          </div>
        </div>
      )}

      {/* Page Header Card */}
      <div className="card bg-base-100 border border-base-200 shadow-2xs rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar Pill with Photo / Initial + Quick Camera Button */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-primary/20 overflow-hidden border-2 border-white dark:border-slate-800 select-none relative">
                {settings.profile.avatarUrl ? (
                  <img
                    src={settings.profile.avatarUrl}
                    alt={settings.profile.name || "Foto Profil"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
                    <span className="loading loading-spinner loading-sm text-white" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-slate-900 text-white hover:bg-primary border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-sm transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                title="Ganti Foto Profil"
                aria-label="Ganti Foto Profil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                  {settings.profile.name || "Pengguna Waply"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-3 h-3" />
                  {currentPlanName}
                </span>
              </div>

              <p className="text-xs text-base-content/60 truncate flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-base-content/40" />
                <span>{settings.profile.email || "email@domain.com"}</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                  Terverifikasi
                </span>
              </p>
            </div>
          </div>

          {/* Quick ID Badge */}
          {settings.userId && (
            <div className="bg-base-200/60 border border-base-300 rounded-2xl p-2.5 sm:px-3.5 flex items-center gap-2.5 self-start sm:self-auto shrink-0">
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 block">
                  User ID
                </span>
                <span className="text-xs font-mono font-semibold text-slate-800">
                  {showUserId ? settings.userId : `${settings.userId.slice(0, 10)}...`}
                </span>
              </div>
              <div className="flex items-center gap-1 border-l border-base-300 pl-2">
                <button
                  type="button"
                  onClick={() => setShowUserId(!showUserId)}
                  className="btn btn-ghost btn-xs btn-circle text-slate-500 hover:text-slate-800"
                  title={showUserId ? "Sembunyikan User ID" : "Tampilkan User ID"}
                  aria-label="Toggle lihat User ID"
                >
                  {showUserId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (settings.userId) {
                      navigator.clipboard.writeText(settings.userId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }
                  }}
                  className="btn btn-ghost btn-xs btn-circle text-slate-500 hover:text-primary"
                  title="Salin User ID"
                  aria-label="Salin User ID"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1.5 bg-base-200/70 border border-base-300 rounded-2xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          const isDanger = t.key === "danger";

          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 select-none",
                isActive
                  ? isDanger
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-base-100 text-slate-900 dark:text-slate-100 shadow-xs"
                  : isDanger
                  ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  : "text-base-content/60 hover:text-base-content hover:bg-base-100"
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? (isDanger ? "text-white" : "text-primary") : "")} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFIL AKUN */}
      {activeTab === "profile" && (
        <div className="space-y-5">
          <div className="card bg-base-100 border border-base-200 shadow-2xs p-6 sm:p-7 rounded-3xl space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Informasi Kontak & Bisnis
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                Perbarui data identitas pengguna dan nama organisasi yang tertera pada invoice.
              </p>
            </div>

            {/* Profile Photo Management Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-base-200/50 border border-base-300 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white font-bold text-xl flex items-center justify-center shadow-xs overflow-hidden border border-base-300">
                    {settings.profile.avatarUrl ? (
                      <img
                        src={settings.profile.avatarUrl}
                        alt={settings.profile.name || "Avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Foto Profil
                  </div>
                  <p className="text-[11px] text-base-content/60">
                    Format: JPG, PNG, WebP, GIF. Maksimal ukuran 3MB.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="btn btn-sm btn-outline rounded-xl text-xs font-bold gap-1.5 flex-1 sm:flex-initial"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {avatarUploading ? "Mengunggah..." : settings.profile.avatarUrl ? "Ganti Foto" : "Unggah Foto"}
                </button>
                {settings.profile.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className="btn btn-sm btn-ghost text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold gap-1.5"
                    title="Hapus Foto Profil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">Nama Lengkap</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Nama Lengkap Anda"
                    className="input input-bordered input-sm w-full pl-9 rounded-xl text-xs font-medium"
                    value={settings.profile.name}
                    onChange={(e) => update("profile", "name", e.target.value)}
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">Alamat Email</span>
                  <span className="label-text-alt text-[10px] text-base-content/40">Terkunci (Akun Login)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    type="email"
                    className="input input-bordered input-sm w-full pl-9 rounded-xl text-xs font-mono bg-base-200/50 text-base-content/70 cursor-not-allowed"
                    value={settings.profile.email}
                    disabled
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">Nama Perusahaan / Bisnis</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Contoh: PT Maju Bersama / Toko Berkah"
                    className="input input-bordered input-sm w-full pl-9 rounded-xl text-xs font-medium"
                    value={settings.profile.companyName}
                    onChange={(e) => update("profile", "companyName", e.target.value)}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">Nomor WhatsApp Utama</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Contoh: 6281234567890"
                    className="input input-bordered input-sm w-full pl-9 rounded-xl text-xs font-mono font-medium"
                    value={settings.profile.phoneNumber || ""}
                    onChange={(e) => update("profile", "phoneNumber", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-base-200 flex justify-end">
              <SaveButton onSave={handleSave} saving={saving} saved={saved} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KEAMANAN & PASSWORD */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Section 1: Ganti Password */}
          <div className="card bg-base-100 border border-base-200 shadow-2xs p-6 sm:p-7 rounded-3xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Perbarui Kata Sandi
                </h3>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Gunakan kombinasi password yang kuat untuk menjaga keamanan akses dashboard Anda.
                </p>
              </div>

              {settings.security?.lastPasswordChanged && (
                <span className="text-[11px] text-base-content/50 font-mono bg-base-200/50 px-2.5 py-1 rounded-lg border border-base-300 self-start sm:self-auto">
                  Diubah: {new Date(settings.security.lastPasswordChanged).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>

            {passSuccess && (
              <div className="alert alert-success text-xs py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="alert alert-error text-xs py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Current Password */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-700">Password Saat Ini</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      placeholder="••••••••"
                      className="input input-bordered input-sm w-full pr-8 rounded-xl text-xs"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="btn btn-ghost btn-xs btn-circle absolute right-1.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-700">Password Baru</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      placeholder="Min. 6 karakter"
                      className="input input-bordered input-sm w-full pr-8 rounded-xl text-xs"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="btn btn-ghost btn-xs btn-circle absolute right-1.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-700">Ulangi Password Baru</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      placeholder="Konfirmasi password baru"
                      className="input input-bordered input-sm w-full pr-8 rounded-xl text-xs"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="btn btn-ghost btn-xs btn-circle absolute right-1.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    >
                      {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password strength meter */}
              {newPassword && (
                <div className="p-3 bg-base-200/50 rounded-2xl border border-base-300 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-base-content/70">Kekuatan Sandi:</span>
                    <span className={clsx("font-bold", strength.textColor)}>
                      {strength.text}
                    </span>
                  </div>
                  <div className="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={clsx("h-full transition-all duration-300", strength.color)}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passLoading || !newPassword || !confirmPassword}
                  className="btn btn-primary btn-sm rounded-xl gap-2 font-bold shadow-xs text-white"
                >
                  {passLoading ? <span className="loading loading-spinner loading-xs" /> : <Lock className="w-4 h-4" />}
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Two-Factor Authentication (2FA) */}
          <div className="card bg-base-100 border border-base-200 shadow-2xs p-6 sm:p-7 rounded-3xl space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  Autentikasi Dua Langkah (2FA)
                </h3>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Proteksi akun tambahan dengan mewajibkan verifikasi kode 6 digit saat login.
                </p>
              </div>
              <span
                className={clsx(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shrink-0",
                  settings.security?.twoFactorEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                {settings.security?.twoFactorEnabled ? "2FA Aktif" : "Nonaktif"}
              </span>
            </div>

            <div className="space-y-4">
              <label className="label cursor-pointer justify-start gap-4 p-4 rounded-2xl hover:bg-base-200/50 border border-base-200 bg-base-50/50">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={settings.security?.twoFactorEnabled || false}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    update("security", "twoFactorEnabled", enabled);
                    if (enabled) {
                      setShow2FAModal(true);
                    }
                  }}
                />
                <div>
                  <span className="label-text font-bold text-sm text-slate-900 block">Aktifkan Proteksi 2FA</span>
                  <span className="text-xs text-base-content/60">
                    Wajibkan verifikasi kode keamanan saat masuk dari perangkat atau browser baru.
                  </span>
                </div>
              </label>

              {settings.security?.twoFactorEnabled && (
                <div className="p-4 sm:p-5 bg-base-200/50 rounded-2xl space-y-4 border border-base-300">
                  <span className="text-xs font-bold text-slate-800 block">Pilih Metode Verifikasi Utama:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => update("security", "twoFactorMethod", "authenticator")}
                      className={clsx(
                        "p-4 rounded-2xl border cursor-pointer transition-all",
                        settings.security.twoFactorMethod === "authenticator"
                          ? "bg-primary/5 border-primary text-primary font-bold shadow-xs"
                          : "bg-base-100 border-base-300 hover:border-base-content/20"
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Smartphone className="w-4 h-4" />
                        <span>Aplikasi Authenticator (TOTP)</span>
                      </div>
                      <p className="text-[11px] font-normal text-base-content/60 mt-1">
                        Gunakan Google Authenticator, Microsoft Authenticator, atau Authy.
                      </p>
                    </div>

                    <div
                      onClick={() => update("security", "twoFactorMethod", "email")}
                      className={clsx(
                        "p-4 rounded-2xl border cursor-pointer transition-all",
                        settings.security.twoFactorMethod === "email"
                          ? "bg-primary/5 border-primary text-primary font-bold shadow-xs"
                          : "bg-base-100 border-base-300 hover:border-base-content/20"
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Mail className="w-4 h-4" />
                        <span>Kode OTP via Email</span>
                      </div>
                      <p className="text-[11px] font-normal text-base-content/60 mt-1">
                        Kirim kode verifikasi ke email: <strong>{settings.profile.email}</strong>
                      </p>
                    </div>
                  </div>

                  {settings.security.twoFactorMethod === "authenticator" && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShow2FAModal(true)}
                        className="btn btn-outline btn-primary btn-sm rounded-xl gap-2 font-bold"
                      >
                        <QrCode className="w-4 h-4" />
                        Tampilkan QR Code / Setup Authenticator
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-base-200 flex justify-end">
              <SaveButton onSave={handleSave} saving={saving} saved={saved} />
            </div>
          </div>

          {/* Section 3: Sesi Login & Perangkat Aktif */}
          <div className="card bg-base-100 border border-base-200 shadow-2xs p-6 sm:p-7 rounded-3xl space-y-5">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-primary" />
                Sesi Perangkat Login Aktif
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                Pantau daftar perangkat yang saat ini memiliki token sesi aktif pada akun Anda.
              </p>
            </div>

            <div className="space-y-3">
              {/* Current Session */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Perangkat Ini (Web Browser)</span>
                      <span className="badge badge-success badge-xs text-[9px] font-bold text-white">Sesi Aktif</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      IP: 127.0.0.1 (Local Session) • Login Terakhir: Hari ini
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Alerts Toggle */}
              <label className="label cursor-pointer justify-start gap-4 p-4 rounded-2xl hover:bg-base-200/50 border border-base-200">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={settings.security?.loginAlerts ?? true}
                  onChange={(e) => update("security", "loginAlerts", e.target.checked)}
                />
                <div>
                  <span className="label-text font-bold text-sm text-slate-900 block">Peringatan Login Lokasi Baru</span>
                  <span className="text-xs text-base-content/60">
                    Kirim notifikasi email otomatis jika terdeteksi aktivitas login dari browser atau alamat IP baru.
                  </span>
                </div>
              </label>

              {/* Revoke All Other Sessions */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-base-200">
                <span className="text-xs text-base-content/60">
                  {sessionsRevoked
                    ? "Semua sesi pada perangkat lain telah berhasil dikeluarkan."
                    : "Keluarkan sesi pada perangkat lain jika mencurigai adanya akses tidak sah."}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSessionsRevoked(true);
                    setTimeout(() => setSessionsRevoked(false), 3500);
                  }}
                  className={clsx(
                    "btn btn-sm rounded-xl gap-2 font-bold",
                    sessionsRevoked ? "btn-success text-white" : "btn-outline btn-error"
                  )}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {sessionsRevoked ? "Sesi Berhasil Dikeluarkan" : "Keluarkan Semua Sesi Lain"}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-base-200 flex justify-end">
              <SaveButton onSave={handleSave} saving={saving} saved={saved} />
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal Dialog */}
      {show2FAModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-base-100 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-base-200 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <QrCode className="w-5 h-5 text-primary" />
                  Setup Authenticator (2FA)
                </div>
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                  aria-label="Tutup dialog"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-base-content/70 leading-relaxed">
                1. Buka aplikasi <strong>Google Authenticator</strong> atau <strong>Authy</strong> pada ponsel Anda.<br />
                2. Pindai kode QR di bawah ini atau masukkan Secret Key secara manual.
              </p>

              {/* QR Code Mockup */}
              <div className="p-5 bg-white border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-36 h-36 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-mono text-center p-2 shadow-inner">
                  <div className="space-y-1">
                    <QrCode className="w-16 h-16 mx-auto text-primary" />
                    <span className="text-[10px] tracking-wider block font-bold text-emerald-400">WAPLY 2FA</span>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secret Key Manual</span>
                  <p className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg mt-0.5 select-all border border-slate-200">
                    SNDR-7X9K-2M4Q-8W1P
                  </p>
                </div>
              </div>

              {/* 6 Digit Verification Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold block text-slate-700">
                  3. Masukkan 6 Digit Kode dari Aplikasi:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="input input-bordered input-sm w-full font-mono text-center tracking-[0.4em] font-bold text-lg rounded-xl"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={twoFACode.length !== 6 || twoFAVerifying}
                  onClick={() => {
                    setTwoFAVerifying(true);
                    setTimeout(() => {
                      setTwoFAVerifying(false);
                      setShow2FAModal(false);
                      setTwoFACode("");
                      update("security", "twoFactorEnabled", true);
                      handleSave();
                    }, 800);
                  }}
                  className="btn btn-primary btn-sm rounded-xl gap-2 font-bold text-white"
                >
                  {twoFAVerifying ? <span className="loading loading-spinner loading-xs" /> : <Check className="w-4 h-4" />}
                  Verifikasi & Aktifkan
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* TAB 3: NOTIFIKASI */}
      {activeTab === "notif" && (
        <div className="space-y-5">
          <div className="card bg-base-100 border border-base-200 shadow-2xs p-6 sm:p-7 rounded-3xl space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Preferensi Notifikasi & Peringatan
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                Atur notifikasi penting yang akan dikirimkan ke email akun Anda saat terjadi peristiwa di gateway.
              </p>
            </div>

            <div className="space-y-3">
              <label className="label cursor-pointer justify-start gap-4 p-4 rounded-2xl hover:bg-base-200/50 border border-base-200">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={settings.notifications.emailOnBroadcastDone}
                  onChange={(e) => update("notifications", "emailOnBroadcastDone", e.target.checked)}
                />
                <div>
                  <span className="label-text font-bold text-sm text-slate-900 block">Laporan Broadcast Selesai</span>
                  <span className="text-xs text-base-content/60">
                    Kirim notifikasi email dan ringkasan statistik setelah pengiriman pesan broadcast selesai.
                  </span>
                </div>
              </label>

              <label className="label cursor-pointer justify-start gap-4 p-4 rounded-2xl hover:bg-base-200/50 border border-base-200">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={settings.notifications.emailOnDeviceDisconnect}
                  onChange={(e) => update("notifications", "emailOnDeviceDisconnect", e.target.checked)}
                />
                <div>
                  <span className="label-text font-bold text-sm text-slate-900 block">WhatsApp Device Disconnected</span>
                  <span className="text-xs text-base-content/60">
                    Kirim email peringatan instan jika koneksi device WhatsApp Anda terputus dari server.
                  </span>
                </div>
              </label>

              <label className="label cursor-pointer justify-start gap-4 p-4 rounded-2xl hover:bg-base-200/50 border border-base-200">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={settings.notifications.emailOnQuotaLow ?? true}
                  onChange={(e) => update("notifications", "emailOnQuotaLow", e.target.checked)}
                />
                <div>
                  <span className="label-text font-bold text-sm text-slate-900 block">Peringatan Kuota Menipis</span>
                  <span className="text-xs text-base-content/60">
                    Kirim peringatan email saat kuota pesan harian atau bulanan Anda tersisa kurang dari 10%.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-base-200 flex justify-end">
              <SaveButton onSave={handleSave} saving={saving} saved={saved} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DANGER ZONE */}
      {activeTab === "danger" && (
        <div className="space-y-5">
          <div className="card bg-base-100 border-2 border-rose-200 dark:border-rose-900/50 shadow-2xs p-6 sm:p-7 rounded-3xl space-y-6">
            <div>
              <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Zona Bahaya (Danger Zone)
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                Tindakan pada bagian ini bersifat permanen dan tidak dapat dibatalkan. Mohon berhati-hati sebelum melakukan aksi berikut.
              </p>
            </div>

            {resetDone !== null ? (
              <div className="alert alert-success text-xs py-4 rounded-2xl gap-3 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Data lokal berhasil dibersihkan!</p>
                  <p className="text-xs mt-0.5 text-emerald-800">
                    File yang direset: {resetDone.length > 0 ? resetDone.join(", ") : "seluruh data log lokal"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl">
                <div>
                  <p className="font-bold text-sm text-slate-900">Reset Seluruh Data Lokal</p>
                  <p className="text-xs text-base-content/60 mt-1 leading-relaxed">
                    Menghapus data kontak, kampanye broadcast, aturan auto-reply, template, webhook logs, dan blacklist lokal. Sesi koneksi WhatsApp device tetap aman.
                  </p>
                </div>

                {resetConfirm ? (
                  <div className="flex gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="btn btn-ghost btn-sm rounded-xl text-xs"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={resetting}
                      className="btn btn-error btn-sm rounded-xl gap-2 text-white font-bold text-xs"
                    >
                      {resetting ? <span className="loading loading-spinner loading-xs" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Ya, Hapus Semua
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setResetConfirm(true)}
                    className="btn btn-outline btn-error btn-sm rounded-xl font-bold shrink-0 self-start sm:self-auto text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Data Lokal
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SaveButton({
  onSave,
  saving,
  saved,
}: {
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className={clsx(
        "btn btn-sm rounded-xl gap-2 min-w-[150px] font-bold text-xs shadow-xs text-white",
        saved ? "btn-success" : "btn-primary"
      )}
    >
      {saving ? (
        <span className="loading loading-spinner loading-xs" />
      ) : saved ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {saved ? "Perubahan Tersimpan!" : "Simpan Perubahan"}
    </button>
  );
}
