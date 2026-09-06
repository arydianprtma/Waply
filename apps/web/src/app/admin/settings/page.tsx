"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Server,
  CreditCard,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Save,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Zap,
  Activity,
  Layers,
  Clock,
  Radio,
  Sliders,
  QrCode,
  Check,
} from "lucide-react";

interface AdminSystemSettings {
  systemProfile: {
    adminName: string;
    adminEmail: string;
    appName: string;
  };
  gatewayConfig: {
    gatewayUrl: string;
    minDelaySec: number;
    maxDelaySec: number;
    typingPresence: boolean;
    autoRotateEnabled: boolean;
    circuitBreakerThreshold: number;
  };
  paymentConfig: {
    provider: "midtrans";
    environment: "sandbox" | "production";
    merchantId: string;
    clientKey: string;
    serverKey: string;
    enabled: boolean;
  };
  smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password?: string;
    fromEmail: string;
    fromName: string;
    enabled: boolean;
  };
  maintenanceConfig: {
    enabled: boolean;
    message: string;
    allowAdminBypass: boolean;
  };
  dataRetentionDays: number;
  updatedAt?: string;
}

const DEFAULT_ADMIN_SETTINGS: AdminSystemSettings = {
  systemProfile: {
    adminName: "Super Administrator",
    adminEmail: "admin@sendora.id",
    appName: "Sendora WhatsApp Gateway",
  },
  gatewayConfig: {
    gatewayUrl: "http://localhost:3002",
    minDelaySec: 4,
    maxDelaySec: 8,
    typingPresence: true,
    autoRotateEnabled: true,
    circuitBreakerThreshold: 5,
  },
  paymentConfig: {
    provider: "midtrans",
    environment: "sandbox",
    merchantId: "",
    clientKey: "",
    serverKey: "",
    enabled: true,
  },
  smtpConfig: {
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    username: "apikey",
    password: "",
    fromEmail: "notifications@sendora.id",
    fromName: "Sendora WhatsApp Gateway",
    enabled: false,
  },
  maintenanceConfig: {
    enabled: false,
    message: "Sistem sedang dalam peningkatan performa server terjadwal. Silakan coba kembali beberapa saat lagi.",
    allowAdminBypass: true,
  },
  dataRetentionDays: 30,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSystemSettings>(DEFAULT_ADMIN_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"gateway" | "payment" | "smtp" | "security" | "maintenance">("gateway");

  // Gateway Ping Test State
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Admin Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Admin 2FA State
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [show2FAModal, setShow2FAModal] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
      }
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
      const res = await fetch("/api/admin/settings", {
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

  const testGatewayConnection = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ping_gateway",
          url: settings.gatewayConfig.gatewayUrl || "http://localhost:3002",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPingResult({ ok: true, message: json.message || "Gateway Engine Online & Beroperasi Normal" });
      } else {
        setPingResult({ ok: false, message: json.message || "Gateway Offline" });
      }
    } catch (err: any) {
      setPingResult({ ok: false, message: `Gagal menguji gateway: ${err.message}` });
    } finally {
      setPinging(false);
    }
  };

  const handleAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 8) {
      setPassError("Password baru akun Admin minimal harus 8 karakter");
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
        setPassSuccess("Password Super Admin berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPassError(json.error || "Gagal mengubah password Admin");
      }
    } catch (err: any) {
      setPassError(err.message || "Terjadi kesalahan sistem saat mengubah password");
    } finally {
      setPassLoading(false);
    }
  };

  const updateGateway = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      gatewayConfig: { ...prev.gatewayConfig, [field]: value },
    }));
  };

  const updatePayment = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      paymentConfig: { ...prev.paymentConfig, [field]: value },
    }));
  };

  const updateSmtp = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      smtpConfig: { ...prev.smtpConfig, [field]: value },
    }));
  };

  const updateMaintenance = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      maintenanceConfig: { ...prev.maintenanceConfig, [field]: value },
    }));
  };

  const tabs = [
    { key: "gateway", label: "Engine & Gateway", icon: Server },
    { key: "payment", label: "Midtrans Payment", icon: CreditCard },
    { key: "smtp", label: "SMTP & Email", icon: Mail },
    { key: "security", label: "Keamanan Admin", icon: ShieldCheck },
    { key: "maintenance", label: "Maintenance & Sistem", icon: AlertTriangle },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-md text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin Control Center
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan Sistem & Server
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
            Konfigurasi global infrastruktur WhatsApp Gateway, payment gateway Midtrans, server email SMTP, dan kebijakan keamanan server.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn btn-sm md:btn-md gap-2 rounded-xl font-bold shadow-md ${
              saved ? "btn-success text-white" : "btn-primary shadow-emerald-600/25"
            }`}
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Tersimpan!" : "Simpan Semua Pengaturan"}
          </button>
        </div>
      </div>

      {/* Maintenance Mode Alert Banner if active */}
      {settings.maintenanceConfig.enabled && (
        <div className="alert alert-warning text-xs font-semibold py-3 px-5 rounded-2xl border border-amber-300 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0" />
            <div>
              <span className="font-bold text-amber-950 block">PERINGATAN: MODE MAINTENANCE AKTIF!</span>
              <span className="text-amber-900 font-normal">{settings.maintenanceConfig.message}</span>
            </div>
          </div>
          <button
            onClick={() => {
              updateMaintenance("enabled", false);
              handleSave();
            }}
            className="btn btn-xs bg-amber-900 text-white hover:bg-amber-950 border-none rounded-lg font-bold"
          >
            Nonaktifkan
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl w-fit border border-slate-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`btn btn-sm gap-2 rounded-xl transition-all font-bold text-xs ${
                isActive
                  ? t.key === "maintenance"
                    ? "btn-warning text-amber-950 shadow-sm"
                    : "btn-primary shadow-sm shadow-emerald-600/20"
                  : "btn-ghost text-slate-700 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Engine & Gateway */}
      {activeTab === "gateway" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" /> Konfigurasi Engine WhatsApp Gateway
              </h3>
              <button
                type="button"
                onClick={testGatewayConnection}
                disabled={pinging}
                className="btn btn-outline btn-xs font-bold gap-1.5 rounded-xl border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
              >
                {pinging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                {pinging ? "Testing Ping..." : "Uji Koneksi Engine"}
              </button>
            </div>

            {pingResult && (
              <div
                className={`alert text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 ${
                  pingResult.ok ? "alert-success text-white" : "alert-error text-white"
                }`}
              >
                {pingResult.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{pingResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">Gateway Engine Base URL</span>
                  <span className="label-text-alt text-slate-400">Endpoint internal/eksternal gateway Baileys</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm font-mono text-xs font-semibold"
                  value={settings.gatewayConfig.gatewayUrl}
                  onChange={(e) => updateGateway("gatewayUrl", e.target.value)}
                  placeholder="http://localhost:3002"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">Default Min Delay Broadcast (Detik)</span>
                </label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  className="input input-bordered input-sm"
                  value={settings.gatewayConfig.minDelaySec}
                  onChange={(e) => updateGateway("minDelaySec", Number(e.target.value))}
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">Default Max Delay Broadcast (Detik)</span>
                </label>
                <input
                  type="number"
                  min={3}
                  max={120}
                  className="input input-bordered input-sm"
                  value={settings.gatewayConfig.maxDelaySec}
                  onChange={(e) => updateGateway("maxDelaySec", Number(e.target.value))}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-slate-700">Circuit Breaker Disconnect Threshold</span>
                  <span className="label-text-alt text-slate-400">Jumlah error beruntun sebelum engine auto-pause</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="input input-bordered input-sm"
                  value={settings.gatewayConfig.circuitBreakerThreshold}
                  onChange={(e) => updateGateway("circuitBreakerThreshold", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="label cursor-pointer justify-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={settings.gatewayConfig.typingPresence}
                  onChange={(e) => updateGateway("typingPresence", e.target.checked)}
                />
                <div>
                  <span className="label-text font-bold text-xs text-slate-900 block">
                    Global Human Typing Simulation
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Otomatis mensimulasikan status "composing..." sebelum pesan dikirim untuk semua pengguna
                  </span>
                </div>
              </label>

              <label className="label cursor-pointer justify-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={settings.gatewayConfig.autoRotateEnabled}
                  onChange={(e) => updateGateway("autoRotateEnabled", e.target.checked)}
                />
                <div>
                  <span className="label-text font-bold text-xs text-slate-900 block">
                    Multi-Device Auto-Rotate Engine
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Izinkan pengguna mendistribusikan blast secara round-robin ke semua device aktif mereka
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Midtrans Payment Gateway */}
      {activeTab === "payment" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Konfigurasi Payment Gateway Midtrans
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                settings.paymentConfig.environment === "production"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              Mode: {settings.paymentConfig.environment}
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Kredensial Midtrans digunakan untuk memproses pembayaran upgrade paket pengguna secara instan via QRIS, Virtual Account, dan Kartu Kredit.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Environment Mode</span>
              </label>
              <select
                className="select select-bordered select-sm font-semibold"
                value={settings.paymentConfig.environment}
                onChange={(e) => updatePayment("environment", e.target.value)}
              >
                <option value="sandbox">Sandbox (Testing / Uji Coba)</option>
                <option value="production">Production (Live Transaksi Nyata)</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Midtrans Merchant ID</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm font-mono text-xs"
                placeholder="G123456789"
                value={settings.paymentConfig.merchantId}
                onChange={(e) => updatePayment("merchantId", e.target.value)}
              />
            </div>

            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Midtrans Client Key (Public)</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm font-mono text-xs"
                placeholder="SB-Mid-client-XXXXX"
                value={settings.paymentConfig.clientKey}
                onChange={(e) => updatePayment("clientKey", e.target.value)}
              />
            </div>

            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Midtrans Server Key (Secret)</span>
                <span className="label-text-alt text-slate-400">Tersimpan dengan proteksi server-side</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm font-mono text-xs"
                placeholder="SB-Mid-server-XXXXX"
                value={settings.paymentConfig.serverKey}
                onChange={(e) => updatePayment("serverKey", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SMTP & Email */}
      {activeTab === "smtp" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600" /> Konfigurasi Server SMTP / Email Pengirim
            </h3>
            <label className="label cursor-pointer gap-2 p-0">
              <span className="label-text text-xs font-bold text-slate-700">Aktifkan Email</span>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={settings.smtpConfig.enabled}
                onChange={(e) => updateSmtp("enabled", e.target.checked)}
              />
            </label>
          </div>

          <p className="text-xs text-slate-600">
            Digunakan untuk mengirimkan email OTP verifikasi pendaftaran, notifikasi sistem offline, dan struk pembayaran.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">SMTP Host</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm font-mono text-xs"
                placeholder="smtp.mailgun.org / smtp.sendgrid.net"
                value={settings.smtpConfig.host}
                onChange={(e) => updateSmtp("host", e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">SMTP Port</span>
              </label>
              <input
                type="number"
                className="input input-bordered input-sm font-mono text-xs"
                placeholder="587 / 465"
                value={settings.smtpConfig.port}
                onChange={(e) => updateSmtp("port", Number(e.target.value))}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">SMTP Username</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="apikey / username"
                value={settings.smtpConfig.username}
                onChange={(e) => updateSmtp("username", e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">SMTP Password / API Key</span>
              </label>
              <input
                type="password"
                className="input input-bordered input-sm"
                placeholder="••••••••"
                value={settings.smtpConfig.password || ""}
                onChange={(e) => updateSmtp("password", e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Sender From Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered input-sm"
                placeholder="no-reply@sendora.id"
                value={settings.smtpConfig.fromEmail}
                onChange={(e) => updateSmtp("fromEmail", e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Sender Display Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Sendora Notification"
                value={settings.smtpConfig.fromName}
                onChange={(e) => updateSmtp("fromName", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Keamanan Super Admin */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" /> Ganti Password Super Admin
            </h3>
            <p className="text-xs text-slate-600">
              Sebagai Super Administrator, disarankan menggunakan password minimal 8-12 karakter dengan kombinasi angka dan simbol unik.
            </p>

            {passSuccess && (
              <div className="alert alert-success text-xs py-3 rounded-xl flex items-center gap-2 text-white">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="alert alert-error text-xs py-3 rounded-xl flex items-center gap-2 text-white">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleAdminPasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-700">Password Saat Ini (Opsional)</span>
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
                    <span className="label-text font-bold text-xs text-slate-700">Password Baru Super Admin</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      className="input input-bordered input-sm w-full pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn btn-ghost btn-xs absolute right-1.5 top-1 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-slate-700">Ulangi Password Baru</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Konfirmasi password baru"
                    className="input input-bordered input-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passLoading || !newPassword || !confirmPassword}
                  className="btn btn-primary btn-sm gap-2 font-bold"
                >
                  {passLoading ? <span className="loading loading-spinner loading-xs" /> : <Lock className="w-4 h-4" />}
                  Perbarui Password Admin
                </button>
              </div>
            </form>
          </div>

          {/* Admin 2FA */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> Admin Two-Factor Authentication (2FA)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proteksi tingkat tinggi untuk seluruh login ke Admin Control Panel.
                </p>
              </div>
              <span className="badge badge-success badge-sm text-white font-bold">Wajib Aktif</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Maintenance & System Tools */}
      {activeTab === "maintenance" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-amber-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Mode Pemeliharaan & Kontrol Sistem
            </h3>
            <label className="label cursor-pointer gap-2 p-0">
              <span className="label-text text-xs font-bold text-slate-800">Aktifkan Maintenance Mode</span>
              <input
                type="checkbox"
                className="toggle toggle-warning toggle-sm"
                checked={settings.maintenanceConfig.enabled}
                onChange={(e) => updateMaintenance("enabled", e.target.checked)}
              />
            </label>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Saat Mode Maintenance aktif, seluruh akses dashboard pengguna reguler akan dialihkan ke layar pemeliharaan sistem dengan pesan yang dapat Anda sesuaikan di bawah ini. Administrator tetap dapat masuk.
          </p>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Pesan Pemeliharaan ke Pengguna</span>
              </label>
              <textarea
                className="textarea textarea-bordered text-xs font-medium h-24"
                value={settings.maintenanceConfig.message}
                onChange={(e) => updateMaintenance("message", e.target.value)}
                placeholder="Pesan status pemeliharaan sistem..."
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Retensi Log Sistem & Riwayat Pesan (Hari)</span>
                <span className="label-text-alt text-slate-400">Log lama otomatis dipangkas untuk efisiensi database</span>
              </label>
              <input
                type="number"
                min={7}
                max={365}
                className="input input-bordered input-sm font-semibold"
                value={settings.dataRetentionDays}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, dataRetentionDays: Number(e.target.value) }))
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
