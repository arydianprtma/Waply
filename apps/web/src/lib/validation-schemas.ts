import { z } from "zod";
import { sanitizeHtml, sanitizePhoneNumber, sanitizeText } from "./sanitizer";

/**
 * Helper to validate data against a Zod schema and format errors cleanly
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string>; message: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join(".") || "root";
      formattedErrors[field] = issue.message;
    }
    const firstMessage = result.error.issues[0]?.message || "Validasi gagal";
    return {
      success: false,
      errors: formattedErrors,
      message: firstMessage,
    };
  }
  return { success: true, data: result.data };
}

// 1. Send Message Schema
export const sendMessageSchema = z.object({
  deviceId: z.string().optional(),
  recipient: z.string().optional(),
  to: z.string().optional(),
  template: z.string().optional(),
  templateId: z.string().optional(),
  message: z
    .string()
    .max(4096, "Pesan maksimal 4096 karakter")
    .transform((val) => sanitizeHtml(sanitizeText(val)))
    .optional(),
  variables: z.record(z.union([z.string(), z.number()])).optional(),
});

// 2. Auth - Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid")
    .transform((val) => val.trim().toLowerCase()),
});

// 3. Auth - Reset Password Schema
export const resetPasswordSchema = z.object({
  token: z.string({ required_error: "Token reset password wajib disertakan" }).min(10, "Token tidak valid"),
  newPassword: z
    .string({ required_error: "Password baru wajib diisi" })
    .min(6, "Password minimal 6 karakter")
    .max(128, "Password maksimal 128 karakter"),
});

// 4. Auth - Login Schema
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid")
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(1, "Password tidak boleh kosong"),
});

// 5. Auth - Register Schema
export const registerSchema = z.object({
  name: z
    .string({ required_error: "Nama lengkap wajib diisi" })
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .transform((val) => sanitizeText(val, 100)),
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid")
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(6, "Password minimal 6 karakter")
    .max(128, "Password maksimal 128 karakter"),
  phone: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizePhoneNumber(val) : undefined)),
});

// 6. Admin Plan Schema
export const planSchema = z.object({
  id: z
    .string({ required_error: "ID Paket wajib diisi" })
    .min(2, "ID Paket minimal 2 karakter")
    .max(50, "ID Paket maksimal 50 karakter")
    .transform((val) => val.trim().toUpperCase().replace(/\s+/g, "_")),
  name: z
    .string({ required_error: "Nama Paket wajib diisi" })
    .min(2, "Nama Paket minimal 2 karakter")
    .max(100, "Nama Paket maksimal 100 karakter")
    .transform((val) => sanitizeText(val, 100)),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  period: z.enum(["month", "year", "week", "day"]).default("month").optional(),
  maxDevices: z.coerce.number().int().min(1, "Minimal 1 device"),
  monthlyMessages: z.coerce.number().int().min(-1, "Pesan bulanan minimal -1 (unlimited)"),
  originalPrice: z.coerce.number().min(0).optional().nullable(),
  discountPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  discountBadge: z.string().optional().nullable(),
  watermarkEnabled: z.boolean().optional().nullable(),
  features: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  access: z.record(z.string(), z.boolean()).optional().nullable(),
  isPopular: z.boolean().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
  createdAt: z.string().optional().nullable(),
});

// 7. Admin Voucher Schema
export const voucherSchema = z.object({
  code: z
    .string({ required_error: "Kode voucher wajib diisi" })
    .min(3, "Kode voucher minimal 3 karakter")
    .max(30, "Kode voucher maksimal 30 karakter")
    .transform((val) => val.trim().toUpperCase().replace(/\s+/g, "")),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  discountValue: z.coerce.number().min(1, "Nilai diskon minimal 1"),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  minOrderAmount: z.coerce.number().min(0).optional().nullable(),
  quota: z.coerce.number().int().min(1, "Kuota minimal 1"),
  validUntil: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  applicablePlans: z.array(z.string()).optional().default([]),
});

// 8. API Key Generation Schema
export const apiKeySchema = z.object({
  name: z
    .string({ required_error: "Nama API Key wajib diisi" })
    .min(1, "Nama API Key minimal 1 karakter")
    .max(64, "Nama API Key maksimal 64 karakter")
    .transform((val) => sanitizeText(val, 64)),
});

// 9. Auto Reply Schema
export const autoReplySchema = z.object({
  keyword: z
    .string({ required_error: "Keyword wajib diisi" })
    .min(1, "Keyword tidak boleh kosong")
    .max(255, "Keyword maksimal 255 karakter")
    .transform((val) => sanitizeText(val, 255)),
  matchType: z.enum(["EXACT", "CONTAINS", "STARTS_WITH", "REGEX"]).default("CONTAINS"),
  response: z
    .string({ required_error: "Respon pesan wajib diisi" })
    .min(1, "Respon pesan tidak boleh kosong")
    .max(4096, "Respon pesan maksimal 4096 karakter")
    .transform((val) => sanitizeHtml(sanitizeText(val))),
  isActive: z.boolean().optional().default(true),
});

// 10. Contact Schema
export const contactSchema = z.object({
  name: z
    .string({ required_error: "Nama kontak wajib diisi" })
    .min(1, "Nama kontak tidak boleh kosong")
    .max(100, "Nama kontak maksimal 100 karakter")
    .transform((val) => sanitizeText(val, 100)),
  phone: z
    .string({ required_error: "Nomor WhatsApp wajib diisi" })
    .transform((val) => sanitizePhoneNumber(val)),
  group: z.string().optional().nullable(),
  customFields: z.record(z.any()).optional().nullable(),
});
