import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { saveSettings } from "@/lib/settings";
import {
  setAdminPassword,
  verifyAdminPassword,
  hasAdminPassword,
} from "@/lib/admin-settings";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json();

    const { currentPassword, newPassword, confirmPassword } = body;

    const isSuperAdmin = user.role === "admin" || user.email === "admin@waply.id";
    const minLength = isSuperAdmin ? 8 : 6;

    if (!newPassword || newPassword.length < minLength) {
      return NextResponse.json(
        {
          success: false,
          error: `Password baru ${isSuperAdmin ? "Super Admin " : ""}minimal harus ${minLength} karakter`,
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Konfirmasi password baru tidak cocok" },
        { status: 400 }
      );
    }

    // 1. Super Admin Password Handling
    if (isSuperAdmin) {
      // If current password was previously configured, verify currentPassword if provided
      if (hasAdminPassword() && currentPassword) {
        const isCurrentValid = verifyAdminPassword(currentPassword);
        if (!isCurrentValid) {
          return NextResponse.json(
            { success: false, error: "Password saat ini yang Anda masukkan salah." },
            { status: 400 }
          );
        }
      }

      // Save new Super Admin password
      setAdminPassword(newPassword);

      // Record last password changed timestamp
      saveSettings(
        user.id,
        {
          security: {
            twoFactorEnabled: false,
            twoFactorMethod: "authenticator",
            lastPasswordChanged: new Date().toISOString(),
            loginAlerts: true,
          },
        },
        {
          name: user.name,
          email: user.email,
        }
      );

      // Attempt Supabase sync if an active Supabase session exists for this user (safe & non-blocking)
      if (isSupabaseConfigured()) {
        try {
          const cookieStore = await cookies();
          const hasSbCookie = cookieStore.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
          if (hasSbCookie) {
            const supabase = await createClient();
            await supabase.auth.updateUser({ password: newPassword });
          }
        } catch (sbErr: any) {
          console.warn("[Auth] Superadmin Supabase password sync skipped:", sbErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Password Super Admin berhasil diperbarui. Silakan gunakan password baru ini untuk login berikutnya.",
      });
    }

    // 2. Regular User Password Handling
    const cookieStore = await cookies();
    const hasSbCookie = cookieStore.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

    if (isSupabaseConfigured() && hasSbCookie) {
      try {
        const supabase = await createClient();
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
          );
        }
      } catch (sbErr: any) {
        console.error("[Auth] Supabase password update error:", sbErr.message);
        return NextResponse.json(
          { success: false, error: sbErr.message || "Gagal mengupdate password di Supabase" },
          { status: 500 }
        );
      }
    }

    // Record last password changed timestamp in user settings
    saveSettings(
      user.id,
      {
        security: {
          twoFactorEnabled: false,
          twoFactorMethod: "authenticator",
          lastPasswordChanged: new Date().toISOString(),
          loginAlerts: true,
        },
      },
      {
        name: user.name,
        email: user.email,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah. Silakan gunakan password baru Anda untuk login berikutnya.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengubah password" },
      { status: 500 }
    );
  }
}
