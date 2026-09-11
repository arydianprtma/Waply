import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/forgot-password");

  const isResetPasswordRoute = request.nextUrl.pathname.startsWith("/reset-password");

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isDashboardRoute =
    request.nextUrl.pathname.startsWith("/dashboard") || isAdminRoute;

  // Allow reset password page to be accessible directly
  if (isResetPasswordRoute) {
    return supabaseResponse;
  }

  // Handle explicit logout route or query parameter
  if (request.nextUrl.pathname === "/logout" || request.nextUrl.searchParams.get("logged_out") === "true") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.delete("logged_out");
    url.searchParams.delete("t");
    const res = NextResponse.redirect(url);
    // Purge all cookies
    request.cookies.getAll().forEach((c) => {
      res.cookies.delete(c.name);
      res.cookies.set(c.name, "", { path: "/", maxAge: 0, expires: new Date(0) });
    });
    return res;
  }

  // 1. Check local session cookies first (instant, zero network latency)
  const isDemoAuth = request.cookies.get("waply_demo_auth")?.value === "true";
  const rawEmail = request.cookies.get("waply_user_email")?.value || "";
  const decodedEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : "";
  const rawRole = request.cookies.get("waply_user_role")?.value || "";

  const isAdmin = rawRole === "admin" || decodedEmail === "admin@waply.id";

  if (isDemoAuth || rawEmail) {
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = isAdmin ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }
    // If visiting /admin but role is not admin, redirect to dashboard
    if (isAdminRoute && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // If supabase is not configured yet, redirect unauthenticated users on protected routes to /login
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("[PROJECT-REF]")) {
    if (isDashboardRoute || isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const hasSbCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasSbCookie && (isDashboardRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (!hasSbCookie && !isDashboardRoute && !isAdminRoute) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Fast timeout (180ms) so browser navigation is always instant
    const userPromise = (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    })();

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 180));
    const user = await Promise.race([userPromise, timeoutPromise]);

    // If authenticated user visits login/register, redirect to dashboard
    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // If visiting admin route, strictly verify role
    if (isAdminRoute) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirectTo", request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }

      const email = user.email?.toLowerCase() || "";
      const role =
        user.user_metadata?.role ||
        user.app_metadata?.role ||
        (email === "admin@waply.id" ? "admin" : rawRole || "user");

      if (role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.searchParams.set("error", "forbidden");
        return NextResponse.redirect(url);
      }
    }

    // If unauthenticated user visits protected dashboard, redirect to login
    if (!user && (isDashboardRoute || isAdminRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  } catch (err) {
    // If Supabase check fails on protected route, redirect to login
    if (isDashboardRoute || isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
