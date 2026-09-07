/**
 * Utility to extract client IP from incoming HTTP requests,
 * handling Cloudflare Tunnel (cf-connecting-ip), True-Client-IP,
 * Reverse Proxies (x-forwarded-for), and Nginx (x-real-ip).
 */
export function extractClientIp(
  requestOrHeaders?: Request | Headers | Record<string, string | string[] | undefined> | null
): string {
  try {
    if (!requestOrHeaders) return "127.0.0.1";

    let getHeader = (name: string): string | null => {
      try {
        if (!requestOrHeaders) return null;
        if ("headers" in requestOrHeaders && requestOrHeaders.headers) {
          const h = requestOrHeaders.headers;
          if (typeof (h as any).get === "function") {
            return (h as Headers).get(name) || (h as Headers).get(name.toLowerCase());
          }
          const rec = h as Record<string, any>;
          return rec[name] || rec[name.toLowerCase()] || null;
        }
        if (typeof (requestOrHeaders as any).get === "function") {
          return (
            (requestOrHeaders as Headers).get(name) ||
            (requestOrHeaders as Headers).get(name.toLowerCase())
          );
        }
        const rec = requestOrHeaders as Record<string, any>;
        return rec[name] || rec[name.toLowerCase()] || null;
      } catch {
        return null;
      }
    };

    // Priority 1: Cloudflare Connecting IP
    const cfIp = getHeader("cf-connecting-ip") || getHeader("true-client-ip");
    if (cfIp && typeof cfIp === "string" && cfIp.trim() && cfIp !== "unknown") {
      return cfIp.trim();
    }

    // Priority 2: X-Forwarded-For (First non-internal IP)
    const xff = getHeader("x-forwarded-for");
    if (xff && typeof xff === "string" && xff.trim()) {
      const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        if (p && p !== "unknown" && p !== "127.0.0.1" && p !== "::1") {
          return p;
        }
      }
      if (parts.length > 0 && parts[0] !== "unknown") {
        return parts[0];
      }
    }

    // Priority 3: X-Real-IP / X-Client-IP
    const realIp = getHeader("x-real-ip") || getHeader("x-client-ip");
    if (realIp && typeof realIp === "string" && realIp.trim() && realIp !== "unknown") {
      return realIp.trim();
    }

    return "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}
