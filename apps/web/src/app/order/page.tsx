"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Download,
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
import { ModalPortal } from "@/components/ui/ModalPortal";
import { WaplyLogo } from "@/components/brand/WaplyLogo";
import { PromoCountdownTimer } from "@/components/ui/PromoCountdownTimer";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type PaymentMethodOption = "qris" | "bca_va" | "mandiri_va" | "bri_va" | "bni_va" | "gopay" | "snap";

interface PaymentChargeData {
  orderId: string;
  grossAmount: number;
  paymentType: string;
  bank?: string;
  qrCodeUrl?: string | null;
  qrString?: string | null;
  vaNumber?: string | null;
  billerCode?: string | null;
  billKey?: string | null;
  deeplinkUrl?: string | null;
  expiryTime?: string;
  transactionStatus?: string;
}

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
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [activeInstructionTab, setActiveInstructionTab] = useState<"mbanking" | "ibanking" | "atm" | null>("mbanking");
  const [timeRemaining, setTimeRemaining] = useState<string>("23:59:59");
  const [originUrl, setOriginUrl] = useState<string>("http://localhost:3001");
  const [syncChecking, setSyncChecking] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: "info" | "warning" | "error"; title: string; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // Format VA string into 4-digit readable chunks
  const formatVaNumber = (va: string) => {
    return va.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  // Live countdown timer when modal is open
  useEffect(() => {
    if (!customModalOpen || paymentSuccess) return;

    // Start 24 hours countdown or simulate remaining time
    let totalSeconds = 24 * 3600 - 1;
    const interval = setInterval(() => {
      if (totalSeconds <= 0) {
        clearInterval(interval);
        return;
      }
      totalSeconds -= 1;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [customModalOpen, paymentSuccess]);

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

    // Load Midtrans Snap.js script in case fallback is chosen
    if (typeof window !== "undefined" && !window.snap) {
      const script = document.createElement("script");
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "");
      document.head.appendChild(script);
    }
  }, []);

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

  const currentPlanDiscount = getPlanDiscountStatus(currentPlan, nowMs);
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

  // Poll transaction status when custom modal is open
  useEffect(() => {
    if (!customModalOpen || !chargeData?.orderId || paymentSuccess) return;

    setPollingActive(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: chargeData.orderId }),
        });
        const json = await res.json();
        if (json.success && json.data?.status === "PAID") {
          setPaymentSuccess(true);
          setPollingActive(false);
          clearInterval(interval);
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [customModalOpen, chargeData, paymentSuccess]);

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
          const redirectUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=/dashboard/billing`
              : undefined;

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
      } else if (selectedMethod === "gopay") {
        paymentType = "gopay";
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
      setSyncNotice(null);
      setCustomModalOpen(true);
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan saat memproses order. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "va" | "amount") => {
    navigator.clipboard.writeText(text);
    if (type === "va") {
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
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
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
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
                    <Zap className="w-3 h-3 text-amber-500" />
                    Aktivasi Otomatis
                  </span>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  {/* STATE 1: Loading Session */}
                  {isLoadingUser ? (
                    <div className="py-8 px-4 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-200/70 animate-pulse">
                      <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-700 shadow-xs">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-2">
                          Mencari Data User...
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Memeriksa sesi login dan data akun Anda untuk aktivasi instan
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                        <div className="h-9 bg-slate-200/70 rounded-xl" />
                        <div className="h-9 bg-slate-200/70 rounded-xl" />
                      </div>
                    </div>
                  ) : isLoggedIn ? (
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
                        {/* QRIS Option (Recommended) */}
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("qris")}
                          className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                            selectedMethod === "qris"
                              ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                            TERCEPAT & PRAKTIS
                          </span>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                                <QrCode className="w-4 h-4 text-emerald-600" /> QRIS Nasional
                              </span>
                              <div className={`w-3.5 h-3.5 rounded-full border ${selectedMethod === "qris" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`} />
                            </div>
                            <p className="text-[11px] text-slate-500">
                              BCA Mobile, GoPay, OVO, Dana, ShopeePay, Mandiri Livin, BRImo, dll.
                            </p>
                          </div>
                        </button>

                        {/* BCA VA */}
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("bca_va")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            selectedMethod === "bca_va"
                              ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-blue-600" /> BCA Virtual Account
                            </span>
                            <div className={`w-3.5 h-3.5 rounded-full border ${selectedMethod === "bca_va" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`} />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Transfer via BCA Mobile, myBCA, KlikBCA, atau ATM BCA.
                          </p>
                        </button>

                        {/* Mandiri VA */}
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("mandiri_va")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            selectedMethod === "mandiri_va"
                              ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-amber-600" /> Mandiri Bill / VA
                            </span>
                            <div className={`w-3.5 h-3.5 rounded-full border ${selectedMethod === "mandiri_va" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`} />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Transfer via Livin by Mandiri atau ATM Mandiri.
                          </p>
                        </button>

                        {/* BRI VA */}
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("bri_va")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            selectedMethod === "bri_va"
                              ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-sky-600" /> BRI (BRIVA)
                            </span>
                            <div className={`w-3.5 h-3.5 rounded-full border ${selectedMethod === "bri_va" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`} />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Transfer via BRImo, Internet Banking BRI, atau ATM BRI.
                          </p>
                        </button>

                        {/* BNI VA */}
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("bni_va")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            selectedMethod === "bni_va"
                              ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-orange-600" /> BNI Virtual Account
                            </span>
                            <div className={`w-3.5 h-3.5 rounded-full border ${selectedMethod === "bni_va" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`} />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Transfer via BNI Mobile Banking atau ATM BNI.
                          </p>
                        </button>

                        {/* GoPay */}
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("gopay")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            selectedMethod === "gopay"
                              ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                              <Smartphone className="w-4 h-4 text-emerald-600" /> GoPay & QRIS
                            </span>
                            <div className={`w-3.5 h-3.5 rounded-full border ${selectedMethod === "gopay" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`} />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Bayar instan via aplikasi GoPay atau scan QR.
                          </p>
                        </button>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Ingin bayar dengan Kartu Kredit atau saluran lain?</span>
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("snap")}
                          className={`font-bold hover:underline ${selectedMethod === "snap" ? "text-primary font-black" : "text-slate-600"}`}
                        >
                          {selectedMethod === "snap" ? "✓ Mode Snap Modal Aktif" : "Buka Midtrans Snap Klasik"}
                        </button>
                      </div>
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

                    <div className="p-4 sm:p-6">
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
                            const pDiscount = getPlanDiscountStatus(p, nowMs);
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
      {/* WAPLY CUSTOM PAYMENT MODAL (DIRECT CORE API UI)                        */}
      {/* ========================================================================= */}
      {customModalOpen && chargeData && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto relative z-10 max-h-[92vh] flex flex-col overflow-hidden">
              
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl ${paymentSuccess ? "bg-emerald-600" : "bg-gradient-to-tr from-emerald-600 to-teal-500"} text-white flex items-center justify-center font-black text-sm shadow-xs`}>
                    {paymentSuccess ? <Check className="w-4 h-4" /> : "S"}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {paymentSuccess ? "Pembayaran Berhasil" : "Selesaikan Pembayaran"}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>Order: {chargeData.orderId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!paymentSuccess ? (
                    <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold font-mono">
                      <Clock className="w-3 h-3 text-rose-500 animate-pulse" />
                      <span>{timeRemaining}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCustomModalOpen(false)}
                    className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                
                {/* REDESIGNED SUCCESS STATE */}
                {paymentSuccess ? (
                  <div className="py-2 text-center space-y-5">
                    {/* Celebration Hero Badge */}
                    <div className="relative inline-block mx-auto mt-2">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-50">
                        <CheckCircle2 className="w-11 h-11 animate-bounce" />
                      </div>
                      <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400 text-[9px] font-black uppercase tracking-wider shadow-sm border border-slate-700">
                        LUNAS
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-2xl font-black tracking-tight text-slate-900">
                        Pembayaran Berhasil!
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        {chargeData.orderId?.startsWith("WAPLY-ADDON") || isAddonMode ? (
                          <>
                            Terima kasih! Addon{" "}
                            <strong className="text-slate-900">
                              {selectedAddonIds
                                .map((id) => availableAddons.find((a) => a.id === id)?.name)
                                .filter(Boolean)
                                .join(", ") || "Top-Up Kuota"}
                            </strong>{" "}
                            Anda telah aktif dan kuota langsung ditambahkan ke akun Anda.
                          </>
                        ) : (
                          <>
                            Terima kasih! Paket <strong className="text-slate-900">Waply {currentPlan.name}</strong> Anda telah aktif. Kuota pesan & akses API gateway langsung dapat digunakan sekarang.
                          </>
                        )}
                      </p>
                    </div>

                    {/* Digital Receipt Card */}
                    <div className="p-5 bg-slate-50/90 rounded-3xl border border-slate-200/90 text-xs space-y-3.5 text-left shadow-xs relative overflow-hidden">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Total Pembayaran
                          </span>
                          <div className="text-2xl font-black text-emerald-600 font-mono">
                            {formatIDR(chargeData.grossAmount)}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                          PAID
                        </span>
                      </div>

                      <div className="space-y-2 text-slate-600 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">ID Pesanan:</span>
                          <span className="font-mono font-bold text-slate-800">{chargeData.orderId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">
                            {chargeData.orderId?.startsWith("WAPLY-ADDON") || isAddonMode ? "Item Addon:" : "Paket Layanan:"}
                          </span>
                          <strong className="text-emerald-700 font-bold">
                            {chargeData.orderId?.startsWith("WAPLY-ADDON") || isAddonMode ? (
                              selectedAddonIds
                                .map((id) => availableAddons.find((a) => a.id === id)?.name)
                                .filter(Boolean)
                                .join(", ") || "Top-Up Addon"
                            ) : (
                              `Waply ${currentPlan.name} (${
                                effectiveDurationMonths === 36
                                  ? "3 Tahun"
                                  : effectiveDurationMonths === 24
                                  ? "2 Tahun"
                                  : effectiveDurationMonths === 12
                                  ? "1 Tahun"
                                  : `${effectiveDurationMonths} Bulan`
                              })`
                            )}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Metode Pembayaran:</span>
                          <span className="font-semibold text-slate-800">
                            {chargeData.paymentType === "bank_transfer"
                              ? `Virtual Account ${chargeData.bank?.toUpperCase() || ""}`
                              : "QRIS / E-Wallet"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Waktu Aktivasi:</span>
                          <span className="font-medium text-slate-700">
                            {new Date().toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })} WIB
                          </span>
                        </div>
                      </div>

                      {/* Email Notification Badge */}
                      {customerEmail && (
                        <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 font-medium">
                          <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Rincian invoice & bukti bayar resmi dikirimkan ke Email: <strong>{customerEmail}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Unlocked Benefits Quick Pills */}
                    {chargeData.orderId?.startsWith("WAPLY-ADDON") || isAddonMode ? (
                      <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                        {(() => {
                          const addedDev = selectedAddonIds.reduce((sum, id) => {
                            const a = availableAddons.find((item) => item.id === id);
                            return sum + (a?.type === "DEVICE" ? a.amount : 0);
                          }, 0);
                          const addedMsg = selectedAddonIds.reduce((sum, id) => {
                            const a = availableAddons.find((item) => item.id === id);
                            return sum + (a?.type === "MESSAGES" ? a.amount : 0);
                          }, 0);

                          return (
                            <>
                              <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                                <Smartphone className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                                <span>{addedDev > 0 ? `+${addedDev} Device` : "Slot Perangkat"}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                                <MessageSquare className="w-3.5 h-3.5 text-sky-600 mb-0.5" />
                                <span>{addedMsg > 0 ? `+${addedMsg.toLocaleString("id-ID")} Pesan` : "Kuota Pesan"}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                                <Zap className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
                                <span>Aktif Instan</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                        <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                          <span>{currentPlan.maxDevices} Devices</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                          <MessageSquare className="w-3.5 h-3.5 text-sky-600 mb-0.5" />
                          <span>
                            {currentPlan.monthlyMessages === -1
                              ? "Unlimited"
                              : currentPlan.monthlyMessages.toLocaleString("id-ID")}{" "}
                            Pesan
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200 flex flex-col items-center">
                          <Server className="w-3.5 h-3.5 text-primary mb-0.5" />
                          <span>REST API Siap</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col gap-2.5">
                      <Link
                        href="/dashboard"
                        className="btn btn-primary btn-block rounded-2xl text-white font-extrabold shadow-lg shadow-primary/25 gap-2 text-sm"
                      >
                        Buka Dashboard Gateway <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/dashboard/billing"
                        className="btn btn-ghost btn-sm text-xs font-bold text-slate-500 hover:text-slate-800"
                      >
                        Lihat Riwayat & Invoice di Dashboard
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* PENDING / INSTRUCTIONS STATE */
                  <div className="space-y-5">
                    
                    {/* Expiry Mobile Banner */}
                    <div className="sm:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-500" /> Batas Waktu Bayar:
                      </span>
                      <span className="font-mono text-sm">{timeRemaining}</span>
                    </div>

                    {/* Total Amount Box */}
                    <div className="p-4 bg-slate-900 rounded-2xl text-white relative overflow-hidden shadow-md">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Total Tagihan Pembayaran
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(chargeData.grossAmount.toString(), "amount")}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                        >
                          {copiedAmount ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedAmount ? "Nominal Tersalin" : "Salin Nominal"}
                        </button>
                      </div>
                      <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
                        {formatIDR(chargeData.grossAmount)}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Transfer tepat sesuai nominal hingga digit terakhir untuk verifikasi instan.
                      </p>
                    </div>

                    {/* 1. QRIS VIEW */}
                    {chargeData.paymentType === "qris" && (
                      <div className="space-y-4 text-center">
                        <div className="p-5 bg-white border-2 border-slate-200 rounded-3xl inline-block shadow-md mx-auto relative group">
                          {chargeData.qrCodeUrl ? (
                            <img
                              src={chargeData.qrCodeUrl}
                              alt="QRIS Code Waply"
                              className="w-56 h-56 object-contain mx-auto rounded-xl"
                            />
                          ) : chargeData.qrString ? (
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(chargeData.qrString)}`}
                              alt="QRIS Code Waply"
                              className="w-56 h-56 object-contain mx-auto rounded-xl"
                            />
                          ) : (
                            <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-100 rounded-xl text-xs text-slate-400 font-medium gap-2">
                              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                              Memuat QRIS...
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <QrCode className="w-3.5 h-3.5" /> QRIS Nasional (Semua Bank & E-Wallet)
                          </div>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Buka BCA Mobile, Livin Mandiri, BRImo, BNI Mobile, GoPay, OVO, Dana, atau ShopeePay lalu scan QR di atas.
                          </p>
                        </div>

                        {chargeData.qrCodeUrl && (
                          <a
                            href={chargeData.qrCodeUrl}
                            target="_blank"
                            rel="noreferrer"
                            download="QRIS-Waply.png"
                            className="btn btn-outline btn-xs gap-1.5 rounded-xl text-slate-700 font-bold"
                          >
                            <Download className="w-3.5 h-3.5" /> Unduh Gambar QRIS
                          </a>
                        )}
                      </div>
                    )}

                    {/* 2. VIRTUAL ACCOUNT VIEW (BCA, BRI, BNI, PERMATA) */}
                    {chargeData.vaNumber && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-600" />
                              <span className="font-extrabold text-slate-800">
                                {chargeData.bank?.toUpperCase() === "BCA" && "BCA Virtual Account"}
                                {chargeData.bank?.toUpperCase() === "BRI" && "BRI (BRIVA)"}
                                {chargeData.bank?.toUpperCase() === "BNI" && "BNI Virtual Account"}
                                {chargeData.bank?.toUpperCase() === "PERMATA" && "Permata Virtual Account"}
                                {!["BCA", "BRI", "BNI", "PERMATA"].includes(chargeData.bank?.toUpperCase() || "") &&
                                  `${chargeData.bank?.toUpperCase()} Virtual Account`}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase font-mono">
                              {chargeData.bank || "VA"}
                            </span>
                          </div>

                          {/* VA Display Box */}
                          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Nomor Virtual Account
                            </span>
                            <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-900 select-all break-all leading-tight">
                              {formatVaNumber(chargeData.vaNumber)}
                            </div>
                          </div>

                          {/* Copy Button */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(chargeData.vaNumber!, "va")}
                            className={`btn btn-sm btn-block rounded-xl font-extrabold gap-1.5 transition-all shadow-xs ${
                              copiedVa
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
                                : "btn-primary text-white"
                            }`}
                          >
                            {copiedVa ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copiedVa ? "Nomor VA Berhasil Disalin!" : "Salin Nomor Virtual Account"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. MANDIRI BILL VIEW */}
                    {chargeData.billerCode && chargeData.billKey && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-amber-600" />
                              <span className="font-extrabold text-slate-800">Mandiri Bill Payment</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase font-mono">
                              MANDIRI
                            </span>
                          </div>

                          {/* Biller Code */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Kode Perusahaan (Biller Code)</div>
                              <div className="text-lg font-black font-mono text-slate-900">{chargeData.billerCode}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(chargeData.billerCode!, "va")}
                              className="btn btn-xs btn-outline rounded-lg text-slate-600 font-bold gap-1"
                            >
                              <Copy className="w-3 h-3" /> Salin
                            </button>
                          </div>

                          {/* Bill Key */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Nomor Pelanggan (Bill Key)</div>
                              <div className="text-lg font-black font-mono text-slate-900 select-all">{chargeData.billKey}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(chargeData.billKey!, "va")}
                              className="btn btn-xs btn-primary rounded-lg text-white font-bold gap-1"
                            >
                              <Copy className="w-3 h-3" /> Salin
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. GOPAY DEEPLINK VIEW */}
                    {chargeData.deeplinkUrl && (
                      <div className="pt-2 text-center space-y-3">
                        <a
                          href={chargeData.deeplinkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary btn-block rounded-2xl text-white font-extrabold shadow-md gap-2"
                        >
                          <Smartphone className="w-4 h-4" /> Buka Aplikasi GoPay Sekarang
                        </a>
                      </div>
                    )}

                    {/* COLLAPSIBLE PAYMENT INSTRUCTIONS ACCORDION */}
                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                      <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-primary" /> Panduan Cara Pembayaran
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveInstructionTab("mbanking")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              activeInstructionTab === "mbanking"
                                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            m-Banking
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveInstructionTab("ibanking")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              activeInstructionTab === "ibanking"
                                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Internet
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveInstructionTab("atm")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              activeInstructionTab === "atm"
                                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            ATM
                          </button>
                        </div>
                      </div>

                      <div className="p-4 text-xs text-slate-600 bg-white">
                        {/* BCA Instructions */}
                        {chargeData.bank?.toUpperCase() === "BCA" && (
                          <>
                            {activeInstructionTab === "mbanking" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Buka aplikasi <strong>BCA Mobile</strong> & login m-BCA.</li>
                                <li>Pilih menu <strong>m-Transfer</strong> &gt; <strong>BCA Virtual Account</strong>.</li>
                                <li>Masukkan nomor Virtual Account di atas & klik <strong>Send</strong>.</li>
                                <li>Periksa nama penerima <strong>WAPLY / MIDTRANS</strong> dan total nominal.</li>
                                <li>Masukkan <strong>PIN m-BCA</strong> Anda. Transaksi selesai & gateway langsung aktif.</li>
                              </ol>
                            )}
                            {activeInstructionTab === "ibanking" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Login ke <strong>KlikBCA Individual</strong> (https://ibank.klikbca.com).</li>
                                <li>Pilih menu <strong>Transfer Dana</strong> &gt; <strong>Transfer ke BCA Virtual Account</strong>.</li>
                                <li>Masukkan nomor Virtual Account di atas lalu klik <strong>Lanjutkan</strong>.</li>
                                <li>Masukkan respon <strong>KeyBCA APPLI 1</strong> lalu klik <strong>Kirim</strong>.</li>
                              </ol>
                            )}
                            {activeInstructionTab === "atm" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Masukkan <strong>Kartu ATM BCA</strong> & PIN Anda.</li>
                                <li>Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>Ke Rek BCA Virtual Account</strong>.</li>
                                <li>Masukkan nomor Virtual Account di atas lalu tekan <strong>Benar</strong>.</li>
                                <li>Konfirmasi jumlah dan rincian transaksi lalu selesaikan pembayaran.</li>
                              </ol>
                            )}
                          </>
                        )}

                        {/* Mandiri Instructions */}
                        {chargeData.bank?.toUpperCase() === "MANDIRI" && (
                          <>
                            {activeInstructionTab === "mbanking" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Buka aplikasi <strong>Livin&apos; by Mandiri</strong> & login.</li>
                                <li>Pilih menu <strong>Bayar</strong> &gt; cari <strong>Midtrans / Waply</strong> (Kode: {chargeData.billerCode}).</li>
                                <li>Masukkan <strong>Bill Key / Nomor Pembayaran</strong>: {chargeData.billKey}.</li>
                                <li>Konfirmasi detail pembayaran lalu masukkan <strong>PIN Livin&apos;</strong> Anda.</li>
                              </ol>
                            )}
                            {activeInstructionTab === "ibanking" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Login ke <strong>Mandiri Online</strong>.</li>
                                <li>Pilih menu <strong>Bayar</strong> &gt; <strong>Multi Payment</strong>.</li>
                                <li>Pilih penyedia jasa <strong>Midtrans</strong> lalu masukkan Bill Key.</li>
                                <li>Konfirmasi dengan Token Mandiri Anda.</li>
                              </ol>
                            )}
                            {activeInstructionTab === "atm" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Masukkan Kartu ATM Mandiri & PIN.</li>
                                <li>Pilih <strong>Bayar/Beli</strong> &gt; <strong>Lainnya</strong> &gt; <strong>Multi Payment</strong>.</li>
                                <li>Masukkan Kode Perusahaan ({chargeData.billerCode}) & Bill Key ({chargeData.billKey}).</li>
                                <li>Konfirmasi pembayaran lalu tekan <strong>Ya</strong>.</li>
                              </ol>
                            )}
                          </>
                        )}

                        {/* BRI Instructions */}
                        {chargeData.bank?.toUpperCase() === "BRI" && (
                          <>
                            {activeInstructionTab === "mbanking" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Buka aplikasi <strong>BRImo</strong> & login.</li>
                                <li>Pilih menu <strong>Tagihan / Pembayaran</strong> &gt; <strong>BRIVA</strong>.</li>
                                <li>Masukkan nomor BRIVA di atas lalu klik <strong>Lanjutkan</strong>.</li>
                                <li>Periksa data transaksi dan masukkan <strong>PIN BRImo</strong> Anda.</li>
                              </ol>
                            )}
                            {activeInstructionTab === "ibanking" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Login ke <strong>Internet Banking BRI</strong>.</li>
                                <li>Pilih menu <strong>Pembayaran</strong> &gt; <strong>BRIVA</strong>.</li>
                                <li>Masukkan nomor BRIVA dan konfirmasi dengan token m-Token.</li>
                              </ol>
                            )}
                            {activeInstructionTab === "atm" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Masukkan Kartu ATM BRI & PIN.</li>
                                <li>Pilih <strong>Transaksi Lain</strong> &gt; <strong>Pembayaran</strong> &gt; <strong>Lainnya</strong> &gt; <strong>BRIVA</strong>.</li>
                                <li>Masukkan nomor BRIVA di atas lalu tekan <strong>Ya</strong> untuk konfirmasi.</li>
                              </ol>
                            )}
                          </>
                        )}

                        {/* BNI Instructions */}
                        {chargeData.bank?.toUpperCase() === "BNI" && (
                          <>
                            {activeInstructionTab === "mbanking" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Buka aplikasi <strong>BNI Mobile Banking</strong> & login.</li>
                                <li>Pilih menu <strong>Pembayaran</strong> &gt; <strong>Virtual Account Billing</strong>.</li>
                                <li>Pilih Tab <strong>Input Baru</strong> lalu masukkan nomor Virtual Account.</li>
                                <li>Konfirmasi transaksi dan masukkan <strong>Password Transaksi</strong>.</li>
                              </ol>
                            )}
                            {activeInstructionTab === "ibanking" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Login ke <strong>BNI Internet Banking</strong>.</li>
                                <li>Pilih <strong>Transaksi</strong> &gt; <strong>Virtual Account Billing</strong>.</li>
                                <li>Masukkan nomor Virtual Account dan otorisasi dengan token BNI.</li>
                              </ol>
                            )}
                            {activeInstructionTab === "atm" && (
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                                <li>Masukkan Kartu ATM BNI & PIN.</li>
                                <li>Pilih <strong>Menu Lain</strong> &gt; <strong>Pembayaran</strong> &gt; <strong>Menu Berikutnya</strong> &gt; <strong>Virtual Account Billing</strong>.</li>
                                <li>Masukkan nomor Virtual Account di atas lalu selesaikan transaksi.</li>
                              </ol>
                            )}
                          </>
                        )}

                        {/* QRIS Instructions */}
                        {chargeData.paymentType === "qris" && (
                          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                            <li>Buka aplikasi mobile banking atau e-wallet pilihan Anda (BCA Mobile, Livin&apos;, BRImo, GoPay, OVO, Dana, dll).</li>
                            <li>Pilih menu <strong>Scan QRIS / Bayar</strong>.</li>
                            <li>Arahkan kamera ke QR Code di atas (atau unggah dari galeri jika diunduh).</li>
                            <li>Periksa nominal tagihan & nama merchant <strong>Waply Gateway</strong>.</li>
                            <li>Konfirmasi dan masukkan PIN transaksi Anda. Verifikasi akan terdeteksi otomatis dalam 1-3 detik.</li>
                          </ol>
                        )}
                      </div>
                    </div>

                    {/* Status Indicator Bar */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="font-bold text-slate-700">Menunggu Pembayaran...</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Sinkronisasi Otomatis Tiap 3 Detik
                      </span>
                    </div>

                    {/* In-Modal Feedback Notice */}
                    {syncNotice && (
                      <div
                        className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150 ${
                          syncNotice.type === "warning"
                            ? "bg-amber-50/90 border-amber-200 text-amber-900"
                            : syncNotice.type === "error"
                            ? "bg-rose-50/90 border-rose-200 text-rose-900"
                            : "bg-sky-50/90 border-sky-200 text-sky-900"
                        }`}
                      >
                        <div className="flex items-center justify-between font-extrabold">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                            <span>{syncNotice.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSyncNotice(null)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-black/5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">
                          {syncNotice.message}
                        </p>
                      </div>
                    )}

                    {/* Manual Action Buttons */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <button
                        type="button"
                        disabled={syncChecking}
                        onClick={async () => {
                          setSyncChecking(true);
                          setSyncNotice(null);
                          try {
                            const res = await fetch("/api/billing/sync", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ orderId: chargeData.orderId }),
                            });
                            const json = await res.json();
                            if (json.success && json.data?.status === "PAID") {
                              setPaymentSuccess(true);
                            } else {
                              const currentStatus = json.data?.transactionStatus || json.data?.status || "PENDING";
                              setSyncNotice({
                                type: "warning",
                                title: `Status: ${currentStatus.toUpperCase()}`,
                                message: "Pembayaran belum terverifikasi oleh gateway. Jika Anda baru saja menyelesaikan transfer, mohon tunggu 5-15 detik agar sistem perbankan mengirim webhook konfirmasi ke gateway. Halaman akan otomatis beralih setelah lunas.",
                              });
                            }
                          } catch {
                            setSyncNotice({
                              type: "error",
                              title: "Gagal Menghubungi Server",
                              message: "Koneksi terputus saat memeriksa status. Sistem tetap akan mencoba sinkronisasi otomatis di latar belakang.",
                            });
                          } finally {
                            setSyncChecking(false);
                          }
                        }}
                        className="btn btn-outline btn-sm rounded-xl text-xs font-bold gap-1.5 flex-1 shadow-xs"
                      >
                        {syncChecking ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Memeriksa...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            Saya Sudah Bayar
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setCustomModalOpen(false)}
                        className="btn btn-ghost btn-sm text-xs text-slate-400 hover:text-slate-700 font-semibold"
                      >
                        Tutup / Bayar Nanti
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
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

