"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, Search } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    // Silently report the 404 hit to the admin URL tracker
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath && currentPath !== "/") {
        fetch("/api/admin/url-scans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: currentPath,
            method: "GET",
            statusCode: 404,
          }),
        }).catch(() => {});
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="badge badge-error badge-outline font-mono text-xs font-bold px-3 py-1">
            HTTP 404 NOT FOUND
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-base-content/60 leading-relaxed max-w-sm mx-auto">
            Halaman atau endpoint yang Anda tuju tidak tersedia atau telah dipindahkan.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="btn btn-primary btn-sm rounded-xl px-5 gap-2 w-full sm:w-auto"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/docs"
            className="btn btn-outline btn-sm rounded-xl px-5 gap-2 w-full sm:w-auto"
          >
            <Search className="w-4 h-4" />
            Buka Dokumentasi API
          </Link>
        </div>
      </div>
    </div>
  );
}
