"use client";

import { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  QrCode,
  Check,
  CheckCircle,
  AlertCircle,
  Laptop,
  Mail,
  Bell,
  Save,
  CheckCircle2,
  Copy,
  LogOut,
  UserCog,
  Sparkles,
} from "lucide-react";
import { useUserSession } from "@/lib/use-user-session";
import { ModalPortal } from "@/components/ui/ModalPortal";

export default function AdminAccountPage() {
  const { user: currentUser } = useUserSession();

  const [name, setName] = useState("Super Administrator");
  const [email, setEmail] = useState("admin@sendora.id");
  const [adminId, setAdminId] = useState("admin-master-sendora-01");
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile");

  // Save feedback
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // 2FA State
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAVerifying, setTwoFAVerifying] = useState(false);

  // Admin Notification Prefs
  const [notifGatewayError, setNotifGatewayError] = useState(true);
  const [notifNewPayment, setNotifNewPayment] = useState(true);
  const [notifHighLoad, setNotifHighLoad] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.id) setAdminId(currentUser.id);
    }
  }, [currentUser]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemProfile: {
            adminName: name,
            adminEmail: email,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
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
        setPassSuccess("Password akun Admin berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPassError(json.error || "Gagal mengubah password");
      }
    } catch (err: any) {
      setPassError(err.message || "Terjadi kesalahan sistem saat mengubah password");
    } finally {
      setPassLoading(false);
    }
  };

  const tabs = [
    { key: "profile", label: "Profil Admin", icon: UserCog },
    { key: "security", label: "Keamanan & Password", icon: ShieldCheck },
    { key: "notifications", label: "Notifikasi Admin", icon: Bell },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Administrator Account
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan Akun Admin
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
            Kelola profil administrator, kredensial login Super Admin, ganti password, dan keamanan 2FA.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSaveProfile}
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
            {saved ? "Tersimpan!" : "Simpan Profil"}
          </button>
        </div>
      </div>

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
                  ? "btn-primary shadow-sm shadow-emerald-600/20"
                  : "btn-ghost text-slate-700 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Profil Admin */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <UserCog className="w-4 h-4 text-emerald-600" /> Informasi Akun Administrator
            </h3>
            <span className="badge badge-success badge-sm text-white font-bold">
              SUPER ADMIN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Admin ID */}
            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">ID Administrator</span>
                <span className="label-text-alt text-slate-400">ID unik otoritas sistem</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="input input-bordered input-sm w-full font-mono bg-slate-50 pr-12 text-xs font-bold text-slate-800"
                  value={adminId}
                  disabled
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(adminId);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="btn btn-ghost btn-xs btn-square absolute right-1.5 top-1 text-slate-500 hover:text-emerald-700"
                  title="Salin Admin ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Nama Tampilan Admin</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm font-semibold text-slate-800"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Email Utama Admin</span>
              </label>
              <input
                type="email"
                className="input input-bordered input-sm font-semibold text-slate-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-slate-700">Hak Akses & Role</span>
              </label>
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 font-medium flex items-center justify-between">
                <div>
                  <span className="font-bold block">Super Administrator (Full System Access)</span>
                  <span className="text-[11px] text-emerald-800">
                    Memiliki wewenang penuh mengelola User, Devices, Gateway Engine, Billing, dan System Settings.
                  </span>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Keamanan & Password */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" /> Ganti Password Super Admin
            </h3>
            <p className="text-xs text-slate-600">
              Gunakan kombinasi minimal 8 karakter dengan angka dan simbol untuk menjaga keamanan akses kontrol sistem.
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

            <form onSubmit={handlePasswordChange} className="space-y-4">
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
                    <span className="label-text font-bold text-xs text-slate-700">Konfirmasi Password Baru</span>
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

          {/* 2FA Section */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> Autentikasi Dua Langkah (2FA TOTP)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wajibkan kode 6-digit dari aplikasi Google Authenticator / Authy saat login ke akun Admin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShow2FAModal(true)}
                className="btn btn-outline btn-xs font-bold rounded-xl gap-1.5 border-slate-300"
              >
                <QrCode className="w-3.5 h-3.5" /> Setup 2FA
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-600" /> Sesi Login Aktif
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Sesi Admin Ini (Windows / Web Browser)</span>
                  <span className="text-slate-500 text-[11px]">IP: 127.0.0.1 • Status: Aktif & Terverifikasi</span>
                </div>
              </div>
              <span className="badge badge-success badge-xs font-bold text-[9px] text-white">Online</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Notifikasi Admin */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" /> Notifikasi Email untuk Administrator
          </h3>
          <p className="text-xs text-slate-600">
            Pilih event sistem penting yang perlu langsung dikirimkan ke email Super Admin (<strong>{email}</strong>).
          </p>

          <div className="space-y-3">
            <label className="label cursor-pointer justify-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={notifGatewayError}
                onChange={(e) => setNotifGatewayError(e.target.checked)}
              />
              <div>
                <span className="label-text font-bold text-xs text-slate-900 block">
                  Peringatan Gateway Engine Error / Disconnect
                </span>
                <span className="text-[11px] text-slate-500">
                  Kirim email jika terdeteksi kegagalan koneksi engine WhatsApp Baileys
                </span>
              </div>
            </label>

            <label className="label cursor-pointer justify-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={notifNewPayment}
                onChange={(e) => setNotifNewPayment(e.target.checked)}
              />
              <div>
                <span className="label-text font-bold text-xs text-slate-900 block">
                  Notifikasi Pembayaran & Upgrade Paket Baru
                </span>
                <span className="text-[11px] text-slate-500">
                  Kirim email saat ada pengguna yang berhasil menyelesaikan pembayaran via Midtrans
                </span>
              </div>
            </label>

            <label className="label cursor-pointer justify-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={notifHighLoad}
                onChange={(e) => setNotifHighLoad(e.target.checked)}
              />
              <div>
                <span className="label-text font-bold text-xs text-slate-900 block">
                  Peringatan Beban Server Tinggi (High Traffic)
                </span>
                <span className="text-[11px] text-slate-500">
                  Kirim email peringatan saat lonjakan antrean broadcast melebihi kapasitas normal
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <QrCode className="w-5 h-5 text-emerald-600" /> Setup Admin Authenticator (2FA)
                </div>
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="btn btn-ghost btn-circle btn-xs text-slate-400"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600">
                1. Buka aplikasi <strong>Google Authenticator</strong> atau <strong>Authy</strong> di smartphone Anda.<br />
                2. Scan QR code di bawah ini atau masukkan Secret Key secara manual.
              </p>

              <div className="p-4 bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 text-white">
                <QrCode className="w-20 h-20 text-emerald-400" />
                <span className="text-[10px] tracking-widest text-emerald-300 font-bold uppercase">SENDORA SUPER ADMIN 2FA</span>
                <p className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-lg select-all border border-slate-700 mt-1">
                  SNDR-ADM8-99K2-X1P7
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
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
                  className="btn btn-ghost btn-sm font-bold"
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
                    }, 800);
                  }}
                  className="btn btn-primary btn-sm gap-2 font-bold"
                >
                  {twoFAVerifying ? <span className="loading loading-spinner loading-xs" /> : <Check className="w-4 h-4" />}
                  Verifikasi & Simpan 2FA
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
