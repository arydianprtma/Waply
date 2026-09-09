"use client";

import { useState, useEffect } from "react";
import { PlanFeatureAccess, Plan, DEFAULT_FREE_ACCESS } from "@/lib/billing-types";

interface BillingData {
  subscription: any;
  plan: Plan | null;
  invoices: any[];
  allPlans?: Record<string, Plan>;
}

let cachedBillingData: BillingData | null = null;
let fetchPromise: Promise<BillingData | null> | null = null;
const listeners = new Set<(data: BillingData | null) => void>();

export function getCachedBillingData(): BillingData | null {
  return cachedBillingData;
}

export function setCachedBillingData(data: BillingData | null) {
  cachedBillingData = data;
  if (typeof window !== "undefined") {
    try {
      if (data) {
        localStorage.setItem("waply_billing_cache", JSON.stringify(data));
        sessionStorage.setItem("waply_billing_cache", JSON.stringify(data));
      } else {
        localStorage.removeItem("waply_billing_cache");
        sessionStorage.removeItem("waply_billing_cache");
      }
    } catch {}
  }
  listeners.forEach((cb) => cb(data));
}

export async function fetchBillingData(force = false): Promise<BillingData | null> {
  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch("/api/billing/status", { cache: "no-store" });
      if (!res.ok) return cachedBillingData;
      const json = await res.json();
      if (json.success && json.data) {
        setCachedBillingData(json.data);
        return json.data;
      }
      return cachedBillingData;
    } catch {
      return cachedBillingData;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function useBillingPlan() {
  const [data, setData] = useState<BillingData | null>(() => {
    if (cachedBillingData) return cachedBillingData;
    if (typeof window !== "undefined") {
      try {
        const raw =
          localStorage.getItem("waply_billing_cache") ||
          sessionStorage.getItem("waply_billing_cache");
        if (raw) {
          const parsed = JSON.parse(raw);
          cachedBillingData = parsed;
          return parsed;
        }
      } catch {}
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedBillingData);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handler = (newData: BillingData | null) => {
      setData(newData);
      setIsLoading(false);
    };
    listeners.add(handler);

    // Fetch in background to revalidate
    fetchBillingData().finally(() => {
      setIsLoading(false);
    });

    return () => {
      listeners.delete(handler);
    };
  }, []);

  const plan = data?.plan || null;
  // If data has not loaded yet and no cache, don't prematurely lock features
  const planAccess: PlanFeatureAccess = plan?.access || (data ? DEFAULT_FREE_ACCESS : {
    devices: true,
    warmupHealth: true,
    broadcast: true,
    contacts: true,
    sendMessage: true,
    messageLogs: true,
    templatesSpintax: true,
    blacklistDnd: true,
    autoReply: true,
    apiDocs: true,
    apiKeys: true,
    webhooks: true,
  });
  const currentPlanName = plan?.name || (data ? "Free Trial" : "Memuat...");
  const isExpired = data?.subscription?.status === "EXPIRED";

  const hasFeature = (key: keyof PlanFeatureAccess): boolean => {
    return Boolean(planAccess[key]);
  };

  /**
   * Determine the next best upgrade plan that has this specific feature enabled
   */
  const getRecommendedUpgradePlan = (feature: keyof PlanFeatureAccess): Plan | null => {
    const plansMap = data?.allPlans;
    if (!plansMap) return null;

    const currentPrice = plan?.price ?? 0;
    const currentId = plan?.id || "FREE";

    // All active plans that enable this feature
    const candidatePlans = Object.values(plansMap).filter((p) => {
      if (!p || p.isActive === false) return false;
      return Boolean(p.access && p.access[feature]);
    });

    if (candidatePlans.length === 0) return null;

    // Plans with higher price than current user plan
    const higherPlans = candidatePlans.filter(
      (p) => p.id !== currentId && (p.price ?? 0) > currentPrice
    );
    if (higherPlans.length > 0) {
      higherPlans.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      return higherPlans[0];
    }

    // Fallback: candidate plans with different ID (e.g. if price is equal or custom)
    const otherCandidates = candidatePlans.filter((p) => p.id !== currentId);
    if (otherCandidates.length > 0) {
      otherCandidates.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      return otherCandidates[0];
    }

    return candidatePlans[0];
  };

  return {
    billingData: data,
    plan,
    planAccess,
    currentPlanName,
    isExpired,
    hasFeature,
    getRecommendedUpgradePlan,
    isLoading: !data && isLoading,
    isMounted,
    refreshBilling: () => fetchBillingData(true),
  };
}
