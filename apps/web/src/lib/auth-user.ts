import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

import { registerOrSyncUser, getUserById, getUserByEmail } from "@/lib/admin-users";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  banReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  avatarUrl: string | null;
}

const DEFAULT_DEMO_USER: SessionUser = {
  id: "usr_default_guest",
  email: "guest@sendora.id",
  name: "Sendora User",
  role: "user",
  status: "ACTIVE",
  banReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarUrl: null,
};

export async function getSessionUser(): Promise<SessionUser> {
  try {
    const cookieStore = await cookies();
    const isDemoAuth = cookieStore.get("sendora_demo_auth")?.value === "true";
    const rawEmail = cookieStore.get("sendora_user_email")?.value || "";
    const rawName = cookieStore.get("sendora_user_name")?.value || "";
    const rawId = cookieStore.get("sendora_user_id")?.value || "";

    const demoEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : "";
    const demoName = rawName ? decodeURIComponent(rawName).trim() : "";
    const demoId = rawId ? decodeURIComponent(rawId).trim() : "";

    if (isDemoAuth || demoEmail) {
      const email = demoEmail || "guest@sendora.id";
      const dbUser = getUserByEmail(email) || (demoId ? getUserById(demoId) : null);

      const role: "admin" | "user" =
        dbUser?.role || (email === "admin@sendora.id" ? "admin" : "user");
      const userId =
        dbUser?.id ||
        (email === "admin@sendora.id"
          ? "admin-master-sendora-01"
          : `usr_${email.replace(/[^a-zA-Z0-9]/g, "_")}`);
      const name =
        dbUser?.name ||
        demoName ||
        (role === "admin" ? "Sendora Admin" : email.split("@")[0] || "Sendora User");

      const managed =
        dbUser ||
        registerOrSyncUser({
          id: userId,
          email,
          name,
          role,
        });

      return {
        id: managed.id,
        email: managed.email,
        name: managed.name,
        role: managed.role || role,
        status: managed.status,
        banReason: managed.banReason,
        createdAt: new Date(managed.createdAt || Date.now()),
        updatedAt: new Date(),
        avatarUrl: null,
      };
    }

    const hasSbCookie = cookieStore.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
    if (!hasSbCookie) {
      return DEFAULT_DEMO_USER;
    }

    // Try Supabase auth with strict 200ms timeout to avoid hanging on slow network
    try {
      const supabasePromise = (async () => {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        return authUser;
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 200));
      const authUser: any = await Promise.race([supabasePromise, timeoutPromise]);

      if (authUser && authUser.email) {
        const email = authUser.email.toLowerCase();
        const role =
          authUser.user_metadata?.role ||
          authUser.app_metadata?.role ||
          (email === "admin@sendora.id" ? "admin" : "user");
        const name = authUser.user_metadata?.name || authUser.email.split("@")[0];

        const managed = registerOrSyncUser({
          id: authUser.id,
          email,
          name,
          role: role as "admin" | "user",
        });

        return {
          id: authUser.id,
          email: authUser.email,
          name,
          role: role as "admin" | "user",
          status: managed.status,
          banReason: managed.banReason,
          createdAt: new Date(),
          updatedAt: new Date(),
          avatarUrl: authUser.user_metadata?.avatar_url || null,
        };
      }
    } catch (sbErr) {
      // Ignore and fallback immediately
    }
  } catch (err) {
    // Fallback directly without blocking timeout
  }

  return DEFAULT_DEMO_USER;
}

export const getAuthUser = getSessionUser;

export async function requireAdminUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user.role !== "admin") {
    throw new Error("403 Forbidden: Akses khusus Super Admin");
  }
  return user;
}

