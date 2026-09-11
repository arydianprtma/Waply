"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Zap,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  MessageSquare,
  Sparkles,
  Lock,
  Tag,
  ArrowRight,
  Radio,
  ChevronRight,
  Bot,
  ScrollText,
  Clock,
  Layers,
  AlertCircle,
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  RefreshCw,
  HelpCircle,
  Server,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus,
  KeyRound,
  LogOut,
  Loader2,
  PlusCircle,
  Timer,
} from "lucide-react";
import {
  type Plan,
  type PlanId,
  DEFAULT_PLANS,
  getPlanDetailedFeatureList,
  getPlanDiscountStatus,
} from "@/lib/billing-types";
import { AddonItem } from "@/lib/addon-types";
import { WaplyLogo } from "@/components/brand/WaplyLogo";
import { PromoCountdownTimer } from "@/components/ui/PromoCountdownTimer";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { PaymentChargeData } from "@/components/order/DirectPaymentModal";

const DirectPaymentModal = dynamic(
  () => import("@/components/order/DirectPaymentModal"),
  { ssr: false }
);

type PaymentMethodOption =
  | "qris"
  | "bca_va"
  | "mandiri_va"
  | "bri_va"
  | "bni_va"
  | "permata_va"
  | "cimb_va"
  | "gopay"
  | "shopeepay"
  | "snap";

const PAYMENT_CHANNELS_DATA: Record<
  string,
  {
    name: string;
    description: string;
    badge?: string;
    icon: (cls: string) => React.ReactNode;
    colorCls: string;
  }
> = {
  qris: {
    name: "QRIS Nasional",
    description: "BCA Mobile, GoPay, OVO, Dana, ShopeePay, Mandiri Livin, BRImo, dll.",
    badge: "TERCEPAT & PRAKTIS",
    icon: (cls) => <QrCode className={cls} />,
    colorCls: "text-emerald-600",
  },
  bca_va: {
    name: "BCA Virtual Account",
    description: "Transfer via BCA Mobile, myBCA, KlikBCA, atau ATM BCA.",
    badge: "POPULER",
    icon: (cls) => <Building2 className={cls} />,
    colorCls: "text-blue-600",
  },
  mandiri_va: {
    name: "Mandiri Bill / VA",
    description: "Transfer via Livin by Mandiri atau ATM Mandiri.",
    icon: (cls) => <Building2 className={cls} />,
    colorCls: "text-amber-600",
  },
  bri_va: {
    name: "BRI (BRIVA)",
    description: "Transfer via BRImo, Internet Banking BRI, atau ATM BRI.",
    icon: (cls) => <Building2 className={cls} />,
    colorCls: "text-sky-600",
  },
  bni_va: {
    name: "BNI Virtual Account",
    description: "Transfer via BNI Mobile Banking atau ATM BNI.",
    icon: (cls) => <Building2 className={cls} />,
    colorCls: "text-orange-600",
  },
  permata_va: {
    name: "Permata Virtual Account",
    description: "Transfer via PermataMobile X, PermataNet, atau ATM Permata.",
    icon: (cls) => <Building2 className={cls} />,
    colorCls: "text-purple-600",
  },
  cimb_va: {
    name: "CIMB Virtual Account",
    description: "Transfer via OCTO Mobile, OCTO Clicks, atau ATM CIMB Niaga.",
    icon: (cls) => <Building2 className={cls} />,
    colorCls: "text-red-600",
  },
  gopay: {
    name: "GoPay & QRIS",
    description: "Bayar instan via aplikasi GoPay atau scan QR.",
    icon: (cls) => <Smartphone className={cls} />,
    colorCls: "text-emerald-600",
  },
  shopeepay: {
    name: "ShopeePay & QRIS",
    description: "Bayar instan via aplikasi ShopeePay atau scan QR.",
    icon: (cls) => <Smartphone className={cls} />,
    colorCls: "text-orange-500",
  },
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function OrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Selected plan from URL or default
  const rawPlanParam = searchParams.get("plan") || "STARTER";
  const initialPlanId = rawPlanParam.toUpperCase().replace(/\s+/g, "_");

  const rawModeParam = searchParams.get("mode");
  const rawAddonParam = searchParams.get("addon") || searchParams.get("addons");
  const [checkoutMode, setCheckoutMode] = useState<"PLAN" | "ADDON">(
    rawModeParam === "addon" || (!searchParams.get("plan") && Boolean(rawAddonParam))
      ? "ADDON"
      : "PLAN"
  );

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    DEFAULT_PLANS[initialPlanId] ? initialPlanId : "STARTER"
  );
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>("qris");
  const [enabledChannels, setEnabledChannels] = useState<string[]>([
    "qris",
    "bca_va",
    "mandiri_va",
    "bri_va",
    "bni_va",
    "gopay",
    "snap",
  ]);

  // User Auth & Session State
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loggedInUser, setLoggedInUser] = useState<{ id?: string; name?: string; email?: string; role?: string } | null>(null);

  // Customer Form
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [customerConfirmPassword, setCustomerConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Voucher Promo
  const [couponInput, setCouponInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
    message?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Order & Modal State
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Record<string, Plan>>(DEFAULT_PLANS);
  const [availableAddons, setAvailableAddons] = useState<AddonItem[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"NEW" | "RENEW" | "ADDON_DEVICE" | "ADDON_QUOTA" | "INVOICES">("NEW");
  
  // Custom Payment Modal State
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [chargeData, setChargeData] = useState<PaymentChargeData | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [originUrl, setOriginUrl] = useState<string>("http://localhost:3001");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // Load plans and user profile with dedicated loading state
  useEffect(() => {
    fetch("/api/billing/plans", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setPlans(json.data);
        }
      })
      .catch(() => {});

    setIsLoadingUser(true);
    Promise.allSettled([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([meRes, settingsRes]) => {
        if (meRes.status === "fulfilled" && meRes.value?.success && meRes.value?.user) {
          const u = meRes.value.user;
          if (u.email && u.email !== "guest@waply.id" && u.id && u.id !== "usr_default_guest") {
            setIsLoggedIn(true);
            setLoggedInUser(u);
            if (u.name && u.name !== "Waply User") setCustomerName(u.name);
            setCustomerEmail(u.email);
          }
        }

        if (settingsRes.status === "fulfilled" && settingsRes.value?.success && settingsRes.value?.data?.profile) {
          const p = settingsRes.value.data.profile;
          if (p.name) setCustomerName((prev) => prev || p.name);
          if (p.email && p.email !== "guest@waply.id") {
            setCustomerEmail((prev) => prev || p.email);
          }
          if (p.phone || p.whatsapp) {
            setCustomerPhone((prev) => prev || p.phone || p.whatsapp);
          }
        }
      })
      .finally(() => {
        setIsLoadingUser(false);
      });

    // Fetch addons catalog
    fetch("/api/addons")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.catalog)) {
          setAvailableAddons(json.data.catalog);
          const addonParam = searchParams.get("addon") || searchParams.get("addons");
          if (addonParam) {
            const requested = addonParam.split(",").map((s) => s.trim().toUpperCase());
            const valid = json.data.catalog.filter((a: any) => requested.includes(a.id.toUpperCase())).map((a: any) => a.id);
            if (valid.length > 0) {
              setSelectedAddonIds(valid);
            }
          }
        }
      })
      .catch(() => {});

    // Fetch active payment methods configured in admin settings
    fetch("/api/billing/payment-methods", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.enabledChannels)) {
          setEnabledChannels(json.enabledChannels);
          setSelectedMethod((prev) => {
            if (json.enabledChannels.includes(prev)) return prev;
            const firstDirect = json.enabledChannels.find((ch: string) => ch !== "snap");
            return (firstDirect as PaymentMethodOption) || (json.enabledChannels.includes("snap") ? "snap" : "qris");
          });
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const handleSwitchAccount = () => {
    setIsLoggedIn(false);
    setLoggedInUser(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerPassword("");
    setCustomerConfirmPassword("");
  };

  // Filter active paid plans for Section 3
  const activePlansList = Object.values(plans).filter((p) => {
    if (p.isActive === false) return false;
    if (p.id === "FREE") return false;
    if (p.id.startsWith("YEARLY_")) return false;
    return true;
  });

  useEffect(() => {
    if (rawPlanParam) {
      const clean = rawPlanParam.toUpperCase().replace(/\s+/g, "_");
      const matched = Object.keys(plans).find(
        (k) => k.toUpperCase() === clean || plans[k]?.id?.toUpperCase() === clean
      );
      if (matched) {
        setSelectedPlanId(matched);
        return;
      }
    }
    if (activePlansList.length > 0 && !activePlansList.some((p) => p.id === selectedPlanId)) {
      setSelectedPlanId(activePlansList[0].id);
    }
  }, [rawPlanParam, plans]);

  // Current active plan
  const currentPlan =
    plans[selectedPlanId] ||
    activePlansList.find((p) => p.id === selectedPlanId) ||
    activePlansList[0] ||
    DEFAULT_PLANS[selectedPlanId] ||
    DEFAULT_PLANS.STARTER;
  
  const planPeriod = currentPlan.period || "month";
  const effectiveDurationMonths: number =
    planPeriod === "year"
      ? durationMonths === 24 || durationMonths === 36
        ? durationMonths
        : 12
      : planPeriod === "day" || planPeriod === "week"
      ? 1
      : durationMonths;

  const isAddonMode = checkoutMode === "ADDON";

  const currentPlanDiscount = getPlanDiscountStatus(currentPlan);
  const planUnitPrice = currentPlanDiscount.isDiscountActive
    ? currentPlan.price
    : (currentPlan.originalPrice || currentPlan.price);

  // Price calculations
  let basePrice = 0;
  if (!isAddonMode) {
    if (planPeriod === "year") {
      const years = Math.max(1, Math.round(effectiveDurationMonths / 12));
      basePrice = planUnitPrice * years;
    } else if (planPeriod === "month") {
      basePrice = planUnitPrice * durationMonths;
    } else {
      basePrice = planUnitPrice;
    }
  }

  const addonsTotal = selectedAddonIds.reduce((sum, id) => {
    const item = availableAddons.find((a) => a.id === id);
    return sum + (item ? item.price : 0);
  }, 0);

  const durationDiscount = 0;
  const subtotalAfterDuration = isAddonMode ? addonsTotal : basePrice;

  // Dynamic Voucher discount calculation
  let couponDiscount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountType === "PERCENTAGE") {
      couponDiscount = Math.round((subtotalAfterDuration * appliedVoucher.discountValue) / 100);
    } else {
      couponDiscount = Math.min(appliedVoucher.discountValue, subtotalAfterDuration);
    }
  }

  const finalTotal = Math.max(isAddonMode && addonsTotal === 0 ? 0 : 1000, subtotalAfterDuration - couponDiscount);

  // Dynamic Apply Voucher Handler
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;

    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: clean,
          planId: selectedPlanId,
          durationMonths,
          orderAmount: subtotalAfterDuration,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAppliedVoucher(json.data);
        setCouponError(null);
      } else {
        setAppliedVoucher(null);
        setCouponError(json.error || "Kode voucher tidak valid atau tidak memenuhi syarat.");
      }
    } catch (err: any) {
      setCouponError(err.message || "Gagal memvalidasi voucher");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedVoucher(null);
    setCouponInput("");
    setCouponError(null);
  };

  // Main Checkout Handler
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = customerEmail.trim().toLowerCase();
    const cleanName = customerName.trim() || cleanEmail.split("@")[0] || "Waply User";
    const cleanPhone = customerPhone.trim();

    if (!cleanEmail) {
      setFormError("Silakan masukkan alamat email Anda untuk menerima tagihan dan bukti pembayaran.");
      return;
    }

    if (isAddonMode && selectedAddonIds.length === 0) {
      setFormError("Silakan pilih minimal 1 addon tambahan untuk melanjutkan pembayaran.");
      return;
    }

    // If user is not logged in, require creating password
    if (!isLoggedIn) {
      if (!customerName.trim()) {
        setFormError("Silakan masukkan Nama Lengkap Anda.");
        return;
      }
      if (!customerPassword || customerPassword.length < 6) {
        setFormError("Silakan buat password baru minimal 6 karakter untuk akun Waply Anda.");
        return;
      }
      if (customerConfirmPassword && customerPassword !== customerConfirmPassword) {
        setFormError("Konfirmasi password tidak sesuai dengan password yang dimasukkan.");
        return;
      }
    }

    setLoading(true);

    // Auto-register session for guest/new user
    if (!isLoggedIn) {
      try {
        const maxAge = 60 * 60 * 24 * 7;
        document.cookie = `waply_demo_auth=true; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `waply_user_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `waply_user_name=${encodeURIComponent(cleanName)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `waply_user_role=user; path=/; max-age=${maxAge}; SameSite=Lax`;

        if (isSupabaseConfigured() && customerPassword) {
          const supabase = createClient();
          const origin =
            typeof window !== "undefined" &&
            !window.location.hostname.includes("0.0.0.0") &&
            !window.location.hostname.includes("localhost")
              ? window.location.origin
              : (process.env.NEXT_PUBLIC_APP_URL || "https://ardp.my.id");
          const redirectUrl = `${origin.replace(/\/$/, "")}/auth/callback?next=/dashboard/billing`;

          supabase.auth.signUp({
            email: cleanEmail,
            password: customerPassword,
            options: {
              data: {
                name: cleanName,
                phone: cleanPhone || undefined,
              },
              emailRedirectTo: redirectUrl,
            },
          }).catch(() => {});
        }
      } catch {}
    }

    // Free plan direct activation (No payment required)
    if (!isAddonMode && currentPlan.price === 0) {
      setLoading(false);
      router.push("/dashboard?welcome=free");
      return;
    }

    // If Snap fallback chosen
    if (selectedMethod === "snap") {
      try {
        if (typeof window !== "undefined" && !window.snap) {
          await new Promise<void>((resolve) => {
            const script = document.createElement("script");
            script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
            script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "");
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
          });
        }

        const res = await fetch("/api/billing/create-transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isAddonOnly: isAddonMode,
            planId: isAddonMode ? "ADDON" : selectedPlanId,
            durationMonths: isAddonMode ? 0 : effectiveDurationMonths,
            selectedAddonIds: isAddonMode ? selectedAddonIds : [],
            customerName: cleanName,
            customerEmail: cleanEmail,
            customerPhone: cleanPhone,
            couponCode: appliedVoucher?.code || undefined,
          }),
        });

        const json = await res.json();
        if (!json.success) {
          setFormError(json.error || "Gagal membuat transaksi. Silakan coba lagi.");
          return;
        }

        const { snapToken, orderId } = json.data;
        if (window.snap) {
          window.snap.pay(snapToken, {
            onSuccess: async () => {
              await fetch("/api/billing/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
              });
              router.push("/dashboard/billing?payment=finish");
            },
            onPending: () => {
              router.push("/dashboard/billing?payment=pending");
            },
            onClose: () => {
              setLoading(false);
            },
          });
        }
      } catch (err: any) {
        setFormError(err.message || "Gagal memproses checkout. Silakan periksa koneksi Anda.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Direct Midtrans Core API Charge (Waply Custom UI)
    try {
      let paymentType = "qris";
      let bank: string | undefined = undefined;

      if (selectedMethod === "qris") {
        paymentType = "qris";
      } else if (selectedMethod === "bca_va") {
        paymentType = "bank_transfer";
        bank = "bca";
      } else if (selectedMethod === "mandiri_va") {
        paymentType = "bank_transfer";
        bank = "mandiri";
      } else if (selectedMethod === "bri_va") {
        paymentType = "bank_transfer";
        bank = "bri";
      } else if (selectedMethod === "bni_va") {
        paymentType = "bank_transfer";
        bank = "bni";
      } else if (selectedMethod === "permata_va") {
        paymentType = "bank_transfer";
        bank = "permata";
      } else if (selectedMethod === "cimb_va") {
        paymentType = "bank_transfer";
        bank = "cimb";
      } else if (selectedMethod === "gopay") {
        paymentType = "gopay";
      } else if (selectedMethod === "shopeepay") {
        paymentType = "shopeepay";
      }

      const res = await fetch("/api/billing/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAddonOnly: isAddonMode,
          planId: isAddonMode ? "ADDON" : selectedPlanId,
          durationMonths: isAddonMode ? 0 : effectiveDurationMonths,
          selectedAddonIds: isAddonMode ? selectedAddonIds : [],
          paymentType,
          bank,
          customerName: cleanName,
          customerEmail: cleanEmail,
          customerPhone: cleanPhone,
          couponCode: appliedVoucher?.code || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Gagal memproses pembayaran. Silakan coba beberapa saat lagi.");
        return;
      }

      setChargeData(json.data);
      setPaymentSuccess(false);
      setCustomModalOpen(true);
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan saat memproses order. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const detailedFeatures = getPlanDetailedFeatureList(currentPlan);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <WaplyLogo href="/" size="md" />

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/" className="text-slate-600 hover:text-slate-900 hidden sm:inline">
              Kembali ke Beranda
            </Link>
            <Link
              href="/dashboard"
              className="btn btn-primary btn-sm rounded-xl text-white shadow-sm shadow-primary/25"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Breadcrumb & Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
            <Link href="/" className="hover:text-slate-600">Beranda</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/#pricing" className="hover:text-slate-600">Paket</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold">Order & Aktivasi</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Aktivasi Langganan Paket Waply
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Lengkapi formulir pesanan di bawah ini untuk aktivasi cloud WhatsApp Gateway & akses API instan.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold self-start md:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gateway Server: Online & Siap Digunakan
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Form & Options on Left, Sidebar & Summary on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Order Form */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleCheckout} className="space-y-6">
              {/* SECTION 1: Informasi Pelanggan & Akun */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden min-h-[360px]">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isLoggedIn ? (
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <UserPlus className="w-4 h-4 text-primary" />
                    )}
                    <h2 className="font-extrabold text-sm text-slate-900">
                      1. Informasi Kostumer / Akun
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    {isLoadingUser ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                        Sinkronisasi Sesi...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-500" />
                        Aktivasi Otomatis
                      </>
                    )}
                  </span>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  {isLoggedIn ? (
                    /* STATE 2: Logged In User */
                    <div className="space-y-4">
                      {/* Connected Account Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/50 border border-emerald-200/90 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {(customerName || customerEmail || "U")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 truncate">
                                {customerName || "Waply User"}
                              </span>
                              <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                                Akun Terhubung
                              </span>
                            </div>
                            <span className="text-xs text-slate-600 font-mono truncate block">
                              {customerEmail}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSwitchAccount}
                          className="self-stretch sm:self-auto justify-center text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white/80 hover:bg-white border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
                        >
                          <LogOut className="w-3 h-3" />
                          Ganti / Daftar Akun Lain
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nama Lengkap */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Nama Lengkap</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Budi Pratama"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="input input-bordered input-sm w-full rounded-xl text-xs bg-white"
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Alamat Email</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-emerald-600 font-bold shrink-0">
                              Terverifikasi
                            </span>
                          </div>
                          <input
                            type="email"
                            required
                            placeholder="contoh@bisnis.id"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="input input-bordered input-sm w-full rounded-xl text-xs bg-white"
                          />
                        </div>
                      </div>

                      {/* Optional WhatsApp / Phone Number */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Nomor WhatsApp / HP</span>
                            <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline shrink-0">
                            Kontak bantuan & support
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Contoh: 081234567890 (opsional)"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="input input-bordered input-sm w-full rounded-xl text-xs font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Rincian tagihan & kwitansi pembayaran akan otomatis dikirim ke email <strong>{customerEmail}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* STATE 3: Guest / New User (Register + Checkout Sekaligus) */
                    <div className="space-y-4">
                      {/* Register Banner */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 border border-blue-200/80 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 mt-0.5 sm:mt-0">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="text-xs font-black text-slate-900">
                                1-Step Checkout & Buat Akun
                              </span>
                              <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                                Akun Baru
                              </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                              Lengkapi formulir & buat password untuk aktivasi akun instan Anda.
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/login?redirectTo=${encodeURIComponent("/order" + (selectedPlanId ? `?plan=${selectedPlanId}` : ""))}`}
                          className="self-stretch sm:self-auto justify-center text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 shrink-0 text-center"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Sudah Punya Akun? Masuk
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nama Lengkap */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Nama Lengkap / Bisnis</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Budi Pratama"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="input input-bordered input-sm w-full rounded-xl text-xs"
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Alamat Email</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-normal shrink-0">
                              Username akun Anda
                            </span>
                          </div>
                          <input
                            type="email"
                            required
                            placeholder="nama@bisnis.id"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="input input-bordered input-sm w-full rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      {/* Password Creation Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {/* Buat Password */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Buat Password Baru</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-normal shrink-0">
                              Min. 6 karakter
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              minLength={6}
                              placeholder="••••••••"
                              value={customerPassword}
                              onChange={(e) => setCustomerPassword(e.target.value)}
                              className="input input-bordered input-sm w-full rounded-xl text-xs pl-3 pr-9"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 focus:outline-none"
                              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Konfirmasi Password */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Konfirmasi Password</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            {customerPassword && customerConfirmPassword && (
                              <span className={`text-[10px] font-bold shrink-0 ${customerPassword === customerConfirmPassword ? "text-emerald-600" : "text-rose-500"}`}>
                                {customerPassword === customerConfirmPassword ? "Cocok" : "Tidak cocok"}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              required
                              minLength={6}
                              placeholder="••••••••"
                              value={customerConfirmPassword}
                              onChange={(e) => setCustomerConfirmPassword(e.target.value)}
                              className={`input input-bordered input-sm w-full rounded-xl text-xs pl-3 pr-9 ${
                                customerConfirmPassword && customerPassword !== customerConfirmPassword
                                  ? "border-rose-400 focus:border-rose-500"
                                  : ""
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 focus:outline-none"
                              aria-label={showConfirmPassword ? "Sembunyikan password" : "Lihat password"}
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Optional WhatsApp / Phone Number */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Nomor WhatsApp / HP</span>
                            <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline shrink-0">
                            Kontak bantuan & support
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Contoh: 081234567890 (opsional)"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="input input-bordered input-sm w-full rounded-xl text-xs font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Setelah pembayaran, Anda dapat langsung login ke Dashboard menggunakan email & password di atas.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Pilihan Metode Pembayaran (Custom Waply UI Options) */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h2 className="font-extrabold text-sm text-slate-900">
                      2. Pilih Metode Pembayaran
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                    Midtrans Powered
                  </span>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  {(!isAddonMode && currentPlan.price === 0) ? (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Paket Ini 100% Gratis (Rp 0)</p>
                        <p className="text-emerald-700 mt-0.5">
                          Anda tidak memerlukan metode pembayaran. Cukup klik tombol aktivasi di bawah untuk langsung menggunakan akun.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(() => {
                          const activeChannelKeys = Object.keys(PAYMENT_CHANNELS_DATA).filter((k) =>
                            enabledChannels.includes(k)
                          );
                          const channelsToRender =
                            activeChannelKeys.length > 0
                              ? activeChannelKeys
                              : ["qris", "bca_va", "mandiri_va", "bri_va", "bni_va", "gopay"];

                          return channelsToRender.map((channelKey) => {
                            const ch = PAYMENT_CHANNELS_DATA[channelKey];
                            if (!ch) return null;
                            const isSelected = selectedMethod === channelKey;

                            return (
                              <button
                                key={channelKey}
                                type="button"
                                onClick={() => setSelectedMethod(channelKey as PaymentMethodOption)}
                                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                                  isSelected
                                    ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {ch.badge && (
                                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                                    {ch.badge}
                                  </span>
                                )}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                                      {ch.icon(`w-4 h-4 ${ch.colorCls}`)} {ch.name}
                                    </span>
                                    <div
                                      className={`w-3.5 h-3.5 rounded-full border ${
                                        isSelected
                                          ? "border-emerald-600 bg-emerald-600"
                                          : "border-slate-300"
                                      }`}
                                    />
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    {ch.description}
                                  </p>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>

                      {enabledChannels.includes("snap") && (
                        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                          <span>Ingin bayar dengan Kartu Kredit atau saluran lain?</span>
                          <button
                            type="button"
                            onClick={() => setSelectedMethod("snap")}
                            className={`font-bold hover:underline ${selectedMethod === "snap" ? "text-primary font-black" : "text-slate-600"}`}
                          >
                            {selectedMethod === "snap" ? "✓ Mode Snap Modal Aktif" : "Buka Midtrans Snap Klasik"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ORDER TYPE SELECTOR: Paket Langganan Utama VS Beli Addon & Top-Up */}
              <div className="bg-slate-100 p-1.5 rounded-3xl border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCheckoutMode("PLAN")}
                  className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                    checkoutMode === "PLAN"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Layers className={`w-4 h-4 ${checkoutMode === "PLAN" ? "text-emerald-600" : "text-slate-400"}`} />
                  <span>Paket Langganan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutMode("ADDON")}
                  className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                    checkoutMode === "ADDON"
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <PlusCircle className={`w-4 h-4 ${checkoutMode === "ADDON" ? "text-amber-300" : "text-slate-400"}`} />
                  <span>Beli Addon & Top-Up</span>
                </button>
              </div>

              {checkoutMode === "PLAN" ? (
                <>
                  {/* SECTION 3: Pemilihan Paket Layanan (Plan Tier Switcher) */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary shrink-0" />
                        <h2 className="font-extrabold text-sm text-slate-900">
                          3. Pilih Paket Layanan Waply
                        </h2>
                      </div>
                      <span className="text-[11px] text-primary font-bold shrink-0">
                        Cloud Hosted Ready
                      </span>
                    </div>

                    <div className="p-4 sm:p-6 min-h-[140px]">
                      {activePlansList.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">
                          Memuat daftar paket layanan...
                        </div>
                      ) : (
                        <div
                          className={`grid grid-cols-1 gap-3.5 ${
                            activePlansList.length === 1
                              ? "sm:grid-cols-1 max-w-sm mx-auto"
                              : activePlansList.length === 2
                              ? "sm:grid-cols-2"
                              : activePlansList.length === 4
                              ? "sm:grid-cols-2 lg:grid-cols-4"
                              : "sm:grid-cols-3"
                          }`}
                        >
                          {activePlansList.map((p) => {
                            const isSelected = selectedPlanId === p.id;
                            const pDiscount = getPlanDiscountStatus(p);
                            const hasDiscount = pDiscount.isDiscountActive && Boolean(pDiscount.originalPrice && pDiscount.originalPrice > p.price);
                            const periodSuffix =
                              p.period === "day"
                                ? "/ hr"
                                : p.period === "week"
                                ? "/ mgg"
                                : p.period === "year"
                                ? "/ thn"
                                : "/ bln";
                            const periodFull =
                              p.period === "day"
                                ? "hari"
                                : p.period === "week"
                                ? "minggu"
                                : p.period === "year"
                                ? "tahun"
                                : "bulan";
                            const msgLimit =
                              p.monthlyMessages === -1
                                ? "Unlimited"
                                : `${p.monthlyMessages.toLocaleString("id-ID")}`;

                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPlanId(p.id)}
                                className={`p-4 rounded-2xl border text-left transition-all relative ${
                                  isSelected
                                    ? "bg-emerald-50/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                }`}
                              >
                                {pDiscount.hasTimer && pDiscount.isDiscountActive ? (
                                  <span className={`absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tight flex items-center gap-1 shadow-xs ${
                                    pDiscount.isUrgentCountdown
                                      ? "bg-rose-600 text-white animate-pulse"
                                      : "bg-amber-500 text-white"
                                  }`}>
                                    <Timer className="w-2.5 h-2.5" />
                                    <span>{pDiscount.isUrgentCountdown ? `SISA ${pDiscount.countdownFormatted}` : `PROMO ${pDiscount.countdownFormatted}`}</span>
                                  </span>
                                ) : p.isPopular ? (
                                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-primary text-white shadow-xs">
                                    POPULER
                                  </span>
                                ) : null}

                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-black text-sm text-slate-900">{p.name}</span>
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      isSelected ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                  </div>
                                </div>

                                {hasDiscount && (
                                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    <span className="text-xs text-slate-400 line-through font-medium">
                                      {formatIDR(pDiscount.originalPrice!)}
                                    </span>
                                    {pDiscount.discountBadge ? (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200/60 rounded">
                                        {pDiscount.discountBadge}
                                      </span>
                                    ) : pDiscount.discountPercent ? (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200/60 rounded">
                                        -{pDiscount.discountPercent}%
                                      </span>
                                    ) : null}
                                  </div>
                                )}

                                <div className="text-base font-black text-slate-900">
                                  {formatIDR(pDiscount.effectivePrice)}
                                  <span className="text-[10px] text-slate-400 font-normal"> {periodSuffix}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                                  <div>• {p.maxDevices} Device WhatsApp</div>
                                  <div>• {msgLimit} Pesan / {periodFull}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 4: Pilihan Durasi Berlangganan (Billing Cycle) */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                        <h2 className="font-extrabold text-sm text-slate-900">
                          4. Durasi Berlangganan
                        </h2>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        {currentPlan.price === 0
                          ? "Akses Gratis (Rp 0)"
                          : planPeriod === "year"
                          ? "Paket Tahunan (365 Hari)"
                          : planPeriod === "day"
                          ? "Paket Harian (1 Hari)"
                          : planPeriod === "week"
                          ? "Paket Mingguan (7 Hari)"
                          : "Pilihan Durasi"}
                      </span>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3">
                      {currentPlan.price === 0 ? (
                        <div className="p-4 rounded-2xl border bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">Aktivasi Gratis (Free Trial)</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white">
                                GRATIS
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Paket uji coba gratis tanpa biaya tagihan dan tanpa perlu memilih opsi durasi berulang.
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-black text-emerald-600">
                              Rp 0
                            </div>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {planPeriod === "day" ? "/ hari" : planPeriod === "year" ? "/ tahun" : "/ bulan"}
                            </span>
                          </div>
                        </div>
                      ) : planPeriod === "year" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          {[
                            { months: 12, label: "1 Tahun (12 Bulan)", sub: "Durasi 1 Tahun Penuh", multiplier: 1 },
                            { months: 24, label: "2 Tahun (24 Bulan)", sub: "Durasi 2 Tahun Penuh", multiplier: 2 },
                            { months: 36, label: "3 Tahun (36 Bulan)", sub: "Durasi 3 Tahun Penuh", multiplier: 3 },
                          ].map((item) => {
                            const isSelected = effectiveDurationMonths === item.months;
                            return (
                              <button
                                key={item.months}
                                type="button"
                                onClick={() => setDurationMonths(item.months)}
                                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
                                  isSelected
                                    ? "bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-xs text-slate-900">{item.label}</span>
                                  <div
                                    className={`w-3.5 h-3.5 rounded-full border ${
                                      isSelected ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                                    }`}
                                  />
                                </div>
                                <div className="text-sm font-black text-slate-900">
                                  {formatIDR(currentPlan.price * item.multiplier)}
                                </div>
                                <span className="text-[10px] text-slate-400">{item.sub}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : planPeriod === "day" ? (
                        <div className="p-4 rounded-2xl border bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">1 Hari (24 Jam)</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-primary text-white">
                                PAKET HARIAN
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Periode aktif 1 hari (24 jam) sejak aktivasi.
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-black text-slate-900">
                              {formatIDR(currentPlan.price)}
                            </div>
                            <span className="text-[11px] text-slate-400 font-normal">/ hari</span>
                          </div>
                        </div>
                      ) : planPeriod === "week" ? (
                        <div className="p-4 rounded-2xl border bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">1 Minggu (7 Hari)</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-primary text-white">
                                PAKET MINGGUAN
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Periode aktif 7 hari penuh sejak aktivasi.
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-black text-slate-900">
                              {formatIDR(currentPlan.price)}
                            </div>
                            <span className="text-[11px] text-slate-400 font-normal">/ minggu</span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                          {[
                            { months: 1, label: "1 Bulan", sub: "Durasi 1 Bulan" },
                            { months: 3, label: "3 Bulan", sub: "Durasi 3 Bulan" },
                            { months: 6, label: "6 Bulan", sub: "Durasi 6 Bulan" },
                            { months: 12, label: "12 Bulan", sub: "Durasi 1 Tahun Penuh" },
                            { months: 24, label: "24 Bulan", sub: "Durasi 2 Tahun Penuh" },
                          ].map((item) => {
                            const isSelected = durationMonths === item.months;
                            return (
                              <button
                                key={item.months}
                                type="button"
                                onClick={() => setDurationMonths(item.months)}
                                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
                                  isSelected
                                    ? "bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-xs text-slate-900">{item.label}</span>
                                  <div
                                    className={`w-3.5 h-3.5 rounded-full border ${
                                      isSelected ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                                    }`}
                                  />
                                </div>
                                <div className="text-sm font-black text-slate-900">
                                  {formatIDR(currentPlan.price * item.months)}
                                </div>
                                <span className="text-[10px] text-slate-400">{item.sub}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 5: Fitur Layanan yang Didapatkan */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <h3 className="font-extrabold text-sm text-slate-900">
                          Fitur & Akses{" "}
                          {currentPlan.name.toLowerCase().startsWith("paket")
                            ? currentPlan.name
                            : `Paket ${currentPlan.name}`}
                        </h3>
                      </div>
                      {(() => {
                        const totalFeatures = detailedFeatures.length;
                        const includedFeatures = detailedFeatures.filter((f) => f.included).length;
                        const isFull = includedFeatures === totalFeatures;
                        return isFull ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Akses Penuh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {includedFeatures} dari {totalFeatures} Fitur Aktif
                          </span>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {detailedFeatures.map((feat, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                            feat.included
                              ? "bg-slate-50/80 border-slate-200/80 text-slate-800 font-medium"
                              : "bg-slate-50/30 border-slate-100 text-slate-400 line-through opacity-60"
                          }`}
                        >
                          {feat.included ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] shrink-0 font-black">
                              ✕
                            </span>
                          )}
                          <span className="truncate">{feat.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-[11px] text-slate-600 flex items-center gap-2 font-mono">
                      <Server className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        REST API Base Endpoint: <strong>{originUrl}/api/v1/messages/send</strong>
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* ADDON ONLY CHECKOUT SECTIONS */
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-6">
                  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                          3. Pilih Addon Ekstra & Top-Up
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pilih kuota atau perangkat tambahan yang ingin langsung ditambahkan ke akun Anda
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      {selectedAddonIds.length} Addon Dipilih
                    </span>
                  </div>

                  {availableAddons.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Belum ada Addon yang tersedia untuk dibeli saat ini.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Device Addons */}
                      {availableAddons.some((a) => a.type === "DEVICE") && (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-600" />
                            <span>Slot Perangkat WhatsApp Tambahan</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {availableAddons
                              .filter((a) => a.type === "DEVICE")
                              .map((addon) => {
                                const isSelected = selectedAddonIds.includes(addon.id);
                                return (
                                  <button
                                    key={addon.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedAddonIds((prev) =>
                                        prev.includes(addon.id)
                                          ? prev.filter((id) => id !== addon.id)
                                          : [...prev, addon.id]
                                      );
                                    }}
                                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                                      isSelected
                                        ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    {addon.badge && (
                                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 shadow-2xs">
                                        {addon.badge}
                                      </span>
                                    )}
                                    <div className="flex items-center justify-between mb-1.5 pr-14">
                                      <span className="font-extrabold text-xs text-slate-900">{addon.name}</span>
                                    </div>
                                    <div className="text-base font-black text-emerald-600">
                                      {formatIDR(addon.price)}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                      {addon.description || `+${addon.amount} Device WhatsApp`}
                                    </p>
                                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold">
                                      <div
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                          isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
                                        }`}
                                      >
                                        {isSelected && "✓"}
                                      </div>
                                      <span className={isSelected ? "text-emerald-700 font-black" : "text-slate-500"}>
                                        {isSelected ? "Dipilih" : "Pilih Addon"}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Message Quota Addons */}
                      {availableAddons.some((a) => a.type === "MESSAGES") && (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span>Kuota Pesan / Chat Tambahan</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {availableAddons
                              .filter((a) => a.type === "MESSAGES")
                              .map((addon) => {
                                const isSelected = selectedAddonIds.includes(addon.id);
                                return (
                                  <button
                                    key={addon.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedAddonIds((prev) =>
                                        prev.includes(addon.id)
                                          ? prev.filter((id) => id !== addon.id)
                                          : [...prev, addon.id]
                                      );
                                    }}
                                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                                      isSelected
                                        ? "bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    {addon.badge && (
                                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-800 shadow-2xs">
                                        {addon.badge}
                                      </span>
                                    )}
                                    <div className="flex items-center justify-between mb-1.5 pr-14">
                                      <span className="font-extrabold text-xs text-slate-900">{addon.name}</span>
                                    </div>
                                    <div className="text-base font-black text-blue-600">
                                      {formatIDR(addon.price)}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                      {addon.description || `+${addon.amount.toLocaleString("id-ID")} Pesan`}
                                    </p>
                                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold">
                                      <div
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                          isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                                        }`}
                                      >
                                        {isSelected && "✓"}
                                      </div>
                                      <span className={isSelected ? "text-blue-700 font-black" : "text-slate-500"}>
                                        {isSelected ? "Dipilih" : "Pilih Addon"}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Addon Info Note */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Aktivasi Kuota Instan
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      Kapasitas slot device dan kuota pesan dari Addon ini akan langsung ditambahkan ke akun Anda segera setelah pembayaran berhasil dikonfirmasi secara otomatis.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Column (4 cols): Sidebar Tabs + Order Summary */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Sidebar Navigation Tabs */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-3 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("NEW");
                  setCheckoutMode("PLAN");
                }}
                className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
                  checkoutMode === "PLAN"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Langganan Paket Utama
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("ADDON_DEVICE");
                  setCheckoutMode("ADDON");
                }}
                className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
                  checkoutMode === "ADDON"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                  Beli Addon & Top-Up
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("RENEW");
                  router.push("/dashboard/billing");
                }}
                className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-sky-500" />
                  Perpanjang Paket
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("INVOICES");
                  router.push("/dashboard/billing");
                }}
                className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Riwayat Invoice / Billing
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>

            {/* Order Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 sm:p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  {isAddonMode ? "Ringkasan Addon / Top-Up" : "Ringkasan Pesanan Paket"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAddonMode ? "Rincian kuota tambahan yang dibeli" : "Rincian tagihan langganan Anda"}
                </p>
              </div>

              {/* Selected Plan / Addon Details */}
              <div className="space-y-2 text-xs">
                {isAddonMode ? (
                  <>
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Tipe Order:</span>
                      <span className="text-emerald-600 font-black">Top-Up Addon Ekstra</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Metode Bayar:</span>
                      <span className="font-bold text-slate-900 uppercase">{selectedMethod.replace("_", " ")}</span>
                    </div>

                    <div className="space-y-1.5 py-2 border-y border-dashed border-slate-200">
                      <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
                        <span>Addon Dipilih ({selectedAddonIds.length}):</span>
                        <span className="text-emerald-600">{formatIDR(addonsTotal)}</span>
                      </div>
                      {selectedAddonIds.length === 0 ? (
                        <p className="text-[11px] text-amber-600 italic">
                          Belum ada addon yang dipilih. Silakan centang addon di atas.
                        </p>
                      ) : (
                        <div className="space-y-1 pl-1 text-[11px] text-slate-600">
                          {selectedAddonIds.map((id) => {
                            const item = availableAddons.find((a) => a.id === id);
                            if (!item) return null;
                            return (
                              <div key={id} className="flex items-center justify-between">
                                <span className="truncate max-w-[170px]">• {item.name}</span>
                                <span className="font-mono font-bold text-slate-800">{formatIDR(item.price)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Paket Layanan:</span>
                      <span className="text-primary font-black">Waply {currentPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Durasi Langganan:</span>
                      <span className="font-bold">
                        {planPeriod === "day"
                          ? "1 Hari (24 Jam)"
                          : planPeriod === "week"
                          ? "1 Minggu (7 Hari)"
                          : effectiveDurationMonths === 36
                          ? "36 Bulan (3 Tahun)"
                          : effectiveDurationMonths === 24
                          ? "24 Bulan (2 Tahun)"
                          : effectiveDurationMonths === 12
                          ? "12 Bulan (1 Tahun)"
                          : `${effectiveDurationMonths} Bulan`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Metode Bayar:</span>
                      <span className="font-bold text-slate-900 uppercase">{selectedMethod.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>
                        Harga{" "}
                        {planPeriod === "year"
                          ? `(${Math.max(1, Math.round(effectiveDurationMonths / 12))} thn)`
                          : planPeriod === "month"
                          ? `(${durationMonths} bln)`
                          : planPeriod === "day"
                          ? "(1 hr)"
                          : "(1 mgg)"}
                        :
                      </span>
                      <span>{formatIDR(basePrice)}</span>
                    </div>

                    {durationDiscount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 font-bold">
                        <span>Diskon Durasi ({durationMonths === 12 ? "20%" : "5%"}):</span>
                        <span>- {formatIDR(durationDiscount)}</span>
                      </div>
                    )}

                    {currentPlanDiscount.hasTimer && currentPlanDiscount.isDiscountActive && (
                      <div className="pt-1">
                        <PromoCountdownTimer status={currentPlanDiscount} variant="card" />
                      </div>
                    )}
                  </>
                )}

                {couponDiscount > 0 && appliedVoucher && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold">
                    <span>Diskon Voucher ({appliedVoucher.code}):</span>
                    <span>- {formatIDR(couponDiscount)}</span>
                  </div>
                )}
              </div>

              {/* Dynamic Coupon Voucher Input */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Punya Kode Kupon / Promo?
                </label>

                {!appliedVoucher ? (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: WAPLYHEMAT"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="input input-bordered input-sm flex-1 rounded-xl text-xs uppercase font-mono font-bold"
                      />
                      <button
                        type="submit"
                        disabled={validatingCoupon || !couponInput.trim()}
                        className="btn btn-sm btn-primary rounded-xl text-xs font-bold"
                      >
                        {validatingCoupon ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          "Terapkan"
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <div className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{couponError}</span>
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-emerald-900 flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {appliedVoucher.code}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        {appliedVoucher.name} • Hemat {formatIDR(couponDiscount)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="btn btn-ghost btn-xs text-slate-400 hover:text-rose-600 font-bold"
                      title="Hapus Voucher"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                  Total Tagihan Pembayaran
                </span>
                <div className="text-2xl font-black tracking-tight text-emerald-400">
                  {formatIDR(finalTotal)}
                </div>
                <p className="text-[10px] text-slate-400">
                  Termasuk PPN & biaya aktivasi otomatis 24/7
                </p>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 font-semibold">{formError}</div>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-rose-400 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Main Submit Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || (isAddonMode && selectedAddonIds.length === 0)}
                className="btn btn-primary btn-block rounded-2xl text-white font-extrabold shadow-lg shadow-primary/25 gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menghubungi Server...
                  </>
                ) : isAddonMode ? (
                  selectedAddonIds.length === 0 ? (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Pilih Minimal 1 Addon
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Bayar Addon ({selectedAddonIds.length} item) - {formatIDR(finalTotal)}
                    </>
                  )
                ) : currentPlan.price === 0 ? (
                  <>
                    <Zap className="w-4 h-4" />
                    Aktivasi Paket Gratis Sekarang
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Bayar Sekarang (Proses Otomatis)
                  </>
                )}
              </button>

              {/* Guarantees */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Enkripsi 256-Bit SSL Pembayaran Aman</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>Aktivasi Gateway Instan Tanpa Menunggu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Garansi Ketersediaan Server 99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Terenkripsi Aman dengan Midtrans</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* WAPLY CUSTOM PAYMENT MODAL (DIRECT CORE API UI - CODE SPLIT)            */}
      {/* ========================================================================= */}
      {customModalOpen && chargeData && (
        <DirectPaymentModal
          isOpen={customModalOpen}
          onClose={() => setCustomModalOpen(false)}
          chargeData={chargeData}
          customerEmail={customerEmail}
          selectedAddonIds={selectedAddonIds}
          availableAddons={availableAddons}
          isAddonMode={isAddonMode}
          currentPlan={currentPlan}
          effectiveDurationMonths={effectiveDurationMonths}
          paymentSuccess={paymentSuccess}
          setPaymentSuccess={setPaymentSuccess}
        />
      )}
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-xs font-bold gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          Memuat halaman order...
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}

