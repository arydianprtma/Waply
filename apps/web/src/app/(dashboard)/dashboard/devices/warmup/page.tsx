"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Flame,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Smartphone,
  ChevronDown,
  RefreshCw,
  Zap,
} from "lucide-react";
import { PlanFeatureGuard } from "@/components/dashboard/PlanFeatureGuard";
import { useBillingPlan } from "@/lib/use-billing-plan";
import { Skeleton } from "@/components/ui/SkeletonLoaders";

export default function WarmupHealthPage() {
  const { billingData, plan } = useBillingPlan();
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [updatingStage, setUpdatingStage] = useState(false);

  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      const res = await fetch("/api/gateway/sessions", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDevices(json.data);
        if (json.data.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(json.data[0].id);
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const selectedDevice =
    devices.find((d) => d.id === selectedDeviceId) || devices[0] || null;
  const activeWarmupStage: "Cold" | "Warm" | "Active" | "Mature" =
    selectedDevice?.warmupStage || "Cold";
  const currentDay: number = selectedDevice?.currentDay || 1;

  const planName = plan?.name || (billingData ? "Free Trial" : "Memuat...");
  const totalMessages =
    plan?.monthlyMessages ?? (billingData?.meteredUsage?.messages?.limit ?? 500);
  const isUnlimited = totalMessages === -1;

  // Estimasi kuota harian: Total kuota dibagi durasi hari periode paket (default 30 hari)
  const periodDays = plan?.period === "day" ? 1 : plan?.period === "year" ? 365 : 30;
  const dailyQuota = isUnlimited
    ? -1
    : Math.max(1, Math.round(totalMessages / periodDays));

  const handleUpdateStage = async (stage: "Cold" | "Warm" | "Active" | "Mature") => {
    if (!selectedDevice) return;
    setUpdatingStage(true);
    try {
      const res = await fetch("/api/gateway/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_warmup_stage",
          sessionId: selectedDevice.id,
          stage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDevices((prev) =>
          prev.map((d) => (d.id === selectedDevice.id ? { ...d, warmupStage: stage } : d))
        );
      }
    } catch (e) {
      console.error("Failed to update warmup stage:", e);
    } finally {
      setUpdatingStage(false);
    }
  };

  const getStageStatus = (stageId: 1 | 2 | 3 | 4) => {
    const stageRank = {
      Cold: 1,
      Warm: 2,
      Active: 3,
      Mature: 4,
    };
    const currentRank = stageRank[activeWarmupStage] || 1;

    if (currentRank === stageId) {
      return {
        status: "active" as const,
        statusText: `Sedang Aktif (Hari ke-${currentDay})`,
      };
    }
    if (currentRank > stageId) {
      return {
        status: "completed" as const,
        statusText: "Tahap Telah Selesai",
      };
    }
    const daysRequired = stageId === 2 ? 4 : stageId === 3 ? 8 : 15;
    return {
      status: "locked" as const,
      statusText: `Terkunci (Hari ke-${daysRequired})`,
    };
  };

  // Skema Bertahap Berbasis Persentase Kuota Harian:
  // Cold: 10%, Warm: 30%, Active: 60%, Mature: 100%
  const stages = useMemo(() => {
    const s1 = getStageStatus(1);
    const s2 = getStageStatus(2);
    const s3 = getStageStatus(3);
    const s4 = getStageStatus(4);

    return [
      {
        id: 1 as const,
        targetStage: "Cold" as const,
        stage: "Stage 1 (Hari 1-3)",
        title: "Cold Number",
        percentage: 10,
        percentageLabel: "10% Acuan Harian",
        limit: isUnlimited
          ? "Maks. 100 pesan / hari (10%)"
          : `Maks. ${Math.max(10, Math.round(dailyQuota * 0.10)).toLocaleString("id-ID")} pesan / hari`,
        status: s1.status,
        statusText: s1.statusText,
        description:
          "Nomor baru didaftarkan. Pengiriman dibatasi 10% dari alokasi acuan harian dengan safety delay 8-15s untuk membangun skor trust Meta.",
      },
      {
        id: 2 as const,
        targetStage: "Warm" as const,
        stage: "Stage 2 (Hari 4-7)",
        title: "Warm Number",
        percentage: 30,
        percentageLabel: "30% Acuan Harian",
        limit: isUnlimited
          ? "Maks. 300 pesan / hari (30%)"
          : `Maks. ${Math.max(30, Math.round(dailyQuota * 0.30)).toLocaleString("id-ID")} pesan / hari`,
        status: s2.status,
        statusText: s2.statusText,
        description:
          "Peningkatan volume berkala sebesar 30% kuota harian. Terbuka otomatis di Hari ke-4. Ideal untuk interaksi pesan masuk dan balasan dua arah.",
      },
      {
        id: 3 as const,
        targetStage: "Active" as const,
        stage: "Stage 3 (Hari 8-14)",
        title: "Active Number",
        percentage: 60,
        percentageLabel: "60% Acuan Harian",
        limit: isUnlimited
          ? "Maks. 600 pesan / hari (60%)"
          : `Maks. ${Math.max(60, Math.round(dailyQuota * 0.60)).toLocaleString("id-ID")} pesan / hari`,
        status: s3.status,
        statusText: s3.statusText,
        description:
          "Nomor dinilai stabil oleh sistem telemetri. Terbuka otomatis di Hari ke-8. Kapasitas naik ke 60% kuota harian untuk broadcast dan automasi skala menengah.",
      },
      {
        id: 4 as const,
        targetStage: "Mature" as const,
        stage: "Stage 4 (Hari 15+)",
        title: "Mature Number",
        percentage: 100,
        percentageLabel: "100% Seluruh Kuota",
        limit: isUnlimited
          ? "Kapasitas Penuh Tanpa Batas"
          : `${totalMessages.toLocaleString("id-ID")} pesan (Seluruh Kuota)`,
        status: s4.status,
        statusText: s4.statusText,
        description:
          "Kapasitas penuh 100%. Nomor telah matang (Hari ke-15+) dan bebas menggunakan seluruh sisa kuota paket aktif kapan saja tanpa batasan per hari.",
      },
    ];
  }, [dailyQuota, isUnlimited, totalMessages, activeWarmupStage, currentDay]);

  return (
    <PlanFeatureGuard
      feature="warmupHealth"
      featureName="Warmup & Health Anti-Ban"
      minPlanName="Business"
      description="Fitur Warmup & Health Anti-Ban memanaskan nomor WhatsApp baru secara bertahap dan memonitor reputasi kesehatan perangkat untuk mencegah pemblokiran sepihak dari Meta."
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Warmup & Device Health
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pantau proses adaptasi nomor baru dan reputasi akun WhatsApp Anda untuk mencegah pemblokiran Meta.
            </p>
          </div>

          <button
            onClick={fetchDevices}
            disabled={loadingDevices}
            className="btn btn-ghost btn-sm text-xs gap-1.5 self-start sm:self-auto text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDevices ? "animate-spin" : ""}`} />
            Segarkan Status
          </button>
        </div>

        {/* Connected Device Selector & Active Stage Controls */}
        {loadingDevices && devices.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-xs space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ))}
            </div>
            <div className="bg-base-100 border border-base-200 rounded-2xl p-6 shadow-xs space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        ) : devices.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {selectedDevice?.name || "WhatsApp Device"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      ({selectedDevice?.phoneNumber || "Nomor Terhubung"})
                    </span>
                    <span className="badge badge-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Hari ke-{currentDay} Terhubung
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Stage saat ini: <strong className="text-slate-800 dark:text-slate-200">{activeWarmupStage} Number</strong>.
                    Pesan terkirim hari ini: <strong className="text-slate-800 dark:text-slate-200">{selectedDevice?.sentToday || 0} pesan</strong>.
                  </p>
                </div>
              </div>

              {/* Fast-Track Stage Override Control */}
              <div className="flex items-center gap-2.5 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                {devices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="select select-sm select-bordered text-xs rounded-xl"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phoneNumber || d.id})
                      </option>
                    ))}
                  </select>
                )}

                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-sm btn-outline btn-primary rounded-xl text-xs gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Akselerasi Stage (Nomor Lama)</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-20 menu p-2 shadow-2xl bg-base-100 dark:bg-slate-900 rounded-2xl w-60 border border-base-200 dark:border-slate-800 text-xs mt-2"
                  >
                    <li className="menu-title px-2 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Pilih Tahapan Langsung:
                    </li>
                    <li>
                      <button
                        onClick={() => handleUpdateStage("Cold")}
                        disabled={updatingStage}
                        className={activeWarmupStage === "Cold" ? "active font-bold" : ""}
                      >
                        Stage 1: Cold (10% Kuota)
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleUpdateStage("Warm")}
                        disabled={updatingStage}
                        className={activeWarmupStage === "Warm" ? "active font-bold" : ""}
                      >
                        Stage 2: Warm (30% Kuota)
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleUpdateStage("Active")}
                        disabled={updatingStage}
                        className={activeWarmupStage === "Active" ? "active font-bold" : ""}
                      >
                        Stage 3: Active (60% Kuota)
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleUpdateStage("Mature")}
                        disabled={updatingStage}
                        className={activeWarmupStage === "Mature" ? "active font-bold" : ""}
                      >
                        Stage 4: Mature (100% Seluruh Kuota)
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>Belum ada WhatsApp Device yang terhubung ke sistem. Hubungkan device di menu WhatsApp Devices untuk memulai pemantauan adaptasi.</span>
          </div>
        )}

        {/* Quota Formula Overview Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-sm font-extrabold bg-emerald-600 text-white border-none">
                  {planName}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Adaptasi Bertahap Nomor Baru
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Nomor baru (Stage 1 s.d. 3) dibatasi bertahap dari rata-rata harian paket ({isUnlimited ? "Bertahap" : `~${dailyQuota.toLocaleString("id-ID")} pesan/hari`}) untuk membangun reputasi telemetri Meta. Setelah mencapai <strong>Mature Number (Stage 4)</strong>, nomor bebas menggunakan <strong>100% seluruh kuota paket ({isUnlimited ? "Unlimited" : `${totalMessages.toLocaleString("id-ID")} pesan`})</strong> kapan saja tanpa batasan harian.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shrink-0 shadow-2xs">
              <div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  Total Kuota Paket
                </div>
                <div className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {isUnlimited ? "Unlimited" : `${totalMessages.toLocaleString("id-ID")} pesan`}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  Acuan Warmup Awal
                </div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {isUnlimited ? "Bertahap" : `~${dailyQuota.toLocaleString("id-ID")} / hari`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stages Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((st) => {
            const isActive = st.status === "active";
            const isCompleted = st.status === "completed";
            const isLocked = st.status === "locked";

            return (
              <div
                key={st.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  isActive
                    ? "border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-300/40 dark:ring-emerald-500/20 shadow-md"
                    : isCompleted
                    ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-slate-200/80 dark:border-slate-800 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                          : isCompleted
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {st.stage}
                    </span>
                    {isActive ? (
                      <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{st.title}</h3>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      {st.limit}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {st.percentage}%
                    </span>
                  </div>

                  {/* Progress bar visualizer */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 my-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isActive || isCompleted
                          ? "bg-emerald-500"
                          : "bg-slate-300 dark:bg-slate-700"
                      }`}
                      style={{ width: `${st.percentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {st.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {isActive ? (
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {st.statusText}
                    </div>
                  ) : isCompleted ? (
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {st.statusText}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-slate-400" />
                        {st.statusText}
                      </div>

                      {/* Instant unlock button for established numbers */}
                      {selectedDevice && isLocked && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStage(st.targetStage)}
                          disabled={updatingStage}
                          className="btn btn-xs btn-outline btn-primary w-full rounded-lg text-[11px]"
                        >
                          Buka Stage Ini (Nomor Lama)
                        </button>
                      )}
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
