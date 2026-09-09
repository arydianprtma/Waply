import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/admin-users";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendEmailResetPassword } from "@/lib/email-service";

import { passwordResetRateLimiter, checkRateLimitResponse } from "@/lib/rate-limiter";
import { forgotPasswordSchema, validateSchema } from "@/lib/validation-schemas";

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const rateLimitRes = checkRateLimitResponse(req, passwordResetRateLimiter);
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const body = await req.json().catch(() => ({}));
    const validation = validateSchema(forgotPasswordSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.message, details: validation.errors },
        { status: 400 }
      );
    }

    const cleanEmail = validation.data.email;

    // Find user in database / managed registry
    const dbUser = getUserByEmail(cleanEmail);
    const userName = dbUser?.name || cleanEmail.split("@")[0] || "Pengguna Waply";

    // Generate secure reset token
    const { token } = createPasswordResetToken(cleanEmail);

    // Build reset link
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    // Dispatch custom SMTP email
    const sent = await sendEmailResetPassword({
      customerEmail: cleanEmail,
      customerName: userName,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Tautan reset password telah berhasil dikirim ke alamat email Anda. Silakan periksa inbox (atau spam) email Anda.",
      sentViaSmtp: sent,
    });
  } catch (err: any) {
    console.error("[Forgot Password API Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memproses permintaan reset password." },
      { status: 500 }
    );
  }
}
