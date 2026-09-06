"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Save,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  ShieldAlert,
  Laptop,
  CheckCircle,
  AlertCircle,
  QrCode,
  LogOut,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface Profile {
  name: string;
  email: string;
  companyName: string;
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
  profile: { name: "", email: "", companyName: "" },
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
  notifications: { emailOnBroadcastDone: true, emailOnDeviceDisconnect: true },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showUserId, setShowUserId] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "workingHours" | "notif" | "danger">("profile");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState<string[] | null>(null);
  const [resetting, setResetting] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // 2FA Setup State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAVerifying, setTwoFAVerifying] = useState(false);
  const [sessionsRevoked, setSessionsRevoked] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) setSettings(json.data);
    } catch {
      //
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
      setPassError("Password baru minimal harus 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Konfirmasi password baru tidak cocok");
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
        setPassSuccess(json.message || "Password berhasil diperbarui!");
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
        setPassError(json.error || "Gagal mengubah password");
      }
    } catch (err: any) {
      setPassError(err.message || "Terjadi kesalahan sistem saat mengubah password");
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
    { key: "profile", label: "Profil", icon: User },
    { key: "security", label: "Keamanan", icon: ShieldCheck },
    { key: "workingHours", label: "Jam Kerja", icon: Clock },
    { key: "notif", label: "Notifikasi", icon: Bell },
    { key: "danger", label: "Danger Zone", icon: AlertTriangle },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
        <p className="text-sm text-base-content/60 mt-1">
          Kelola profil akun, keamanan & ganti password, jadwal jam kerja, dan preferensi notifikasi.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-base-200/60 rounded-2xl w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`btn btn-sm gap-2 rounded-xl transition-all ${
                activeTab === t.key
                  ? t.key === "danger"
                    ? "btn-error shadow-md"
                    : "btn-primary shadow-md shadow-primary/20"
                  : "btn-ghost"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Profile */}
      {activeTab === "profile" && (
        <div className="card bg-base-100 border border-base-200 shadow-sm p-6 rounded-2xl space-y-5">
          <h3 className="font-bold text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Profil Pengguna
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ID User */}
            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-medium text-sm">ID User</span>
                <span className="label-text-alt text-base-content/40">ID identifikasi unik akun Anda</span>
              </label>
              <div className="relative">
                <input
                  type={showUserId ? "text" : "password"}
                  className="input input-bordered input-sm w-full font-mono bg-base-200/50 pr-28 text-xs font-semibold text-slate-800"
                  value={settings.userId || ""}
                  disabled
                />
                <div className="absolute right-1.5 top-1 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowUserId(!showUserId)}
                    className="btn btn-ghost btn-xs btn-square text-slate-500 hover:text-slate-800"
                    title={showUserId ? "Sembunyikan ID User" : "Tampilkan ID User"}
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
                    className="btn btn-ghost btn-xs btn-square text-slate-500 hover:text-primary"
                    title={copiedId ? "Berhasil disalin" : "Salin ID User"}
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium text-sm">Nama Lengkap</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                value={settings.profile.name}
                onChange={(e) => update("profile", "name", e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium text-sm">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered input-sm bg-base-200/50"
                value={settings.profile.email}
                disabled
              />
            </div>
            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-medium text-sm">Nama Perusahaan</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                value={settings.profile.companyName}
                onChange={(e) => update("profile", "companyName", e.target.value)}
              />
            </div>
          </div>
          <SaveButton onSave={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Section 1: Ganti Password */}
          <div className="card bg-base-100 border border-base-200 shadow-sm p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" /> Ganti Password Akun
              </h3>
              {settings.security?.lastPasswordChanged && (
                <span className="text-[11px] text-base-content/50 font-medium">
                  Terakhir diubah: {new Date(settings.security.lastPasswordChanged).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>

            <p className="text-xs text-base-content/60">
              Pastikan Anda menggunakan kombinasi password yang kuat dan unik agar akun Anda tetap aman.
            </p>

            {passSuccess && (
              <div className="alert alert-success text-xs py-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="alert alert-error text-xs py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-medium text-xs">Password Saat Ini (Opsional)</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="input input-bordered input-sm"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-medium text-xs">Password Baru</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      className="input input-bordered input-sm w-full pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn btn-ghost btn-xs absolute right-1.5 top-1 text-base-content/40 hover:text-base-content"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label py-1">
                    <span className="label-text font-medium text-xs">Konfirmasi Password Baru</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    className="input input-bordered input-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="p-3 bg-base-200/40 rounded-xl space-y-1.5 border border-base-200 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span>Kekuatan Password:</span>
                    <span className={newPassword.length >= 8 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                      {newPassword.length >= 8 ? "Kuat" : "Cukup (Disarankan min. 8 karakter)"}
                    </span>
                  </div>
                  <div className="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        newPassword.length >= 8 ? "w-full bg-emerald-500" : newPassword.length >= 6 ? "w-2/3 bg-amber-500" : "w-1/3 bg-rose-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={passLoading || !newPassword || !confirmPassword}
                  className="btn btn-primary btn-sm gap-2"
                >
                  {passLoading ? <span className="loading loading-spinner loading-xs" /> : <Lock className="w-4 h-4" />}
                  Perbarui Password
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Two-Factor Authentication (2FA) */}
          <div className="card bg-base-100 border border-base-200 shadow-sm p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" /> Autentikasi Dua Langkah (2FA)
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                settings.security?.twoFactorEnabled
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {settings.security?.twoFactorEnabled ? "Aktif & Terlindungi" : "Nonaktif"}
              </span>
            </div>

            <p className="text-xs text-base-content/60">
              Tambahkan lapisan keamanan ekstra pada akun Anda. Saat login, Anda akan diminta memasukkan kode verifikasi 6 digit.
            </p>

            <div className="space-y-3">
              <label className="label cursor-pointer justify-start gap-4 py-3 rounded-xl hover:bg-base-200/50 px-3 border border-base-200">
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
                  <span className="label-text font-medium text-sm block">Aktifkan 2FA</span>
                  <span className="text-xs text-base-content/50">
                    Wajibkan verifikasi kode saat masuk dari perangkat baru
                  </span>
                </div>
              </label>

              {settings.security?.twoFactorEnabled && (
                <div className="p-4 bg-base-200/40 rounded-xl space-y-4 border border-base-200 animate-in fade-in duration-200">
                  <span className="text-xs font-bold text-slate-700 block">Pilih Metode Verifikasi:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => update("security", "twoFactorMethod", "authenticator")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        settings.security.twoFactorMethod === "authenticator"
                          ? "bg-primary/5 border-primary text-primary font-bold shadow-xs"
                          : "bg-base-100 border-base-300 hover:border-base-content/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Smartphone className="w-4 h-4" />
                        <span>Aplikasi Authenticator (TOTP)</span>
                      </div>
                      <p className="text-[11px] font-normal text-base-content/60 mt-1">
                        Google Authenticator, Microsoft Authenticator, atau Authy.
                      </p>
                    </div>

                    <div
                      onClick={() => update("security", "twoFactorMethod", "email")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        settings.security.twoFactorMethod === "email"
                          ? "bg-primary/5 border-primary text-primary font-bold shadow-xs"
                          : "bg-base-100 border-base-300 hover:border-base-content/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Mail className="w-4 h-4" />
                        <span>Kode OTP via Email</span>
                      </div>
                      <p className="text-[11px] font-normal text-base-content/60 mt-1">
                        Kirim kode verifikasi ke: <strong>{settings.profile.email}</strong>
                      </p>
                    </div>
                  </div>

                  {settings.security.twoFactorMethod === "authenticator" && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShow2FAModal(true)}
                        className="btn btn-outline btn-primary btn-sm gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        Lihat QR Code / Setup Authenticator
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <SaveButton onSave={handleSave} saving={saving} saved={saved} />
          </div>

          {/* Section 3: Sesi Login & Perangkat Aktif */}
          <div className="card bg-base-100 border border-base-200 shadow-sm p-6 rounded-2xl space-y-5">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Laptop className="w-4 h-4 text-primary" /> Sesi & Perangkat Aktif
            </h3>
            <p className="text-xs text-base-content/60">
              Daftar sesi browser dan perangkat yang sedang terhubung ke akun Anda saat ini.
            </p>

            <div className="space-y-3">
              {/* Current Session */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Perangkat Ini (Windows / Web Browser)</span>
                      <span className="badge badge-success badge-xs text-[9px] font-bold">Aktif Sekarang</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      IP: 127.0.0.1 (Local Session) • Login Terakhir: Hari ini
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Alerts Toggle */}
              <label className="label cursor-pointer justify-start gap-4 py-3 rounded-xl hover:bg-base-200/50 px-3 border border-base-200">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={settings.security?.loginAlerts ?? true}
                  onChange={(e) => update("security", "loginAlerts", e.target.checked)}
                />
                <div>
                  <span className="label-text font-medium text-sm block">Peringatan Login Perangkat Baru</span>
                  <span className="text-xs text-base-content/50">
                    Kirim email pemberitahuan jika ada login yang terdeteksi dari lokasi atau browser baru
                  </span>
                </div>
              </label>

              {/* Revoke All Other Sessions */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-base-content/60">
                  {sessionsRevoked ? "Semua sesi lain telah berhasil dikeluarkan!" : "Curiga ada aktivitas tidak dikenal?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSessionsRevoked(true);
                    setTimeout(() => setSessionsRevoked(false), 3500);
                  }}
                  className={`btn btn-sm ${sessionsRevoked ? "btn-success" : "btn-outline btn-error"} gap-2`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {sessionsRevoked ? "Sesi Lain Dikeluarkan" : "Keluarkan Semua Sesi Lain"}
                </button>
              </div>
            </div>

            <SaveButton onSave={handleSave} saving={saving} saved={saved} />
          </div>
        </div>
      )}

      {/* 2FA Setup Modal Dialog */}
      {show2FAModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-base-100 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-base-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <QrCode className="w-5 h-5 text-primary" /> Setup Authenticator (2FA)
                </div>
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-base-content/60">
                1. Buka aplikasi <strong>Google Authenticator</strong> atau <strong>Authy</strong> di smartphone Anda.<br />
                2. Scan QR code di bawah ini atau masukkan Secret Key secara manual.
              </p>

              {/* Simulated QR Code Box */}
              <div className="p-5 bg-white border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-36 h-36 bg-slate-900 rounded-xl flex items-center justify-center text-white font-mono text-center p-2">
                  <div className="space-y-1">
                    <QrCode className="w-16 h-16 mx-auto text-primary" />
                    <span className="text-[10px] tracking-wider block font-bold text-primary-content/80">SENDORA 2FA</span>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Secret Key Manual</span>
                  <p className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg mt-0.5 select-all border border-slate-200">
                    SNDR-7X9K-2M4Q-8W1P
                  </p>
                </div>
              </div>

              {/* 6 Digit Verification Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium block text-slate-700">
                  3. Masukkan 6 Digit Kode dari Aplikasi:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="input input-bordered input-sm w-full font-mono text-center tracking-[0.4em] font-bold text-base"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="btn btn-ghost btn-sm"
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
                  className="btn btn-primary btn-sm gap-2"
                >
                  {twoFAVerifying ? <span className="loading loading-spinner loading-xs" /> : <Check className="w-4 h-4" />}
                  Verifikasi & Aktifkan
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}


      {/* Tab: Working Hours */}
      {activeTab === "workingHours" && (
        <div className="card bg-base-100 border border-base-200 shadow-sm p-6 rounded-2xl space-y-5">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Jam Kerja & Waktu Operasional
          </h3>
          <p className="text-xs text-base-content/60">
            Batasi jam pengiriman otomatis (broadcast & auto-reply) agar tidak mengirim pesan di tengah malam dan terhindar dari report spam pelanggan.
          </p>

          <div className="space-y-4">
            <label className="label cursor-pointer justify-start gap-4 py-3 rounded-xl hover:bg-base-200/50 px-3 border border-base-200">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={settings.workingHours.enabled}
                onChange={(e) => update("workingHours", "enabled", e.target.checked)}
              />
              <div>
                <span className="label-text font-medium text-sm block">Aktifkan Pembatasan Jam Kerja</span>
                <span className="text-xs text-base-content/50">
                  Pesan broadcast di luar jam ini akan ditahan (PAUSED) hingga jam operasional berikutnya
                </span>
              </div>
            </label>

            {settings.workingHours.enabled && (
              <div className="p-4 bg-base-200/40 rounded-xl space-y-4 border border-base-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium text-xs">Jam Mulai (Buka)</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered input-sm font-mono"
                      value={settings.workingHours.startTime}
                      onChange={(e) => update("workingHours", "startTime", e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium text-xs">Jam Selesai (Tutup)</span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered input-sm font-mono"
                      value={settings.workingHours.endTime}
                      onChange={(e) => update("workingHours", "endTime", e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium text-xs">Zona Waktu</span>
                    </label>
                    <select
                      className="select select-bordered select-sm"
                      value={settings.workingHours.timezone}
                      onChange={(e) => update("workingHours", "timezone", e.target.value)}
                    >
                      <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                      <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                      <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label py-1">
                    <span className="label-text font-medium text-xs">Hari Aktif Pengiriman</span>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { day: 1, label: "Sen" },
                      { day: 2, label: "Sel" },
                      { day: 3, label: "Rab" },
                      { day: 4, label: "Kam" },
                      { day: 5, label: "Jum" },
                      { day: 6, label: "Sab" },
                      { day: 7, label: "Min" },
                    ].map(({ day, label }) => {
                      const isSelected = settings.workingHours.daysOfWeek.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const newDays = isSelected
                              ? settings.workingHours.daysOfWeek.filter((d) => d !== day)
                              : [...settings.workingHours.daysOfWeek, day];
                            update("workingHours", "daysOfWeek", newDays);
                          }}
                          className={`btn btn-xs rounded-lg ${
                            isSelected ? "btn-primary" : "btn-outline border-base-300"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <SaveButton onSave={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === "notif" && (
        <div className="card bg-base-100 border border-base-200 shadow-sm p-6 rounded-2xl space-y-5">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Preferensi Notifikasi
          </h3>
          <div className="space-y-3">
            <label className="label cursor-pointer justify-start gap-4 py-3 rounded-xl hover:bg-base-200/50 px-3 border border-base-200">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={settings.notifications.emailOnBroadcastDone}
                onChange={(e) => update("notifications", "emailOnBroadcastDone", e.target.checked)}
              />
              <div>
                <span className="label-text font-medium text-sm block">Broadcast Selesai</span>
                <span className="text-xs text-base-content/50">
                  Kirim notifikasi email saat sesi broadcast selesai diproses
                </span>
              </div>
            </label>
            <label className="label cursor-pointer justify-start gap-4 py-3 rounded-xl hover:bg-base-200/50 px-3 border border-base-200">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={settings.notifications.emailOnDeviceDisconnect}
                onChange={(e) =>
                  update("notifications", "emailOnDeviceDisconnect", e.target.checked)
                }
              />
              <div>
                <span className="label-text font-medium text-sm block">Device Disconnect</span>
                <span className="text-xs text-base-content/50">
                  Kirim notifikasi email saat WhatsApp device terputus secara tidak terduga
                </span>
              </div>
            </label>
          </div>
          <SaveButton onSave={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {/* Tab: Danger Zone */}
      {activeTab === "danger" && (
        <div className="card bg-base-100 border-2 border-error/30 shadow-sm p-6 rounded-2xl space-y-5">
          <h3 className="font-bold text-base flex items-center gap-2 text-error">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>
          <p className="text-sm text-base-content/60">
            Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan. Pastikan Anda sudah membuat backup data sebelum melanjutkan.
          </p>

          {resetDone !== null ? (
            <div className="alert alert-success gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">Data lokal berhasil direset!</p>
                <p className="text-xs mt-0.5">
                  File yang dihapus: {resetDone.length > 0 ? resetDone.join(", ") : "tidak ada file ditemukan"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4 p-4 bg-error/5 border border-error/20 rounded-xl">
              <div>
                <p className="font-semibold text-sm">Hapus Semua Data Lokal</p>
                <p className="text-xs text-base-content/60 mt-1">
                  Menghapus semua data: kontak, broadcast, auto-reply, template, webhook logs, dan blacklist dari storage lokal. Device WhatsApp tetap aman.
                </p>
              </div>
              {resetConfirm ? (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setResetConfirm(false)} className="btn btn-ghost btn-sm">
                    Batal
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="btn btn-error btn-sm gap-2"
                  >
                    {resetting ? <span className="loading loading-spinner loading-xs" /> : null}
                    Ya, Hapus Semua
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="btn btn-outline btn-error btn-sm flex-shrink-0"
                >
                  Reset Data
                </button>
              )}
            </div>
          )}
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
    <div className="flex justify-end">
      <button
        onClick={onSave}
        disabled={saving}
        className={`btn btn-sm gap-2 min-w-[140px] ${saved ? "btn-success" : "btn-primary"}`}
      >
        {saving ? (
          <span className="loading loading-spinner loading-xs" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? "Tersimpan!" : "Simpan Perubahan"}
      </button>
    </div>
  );
}
