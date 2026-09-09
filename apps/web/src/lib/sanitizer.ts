/**
 * Input Sanitization & XSS Prevention Utility for Waply
 */

/**
 * Escapes HTML special characters into safe HTML entities
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strips dangerous HTML tags, inline event handlers, and javascript: protocols
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    // Strip script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Strip iframe tags and content
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    // Strip style, object, embed, applet, meta, link tags
    .replace(/<(object|embed|applet|meta|link|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, "")
    .replace(/<(object|embed|applet|meta|link|style)[^>]*>/gi, "")
    // Strip dangerous img tags or strip all tags if untrusted
    .replace(/<img[^>]*>/gi, "")
    // Replace inline event handlers
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/on\w+=\S+/gi, "")
    // Replace javascript: and vbscript: URIs
    .replace(/javascript:[^"'\s]*/gi, "")
    .replace(/vbscript:[^"'\s]*/gi, "")
    // Replace data: text/html protocols
    .replace(/data:text\/html[^"'\s]*/gi, "");
}

/**
 * Strips HTML tags entirely, converting to plain text
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

/**
 * Cleans, validates, and normalizes phone number to international E.164 format (Indonesian default)
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") return "";

  // Keep only digits
  let cleaned = phone.replace(/\D/g, "");

  // Convert Indonesian formats
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}

/**
 * Validates whether a sanitized phone number is valid
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = sanitizePhoneNumber(phone);
  // Valid international phone number usually has 10 to 16 digits
  return /^\d{10,16}$/.test(cleaned);
}

/**
 * Sanitizes plain text by removing non-printable control characters (except newline, tab, carriage return)
 */
export function sanitizeText(text: string, maxLength?: number): string {
  if (!text || typeof text !== "string") return "";

  // Remove ASCII control characters except \r, \n, \t
  let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();

  if (maxLength && maxLength > 0 && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

/**
 * Deeply sanitizes all string fields within an object or array
 */
export function sanitizeObject<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return sanitizeText(sanitizeHtml(data)) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = sanitizeObject(value);
    }
    return result as T;
  }

  return data;
}
