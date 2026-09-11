"use client";

import { useState, useEffect } from "react";

export interface CachedUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  banReason?: string | null;
  avatarUrl?: string | null;
}

let cachedUser: CachedUser | null = null;
let fetchPromise: Promise<CachedUser | null> | null = null;
const listeners = new Set<(u: CachedUser | null) => void>();

export function getCachedUser(): CachedUser | null {
  return cachedUser;
}

export function setCachedUser(user: CachedUser | null) {
  cachedUser = user;
  if (typeof window !== "undefined") {
    try {
      if (user) sessionStorage.setItem("waply_user_session", JSON.stringify(user));
      else sessionStorage.removeItem("waply_user_session");
    } catch {}
  }
  listeners.forEach((cb) => cb(user));
}

export function fetchUserSession(forceRefresh = false): Promise<CachedUser | null> {
  if (cachedUser && !forceRefresh) return Promise.resolve(cachedUser);
  if (fetchPromise && !forceRefresh) return fetchPromise;

  fetchPromise = fetch("/api/auth/me", { cache: "no-store" })
    .then((r) => {
      if (r.status === 401 || r.status === 403) {
        throw new Error("unauthorized");
      }
      return r.json();
    })
    .then((d) => {
      if (d.success && d.user) {
        cachedUser = d.user;
        listeners.forEach((cb) => cb(d.user));
        return d.user;
      }
      throw new Error("user_not_found");
    })
    .catch(() => {
      // Account deleted by Admin or session terminated: Wipe local cache & perform forced logout
      setCachedUser(null);
      if (typeof window !== "undefined") {
        const isAuthPage =
          window.location.pathname.startsWith("/login") ||
          window.location.pathname.startsWith("/register") ||
          window.location.pathname.startsWith("/reset-password") ||
          window.location.pathname === "/";

        if (!isAuthPage) {
          import("@/lib/auth-logout").then(({ performLogout }) => {
            performLogout("/login?error=account_deleted");
          });
        }
      }
      return null;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function useUserSession() {
  const [user, setUser] = useState<CachedUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (cachedUser) {
      setUser(cachedUser);
    } else {
      try {
        const raw = sessionStorage.getItem("waply_user_session");
        if (raw) {
          const parsed = JSON.parse(raw);
          cachedUser = parsed;
          setUser(parsed);
        }
      } catch {}
    }

    const handler = (u: CachedUser | null) => setUser(u);
    listeners.add(handler);
    fetchUserSession(true);

    // Periodic heartbeat (every 15s) to detect if admin deleted or banned this account
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchUserSession(true);
      }
    }, 15000);

    return () => {
      listeners.delete(handler);
      clearInterval(interval);
    };
  }, []);

  return { user, isLoading: !cachedUser && !user, isMounted };
}
