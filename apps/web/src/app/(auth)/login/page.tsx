"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const authError = searchParams.get("error");
  const isVerified = searchParams.get("verified") === "true";

  const performLoginSync = async (userEmail: string, userName?: string, userId?: string) => {
    try {
      const cleanEmail = userEmail.trim().toLowerCase();

      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, name: userName, id: userId }),
      });
      const json = await res.json();
      if (json.success) {
        const maxAge = 60 * 60 * 24 * 7;
        document.cookie = `waply_demo_auth=true; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `waply_user_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        if (json.user?.name) {
          document.cookie = `waply_user_name=${encodeURIComponent(json.user.name)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
        if (json.user?.role) {
          document.cookie = `waply_user_role=${json.user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
        if (json.user?.id) {
          document.cookie = `waply_user_id=${json.user.id}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }

        const userRole = json.user?.role || "user";
        let target = json.redirectTo || (userRole === "admin" ? "/admin" : "/dashboard");
        if (userRole === "user" && target.startsWith("/admin")) {
          target = "/dashboard";
        }
        window.location.href = target;
      } else {
        setErrorMsg(json.error || "Gagal melakukan login");
        setLoading(false);
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat login");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Silakan masukkan email Anda.");
      setLoading(false);
      return;
    }

    if (!password) {
      setErrorMsg("Silakan masukkan password akun Anda.");
      setLoading(false);
      return;
    }

    // If Supabase is active, strictly enforce Supabase password verification & email confirmation
    if (isSupabaseConfigured() && cleanEmail !== "admin@waply.id") {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          const lower = (error.message || "").toLowerCase();
          if (lower.includes("email not confirmed")) {
            setErrorMsg("Akun Anda belum diverifikasi. Silakan periksa inbox email Anda dan klik tautan 'Confirm email address' sebelum login.");
          } else if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
            setErrorMsg("Email atau password yang Anda masukkan salah. Silakan periksa kembali.");
          } else {
            setErrorMsg(error.message || "Gagal masuk. Periksa kembali email dan password Anda.");
          }
          setLoading(false);
          return;
        }

        if (data?.user) {
          const uName = data.user.user_metadata?.name || data.user.user_metadata?.full_name || cleanEmail.split("@")[0];
          await performLoginSync(cleanEmail, uName, data.user.id);
          return;
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Terjadi kesalahan saat memverifikasi akun.");
        setLoading(false);
        return;
      }
    }

    // For Super Admin master account or offline dev mode
    await performLoginSync(cleanEmail);
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Masuk ke Waply</h1>
        <p className="text-sm text-base-content/60 mt-1">
          Akses dashboard dan kelola gateway WhatsApp Anda
        </p>
      </div>

      {isVerified && (
        <div className="alert alert-success text-xs py-2.5 mb-4 text-white font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Email Anda telah berhasil dikonfirmasi! Silakan masuk ke akun Anda.</span>
        </div>
      )}

      {authError === "auth_callback_failed" && (
        <div className="alert alert-warning text-xs py-2.5 mb-4 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Tautan konfirmasi email tidak valid atau sudah pernah digunakan. Silakan masuk langsung dengan akun Anda.</span>
        </div>
      )}

      {authError === "account_deleted" && (
        <div className="alert alert-error text-xs py-2.5 mb-4 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Akun Anda telah dihapus oleh Administrator. Seluruh sesi dan cache telah dibersihkan.</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-error text-xs py-2.5 mb-4 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text font-medium text-xs">Email Bisnis / Admin</span>
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="nama@email.com"
              className="input input-bordered w-full pl-10 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Mail className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
          </div>
        </div>

        <div className="form-control">
          <label className="label py-1">
            <span className="label-text font-medium text-xs">Password</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="input input-bordered w-full pl-10 pr-10 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-base-content/40 hover:text-base-content transition-colors p-0.5 focus:outline-none"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-500" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="label cursor-pointer justify-start gap-2 p-0 select-none">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-xs rounded"
              defaultChecked
            />
            <span className="label-text text-xs text-slate-600 font-medium">Ingat saya</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline font-semibold"
          >
            Lupa password?
          </Link>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block mt-3 shadow-md shadow-primary/25"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              Masuk Sekarang
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="divider text-xs text-base-content/40 my-5">ATAU</div>

      <div className="text-center text-sm">
        Belum punya akun?{" "}
        <Link href="/register" className="font-bold text-primary hover:underline">
          Daftar Gratis
        </Link>
      </div>

      <p className="text-[11px] text-center text-slate-400 mt-4 leading-relaxed">
        Dengan masuk, Anda menyetujui{" "}
        <Link href="/terms" className="text-slate-600 font-semibold hover:underline" target="_blank">
          Syarat & Ketentuan
        </Link>{" "}
        dan{" "}
        <Link href="/privacy" className="text-slate-600 font-semibold hover:underline" target="_blank">
          Kebijakan Privasi
        </Link>{" "}
        Waply.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
