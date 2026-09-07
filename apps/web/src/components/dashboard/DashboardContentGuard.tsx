"use client";

import React from "react";
import { useUserSession } from "@/lib/use-user-session";
import { AccountLockedScreen } from "./AccountLockedScreen";

export function DashboardContentGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUserSession();

  if (user && (user.status === "BANNED" || user.status === "SUSPENDED")) {
    return <AccountLockedScreen user={user} />;
  }

  return <>{children}</>;
}
