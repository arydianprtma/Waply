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
  Sparkles,
  Building2,
} from "lucide-react";
import {
  AVAILABLE_PAYMENT_CHANNELS,
  DEFAULT_ENABLED_PAYMENT_CHANNELS,
} from "@/lib/payment-channels";

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
  watermarkConfig?: {
    enabled: boolean;
    text: string;
    applyToFreeOnly: boolean;
  };
  paymentConfig: {
    provider: "midtrans";
    environment: "sandbox" | "production";
    merchantId: string;
    clientKey: string;
    serverKey: string;
    enabled: boolean;
    enabledChannels?: string[];
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
    adminEmail: "admin@waply.id",
    appName: "Waply WhatsApp Gateway",
  },
  gatewayConfig: {
    gatewayUrl: "http://localhost:3002",
    minDelaySec: 4,
    maxDelaySec: 8,
    typingPresence: true,
    autoRotateEnabled: true,
    circuitBreakerThreshold: 5,
  },
  watermarkConfig: {
    enabled: true,
    text: "\n\n—\n*Waply.com*",
    applyToFreeOnly: true,
  },
  paymentConfig: {
    provider: "midtrans",
    environment: "sandbox",
    merchantId: "",
    clientKey: "",
    serverKey: "",
    enabled: true,
    enabledChannels: DEFAULT_ENABLED_PAYMENT_CHANNELS,
  },
  smtpConfig: {
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    username: "apikey",
    password: "",
    fromEmail: "notifications@waply.id",
    fromName: "Waply WhatsApp Gateway",
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
  const [activeTab, setActiveTab] = useState<"gateway" | "watermark" | "payment" | "smtp" | "security" | "maintenance">("gateway");

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

  const updateWatermark = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      watermarkConfig: {
        ...(prev.watermarkConfig || {
          enabled: true,
          text: "\n\n—\n*Waply.com*",
          applyToFreeOnly: true,
        }),
        [field]: value,
      },
    }));
  };

  const tabs = [
    { key: "gateway", label: "Engine & Gateway", icon: Server },
    { key: "watermark", label: "Watermark Free Plan", icon: Sparkles },
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
                  <span className="label-text-alt text-slate-400">Endpoint internal/eksternal Waply Gateway Service</span>
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

      {/* TAB: Watermark Free Plan */}
      {activeTab === "watermark" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Branding & Watermark Pesan (Paket Free / Trial)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap pesan keluar dari akun pengguna paket Gratis akan disematkan footer branding secara otomatis. Paket berbayar (Pro/Business) 100% white-label tanpa watermark.
              </p>
            </div>
            <span
              className={`badge badge-sm font-bold ${
                settings.watermarkConfig?.enabled ? "badge-success text-white" : "badge-ghost text-slate-400"
              }`}
            >
              {settings.watermarkConfig?.enabled ? "Aktif" : "Nonaktif"}
            </span>
          </div>

          <div className="space-y-4">
            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={settings.watermarkConfig?.enabled ?? true}
                onChange={(e) => updateWatermark("enabled", e.target.checked)}
              />
              <div>
                <span className="label-text font-bold text-xs text-slate-900 block">
                  Aktifkan Watermark Otomatis
                </span>
                <span className="text-[11px] text-slate-500">
                  Otomatis sisipkan footer watermark ke pesan keluar yang dikirimkan oleh pengguna Free plan (REST API, Single Send, dan Broadcast).
                </span>
              </div>
            </label>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Format / Teks Watermark</span>
                <span className="label-text-alt text-slate-400">Mendukung format Markdown WhatsApp (&gt; quote, `inline code`, *bold*, _italic_)</span>
              </label>
              <textarea
                rows={3}
                className="textarea textarea-bordered font-mono text-xs leading-relaxed"
                value={settings.watermarkConfig?.text ?? "\n\n> `Waply.com`"}
                onChange={(e) => updateWatermark("text", e.target.value)}
                placeholder="\n\n> `Waply.com`"
              />
            </div>

            {/* Live WhatsApp Message Preview */}
            <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  Simulasi Pesan Masuk di WhatsApp Penerima (Contoh: Sistem Absensi):
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Paket Free Client</span>
              </div>

              <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-800/80 max-w-md ml-auto text-xs text-slate-200 font-sans shadow-lg space-y-2">
                <div className="whitespace-pre-wrap leading-relaxed font-medium">
                  {`Nama : Ahmad Fauzi\nKelas : XII RPL 1\nAbsensi : Hadir\nJam : 07:15 WIB`}
                  <span className="text-emerald-400 font-mono font-bold block mt-2 border-l-2 border-emerald-500 pl-2">
                    {settings.watermarkConfig?.enabled
                      ? (settings.watermarkConfig?.text?.replace(/^[\n\r]+>\s*/, "") || "`Waply.com`")
                      : ""}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 text-right">07:15 ✓✓</div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Keterangan: Jika klien meng-upgrade akun ke <strong>Paket Pro</strong>, teks <span className="text-emerald-400">"{settings.watermarkConfig?.text?.trim() || "> `Waply.com`"}"</span> di atas akan otomatis hilang 100%.
              </p>
            </div>

            {/* Direct Save Button for Watermark Tab */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`btn btn-sm gap-2 rounded-xl font-bold shadow-md ${
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
                {saved ? "Perubahan Disimpan!" : "Simpan Pengaturan Watermark"}
              </button>
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

            {/* Saluran Pembayaran Aktif */}
            <div className="md:col-span-2 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600" /> Saluran Pembayaran Aktif di Halaman Order
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih metode pembayaran apa saja yang aktif dan dapat dipilih oleh pelanggan saat checkout.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings((prev) => ({
                        ...prev,
                        paymentConfig: {
                          ...prev.paymentConfig,
                          enabledChannels: AVAILABLE_PAYMENT_CHANNELS.map((c) => c.id),
                        },
                      }));
                    }}
                    className="btn btn-ghost btn-xs text-emerald-700 hover:bg-emerald-50 font-bold"
                  >
                    Aktifkan Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings((prev) => ({
                        ...prev,
                        paymentConfig: {
                          ...prev.paymentConfig,
                          enabledChannels: DEFAULT_ENABLED_PAYMENT_CHANNELS,
                        },
                      }));
                    }}
                    className="btn btn-ghost btn-xs text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Reset Default
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_PAYMENT_CHANNELS.map((channel) => {
                  const currentChannels =
                    settings.paymentConfig.enabledChannels && Array.isArray(settings.paymentConfig.enabledChannels)
                      ? settings.paymentConfig.enabledChannels
                      : DEFAULT_ENABLED_PAYMENT_CHANNELS;
                  const isEnabled = currentChannels.includes(channel.id);

                  return (
                    <div
                      key={channel.id}
                      onClick={() => {
                        setSettings((prev) => {
                          const current =
                            prev.paymentConfig.enabledChannels && Array.isArray(prev.paymentConfig.enabledChannels)
                              ? prev.paymentConfig.enabledChannels
                              : DEFAULT_ENABLED_PAYMENT_CHANNELS;
                          const exists = current.includes(channel.id);
                          const next = exists
                            ? current.filter((id) => id !== channel.id)
                            : [...current, channel.id];
                          return {
                            ...prev,
                            paymentConfig: {
                              ...prev.paymentConfig,
                              enabledChannels: next,
                            },
                          };
                        });
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 select-none ${
                        isEnabled
                          ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/20 shadow-xs"
                          : "bg-slate-50/50 border-slate-200 opacity-60 hover:opacity-80"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{channel.name}</span>
                          {channel.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                              {channel.badge}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                            {channel.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{channel.description}</p>
                      </div>

                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm mt-0.5 shrink-0 pointer-events-none"
                        checked={isEnabled}
                        readOnly
                      />
                    </div>
                  );
                })}
              </div>
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
                placeholder="no-reply@waply.id"
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
                placeholder="Waply Notification"
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
