import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { authRateLimiter, checkRateLimitResponse } from "@/lib/rate-limiter";
import { checkCsrfProtection } from "@/lib/csrf";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/v1/")) {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      const csrfRes = checkCsrfProtection(request);
      if (csrfRes) {
        return csrfRes;
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
