"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(
          json.message ||
            "Tautan reset password telah berhasil dikirim ke email Anda via SMTP resmi Sendora."
        );
      } else {
        setErrorMsg(json.error || "Gagal memproses permintaan reset password.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi gangguan jaringan saat mengirim email reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Lupa Password?</h1>
        <p className="text-sm text-base-content/60 mt-1">
          Masukkan email akun Anda untuk menerima tautan pemulihan kata sandi
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

      <form onSubmit={handleReset} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Email Terdaftar</span>
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

        <button
          type="submit"
          className="btn btn-primary btn-block mt-6 shadow-md shadow-primary/25"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            "Kirim Tautan Reset"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-base-content/70 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke halaman masuk
        </Link>
      </div>
    </div>
  );
}
