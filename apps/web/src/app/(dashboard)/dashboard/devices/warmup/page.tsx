"use client";

import { Flame, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";

const stages = [
  {
    stage: "Stage 1 (Hari 1-3)",
    title: "Cold Number",
    limit: "Maks. 30 pesan / hari",
    status: "active",
    statusText: "Sedang Aktif",
    description: "Nomor baru didaftarkan. Pengiriman pesan dibatasi dengan safety delay 8-15s untuk membangun skor trust Meta.",
  },
  {
    stage: "Stage 2 (Hari 4-7)",
    title: "Warm Number",
    limit: "Maks. 100 pesan / hari",
    status: "locked",
    statusText: "Terkunci (Hari ke-4)",
    description: "Peningkatan volume berkala. Ideal untuk interaksi pesan masuk dan balasan pelanggan dua arah.",
  },
  {
    stage: "Stage 3 (Hari 8-14)",
    title: "Active Number",
    limit: "Maks. 500 pesan / hari",
    status: "locked",
    statusText: "Terkunci (Hari ke-8)",
    description: "Nomor dinilai stabil oleh sistem antitelemetri. Siap untuk pengiriman broadcast & automation skala menengah.",
  },
  {
    stage: "Stage 4 (Hari 15+)",
    title: "Mature Number",
    limit: "Sesuai Kuota Paket",
    status: "locked",
    statusText: "Terkunci (Hari ke-15)",
    description: "Kapasitas penuh sesuai batas langganan paket aktif dengan delay minimal dan perlindungan anti-ban adaptif.",
  },
];

export default function WarmupHealthPage() {
  return (
    <PlanFeatureGuard
      feature="warmupHealth"
      featureName="Warmup & Health Anti-Ban"
      minPlanName="Business"
      description="Fitur Warmup & Health Anti-Ban memanaskan nomor WhatsApp baru secara bertahap dan memonitor reputasi kesehatan perangkat untuk mencegah pemblokiran sepihak dari Meta."
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Warmup & Device Health
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau proses adaptasi nomor baru dan reputasi akun WhatsApp Anda untuk mencegah pemblokiran Meta.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((st, i) => {
            const isActive = st.status === "active";
            return (
              <div
                key={i}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  isActive
                    ? "border-emerald-300 ring-1 ring-emerald-200/80 shadow-xs"
                    : "border-slate-200/80 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {st.stage}
                    </span>
                    {isActive ? (
                      <Flame className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{st.title}</h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{st.limit}</p>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">{st.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  {isActive ? (
                    <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {st.statusText}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-slate-400" />
                      {st.statusText}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PlanFeatureGuard>
  );
}

