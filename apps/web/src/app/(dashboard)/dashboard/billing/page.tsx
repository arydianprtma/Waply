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
  PlusCircle,
  Smartphone,
  MessageSquare,
  PackagePlus,
  ShoppingBag,
  ArrowRight,
  Check,
  Timer,
  Printer,
  BarChart3,
  FileText,
  Download,
  QrCode,
  Copy,
  ExternalLink,
  Eye,
  Building2,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import {
  type PlanId,
  type Plan,
  type Subscription,
  type Invoice,
  DEFAULT_PLANS,
  getPlanDetailedFeatureList,
  getPlanDiscountStatus,
  sortPlansByPeriodAndPrice,
} from "@/lib/billing-types";
import { AddonItem, UserAddon } from "@/lib/addon-types";
import { setCachedBillingData } from "@/lib/use-billing-plan";
import { PromoCountdownTimer } from "@/components/ui/PromoCountdownTimer";
import { BillingSkeleton } from "@/components/ui/SkeletonLoaders";

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

interface MeteredUsage {
  messages: {
    used: number;
    limit: number;
    remaining: number;
    percent: number;
    isUnlimited: boolean;
  };
  devices: {
    connected: number;
    limit: number;
    remaining: number;
    percent: number;
  };
}

interface BillingData {
  subscription: Subscription & { status: string };
  plan: Plan;
  expiredPlan?: Plan | null;
  allPlans?: Record<string, Plan>;
  invoices: Invoice[];
  meteredUsage?: MeteredUsage;
  midtrans?: {
    snapJsUrl: string;
    clientKey: string;
    isProduction: boolean;
  };
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
  if (!iso) return "-";
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"subscription" | "addons" | "invoices">("subscription");
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<"day" | "month" | "year" | "all">("month");
  const [addonsCatalog, setAddonsCatalog] = useState<AddonItem[]>([]);
  const [userAddonTotals, setUserAddonTotals] = useState<{ extraDevices: number; extraMessages: number }>({ extraDevices: 0, extraMessages: 0 });
  const [userAddons, setUserAddons] = useState<UserAddon[]>([]);
  const [addonCategoryFilter, setAddonCategoryFilter] = useState<"ALL" | "DEVICE" | "MESSAGES">("ALL");
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState<Invoice | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, plansRes, addonsRes] = await Promise.all([
        fetch("/api/billing/status", { cache: "no-store" }),
        fetch("/api/billing/plans", { cache: "no-store" }).catch(() => null),
        fetch("/api/addons", { cache: "no-store" }).catch(() => null),
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
      if (addonsRes && addonsRes.ok) {
        const addonsJson = await addonsRes.json();
        if (addonsJson.success && addonsJson.data) {
          setAddonsCatalog(addonsJson.data.catalog || []);
          setUserAddons(addonsJson.data.userAddons || []);
          setUserAddonTotals(addonsJson.data.totals || { extraDevices: 0, extraMessages: 0 });
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

  const handlePaySnap = async (inv: Invoice) => {
    if (!inv.snapToken) {
      if (inv.snapRedirectUrl) {
        window.open(inv.snapRedirectUrl, "_blank");
      }
      return;
    }
    setPayingOrderId(inv.orderId);
    setErrorMsg(null);

    const snapJsUrl = billingData?.midtrans?.snapJsUrl || "https://app.midtrans.com/snap/snap.js";
    const clientKey = billingData?.midtrans?.clientKey || "";

    try {
      const existingScript = document.getElementById("midtrans-snap") as HTMLScriptElement | null;
      if (!existingScript || existingScript.src !== snapJsUrl || !(window as any).snap) {
        if (existingScript) existingScript.remove();
        delete (window as any).snap;

        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.id = "midtrans-snap";
          script.src = snapJsUrl;
          if (clientKey) script.setAttribute("data-client-key", clientKey);
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.head.appendChild(script);
        });
      }

      if ((window as any).snap) {
        (window as any).snap.pay(inv.snapToken, {
          onSuccess: async () => {
            await handleSyncOrder(inv.orderId);
            setSelectedDetailInvoice(null);
            setSuccessMsg(`Pembayaran pesanan ${inv.orderId} berhasil diverifikasi!`);
            await fetchStatus();
          },
          onPending: async () => {
            await handleSyncOrder(inv.orderId);
            await fetchStatus();
          },
          onError: () => {
            setErrorMsg("Pembayaran gagal atau dibatalkan.");
          },
          onClose: () => {
            setPayingOrderId(null);
          },
        });
      } else {
        const redirectUrl =
          inv.snapRedirectUrl ||
          (billingData?.midtrans?.isProduction
            ? `https://app.midtrans.com/snap/v2/vtweb/${inv.snapToken}`
            : `https://app.sandbox.midtrans.com/snap/v2/vtweb/${inv.snapToken}`);
        window.open(redirectUrl, "_blank");
      }
    } catch (err: any) {
      console.error("Snap pay error:", err);
      setErrorMsg(err.message || "Gagal memuat sistem pembayaran");
    } finally {
      setPayingOrderId(null);
    }
  };

  // Handle payment redirects from Midtrans (finish, unfinish, error)
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "finish") {
      setSuccessMsg("Pembayaran selesai diproses. Memperbarui status langganan...");
      fetchStatus();
    } else if (payment === "unfinish") {
      setActiveTab("invoices");
      setErrorMsg("Pembayaran belum diselesaikan. Anda dapat membuka barcode QRIS / menyelesaikan pembayaran di Riwayat Invoice.");
      fetchStatus();
    } else if (payment === "error") {
      setActiveTab("invoices");
      setErrorMsg("Batas waktu pembayaran telah berakhir atau transaksi dibatalkan.");
      fetchStatus();
    }
  }, [searchParams, fetchStatus]);

  const handleUpgrade = (planId: PlanId) => {
    router.push(`/order?plan=${planId}`);
  };

  const isExpired =
    billingData?.subscription.status === "EXPIRED" ||
    !!billingData?.subscription.expiredPlanId ||
    (billingData?.subscription.endDate ? new Date(billingData.subscription.endDate) < new Date() : false);

  const currentPlanId = isExpired ? "FREE" : (billingData?.subscription.planId || "FREE");
  const subStatus = isExpired ? "FREE" : (billingData?.subscription.status || "FREE");
  const days = daysLeft(billingData?.subscription.endDate || null);

  const activePlan = isExpired
    ? (allPlans?.["FREE"] || DEFAULT_PLANS["FREE"])
    : (billingData?.plan || allPlans?.[currentPlanId] || DEFAULT_PLANS[currentPlanId] || DEFAULT_PLANS["FREE"]);

  if (loading && !billingData) {
    return <BillingSkeleton />;
  }

  return (
    <div className="space-y-6 sm:space-y-7 w-full max-w-7xl mx-auto min-w-0">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
          <span className="truncate">Subscription &amp; Billing</span>
        </h1>
        <p className="text-xs sm:text-sm text-base-content/60 mt-1">
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

      {/* Tabs (Responsive Horizontal Scroll on Mobile) */}
      <div className="w-full overflow-x-auto no-scrollbar py-0.5">
        <div className="flex gap-1.5 p-1 bg-base-200/70 border border-base-300/60 rounded-2xl w-max sm:w-fit min-w-0">
          {[
            { key: "subscription", label: "Paket & Upgrade", icon: Sparkles },
            { key: "addons", label: "Addon & Top-Up", icon: PlusCircle, badge: addonsCatalog.length > 0 ? `${addonsCatalog.length}` : undefined },
            { key: "invoices", label: "Riwayat Invoice", icon: Receipt },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`btn btn-sm text-xs sm:text-sm font-semibold gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-xl transition-all whitespace-nowrap min-h-[40px] shrink-0 ${
                  isActive ? "btn-primary shadow-sm text-white" : "btn-ghost text-base-content/70 hover:text-base-content"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.label}</span>
                {t.badge && (
                  <span className="badge badge-xs badge-info font-mono shrink-0">{t.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab: Subscription ─────────────────────────────────────────── */}
      {activeTab === "subscription" && (
        <div className="space-y-6">
          {/* Expired Subscription Notice Banner */}
          {isExpired && (billingData?.subscription.expiredPlanId || billingData?.expiredPlan) && (
            <div className="alert bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Paket Langganan Sebelumnya Telah Berakhir
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Masa aktif paket <strong>{billingData?.expiredPlan?.name || (billingData?.allPlans?.[billingData.subscription.expiredPlanId!]?.name) || billingData?.subscription.expiredPlanId}</strong> Anda telah berakhir
                    {billingData?.subscription.expiredAt ? ` pada ${new Date(billingData.subscription.expiredAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : ""}. Akun Anda telah otomatis dikembalikan ke <strong>Paket Free</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById("plan-selection-grid");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn btn-xs btn-primary rounded-xl shrink-0 gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> Perpanjang / Upgrade
              </button>
            </div>
          )}

          {/* Current Plan Card */}
          {loading ? (
            <div className="h-36 bg-base-200 rounded-2xl animate-pulse" />
          ) : (
            <div
              className={`card bg-base-100 border-2 shadow-xs p-4 sm:p-6 md:p-8 rounded-2xl w-full min-w-0 ${
                (PLAN_COLORS[currentPlanId] || DEFAULT_COLOR).border
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 min-w-0">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      (PLAN_COLORS[currentPlanId] || DEFAULT_COLOR).badge
                    }`}
                  >
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                          (PLAN_COLORS[currentPlanId] || DEFAULT_COLOR).badge
                        }`}
                      >
                        {activePlan?.name || "Free Trial"}
                      </span>
                      <StatusBadge status={subStatus} />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold mt-0.5 sm:mt-1 truncate">
                      {activePlan?.price === 0
                        ? "Gratis"
                        : formatIDR(activePlan?.price || 0)}
                      <span className="text-xs sm:text-sm font-normal text-base-content/50 ml-1">
                        / {activePlan?.period === "day" ? "hari" : activePlan?.period === "week" ? "minggu" : activePlan?.period === "year" ? "tahun" : "bulan"}
                      </span>
                    </div>
                    {subStatus === "ACTIVE" && billingData?.subscription.endDate && (
                      <p className="text-xs text-base-content/60 mt-1">
                        Aktif hingga {formatDate(billingData.subscription.endDate)} •{" "}
                        <span className={days <= 7 ? "text-warning font-semibold" : ""}>
                          {days} hari lagi
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full md:w-auto text-center shrink-0">
                  <div className="bg-base-200/60 rounded-xl p-2.5 sm:px-4 sm:py-2 text-center">
                    <p className="font-bold text-base sm:text-lg">
                      {(activePlan?.maxDevices || 1) + userAddonTotals.extraDevices}
                    </p>
                    <p className="text-[11px] sm:text-xs text-base-content/50">Total Device Slot</p>
                    {userAddonTotals.extraDevices > 0 && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        (+{userAddonTotals.extraDevices} Addon)
                      </p>
                    )}
                  </div>
                  <div className="bg-base-200/60 rounded-xl p-2.5 sm:px-4 sm:py-2 text-center">
                    <p className={`font-bold text-base sm:text-lg ${activePlan?.monthlyMessages === -1 ? "text-emerald-600" : ""}`}>
                      {activePlan?.monthlyMessages === -1
                        ? "Unlimited"
                        : ((activePlan?.monthlyMessages || 100) + userAddonTotals.extraMessages).toLocaleString("id-ID")}
                    </p>
                    <p className="text-[11px] sm:text-xs text-base-content/50">Total Kuota Pesan</p>
                    {activePlan?.monthlyMessages === -1 ? (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        (Tanpa Batas)
                      </p>
                    ) : userAddonTotals.extraMessages > 0 ? (
                      <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                        (+{userAddonTotals.extraMessages.toLocaleString("id-ID")} Addon)
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Active Addons mini-badge list */}
              {userAddons.filter((a) => {
                if (a.status !== "ACTIVE") return false;
                if (a.expiresAt) {
                  const exp = new Date(a.expiresAt);
                  if (!isNaN(exp.getTime()) && exp < new Date()) return false;
                }
                return true;
              }).length > 0 && (
                <div className="mt-5 pt-4 border-t border-base-200/80 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-base-content/60 flex items-center gap-1 mr-1">
                    <PlusCircle className="w-3.5 h-3.5 text-primary" /> Addon Aktif:
                  </span>
                  {userAddons.filter((a) => {
                    if (a.status !== "ACTIVE") return false;
                    if (a.expiresAt) {
                      const exp = new Date(a.expiresAt);
                      if (!isNaN(exp.getTime()) && exp < new Date()) return false;
                    }
                    return true;
                  }).map((addon) => (
                    <span
                      key={addon.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        addon.type === "DEVICE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60"
                      }`}
                    >
                      {addon.type === "DEVICE" ? (
                        <Smartphone className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <MessageSquare className="w-3 h-3 text-indigo-600" />
                      )}
                      <span>{addon.name}</span>
                      {addon.expiresAt && (
                        <span className="text-[10px] opacity-75">
                          (s/d {new Date(addon.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Metered Usage & Quota Monitor (Transparency) */}
          {billingData?.meteredUsage && (
            <div className="card bg-base-100 border border-base-200 shadow-xs p-4 sm:p-6 rounded-2xl w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xs sm:text-sm text-base-content truncate">
                      Transparansi Penggunaan Kuota (Metered Usage)
                    </h3>
                    <p className="text-[11px] sm:text-xs text-base-content/50 truncate">
                      Pantau konsumsi pesan dan perangkat aktif secara real-time
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("addons")}
                  className="btn btn-xs btn-outline btn-primary rounded-lg gap-1.5 self-start sm:self-center shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Top-Up Kuota / Addon
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full min-w-0">
                {/* Messages Meter */}
                <div className="bg-base-200/40 border border-base-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-base-content flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" /> Pengiriman Pesan (Bulan Ini)
                    </span>
                    <span className="font-bold font-mono">
                      {billingData.meteredUsage.messages.used.toLocaleString("id-ID")}{" "}
                      {billingData.meteredUsage.messages.isUnlimited
                        ? "Pesan (Unlimited)"
                        : `/ ${billingData.meteredUsage.messages.limit.toLocaleString("id-ID")} Pesan`}
                    </span>
                  </div>

                  {!billingData.meteredUsage.messages.isUnlimited ? (
                    <>
                      <div className="w-full bg-base-300/80 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            billingData.meteredUsage.messages.percent > 85
                              ? "bg-rose-500"
                              : billingData.meteredUsage.messages.percent > 65
                              ? "bg-amber-500"
                              : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(2, billingData.meteredUsage.messages.percent))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-base-content/50">
                        <span>
                          {billingData.meteredUsage.messages.percent}% terpakai
                        </span>
                        <span>
                          Sisa: <strong className="text-base-content/80 font-bold">{billingData.meteredUsage.messages.remaining.toLocaleString("id-ID")}</strong> pesan
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-4 h-4" /> Paket Anda memiliki kuota pesan Unlimited tanpa batas bulanan.
                    </div>
                  )}
                </div>

                {/* Device Slots Meter */}
                <div className="bg-base-200/40 border border-base-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-base-content flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Slot Device WhatsApp
                    </span>
                    <span className="font-bold font-mono">
                      {billingData.meteredUsage.devices.connected} / {billingData.meteredUsage.devices.limit} Device
                    </span>
                  </div>

                  <div className="w-full bg-base-300/80 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        billingData.meteredUsage.devices.percent >= 100
                          ? "bg-rose-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, billingData.meteredUsage.devices.percent))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-base-content/50">
                    <span>
                      {billingData.meteredUsage.devices.percent}% slot terhubung
                    </span>
                    <span>
                      Sisa: <strong className="text-base-content/80 font-bold">{billingData.meteredUsage.devices.remaining}</strong> slot tersedia
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Tabs & Plan Comparison Grid */}
          <div id="plan-selection-grid" className="space-y-4 w-full min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full min-w-0">
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-base-content">Pilih Paket Langganan</h3>
                <p className="text-xs text-base-content/60">Pilih siklus tagihan harian, bulanan, atau tahunan sesuai kebutuhan.</p>
              </div>

              {/* Period Tabs with Liquid Glass 3D Fluid Morph Animation */}
              <div className="w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5">
                <div className="relative inline-flex max-w-full overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-base-200/80 border border-slate-300/50 dark:border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_8px_20px_-4px_rgba(0,0,0,0.04)] backdrop-blur-md">
                {/* Midnight Obsidian Liquid Glass Fluid Pill */}
                <div
                  className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1.5px_2px_rgba(0,0,0,0.5),0_8px_20px_-3px_rgba(15,23,42,0.5)] border-t border-white/25 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden"
                  style={{
                    left: `${periodIndicator.left}px`,
                    width: `${periodIndicator.width}px`,
                    opacity: periodIndicator.opacity,
                  }}
                >
                  {/* Top Gloss Specular Reflex Overlay */}
                  <div className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/25 via-white/10 to-transparent rounded-t-xl pointer-events-none" />
                  {/* Ambient Base Bloom */}
                  <div className="absolute -bottom-2 inset-x-0 h-4 bg-slate-700/30 blur-xs pointer-events-none" />
                </div>

                {periodTabsList.map((tab, idx) => {
                  const isActive = selectedPeriodTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        periodTabsRef.current[idx] = el;
                      }}
                      onClick={() => setSelectedPeriodTab(tab.id)}
                      className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center gap-1 select-none active:scale-95 cursor-pointer ${
                        isActive
                          ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                          : "text-base-content/70 hover:text-base-content hover:bg-white/20"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[10px] ml-0.5 font-black px-1.5 py-0.2 rounded-full transition-all duration-300 ${
                            isActive
                              ? "bg-emerald-500 text-white shadow-2xs scale-105"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {(allPlans
                ? sortPlansByPeriodAndPrice(
                    Object.values(allPlans).filter((p) => {
                      if (p.id === "FREE" || p.isActive === false) return false;
                      if (selectedPeriodTab === "all") return true;
                      return (p.period || "month") === selectedPeriodTab;
                    })
                  )
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

                    {(() => {
                      const discStatus = getPlanDiscountStatus(plan, nowMs);
                      return (
                        <div className="min-h-[54px] flex flex-col justify-end">
                          {discStatus.isDiscountActive && discStatus.originalPrice && discStatus.originalPrice > discStatus.effectivePrice && (
                            <div className="flex flex-col gap-1 mb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-base-content/40 line-through font-semibold">
                                  {formatIDR(discStatus.originalPrice)}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900 tracking-tight">
                                  {discStatus.discountBadge || `HEMAT ${discStatus.discountPercent}%`}
                                </span>
                              </div>
                              {discStatus.hasTimer && (
                                <PromoCountdownTimer status={discStatus} variant="badge" />
                              )}
                            </div>
                          )}

                          <div className="text-2xl font-black">
                            {formatIDR(discStatus.effectivePrice)}
                            <span className="text-xs font-normal text-base-content/50">
                              {" "}
                              / {plan.period === "day" ? "hari" : plan.period === "week" ? "mgg" : plan.period === "year" ? "thn" : "bln"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
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
      </div>
    )}

      {/* ── Tab: Addons ──────────────────────────────────────────────── */}
      {activeTab === "addons" && (
        <div className="space-y-6">
          {/* Header Banner & Summary */}
          <div className="card bg-base-100 border border-base-200 p-6 md:p-7 rounded-2xl shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>Katalog Addon dan Top-Up Ekstra</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-base-content">
                  Tingkatkan Kapasitas Sesuai Kebutuhan
                </h2>
                <p className="text-xs md:text-sm text-base-content/70 leading-relaxed">
                  Tambah slot koneksi perangkat WhatsApp atau kuota kirim pesan kapan saja tanpa harus mengubah paket langganan utama Anda.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                <div className="flex-1 sm:flex-initial bg-base-200/60 rounded-xl p-4 border border-base-200 min-w-[130px] text-left">
                  <span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider block">
                    Device Aktif
                  </span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">+{userAddonTotals.extraDevices}</p>
                  <span className="text-[11px] text-base-content/50 mt-0.5 block">Slot tambahan</span>
                </div>

                <div className="flex-1 sm:flex-initial bg-base-200/60 rounded-xl p-4 border border-base-200 min-w-[150px] text-left">
                  <span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider block">
                    Kuota Ekstra
                  </span>
                  <p className="text-2xl font-black text-primary mt-1">+{userAddonTotals.extraMessages.toLocaleString("id-ID")}</p>
                  <span className="text-[11px] text-base-content/50 mt-0.5 block">Pesan tersisa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Category */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-base-content">Pilih Addon Ekstra</h3>
              <p className="text-xs text-base-content/60">Pilih opsi slot perangkat atau paket kuota pesan.</p>
            </div>

            <div className="flex gap-1.5 p-1 bg-base-200/80 rounded-xl border border-base-300/60">
              {[
                { id: "ALL", label: "Semua Addon" },
                { id: "DEVICE", label: "Tambah Device" },
                { id: "MESSAGES", label: "Tambah Kuota Pesan" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAddonCategoryFilter(c.id as any)}
                  className={`btn btn-xs rounded-lg font-bold px-3 transition-all ${
                    addonCategoryFilter === c.id
                      ? "btn-primary shadow-xs"
                      : "btn-ghost text-base-content/70 hover:text-base-content"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Addon Catalog Grid / Empty State */}
          {addonsCatalog.filter((a) => a.isActive && (addonCategoryFilter === "ALL" || a.type === addonCategoryFilter)).length === 0 ? (
            <div className="card bg-base-100 border border-base-200 p-12 text-center rounded-2xl flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-base-200/70 flex items-center justify-center text-base-content/40 mb-3">
                <PackagePlus className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-base-content">Belum Ada Addon Tersedia</h4>
              <p className="text-xs text-base-content/60 max-w-sm mt-1">
                Katalog addon ekstra belum ditambahkan oleh administrator. Silakan buat addon melalui panel admin untuk menampilkannya di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {addonsCatalog
                .filter((a) => {
                  if (!a.isActive) return false;
                  if (addonCategoryFilter === "ALL") return true;
                  return a.type === addonCategoryFilter;
                })
                .map((addon) => {
                  const isDev = addon.type === "DEVICE";
                  return (
                    <div
                      key={addon.id}
                      className="card bg-base-100 border-2 border-base-200 hover:border-primary/50 transition-all shadow-sm hover:shadow-md p-5 rounded-2xl flex flex-col justify-between relative group"
                    >
                      {addon.badge && (
                        <span className="absolute -top-3 right-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                          {addon.badge}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isDev
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800"
                                : "bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800"
                            }`}
                          >
                            {isDev ? <Smartphone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isDev ? "bg-emerald-500/10 text-emerald-600" : "bg-indigo-500/10 text-indigo-600"
                              }`}
                            >
                              {isDev ? "Slot Device" : "Kuota Pesan"}
                            </span>
                            <h4 className="text-sm font-bold text-base-content mt-0.5">{addon.name}</h4>
                          </div>
                        </div>

                        <p className="text-xs text-base-content/60 min-h-[32px] line-clamp-2">
                          {addon.description || (isDev ? `Tambahan ${addon.amount} slot perangkat WhatsApp.` : `Top-up kuota ${addon.amount.toLocaleString("id-ID")} pesan.`)}
                        </p>

                        <div className="mt-4 pt-3 border-t border-base-200/80">
                          <div className="text-xl font-black text-base-content">
                            {formatIDR(addon.price)}
                            <span className="text-xs font-normal text-base-content/50"> / addon</span>
                          </div>
                          <p className="text-[11px] text-base-content/50 mt-0.5">
                            {isDev ? `+${addon.amount} WhatsApp Session` : `+${addon.amount.toLocaleString("id-ID")} Pesan WhatsApp`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => router.push(`/order?mode=addon&addon=${addon.id}`)}
                        className="btn btn-sm btn-primary w-full mt-4 gap-2 rounded-xl group-hover:shadow-md group-hover:shadow-primary/20"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Beli / Top-Up Addon
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Active Addons Details Table */}
          {userAddons.length > 0 && (
            <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-base-content">Daftar Addon Anda</h3>
                  <p className="text-xs text-base-content/50">Riwayat addon dan top-up yang terpasang pada akun Anda</p>
                </div>
                <span className="badge badge-primary badge-sm font-bold">
                  {userAddons.filter((a) => a.status === "ACTIVE").length} Aktif
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-base-200/40 text-xs">
                      <th>Nama Addon</th>
                      <th>Tipe</th>
                      <th>Kapasitas</th>
                      <th>Harga</th>
                      <th>Tanggal Aktif</th>
                      <th>Masa Berlaku</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAddons.map((ua) => (
                      <tr key={ua.id} className="hover:bg-base-200/30">
                        <td className="font-bold text-xs">{ua.name}</td>
                        <td>
                          <span
                            className={`badge badge-xs font-semibold ${
                              ua.type === "DEVICE" ? "badge-success text-white" : "badge-info text-white"
                            }`}
                          >
                            {ua.type}
                          </span>
                        </td>
                        <td className="font-bold text-xs">
                          {ua.type === "DEVICE" ? `+${ua.amount} Device` : `+${ua.amount.toLocaleString("id-ID")} Pesan`}
                        </td>
                        <td className="text-xs">{formatIDR(ua.pricePaid || 0)}</td>
                        <td className="text-xs text-base-content/60">{formatDate(ua.activatedAt)}</td>
                        <td className="text-xs text-base-content/60">
                          {ua.expiresAt ? formatDate(ua.expiresAt) : "Permanen / Sesuai Langganan"}
                        </td>
                        <td>
                          <span
                            className={`badge badge-xs font-bold ${
                              ua.status === "ACTIVE" ? "badge-success text-white" : "badge-ghost opacity-60"
                            }`}
                          >
                            {ua.status === "ACTIVE" ? "Aktif" : "Expired"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                        {(allPlans?.[inv.planId]?.name || billingData?.allPlans?.[inv.planId]?.name || `Plan ${inv.planId}`)}: {formatIDR(inv.amount)}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                        {inv.orderId}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => setSelectedDetailInvoice(inv)}
                      className="btn btn-xs rounded-lg gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold px-2.5 py-1"
                      title="Lihat Detail Pesanan & Faktur"
                    >
                      <Eye className="w-3 h-3 text-slate-500" />
                      Detail
                    </button>

                    {inv.status === "PAID" && (
                      <button
                        onClick={() => setViewingInvoice(inv)}
                        className="btn btn-xs rounded-lg gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold px-2.5 py-1"
                        title="Lihat dan Cetak Invoice Resmi"
                      >
                        <Printer className="w-3 h-3 text-slate-500" />
                        Cetak Invoice
                      </button>
                    )}

                    {inv.status === "PENDING" && (
                      <>
                        {(inv.snapToken || inv.qrCodeUrl || inv.vaNumber || inv.snapRedirectUrl) && (
                          <button
                            onClick={() => {
                              if (inv.snapToken) {
                                handlePaySnap(inv);
                              } else {
                                setSelectedDetailInvoice(inv);
                              }
                            }}
                            disabled={payingOrderId === inv.orderId}
                            className="btn btn-xs rounded-lg gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold px-3 py-1 shadow-xs"
                            title="Buka kembali barcode QRIS atau kode bayar"
                          >
                            <QrCode className="w-3 h-3" />
                            {payingOrderId === inv.orderId ? "Memuat..." : "Bayar / Buka QRIS"}
                          </button>
                        )}
                        <button
                          onClick={() => handleSyncOrder(inv.orderId)}
                          disabled={syncingOrderId === inv.orderId}
                          className="btn btn-xs rounded-lg gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold px-2.5 py-1 shadow-xs"
                          title="Sinkronkan status transaksi dari server Midtrans"
                        >
                          <RefreshCw className={`w-3 h-3 ${syncingOrderId === inv.orderId ? "animate-spin" : ""}`} />
                          {syncingOrderId === inv.orderId ? "Memeriksa..." : "Cek Status"}
                        </button>
                      </>
                    )}

                    {(inv.status === "EXPIRED" || inv.status === "FAILED") && (
                      <button
                        onClick={() => router.push(`/order?plan=${inv.planId}`)}
                        className="btn btn-xs rounded-lg gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-semibold px-2.5 py-1"
                        title="Pesan Ulang Paket"
                      >
                        <ArrowRight className="w-3 h-3 text-sky-600" />
                        Pesan Ulang
                      </button>
                    )}

                    <div className="text-right flex-shrink-0 ml-auto sm:ml-2">
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

      {/* ── Order Detail & Payment Modal ────────────────────────────── */}
      {selectedDetailInvoice && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl max-w-xl w-full p-6 md:p-8 space-y-6 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Detail Pesanan & Tagihan</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-slate-500">{selectedDetailInvoice.orderId}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedDetailInvoice.orderId);
                          setCopiedOrderId(true);
                          setTimeout(() => setCopiedOrderId(false), 2000);
                        }}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        {copiedOrderId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedOrderId ? "Tersalin" : "Salin ID"}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetailInvoice(null)}
                  className="btn btn-ghost btn-sm btn-circle text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              {selectedDetailInvoice.status === "PENDING" && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-sm text-amber-800 dark:text-amber-300">Menunggu Pembayaran</p>
                    <p className="text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                      Barcode QRIS atau instruksi pembayaran Anda tertutup atau hilang? Anda dapat membukanya kembali langsung di bawah ini tanpa perlu membuat pesanan baru.
                    </p>
                  </div>
                </div>
              )}

              {selectedDetailInvoice.status === "PAID" && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Pembayaran Berhasil (Lunas)</p>
                    <p className="text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
                      Transaksi telah diverifikasi resmi pada {formatDate(selectedDetailInvoice.paidAt)}. Paket langganan Anda telah aktif dan kuota dapat digunakan.
                    </p>
                  </div>
                </div>
              )}

              {(selectedDetailInvoice.status === "EXPIRED" || selectedDetailInvoice.status === "FAILED") && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/40 text-rose-900 dark:text-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-sm text-rose-800 dark:text-rose-300">Tagihan Kedaluwarsa</p>
                    <p className="text-rose-700/90 dark:text-rose-400/90 leading-relaxed">
                      Batas waktu penyelesaian pembayaran untuk order ini telah berakhir. Silakan lakukan pemesanan ulang jika masih ingin berlangganan.
                    </p>
                  </div>
                </div>
              )}

              {/* Order Breakdown Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-medium">Paket Layanan</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {allPlans?.[selectedDetailInvoice.planId]?.name || `Plan ${selectedDetailInvoice.planId}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-medium">Durasi Berlangganan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedDetailInvoice.durationMonths ? `${selectedDetailInvoice.durationMonths} Bulan` : "1 Bulan"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-medium">Waktu Pemesanan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(selectedDetailInvoice.createdAt)}
                  </span>
                </div>
                {selectedDetailInvoice.customerName && (
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 font-medium">Nama Pemesan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedDetailInvoice.customerName}
                    </span>
                  </div>
                )}
                {selectedDetailInvoice.paymentMethod && (
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 font-medium">Metode Pembayaran</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedDetailInvoice.paymentMethod}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">Total Tagihan</span>
                  <span className="font-extrabold text-lg text-primary">
                    {formatIDR(selectedDetailInvoice.amount)}
                  </span>
                </div>
              </div>

              {/* Direct QRIS Image (if qrCodeUrl exists) */}
              {selectedDetailInvoice.status === "PENDING" && selectedDetailInvoice.qrCodeUrl && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Scan Barcode QRIS di bawah ini dengan aplikasi M-Banking atau E-Wallet:
                  </p>
                  <div className="p-3 bg-white rounded-2xl inline-block border border-slate-200 shadow-xs mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedDetailInvoice.qrCodeUrl}
                      alt="QRIS Barcode"
                      className="w-48 h-48 object-contain mx-auto"
                    />
                  </div>
                  <div>
                    <a
                      href={selectedDetailInvoice.qrCodeUrl}
                      download={`QRIS-${selectedDetailInvoice.orderId}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-xs btn-outline rounded-lg gap-1.5 text-slate-700 dark:text-slate-300 font-bold"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh Barcode QRIS
                    </a>
                  </div>
                </div>
              )}

              {/* Direct VA Number (if vaNumber exists) */}
              {selectedDetailInvoice.status === "PENDING" && selectedDetailInvoice.vaNumber && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> Nomor Virtual Account ({selectedDetailInvoice.bank?.toUpperCase() || "Bank"}):
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 font-mono text-base font-bold text-blue-900 dark:text-blue-200">
                    <span>{selectedDetailInvoice.vaNumber}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedDetailInvoice.vaNumber!);
                        setCopiedVa(true);
                        setTimeout(() => setCopiedVa(false), 2000);
                      }}
                      className="btn btn-xs btn-ghost text-blue-600 font-bold"
                    >
                      {copiedVa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedVa ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {selectedDetailInvoice.status === "PENDING" && (
                  <>
                    {(selectedDetailInvoice.snapToken || selectedDetailInvoice.snapRedirectUrl) && (
                      <button
                        onClick={() => handlePaySnap(selectedDetailInvoice)}
                        disabled={payingOrderId === selectedDetailInvoice.orderId}
                        className="btn btn-primary w-full rounded-2xl font-bold gap-2 shadow-lg shadow-primary/25"
                      >
                        <QrCode className="w-4 h-4" />
                        {payingOrderId === selectedDetailInvoice.orderId
                          ? "Membuka Sistem Pembayaran..."
                          : "Buka Barcode QRIS / Bayar Sekarang"}
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          await handleSyncOrder(selectedDetailInvoice.orderId);
                          // Refresh current detail modal with latest invoice state
                          const updated = billingData?.invoices.find((i) => i.orderId === selectedDetailInvoice.orderId);
                          if (updated) setSelectedDetailInvoice(updated);
                        }}
                        disabled={syncingOrderId === selectedDetailInvoice.orderId}
                        className="btn btn-outline btn-sm rounded-xl font-bold gap-1.5 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingOrderId === selectedDetailInvoice.orderId ? "animate-spin" : ""}`} />
                        {syncingOrderId === selectedDetailInvoice.orderId ? "Memeriksa..." : "Cek Status Midtrans"}
                      </button>

                      {selectedDetailInvoice.snapRedirectUrl && (
                        <a
                          href={selectedDetailInvoice.snapRedirectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm rounded-xl font-bold gap-1.5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
                        </a>
                      )}
                    </div>
                  </>
                )}

                {selectedDetailInvoice.status === "PAID" && (
                  <button
                    onClick={() => {
                      setViewingInvoice(selectedDetailInvoice);
                      setSelectedDetailInvoice(null);
                    }}
                    className="btn btn-primary w-full rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20"
                  >
                    <Printer className="w-4 h-4" /> Cetak / Unduh Faktur Resmi
                  </button>
                )}

                {(selectedDetailInvoice.status === "EXPIRED" || selectedDetailInvoice.status === "FAILED") && (
                  <button
                    onClick={() => {
                      setSelectedDetailInvoice(null);
                      router.push(`/order?plan=${selectedDetailInvoice.planId}`);
                    }}
                    className="btn btn-primary w-full rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20"
                  >
                    <ArrowRight className="w-4 h-4" /> Pesan Ulang Paket Ini
                  </button>
                )}
              </div>

            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Printable Official Invoice Modal ────────────────────────────── */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 relative border border-slate-200 max-h-[90vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none">
            {/* Modal Controls (Hidden when printed) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-slate-900">Faktur Pembayaran Resmi</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn btn-sm btn-primary rounded-xl gap-1.5 font-bold"
                >
                  <Printer className="w-4 h-4" /> Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="btn btn-sm btn-ghost btn-circle"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="space-y-6 print:p-8">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">WAPLY</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    WhatsApp Gateway & Messaging Infrastructure
                  </p>
                  <p className="text-xs text-slate-400">PT Waply Digital Nusantara • NPWP: 98.123.456.7-012.000</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black uppercase tracking-wider border border-emerald-300">
                    LUNAS / PAID
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                    INV-{viewingInvoice.orderId}
                  </p>
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Tanggal Transaksi</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {formatDate(viewingInvoice.paidAt || viewingInvoice.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Metode Pembayaran</p>
                  <p className="font-bold text-slate-800 mt-0.5">Midtrans Snap Gateway</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status Verifikasi</p>
                  <p className="font-bold text-emerald-600 mt-0.5">Terverifikasi Otomatis</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Deskripsi Layanan</th>
                      <th className="p-3.5 text-center">Durasi / Qty</th>
                      <th className="p-3.5 text-right">Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3.5 font-semibold text-slate-900">
                        Paket Langganan Waply - Plan {viewingInvoice.planId}
                        <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                          Akses WhatsApp Multi-Device Gateway, REST API, Spintax & Broadcast
                        </p>
                      </td>
                      <td className="p-3.5 text-center text-slate-600">1 Periode</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {formatIDR(viewingInvoice.amount)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="p-3.5 font-bold text-slate-700 text-right">
                        Total Pembayaran
                      </td>
                      <td className="p-3.5 font-black text-slate-900 text-right text-sm">
                        {formatIDR(viewingInvoice.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer Note */}
              <div className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
                <p>
                  Faktur ini diterbitkan secara otomatis oleh sistem penagihan digital Waply dan sah tanpa tanda tangan basah.
                  Terima kasih telah mempercayakan infrastruktur WhatsApp Gateway bisnis Anda kepada Waply.
                </p>
              </div>
            </div>
          </div>
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
