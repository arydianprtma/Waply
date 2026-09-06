import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByEmail, registerOrSyncUser } from "@/lib/admin-users";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cleanEmail = (body.email || "").toLowerCase().trim();

    if (!cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Silakan masukkan alamat email yang valid." },
        { status: 400 }
      );
    }

    // 1. Look up user in database
    let dbUser = getUserByEmail(cleanEmail);

    // 2. If user does not exist in database, auto-register them
    if (!dbUser) {
      const isSuperAdmin = cleanEmail === "admin@sendora.id";
      const initialRole: "admin" | "user" = isSuperAdmin ? "admin" : "user";
      const initialName = isSuperAdmin
        ? "Sendora Super Admin"
        : body.name || cleanEmail.split("@")[0] || "Sendora User";

      dbUser = registerOrSyncUser({
        id: isSuperAdmin
          ? "admin-master-sendora-01"
          : `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
        email: cleanEmail,
        name: initialName,
        role: initialRole,
      });
    }

    // 3. Check Account Status (BANNED or SUSPENDED)
    if (dbUser.status === "BANNED") {
      return NextResponse.json(
        {
          success: false,
          error: `Akun Anda telah DIBLOKIR (BANNED). Alasan: ${
            dbUser.banReason || "Pelanggaran aturan sistem Sendora"
          }. Hubungi admin untuk informasi lebih lanjut.`,
        },
        { status: 403 }
      );
    }

    if (dbUser.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Akun Anda sedang DINONAKTIFKAN (SUSPENDED) sementara oleh Admin. Hubungi customer support kami.",
        },
        { status: 403 }
      );
    }

    // 4. Resolve exact role from database record
    const exactRole: "admin" | "user" =
      dbUser.role || (cleanEmail === "admin@sendora.id" ? "admin" : "user");
    const exactName = dbUser.name || cleanEmail.split("@")[0] || "Sendora User";

    // 5. Update last login timestamp in database
    registerOrSyncUser({
      id: dbUser.id,
      email: dbUser.email,
      name: exactName,
      role: exactRole,
    });

    // 6. Set Session Cookies
    const cookieStore = await cookies();
    cookieStore.set("sendora_demo_auth", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("sendora_user_email", cleanEmail, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("sendora_user_name", exactName, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("sendora_user_role", exactRole, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("sendora_user_id", dbUser.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
    });

    const redirectPath = exactRole === "admin" ? "/admin" : "/dashboard";

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: cleanEmail,
        name: exactName,
        role: exactRole,
        status: dbUser.status,
        planId: dbUser.planId,
      },
      redirectTo: redirectPath,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
