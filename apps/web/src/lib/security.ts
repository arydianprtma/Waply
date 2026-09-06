import crypto from "crypto";

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface AccountStatusCheckResult {
  allowed: boolean;
  reason?: string;
  statusCode?: number;
}

/**
 * Check if a user's account is permitted to perform operations
 */
export function checkAccountStatus(status?: string, banReason?: string | null): AccountStatusCheckResult {
  const normalizedStatus = (status || "ACTIVE").toUpperCase();

  if (normalizedStatus === "BANNED") {
    return {
      allowed: false,
      reason: `Akun Anda telah dinonaktifkan (Banned)${banReason ? `: ${banReason}` : ". Hubungi dukungan Sendora."}`,
      statusCode: 403,
    };
  }

  if (normalizedStatus === "SUSPENDED") {
    return {
      allowed: false,
      reason: `Akun Anda sedang ditangguhkan sementara (Suspended)${banReason ? `: ${banReason}` : ". Silakan hubungi admin."}`,
      statusCode: 403,
    };
  }

  return {
    allowed: true,
  };
}
