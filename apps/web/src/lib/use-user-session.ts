"use client";

import { useState, useEffect } from "react";

export interface CachedUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  banReason?: string | null;
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

export function fetchUserSession(): Promise<CachedUser | null> {
  if (cachedUser) return Promise.resolve(cachedUser);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/auth/me")
    .then((r) => r.json())
    .then((d) => {
      if (d.success && d.user) {
        cachedUser = d.user;
        listeners.forEach((cb) => cb(d.user));
        return d.user;
      }
      return null;
    })
    .catch(() => null)
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
    fetchUserSession();
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return { user, isLoading: !cachedUser && !user, isMounted };
}
