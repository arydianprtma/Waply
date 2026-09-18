import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { authRateLimiter, checkRateLimitResponse } from "@/lib/rate-limiter";
import { checkCsrfProtection } from "@/lib/csrf";

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // Immediate pass-through for internal Gateway inbound & public API v1 endpoints
    if (pathname.startsWith("/api/inbound") || pathname.startsWith("/api/v1/") || pathname.startsWith("/api/billing/notification")) {
      return NextResponse.next();
    }

    // 1. Rate Limiting for Auth Endpoints
    if (pathname.startsWith("/api/auth/") || pathname === "/login" || pathname === "/register") {
      if (request.method === "POST") {
        const rateLimitRes = checkRateLimitResponse(request, authRateLimiter);
        if (rateLimitRes) {
          return rateLimitRes;
        }
      }
    }

    // 2. CSRF Protection for state-changing API endpoints
    if (
      pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/v1/") &&
      !pathname.startsWith("/api/inbound") &&
      !pathname.startsWith("/api/billing/notification")
    ) {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const csrfRes = checkCsrfProtection(request);
        if (csrfRes) {
          return csrfRes;
        }
      }
    }

    return await updateSession(request);
  } catch (err) {
    console.error("[Middleware Error Caught]:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff2?)$).*)",
  ],
};
