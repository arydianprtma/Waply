"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Lock, Mail, User, Loader2, AlertCircle, CheckCircle, Info, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Send verification email directly via Waply SMTP (Resend @waply.web.id)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error || "Gagal melakukan pendaftaran akun.");
        setLoading(false);
        return;
      }

      // Also register in Supabase Auth in background if configured
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          });
        } catch {
          // ignore background sync
        }
      }

      setSuccessMsg(
        "Pendaftaran berhasil! Tautan verifikasi email resmi telah dikirimkan ke kotak masuk Anda. Silakan klik tautan verifikasi untuk mengaktifkan akun."
      );
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses pendaftaran.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Buat Akun Waply</h1>
        <p className="text-sm text-base-content/60 mt-1">
          Dapatkan free trial 1.500 pesan WhatsApp & 1 WhatsApp Device
        </p>
      </div>


      {errorMsg && (
        <div className="alert alert-error text-sm py-2 mb-4">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success text-sm py-2 mb-4 text-white">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Nama Lengkap / Bisnis</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="John Doe"
              className="input input-bordered w-full pl-10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <User className="w-5 h-5 absolute left-3 top-3.5 text-base-content/40" />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Email</span>
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="nama@email.com"
              className="input input-bordered w-full pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Mail className="w-5 h-5 absolute left-3 top-3.5 text-base-content/40" />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Password</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 6 karakter"
              minLength={6}
              className="input input-bordered w-full pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock className="w-5 h-5 absolute left-3 top-3.5 text-base-content/40" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-base-content/40 hover:text-base-content transition-colors p-0.5 focus:outline-none"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-slate-500" />
              ) : (
                <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              )}
            </button>
          </div>
        </div>
        <div className="form-control pt-1">
          <label className="label cursor-pointer justify-start gap-2.5 items-start p-0 select-none">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm mt-0.5 rounded-md"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            <span className="label-text text-xs text-slate-600 leading-relaxed">
              Saya telah membaca dan menyetujui{" "}
              <Link href="/terms" className="text-primary font-bold hover:underline" target="_blank">
                Syarat & Ketentuan (ToS)
              </Link>{" "}
              serta{" "}
              <Link href="/privacy" className="text-primary font-bold hover:underline" target="_blank">
                Kebijakan Privasi
              </Link>{" "}
              Waply.
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block mt-4 shadow-md shadow-primary/25"
          disabled={loading || !agreeTerms}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mendaftarkan...
            </>
          ) : (
            "Daftar Sekarang"
          )}
        </button>
      </form>

      <div className="divider text-xs text-base-content/40 my-6">ATAU</div>

      <div className="text-center text-sm">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Masuk
        </Link>
      </div>
    </div>
  );
}
