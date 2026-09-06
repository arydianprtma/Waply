"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  RefreshCw,
  Sparkles,
  Shield,
  ChevronRight,
  X,
} from "lucide-react";
import {
  type PlanId,
  type Plan,
  type Subscription,
  type Invoice,
  getPlanDetailedFeatureList,
} from "@/lib/billing-types";
import { setCachedBillingData } from "@/lib/use-billing-plan";

// Plan display order
const PLAN_ORDER: PlanId[] = ["FREE", "STARTER", "BUSINESS", "PRO"];

const DEFAULT_COLOR = {
  badge: "bg-emerald-600 text-white",
  border: "border-emerald-500/60",
  btn: "btn-outline btn-primary",
};

const PLAN_COLORS: Record<string, { badge: string; border: string; btn: string }> = {
  FREE: {
    badge: "bg-base-200 text-base-content",
    border: "border-base-200",
    btn: "btn-ghost border border-base-300",
  },
  STARTER: {
    badge: "bg-sky-500 text-white",
    border: "border-sky-400/50",
    btn: "btn-outline btn-info",
  },
  BUSINESS: {
    badge: "bg-primary text-primary-content",
    border: "border-primary",
    btn: "btn-primary",
  },
  PRO: {
    badge: "bg-violet-600 text-white",
    border: "border-violet-500/60",
    btn: "btn-outline",
  },
};

interface BillingData {
  subscription: Subscription & { status: string };
  plan: Plan;
  invoices: Invoice[];
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function daysLeft(endDate: string | null): number {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [allPlans, setAllPlans] = useState<Record<PlanId, Plan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PlanId | null>(null);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"subscription" | "invoices">("subscription");
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<"day" | "month" | "year" | "all">("month");

  const periodTabsList: { id: "day" | "month" | "year" | "all"; label: string; badge?: string }[] = [
    { id: "day", label: "Harian" },
    { id: "month", label: "Bulanan" },
    { id: "year", label: "Tahunan", badge: "-20%" },
    { id: "all", label: "Semua" },
  ];
  const periodTabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [periodIndicator, setPeriodIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const activeIndex = periodTabsList.findIndex((t) => t.id === selectedPeriodTab);
    const activeEl = periodTabsRef.current[activeIndex];
    if (activeEl) {
      setPeriodIndicator({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  }, [selectedPeriodTab]);

  // Load Snap.js script
  useEffect(() => {
    if (document.getElementById("midtrans-snap")) {
      setSnapLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.dataset.clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    script.onload = () => setSnapLoaded(true);
    document.head.appendChild(script);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, plansRes] = await Promise.all([
        fetch("/api/billing/status"),
        fetch("/api/billing/plans").catch(() => null),
      ]);
      const statusJson = await statusRes.json();
      if (statusJson.success) {
        setBillingData(statusJson.data);
        setCachedBillingData(statusJson.data);
      }
      if (plansRes && plansRes.ok) {
        const plansJson = await plansRes.json();
        if (plansJson.success && plansJson.data) {
          setAllPlans(plansJson.data);
        }
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSyncOrder = async (orderId: string) => {
    setSyncingOrderId(orderId);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/billing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.data.status === "PAID") {
          setSuccessMsg(`Status transaksi ${orderId} berhasil disinkronkan: PAID (Aktif)!`);
        } else {
          setSuccessMsg(`Status transaksi ${orderId}: ${json.data.transactionStatus || json.data.status}`);
        }
        await fetchStatus();
      } else {
        setErrorMsg(json.error || "Gagal sinkronisasi status");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghubungi server");
    } finally {
      setSyncingOrderId(null);
    }
  };

  // Handle payment=finish redirect from Midtrans
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "finish") {
      setSuccessMsg("Pembayaran selesai diproses. Memperbarui status langganan...");
      fetchStatus();
    }
  }, [searchParams, fetchStatus]);

  const handleUpgrade = (planId: PlanId) => {
    router.push(`/order?plan=${planId}`);
  };

  const currentPlanId = billingData?.subscription.planId || "FREE";
  const subStatus = billingData?.subscription.status || "FREE";
  const days = daysLeft(billingData?.subscription.endDate || null);

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          Subscription & Billing
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Kelola paket langganan dan pantau riwayat pembayaran Anda.
        </p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="alert alert-success gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="btn btn-ghost btn-xs ml-auto">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-error gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="btn btn-ghost btn-xs ml-auto">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-base-200/60 rounded-2xl w-fit">
        {[
          { key: "subscription", label: "Paket & Upgrade", icon: Sparkles },
          { key: "invoices", label: "Riwayat Invoice", icon: Receipt },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`btn btn-sm gap-2 rounded-xl transition-all ${
                activeTab === t.key ? "btn-primary shadow-md shadow-primary/20" : "btn-ghost"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Subscription ─────────────────────────────────────────── */}
      {activeTab === "subscription" && (
        <div className="space-y-6">
          {/* Current Plan Card */}
          {loading ? (
            <div className="h-36 bg-base-200 rounded-2xl animate-pulse" />
          ) : (
            <div
              className={`card bg-base-100 border-2 shadow-sm p-6 md:p-8 rounded-2xl ${
                (PLAN_COLORS[currentPlanId] || DEFAULT_COLOR).border
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      (PLAN_COLORS[currentPlanId] || DEFAULT_COLOR).badge
                    }`}
                  >
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          (PLAN_COLORS[currentPlanId] || DEFAULT_COLOR).badge
                        }`}
                      >
                        {billingData?.plan.name || "Free Trial"}
                      </span>
                      <StatusBadge status={subStatus} />
                    </div>
                    <div className="text-3xl font-extrabold mt-1">
                      {billingData?.plan.price === 0
                        ? "Gratis"
                        : formatIDR(billingData?.plan.price || 0)}
                      <span className="text-sm font-normal text-base-content/50 ml-1">/ bulan</span>
                    </div>
                    {subStatus === "ACTIVE" && billingData?.subscription.endDate && (
                      <p className="text-xs text-base-content/50 mt-1">
                        Aktif hingga {formatDate(billingData.subscription.endDate)} •{" "}
                        <span className={days <= 7 ? "text-warning font-semibold" : ""}>
                          {days} hari lagi
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-center">
                  <div className="bg-base-200/60 rounded-xl px-4 py-2">
                    <p className="font-bold text-lg">{billingData?.plan.maxDevices || 1}</p>
                    <p className="text-xs text-base-content/50">Device</p>
                  </div>
                  <div className="bg-base-200/60 rounded-xl px-4 py-2">
                    <p className="font-bold text-lg">
                      {(billingData?.plan.monthlyMessages || 100).toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-base-content/50">Pesan / bln</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Tabs & Plan Comparison Grid */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-base-content">Pilih Paket Langganan</h3>
                <p className="text-xs text-base-content/60">Pilih siklus tagihan harian, bulanan, atau tahunan sesuai kebutuhan.</p>
              </div>

              {/* Period Tabs with 3D Smooth Sliding Indicator */}
              <div className="relative inline-flex p-1.5 rounded-2xl bg-base-200/80 border border-base-300 shadow-inner">
                {/* Animated Sliding 3D Pill */}
                <div
                  className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30 border-t border-white/25 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    left: `${periodIndicator.left}px`,
                    width: `${periodIndicator.width}px`,
                    opacity: periodIndicator.opacity,
                  }}
                />

                {periodTabsList.map((tab, idx) => {
                  const isActive = selectedPeriodTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        periodTabsRef.current[idx] = el;
                      }}
                      onClick={() => setSelectedPeriodTab(tab.id)}
                      className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center gap-1 select-none ${
                        isActive
                          ? "text-white"
                          : "text-base-content/70 hover:text-base-content"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[10px] ml-0.5 font-bold px-1.5 py-0.2 rounded-full transition-colors duration-200 ${
                            isActive
                              ? "bg-emerald-300 text-emerald-950 shadow-2xs"
                              : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {(allPlans
                ? Object.values(allPlans).filter((p) => {
                    if (p.id === "FREE" || p.isActive === false) return false;
                    if (selectedPeriodTab === "all") return true;
                    return (p.period || "month") === selectedPeriodTab;
                  })
                : []
              ).map((plan: any) => {
              const planId = plan.id;
              const isCurrent = planId === currentPlanId;
              const colors = PLAN_COLORS[planId] || DEFAULT_COLOR;
              const isPopular = plan.isPopular;
              const detailedFeatures = getPlanDetailedFeatureList(plan);

              return (
                <div
                  key={planId}
                  className={`card bg-base-100 border-2 p-5 rounded-2xl flex flex-col justify-between relative transition-shadow hover:shadow-lg ${
                    isCurrent ? colors.border + " shadow-md" : "border-base-200"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 right-4 inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-content shadow-sm">
                      Paling Populer
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 left-4 inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm">
                      Plan Aktif
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}>
                        {plan.name || planId}
                      </span>
                      {plan.period === "day" && (
                        <span className="badge badge-warning text-[10px] font-bold">
                          Harian
                        </span>
                      )}
                    </div>

                    <div className="min-h-[54px] flex flex-col justify-end">
                      {plan.originalPrice && plan.originalPrice > plan.price && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-base-content/40 line-through font-semibold">
                            {formatIDR(plan.originalPrice)}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500 text-white shadow-xs tracking-wide">
                            {plan.discountBadge || `HEMAT ${plan.discountPercent || Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%`}
                          </span>
                        </div>
                      )}

                      <div className="text-2xl font-black">
                        {formatIDR(plan.price || 0)}
                        <span className="text-xs font-normal text-base-content/50">
                          {" "}
                          / {plan.period === "day" ? "hari" : plan.period === "week" ? "mgg" : plan.period === "year" ? "thn" : "bln"}
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-2.5 mt-4">
                      {detailedFeatures.map((feat, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-2 text-xs ${
                            feat.included ? "text-base-content/90 font-medium" : "text-base-content/40 opacity-50"
                          }`}
                        >
                          {feat.included ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-base-content/30 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feat.included ? "" : "line-through"}>{feat.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleUpgrade(planId)}
                    disabled={isCurrent || upgrading === planId}
                    className={`btn btn-sm mt-5 w-full gap-2 ${colors.btn} ${
                      isCurrent ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {upgrading === planId ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : isCurrent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Plan Aktif
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" /> Pilih {plan.name || planId}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

          {/* Sandbox Notice */}
          <div className="alert gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-semibold">Mode Sandbox Aktif</p>
              <p className="mt-0.5">
                Gunakan kartu test Midtrans: <code className="bg-amber-100 px-1 rounded">4811 1111 1111 1114</code> •
                Exp: <code className="bg-amber-100 px-1 rounded">01/25</code> •
                CVV: <code className="bg-amber-100 px-1 rounded">123</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Invoices ─────────────────────────────────────────────── */}
      {activeTab === "invoices" && (
        <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
            <h3 className="font-semibold text-sm">Riwayat Pembayaran</h3>
            <button onClick={fetchStatus} className="btn btn-ghost btn-xs gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-base-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !billingData?.invoices.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-base-content/30">
              <Receipt className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">Belum ada riwayat pembayaran</p>
            </div>
          ) : (
            <div className="divide-y divide-base-200">
              {billingData.invoices.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4.5 hover:bg-slate-50/80 transition-colors gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : inv.status === "FAILED" || inv.status === "EXPIRED"
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}
                    >
                      {inv.status === "PAID" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : inv.status === "PENDING" ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        Plan {inv.planId} — {formatIDR(inv.amount)}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                        {inv.orderId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {inv.status === "PENDING" && (
                      <button
                        onClick={() => handleSyncOrder(inv.orderId)}
                        disabled={syncingOrderId === inv.orderId}
                        className="btn btn-xs rounded-lg gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold px-3 py-1 shadow-xs"
                        title="Sinkronkan status transaksi dari server Midtrans"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingOrderId === inv.orderId ? "animate-spin" : ""}`} />
                        {syncingOrderId === inv.orderId ? "Memeriksa..." : "Cek Status Midtrans"}
                      </button>
                    )}
                    <div className="text-right flex-shrink-0">
                      <InvoiceStatusBadge status={inv.status} />
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">
                        {formatDate(inv.paidAt || inv.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    ACTIVE: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Aktif" },
    EXPIRED: { color: "bg-error/10 text-error border-error/20", label: "Expired" },
    PENDING: { color: "bg-warning/10 text-warning border-warning/20", label: "Pending" },
    FREE: { color: "bg-base-200 text-base-content/50 border-base-300", label: "Free" },
  };
  const s = map[status] || map.FREE;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "ACTIVE" ? "bg-emerald-500" : "bg-current"}`} />
      {s.label}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-600",
    PENDING: "bg-amber-500/10 text-amber-600",
    FAILED: "bg-error/10 text-error",
    EXPIRED: "bg-base-200 text-base-content/50",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${map[status] || map.EXPIRED}`}>
      {status}
    </span>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><span className="loading loading-spinner loading-md" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
