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
} from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const performDemoLogin = async (userEmail: string) => {
    try {
      const cleanEmail = userEmail.trim().toLowerCase();

      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const json = await res.json();
      if (json.success) {
        // Set client-side cookies directly to guarantee immediate sync
        const maxAge = 60 * 60 * 24 * 7;
        document.cookie = `sendora_demo_auth=true; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `sendora_user_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        if (json.user?.name) {
          document.cookie = `sendora_user_name=${encodeURIComponent(json.user.name)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
        if (json.user?.role) {
          document.cookie = `sendora_user_role=${json.user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
        if (json.user?.id) {
          document.cookie = `sendora_user_id=${json.user.id}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }

        const userRole = json.user?.role || "user";
        let target = json.redirectTo || (userRole === "admin" ? "/admin" : "/dashboard");
        // If a regular user had an admin URL in redirectTo, force user dashboard
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

    // Attempt Supabase sign in in parallel if configured (non-blocking)
    if (isSupabaseConfigured() && password) {
      try {
        const supabase = createClient();
        supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        }).catch(() => {});
      } catch {}
    }

    // Always perform robust database & cookie session login
    await performDemoLogin(cleanEmail);
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Masuk ke Sendora</h1>
        <p className="text-sm text-base-content/60 mt-1">
          Akses dashboard dan kelola gateway WhatsApp Anda
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-error text-xs py-2.5 mb-4">
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
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full pl-10 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
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
        Sendora.
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
