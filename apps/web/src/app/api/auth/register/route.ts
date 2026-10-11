import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, registerOrSyncUser } from "@/lib/admin-users";
import { extractClientIp } from "@/lib/ip-utils";
import { sendEmailVerification } from "@/lib/email-service";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cleanEmail = (body.email || "").trim().toLowerCase();
    const name = (body.name || "").trim() || cleanEmail.split("@")[0] || "Waply User";
    const password = (body.password || "").trim();
    const clientIp = extractClientIp(req);

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Alamat email tidak valid." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    const existing = getUserByEmail(cleanEmail);
    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json(
          { success: false, error: "Email ini sudah terdaftar. Silakan langsung masuk (login)." },
          { status: 400 }
        );
      }
    }

    // 2. Generate secure email verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");

    // 3. Register user in local database with emailVerified = false
    let userId = existing ? existing.id : `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;

    // Sync to Supabase Auth backend via Admin API (email_confirm: false, no default email sent)
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sbUrl && sbKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(sbUrl, sbKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: sbUser, error: sbErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: password,
          email_confirm: false, // will be confirmed when user clicks verification link
          user_metadata: { name },
        });

        if (!sbErr && sbUser?.user?.id) {
          userId = sbUser.user.id;
        } else if (sbErr) {
          console.warn("[Register] Supabase Admin sync warning:", sbErr.message);
        }
      } catch (err: any) {
        console.warn("[Register] Supabase Admin connection error:", err.message);
      }
    }

    registerOrSyncUser({
      id: userId,
      email: cleanEmail,
      name,
      role: "user",
      ipAddress: clientIp,
      emailVerified: false,
      emailVerifyToken: verifyToken,
    });

    // 4. Build verification link
    const reqOrigin = req.headers.get("origin") || req.headers.get("x-forwarded-host");
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (reqOrigin && !reqOrigin.includes("0.0.0.0") && !reqOrigin.includes("localhost")
        ? (reqOrigin.startsWith("http") ? reqOrigin : `https://${reqOrigin}`)
        : "https://waply.web.id");

    const verificationUrl = `${origin.replace(/\/$/, "")}/auth/callback?verify_token=${verifyToken}&email=${encodeURIComponent(cleanEmail)}`;

    // 5. Send verification email via Resend SMTP
    const sent = await sendEmailVerification({
      customerEmail: cleanEmail,
      customerName: name,
      verificationUrl,
    });

    if (!sent) {
      return NextResponse.json(
        {
          success: false,
          error: "Gagal mengirimkan email verifikasi. Silakan periksa kembali konfigurasi SMTP atau coba beberapa saat lagi.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pendaftaran berhasil! Tautan verifikasi email telah dikirimkan ke kotak masuk Anda. Silakan verifikasi untuk mengaktifkan akun.",
      emailSent: true,
    });
  } catch (err: any) {
    console.error("[Register API Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memproses pendaftaran akun." },
      { status: 500 }
    );
  }
}
