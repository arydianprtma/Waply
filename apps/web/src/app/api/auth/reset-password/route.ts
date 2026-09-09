import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByEmail, registerOrSyncUser } from "@/lib/admin-users";
import { verifyPasswordResetToken, consumePasswordResetToken } from "@/lib/password-reset";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { saveSettings } from "@/lib/settings";

import { passwordResetRateLimiter, checkRateLimitResponse } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const rateLimitRes = checkRateLimitResponse(req, passwordResetRateLimiter);
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const body = await req.json().catch(() => ({}));
    const cleanEmail = (body.email || "").trim().toLowerCase();
    const token = (body.token || "").trim();
    const newPassword = (body.password || "").trim();
    const confirmPassword = (body.confirmPassword || "").trim();

    if (!cleanEmail || !token) {
      return NextResponse.json(
        { success: false, error: "Parameter token dan email reset password tidak lengkap atau tidak valid." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password baru minimal harus 6 karakter." },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Konfirmasi password baru tidak cocok." },
        { status: 400 }
      );
    }

    // 1. Verify token
    const isValidToken = verifyPasswordResetToken(cleanEmail, token);
    if (!isValidToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan reset password sudah kedaluwarsa atau tidak valid. Silakan ajukan permohonan reset baru.",
        },
        { status: 400 }
      );
    }

    // 2. Consume / Invalidate token
    consumePasswordResetToken(cleanEmail, token);

    // 3. Update Supabase Auth password if active
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.auth.updateUser({
          password: newPassword,
        });
      } catch (sbErr: any) {
        console.warn("[Reset Password] Supabase updateUser note:", sbErr.message);
      }
    }

    // 4. Update / ensure user in registry & settings
    let dbUser = getUserByEmail(cleanEmail);
    if (!dbUser) {
      dbUser = registerOrSyncUser({
        id: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
        email: cleanEmail,
        name: cleanEmail.split("@")[0] || "Waply User",
        role: cleanEmail === "admin@waply.id" ? "admin" : "user",
      });
    }

    saveSettings(
      dbUser.id,
      {
        security: {
          twoFactorEnabled: false,
          twoFactorMethod: "authenticator",
          lastPasswordChanged: new Date().toISOString(),
          loginAlerts: true,
        },
      },
      {
        name: dbUser.name,
        email: dbUser.email,
      }
    );

    // 5. Establish session cookies so user is automatically logged in
    const cookieStore = await cookies();
    const maxAge = 60 * 60 * 24 * 7;
    cookieStore.set("waply_demo_auth", "true", {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("waply_user_email", cleanEmail, {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("waply_user_name", dbUser.name || cleanEmail.split("@")[0], {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("waply_user_role", dbUser.role || "user", {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("waply_user_id", dbUser.id, {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: false,
    });

    return NextResponse.json({
      success: true,
      message: "Password Anda berhasil diperbarui. Mengalihkan ke Dashboard...",
      redirectTo: dbUser.role === "admin" ? "/admin" : "/dashboard",
    });
  } catch (err: any) {
    console.error("[Reset Password API Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui password." },
      { status: 500 }
    );
  }
}
