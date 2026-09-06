"use client";

import { useState, useEffect } from "react";
import { PlanFeatureAccess, Plan, DEFAULT_FREE_ACCESS } from "@/lib/billing-types";

interface BillingData {
  subscription: any;
  plan: Plan | null;
  invoices: any[];
}

let cachedBillingData: BillingData | null = null;
let fetchPromise: Promise<BillingData | null> | null = null;
const listeners = new Set<(data: BillingData | null) => void>();

// Read initial cache from localStorage or sessionStorage instantly
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("sendora_billing_cache") || sessionStorage.getItem("sendora_billing_cache");
    if (raw) {
      cachedBillingData = JSON.parse(raw);
    }
  } catch {}
}

export function getCachedBillingData(): BillingData | null {
  return cachedBillingData;
}

export function setCachedBillingData(data: BillingData | null) {
  cachedBillingData = data;
  if (typeof window !== "undefined") {
    try {
      if (data) {
        localStorage.setItem("sendora_billing_cache", JSON.stringify(data));
        sessionStorage.setItem("sendora_billing_cache", JSON.stringify(data));
      } else {
        localStorage.removeItem("sendora_billing_cache");
        sessionStorage.removeItem("sendora_billing_cache");
      }
    } catch {}
  }
  listeners.forEach((cb) => cb(data));
}

export async function fetchBillingData(force = false): Promise<BillingData | null> {
  if (cachedBillingData && !force) {
    return cachedBillingData;
  }
  if (fetchPromise && !force) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch("/api/billing/status");
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
  const [data, setData] = useState<BillingData | null>(cachedBillingData);

  useEffect(() => {
    const handler = (newData: BillingData | null) => setData(newData);
    listeners.add(handler);

    // Fetch in background to revalidate
    fetchBillingData();

    return () => {
      listeners.delete(handler);
    };
  }, []);

  const plan = data?.plan || null;
  const planAccess: PlanFeatureAccess = plan?.access || DEFAULT_FREE_ACCESS;
  const currentPlanName = plan?.name || "Free Trial";
  const isExpired = data?.subscription?.status === "EXPIRED";

  const hasFeature = (key: keyof PlanFeatureAccess): boolean => {
    return Boolean(planAccess[key]);
  };

  return {
    billingData: data,
    plan,
    planAccess,
    currentPlanName,
    isExpired,
    hasFeature,
    isLoading: false, // Cache/defaults are always synchronously available!
    refresh: () => fetchBillingData(true),
  };
}
