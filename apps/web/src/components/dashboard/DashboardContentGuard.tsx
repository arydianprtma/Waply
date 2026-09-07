"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useUserSession } from "@/lib/use-user-session";
import { AccountLockedScreen } from "./AccountLockedScreen";

export function DashboardContentGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUserSession();
  const pathname = usePathname();

  if (user && (user.status === "BANNED" || user.status === "SUSPENDED")) {
    // Izinkan akses ke Pusat Bantuan & Tiket agar pengguna dapat memantau permohonan banding
    if (pathname && pathname.startsWith("/dashboard/support")) {
      return <>{children}</>;
    }
    return <AccountLockedScreen user={user} />;
  }

  return <>{children}</>;
}
