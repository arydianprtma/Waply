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

    // 1. Find user in database / managed registry
    let dbUser = getUserByEmail(cleanEmail);

    // 2. Fallback check directly in Prisma database if not in JSON registry
    if (!dbUser) {
      try {
        const { prisma } = await import("@waply/database");
        const pUser = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (pUser) {
          dbUser = {
            id: pUser.id,
            email: pUser.email,
            name: pUser.name || cleanEmail.split("@")[0],
            role: (pUser.role as any) || "user",
            status: "ACTIVE",
            planId: "FREE",
            planStatus: "FREE",
            messagesUsed: 0,
            devicesCount: 0,
            createdAt: pUser.createdAt.toISOString(),
          };
        }
      } catch {
        // Safe fallback
      }
    }

    // 3. User verification: Reject if email is not registered in the system
    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Alamat email ini tidak terdaftar di sistem kami. Silakan periksa kembali atau daftar akun baru.",
        },
        { status: 404 }
      );
    }

    if (dbUser.status === "BANNED" || dbUser.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          error: "Akun Anda sedang dinonaktifkan atau ditangguhkan. Silakan hubungi Administrator.",
        },
        { status: 403 }
      );
    }

    const userName = dbUser.name || cleanEmail.split("@")[0] || "Pengguna Waply";

    // Generate secure reset token
    const { token } = createPasswordResetToken(cleanEmail);

    // Build reset link
    const reqOrigin = req.headers.get("origin") || req.headers.get("x-forwarded-host");
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (reqOrigin && !reqOrigin.includes("0.0.0.0") && !reqOrigin.includes("localhost")
        ? (reqOrigin.startsWith("http") ? reqOrigin : `https://${reqOrigin}`)
        : "https://ardp.my.id");
    const resetUrl = `${origin.replace(/\/$/, "")}/reset-password?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

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
