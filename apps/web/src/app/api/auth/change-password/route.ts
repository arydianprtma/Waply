import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { saveSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json();

    const { currentPassword, newPassword, confirmPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password baru minimal harus 6 karakter" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Konfirmasi password baru tidak cocok" },
        { status: 400 }
      );
    }

    // If Supabase is active, update the password on Supabase Auth
    if (isSupabaseConfigured()) {
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
