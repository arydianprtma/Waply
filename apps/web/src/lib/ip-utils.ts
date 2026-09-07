/**
 * Utility to extract client IP from incoming HTTP requests,
 * handling Cloudflare Tunnel (cf-connecting-ip), Reverse Proxies (x-forwarded-for),
 * and standard Nginx (x-real-ip).
 */
export function extractClientIp(
  requestOrHeaders?: Request | Headers | Record<string, string | string[] | undefined> | null
): string {
  try {
    if (!requestOrHeaders) return "127.0.0.1";

    let headersObj: Headers | Record<string, any> | null = null;

    if ("headers" in requestOrHeaders && requestOrHeaders.headers) {
      headersObj = requestOrHeaders.headers as Headers;
    } else {
      headersObj = requestOrHeaders as Headers | Record<string, any>;
    }

    let cfIp: string | null = null;
    let xff: string | null = null;
    let realIp: string | null = null;

    if (typeof (headersObj as any).get === "function") {
      cfIp = (headersObj as Headers).get("cf-connecting-ip");
      xff = (headersObj as Headers).get("x-forwarded-for");
      realIp = (headersObj as Headers).get("x-real-ip");
    } else {
      const obj = headersObj as Record<string, any>;
      cfIp = obj["cf-connecting-ip"];
      xff = obj["x-forwarded-for"];
      realIp = obj["x-real-ip"];
    }

    if (cfIp && typeof cfIp === "string" && cfIp.trim()) {
      return cfIp.trim();
    }

    if (xff && typeof xff === "string" && xff.trim()) {
      const first = xff.split(",")[0]?.trim();
      if (first && first !== "::1" && first !== "unknown") return first;
    }

    if (realIp && typeof realIp === "string" && realIp.trim()) {
      return realIp.trim();
    }

    return "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}
