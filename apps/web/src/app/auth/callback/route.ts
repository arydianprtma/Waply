import { NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { registerOrSyncUser } from "@/lib/admin-users";
import { extractClientIp } from "@/lib/ip-utils";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseUrl = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

  try {
    const supabase = await createClient();
    let authUser = null;

    // 1. Verify PKCE Auth Code
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        authUser = data.user;
      }
    }
    // 2. Verify Token Hash (OTP / Email Confirmation)
    else if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error && data?.user) {
        authUser = data.user;
      }
    }

    if (authUser) {
      const userEmail = authUser.email?.toLowerCase().trim() || "";
      const userName =
        authUser.user_metadata?.name ||
        authUser.user_metadata?.full_name ||
        userEmail.split("@")[0] ||
        "Sendora User";
      const isSuperAdmin = userEmail === "admin@sendora.id";
      const userRole: "admin" | "user" = isSuperAdmin ? "admin" : "user";
      const clientIp = extractClientIp(request);

      // Register or sync user in local database registry
      if (userEmail) {
        registerOrSyncUser({
          id: authUser.id || `usr_${userEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
          email: userEmail,
          name: userName,
          role: userRole,
          ipAddress: clientIp,
        });

        // Set session cookies for persistent auth
        const cookieStore = await cookies();
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        cookieStore.set("sendora_demo_auth", "true", {
          path: "/",
          maxAge,
          sameSite: "lax",
          httpOnly: false,
        });
        cookieStore.set("sendora_user_email", userEmail, {
          path: "/",
          maxAge,
          sameSite: "lax",
          httpOnly: false,
        });
        cookieStore.set("sendora_user_name", userName, {
          path: "/",
          maxAge,
          sameSite: "lax",
          httpOnly: false,
        });
        cookieStore.set("sendora_user_role", userRole, {
          path: "/",
          maxAge,
          sameSite: "lax",
          httpOnly: false,
        });
        cookieStore.set("sendora_user_id", authUser.id, {
          path: "/",
          maxAge,
          sameSite: "lax",
          httpOnly: false,
        });
      }

      const targetPath = next.startsWith("/") ? next : `/${next}`;
      return NextResponse.redirect(`${baseUrl}${targetPath}`);
    }
  } catch (err) {
    console.error("[Auth Callback Error]:", err);
  }

  // If code exchange or OTP verification failed
  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_failed`);
}
