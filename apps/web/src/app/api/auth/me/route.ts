import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const isDemoAuth = cookieStore.get("waply_demo_auth")?.value === "true";
    const rawEmail = cookieStore.get("waply_user_email")?.value;
    const cleanEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : "";

    const user = await getSessionUser();

    // Jika membawa cookie auth tetapi user me-fallback ke default guest (karena akun dihapus)
    if ((isDemoAuth || cleanEmail) && user.id === "usr_default_guest") {
      const isSystemAdmin = cleanEmail === "arydianprtma@gmail.com" || cleanEmail === "admin@waply.id";
      if (!isSystemAdmin) {
        const res = NextResponse.json(
          { success: false, error: "Akun Anda telah dihapus oleh Administrator.", code: "ACCOUNT_DELETED" },
          { status: 401 }
        );
        res.cookies.delete("waply_demo_auth");
        res.cookies.delete("waply_user_email");
        res.cookies.delete("waply_user_name");
        res.cookies.delete("waply_user_role");
        res.cookies.delete("waply_user_id");
        return res;
      }
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err: any) {
    const res = NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve user session", code: "ACCOUNT_DELETED" },
      { status: 401 }
    );
    try {
      res.cookies.delete("waply_demo_auth");
      res.cookies.delete("waply_user_email");
      res.cookies.delete("waply_user_name");
      res.cookies.delete("waply_user_role");
      res.cookies.delete("waply_user_id");
    } catch {}
    return res;
  }
}
