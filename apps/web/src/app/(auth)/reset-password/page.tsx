"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [emailParam]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!token) {
      setErrorMsg("Token reset password tidak ditemukan di URL. Silakan klik kembali tautan dari email Anda.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password baru minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token,
          password,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message || "Password berhasil diubah! Mengalihkan...");
        setTimeout(() => {
          window.location.href = json.redirectTo || "/dashboard";
        }, 1200);
      } else {
        setErrorMsg(json.error || "Gagal mengubah password.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi saat mereset password.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200/80 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Buat Password Baru</h1>
        <p className="text-xs text-slate-500 mt-1">
          Masukkan kata sandi baru untuk mengamankan akun Sendora Anda
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-error text-xs py-2.5 mb-4 rounded-2xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success text-xs py-2.5 mb-4 text-white rounded-2xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        {/* Email Akun */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text font-bold text-xs text-slate-700">Akun Email</span>
          </label>
          <input
            type="email"
            value={email}
            disabled={Boolean(emailParam)}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered input-sm w-full text-xs font-mono bg-slate-50 disabled:opacity-75 rounded-xl"
            required
          />
        </div>

        {/* Password Baru */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text font-bold text-xs text-slate-700">Password Baru</span>
            <span className="text-[10px] text-slate-400">Min. 6 karakter</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered input-sm w-full pl-9 pr-9 text-xs rounded-xl"
              required
            />
            <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Konfirmasi Password */}
        <div className="form-control">
          <label className="label py-1 justify-between">
            <span className="label-text font-bold text-xs text-slate-700">Konfirmasi Password</span>
            {password && confirmPassword && (
              <span className={`text-[10px] font-bold ${password === confirmPassword ? "text-emerald-600" : "text-rose-500"}`}>
                {password === confirmPassword ? "Cocok" : "Tidak cocok"}
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`input input-bordered input-sm w-full pl-9 pr-9 text-xs rounded-xl ${
                confirmPassword && password !== confirmPassword ? "border-rose-400 focus:border-rose-500" : ""
              }`}
              required
            />
            <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block mt-5 shadow-md shadow-primary/25 rounded-xl text-xs font-bold"
          disabled={loading || Boolean(successMsg)}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan Password...
            </>
          ) : (
            <>
              Simpan & Masuk ke Dashboard
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Halaman Masuk
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
