import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const DEFAULT_SECRET = "waply_internal_gateway_token_key";

function timingSafeMatch(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Middleware to secure Gateway internal endpoints against unauthorized direct access
 */
export function gatewayAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow health checks unconditionally
  if (req.path === "/health") {
    return next();
  }

  const configuredSecret = process.env.GATEWAY_SECRET || DEFAULT_SECRET;
  const providedSecret =
    req.headers["x-gateway-secret"] ||
    (req.headers["authorization"]?.startsWith("Bearer ")
      ? req.headers["authorization"].substring(7)
      : null);

  if (!providedSecret || typeof providedSecret !== "string") {
    res.status(401).json({
      success: false,
      error: "401 Unauthorized: Internal Gateway secret is missing or invalid",
    });
    return;
  }

  if (!timingSafeMatch(providedSecret.trim(), configuredSecret.trim())) {
    res.status(403).json({
      success: false,
      error: "403 Forbidden: Invalid Gateway secret token",
    });
    return;
  }

  next();
}
