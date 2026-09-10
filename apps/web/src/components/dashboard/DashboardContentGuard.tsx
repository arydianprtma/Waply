"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useUserSession } from "@/lib/use-user-session";
import { AccountLockedScreen } from "./AccountLockedScreen";
import { PlanLockedScreen } from "./PlanLockedScreen";
import { useBillingPlan } from "@/lib/use-billing-plan";
import { PlanFeatureAccess } from "@/lib/billing-types";

const ROUTE_PLAN_FEATURES: Array<{ path: string; featureKey: keyof PlanFeatureAccess }> = [
  { path: "/dashboard/devices/warmup", featureKey: "warmupHealth" },
  { path: "/dashboard/broadcast", featureKey: "broadcast" },
  { path: "/dashboard/automation", featureKey: "autoReply" },
  { path: "/dashboard/contacts", featureKey: "contacts" },
  { path: "/dashboard/blacklist", featureKey: "blacklistDnd" },
  { path: "/dashboard/api-keys", featureKey: "apiKeys" },
  { path: "/dashboard/webhooks", featureKey: "webhooks" },
  { path: "/dashboard/logs", featureKey: "systemLogs" },
  { path: "/dashboard/templates", featureKey: "templatesSpintax" },
  { path: "/dashboard/messages/send", featureKey: "sendMessage" },
  { path: "/dashboard/messages", featureKey: "messageLogs" },
  { path: "/dashboard/devices", featureKey: "devices" },
];

export function DashboardContentGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUserSession();
  const pathname = usePathname();
  const { planAccess, isMounted } = useBillingPlan();

  // 1. Account status guard (Banned/Suspended)
  if (user && (user.status === "BANNED" || user.status === "SUSPENDED")) {
    // Izinkan akses ke Pusat Bantuan & Tiket agar pengguna dapat memantau permohonan banding
    if (pathname && pathname.startsWith("/dashboard/support")) {
      return <>{children}</>;
    }
    return <AccountLockedScreen user={user} />;
  }

  // 2. Plan feature lock guard (Super Admin bypasses all locks)
  if (isMounted && user && user.role !== "admin" && pathname) {
    for (const item of ROUTE_PLAN_FEATURES) {
      if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
        if (planAccess && planAccess[item.featureKey] === false) {
          return <PlanLockedScreen featureKey={item.featureKey} />;
        }
        break;
      }
    }
  }

  return <>{children}</>;
}
