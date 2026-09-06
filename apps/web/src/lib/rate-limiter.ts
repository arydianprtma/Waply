import { NextResponse } from "next/server";

export interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds (e.g. 60000 for 1 minute)
  maxRequests: number; // Maximum requests permitted within windowMs
  name?: string; // Identifier for logging/debugging
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds until allowed
}

interface ClientRecord {
  timestamps: number[];
  lastSeen: number;
}

export class SlidingWindowRateLimiter {
  private clients = new Map<string, ClientRecord>();
  private windowMs: number;
  private maxRequests: number;
  private name: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.name = options.name || "default";

    // Periodically clean up stale client records every 2 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 120000);
      // Ensure interval does not prevent node from exiting
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.clients.entries()) {
      if (now - record.lastSeen > this.windowMs * 2) {
        this.clients.delete(key);
      }
    }
  }

  public check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.clients.get(key);
    if (!record) {
      record = { timestamps: [], lastSeen: now };
      this.clients.set(key, record);
    }

    record.lastSeen = now;
    // Filter timestamps within the current window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const currentCount = record.timestamps.length;
    const resetTime = Math.ceil((now + this.windowMs) / 1000);

    if (currentCount >= this.maxRequests) {
      const oldestTimestamp = record.timestamps[0] || now;
      const retryAfter = Math.max(1, Math.ceil((oldestTimestamp + this.windowMs - now) / 1000));

      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }

    record.timestamps.push(now);
    const remaining = Math.max(0, this.maxRequests - record.timestamps.length);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining,
      resetTime,
      retryAfter: 0,
    };
  }

  public reset(key: string) {
    this.clients.delete(key);
  }
}

/**
 * Pre-configured rate limiters
 */
// Auth Rate Limiter: 5 attempts per 60 seconds (brute force protection)
export const authRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  name: "auth",
});

// Password Reset Rate Limiter: 3 attempts per 60 seconds
export const passwordResetRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 3,
  name: "password-reset",
});

// Messaging & API Key Rate Limiter: 60 requests per 60 seconds
export const apiMessageRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  name: "api-messages",
});

// General Mutation Rate Limiter: 120 requests per 60 seconds
export const generalMutationRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  name: "general-mutation",
});

/**
 * Helper to extract client IP address from standard headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Check rate limit and return 429 response if exceeded, or null if allowed
 */
export function checkRateLimitResponse(
  request: Request,
  limiter: SlidingWindowRateLimiter,
  customIdentifier?: string
): NextResponse | null {
  const ip = getClientIp(request);
  const identifier = customIdentifier ? `${customIdentifier}:${ip}` : ip;
  const result = limiter.check(identifier);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Terlalu banyak permintaan (Rate Limit Exceeded). Silakan coba lagi beberapa saat.",
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.resetTime),
          "Retry-After": String(result.retryAfter),
        },
      }
    );
  }

  return null;
}
