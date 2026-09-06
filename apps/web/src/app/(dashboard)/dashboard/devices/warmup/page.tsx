"use client";

import { Flame, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";

export default function WarmupHealthPage() {
  return (
    <PlanFeatureGuard
      feature="warmupHealth"
      featureName="Warmup & Health Anti-Ban"
      minPlanName="Business"
      description="Fitur Warmup & Health Anti-Ban memanaskan nomor WhatsApp baru secara bertahap dan memonitor reputasi kesehatan perangkat untuk mencegah pemblokiran sepihak dari Meta."
    >
      <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Warmup & Device Health</h1>
        <p className="text-sm text-base-content/60 mt-1">
          Pantau proses pemanasan nomor baru dan reputasi akun WhatsApp Anda untuk mencegah pemblokiran Meta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="card bg-base-100 border-2 border-primary shadow-sm p-6 rounded-2xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25 self-start mb-3">
            Stage 1 (Hari 1-3)
          </span>
          <h3 className="font-bold text-lg text-primary">Cold Number</h3>
          <p className="text-xs text-base-content/60 mt-1">Maks. 30 pesan / hari</p>
          <div className="mt-5 text-xs font-semibold text-emerald-600 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sedang Aktif
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 p-6 rounded-2xl opacity-60">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-base-200 text-base-content/60 border border-base-300 self-start mb-3">
            Stage 2 (Hari 4-7)
          </span>
          <h3 className="font-bold text-lg">Warm Number</h3>
          <p className="text-xs text-base-content/60 mt-1">Maks. 100 pesan / hari</p>
          <div className="mt-5 text-xs text-base-content/40 bg-base-200 px-3 py-1.5 rounded-xl">
            Terkunci (Mulai Hari ke-4)
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 p-6 rounded-2xl opacity-60">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-base-200 text-base-content/60 border border-base-300 self-start mb-3">
            Stage 3 (Hari 8-14)
          </span>
          <h3 className="font-bold text-lg">Active Number</h3>
          <p className="text-xs text-base-content/60 mt-1">Maks. 500 pesan / hari</p>
          <div className="mt-5 text-xs text-base-content/40 bg-base-200 px-3 py-1.5 rounded-xl">
            Terkunci (Mulai Hari ke-8)
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 p-6 rounded-2xl opacity-60">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-base-200 text-base-content/60 border border-base-300 self-start mb-3">
            Stage 4 (Hari 15+)
          </span>
          <h3 className="font-bold text-lg">Mature Number</h3>
          <p className="text-xs text-base-content/60 mt-1">Sesuai Kuota Paket</p>
          <div className="mt-5 text-xs text-base-content/40 bg-base-200 px-3 py-1.5 rounded-xl">
            Terkunci (Mulai Hari ke-15)
          </div>
        </div>
      </div>
      </div>
    </PlanFeatureGuard>
  );
}
