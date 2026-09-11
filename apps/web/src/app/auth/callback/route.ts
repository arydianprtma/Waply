import { NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { registerOrSyncUser } from "@/lib/admin-users";
import { extractClientIp } from "@/lib/ip-utils";

function resolveAppBaseUrl(request: NextRequest): string {
  // 1. If explicit NEXT_PUBLIC_APP_URL is set and not localhost/0.0.0.0, prioritize it
  if (
    process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("localhost") &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("0.0.0.0")
  ) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Check forwarded proxy headers (Cloudflare Tunnel / Nginx)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost && !forwardedHost.includes("0.0.0.0") && !forwardedHost.includes("localhost")) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
  }

  // 3. Check Host header
  const host = request.headers.get("host");
  if (host && !host.includes("0.0.0.0") && !host.includes("localhost")) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  // 4. Default fallback to production live domain
  return "https://ardp.my.id";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const baseUrl = resolveAppBaseUrl(request);

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
        "Waply User";
      const isSuperAdmin = userEmail === "admin@waply.id";
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
        cookieStore.set("waply_demo_auth", "true", {
          path: "/",
          maxAge,
          sameSite: "lax",
          httpOnly: false,
        });
        cookieStore.set("waply_user_email", userEmail, {
          path: "/",
          maxAge,
          sameSite: "lax",
          httpOnly: false,
        });
        cookieStore.set("waply_user_name", userName, {
          path: "/",
          maxAge,
          sameSite: "lax",
          httpOnly: false,
        });
        cookieStore.set("waply_user_role", userRole, {
          path: "/",
          maxAge,
          sameSite: "lax",
          httpOnly: false,
        });
        cookieStore.set("waply_user_id", authUser.id, {
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
