"use client";

import { setCachedUser } from "@/lib/use-user-session";
import { createClient } from "@/lib/supabase/client";

/**
 * Perform comprehensive logout:
 * 1. Clear in-memory React session cache
 * 2. Wipe every authentication cookie (waply_*, sb-*, supabase-*)
 * 3. Clear storage (sessionStorage, auth localStorage)
 * 4. Call /api/auth/logout API to clear server cookies & HTTP headers
 * 5. Sign out Supabase auth client if active
 * 6. Hard redirect to /login
 */
export async function performLogout(redirectTo: string = "/login") {
  // 1. Clear React in-memory session cache
  try {
    setCachedUser(null);
  } catch {}

  // 2. Clear all client cookies explicitly across multiple path/domain combinations
  if (typeof document !== "undefined") {
    const cookieNames = [
      "waply_demo_auth",
      "waply_user_email",
      "waply_user_name",
      "waply_user_role",
      "waply_user_id",
    ];

    // Read all existing cookie names in document.cookie
    const existing = document.cookie.split(";");
    for (let i = 0; i < existing.length; i++) {
      const cookie = existing[i].trim();
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      if (name && !cookieNames.includes(name)) {
        cookieNames.push(name);
      }
    }

    const host = typeof window !== "undefined" ? window.location.hostname : "";
    for (const name of cookieNames) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
      if (host) {
        document.cookie = `${name}=; path=/; domain=${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
        document.cookie = `${name}=; path=/; domain=.${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
      }
    }
  }

  // 3. Clear web storage
  if (typeof window !== "undefined") {
    try {
      sessionStorage.clear();
      localStorage.removeItem("waply_user");
      localStorage.removeItem("waply_session");
      localStorage.removeItem("supabase.auth.token");
      // Remove any Supabase localStorage keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase") || key.startsWith("waply_"))) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
  }

  // 4. Call server-side logout route
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {}

  // 5. Supabase sign out
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {}

  // 6. Hard redirect to /login
  if (typeof window !== "undefined") {
    window.location.href = redirectTo;
  }
}
