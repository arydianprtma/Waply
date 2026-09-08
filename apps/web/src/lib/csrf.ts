import { NextResponse } from "next/server";

/**
 * Cross-Site Request Forgery (CSRF) Protection Utility
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Validates request origin against the host header for state-changing HTTP methods
 */
export function validateCsrf(request: Request): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase();

  // 1. Safe HTTP methods don't mutate state
  if (SAFE_METHODS.has(method)) {
    return { valid: true };
  }

  // 2. Exempt API requests authenticated via API Key
  const authHeader = request.headers.get("authorization") || "";
  const apiKeyHeader = request.headers.get("x-api-key") || "";
  if (authHeader.startsWith("Bearer snd_live_") || apiKeyHeader.startsWith("snd_live_")) {
    return { valid: true };
  }

  // 3. Exempt Webhook & Inbound Gateway routes
  const url = new URL(request.url);
  if (
    url.pathname.includes("/api/billing/notification") ||
    url.pathname.includes("/api/inbound") ||
    url.pathname.startsWith("/api/v1/")
  ) {
    return { valid: true };
  }

  // 4. Check custom client headers (standard SPA defense against simple CSRF forms)
  const xRequestedWith = request.headers.get("x-requested-with");
  const xSendoraClient = request.headers.get("x-sendora-client");
  if (xRequestedWith || xSendoraClient) {
    return { valid: true };
  }

  // 5. Origin / Referer validation
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!origin && !referer) {
    // If neither origin nor referer is provided on a browser mutation request, reject
    return {
      valid: false,
      error: "CSRF check failed: Missing Origin or Referer header on state-changing request",
    };
  }

  const checkUrl = origin || referer;
  if (checkUrl && host) {
    try {
      const parsedUrl = new URL(checkUrl);
      // Compare hostname and port
      if (parsedUrl.host !== host) {
        // Allow localhost development port mismatches if both are localhost
        const isLocalHostMatch =
          (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1") &&
          (host.startsWith("localhost") || host.startsWith("127.0.0.1"));

        if (!isLocalHostMatch) {
          return {
            valid: false,
            error: `CSRF check failed: Origin host mismatch (${parsedUrl.host} vs ${host})`,
          };
        }
      }
    } catch {
      return {
        valid: false,
        error: "CSRF check failed: Malformed Origin/Referer header",
      };
    }
  }

  return { valid: true };
}

/**
 * Helper to enforce CSRF validation in API route handlers
 */
export function checkCsrfProtection(request: Request): NextResponse | null {
  const result = validateCsrf(request);
  if (!result.valid) {
    return NextResponse.json(
      {
        success: false,
        error: result.error || "Akses ditolak: Verifikasi keamanan CSRF gagal",
      },
      { status: 403 }
    );
  }
  return null;
}
