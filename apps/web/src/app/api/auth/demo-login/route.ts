import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByEmail, registerOrSyncUser, generateUserId } from "@/lib/admin-users";
import { extractClientIp } from "@/lib/ip-utils";
import {
  hasAdminPassword,
  verifyAdminPassword,
  verifyPassword,
  hashPassword,
} from "@/lib/admin-settings";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cleanEmail = (body.email || "").toLowerCase().trim();
    const inputPassword = (body.password || "").trim();
    const clientIp = extractClientIp(request);

    if (!cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Silakan masukkan alamat email yang valid." },
        { status: 400 }
      );
    }

    const isMasterAdminEmail =
      cleanEmail === "arydianprtma@gmail.com" ||
      cleanEmail === "admin@waply.id" ||
      cleanEmail === "admin@waply.web.id";

    // 1. Look up user in database
    let dbUser = getUserByEmail(cleanEmail);

    // 2. Handle non-existent user: DO NOT auto-register unregistered users on login!
    if (!dbUser) {
      if (isMasterAdminEmail) {
        dbUser = registerOrSyncUser({
          id: "admin-master-waply-01",
          email: cleanEmail,
          name: "Ary Dian Pratama",
          role: "admin",
          ipAddress: clientIp,
          emailVerified: true,
        });
      } else if (body.id) {
        // Authenticated via external provider / Supabase session callback
        dbUser = registerOrSyncUser({
          id: body.id,
          email: cleanEmail,
          name: body.name || cleanEmail.split("@")[0] || "Waply User",
          role: "user",
          ipAddress: clientIp,
          emailVerified: true,
        });
      } else {
        // Unregistered user attempting to login
        return NextResponse.json(
          {
            success: false,
            error: "Akun dengan email ini belum terdaftar. Silakan daftar akun baru terlebih dahulu.",
          },
          { status: 404 }
        );
      }
    }

    // 3. Check Account Status (BANNED or SUSPENDED)
    if (dbUser.status === "BANNED") {
      return NextResponse.json(
        {
          success: false,
          error: `Akun Anda telah DIBLOKIR (BANNED). Alasan: ${
            dbUser.banReason || "Pelanggaran aturan sistem Waply"
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

    // 4. Verify Email Confirmation (Block unverified users except master admin)
    if (!isMasterAdminEmail && dbUser.emailVerified === false) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Alamat email Anda belum diverifikasi. Silakan buka inbox atau folder spam email Anda dan klik tautan verifikasi sebelum masuk.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 }
      );
    }

    // 5. Verify Password
    const isSuperAdminUser = isMasterAdminEmail || dbUser.role === "admin";
    if (isSuperAdminUser && hasAdminPassword()) {
      if (!inputPassword || !verifyAdminPassword(inputPassword)) {
        return NextResponse.json(
          {
            success: false,
            error: "Password akun Super Admin salah. Silakan periksa kembali.",
          },
          { status: 401 }
        );
      }
    } else if (!isSuperAdminUser && !body.id) {
      // Local authentication for standard users
      if (!inputPassword) {
        return NextResponse.json(
          {
            success: false,
            error: "Silakan masukkan password akun Anda.",
          },
          { status: 400 }
        );
      }

      if (dbUser.passwordHash) {
        const isValid = verifyPassword(inputPassword, dbUser.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            {
              success: false,
              error: "Email atau password yang Anda masukkan salah. Silakan periksa kembali.",
            },
            { status: 401 }
          );
        }
      } else {
        // Legacy account without password hash: save password hash on first valid login
        dbUser = registerOrSyncUser({
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          passwordHash: hashPassword(inputPassword),
          ipAddress: clientIp,
        });
      }
    }

    // 6. Resolve exact role from database record
    const exactRole: "admin" | "user" =
      dbUser.role || (cleanEmail === "admin@waply.id" ? "admin" : "user");
    const exactName = dbUser.name || cleanEmail.split("@")[0] || "Waply User";

    // 7. Update last login timestamp and client IP in database
    registerOrSyncUser({
      id: dbUser.id,
      email: dbUser.email,
      name: exactName,
      role: exactRole,
      ipAddress: clientIp,
    });

    // 6. Set Session Cookies
    const cookieStore = await cookies();
    cookieStore.set("waply_demo_auth", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("waply_user_email", cleanEmail, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("waply_user_name", exactName, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("waply_user_role", exactRole, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("waply_user_id", dbUser.id, {
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
        lastLoginIp: clientIp,
      },
      redirectTo: redirectPath,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
