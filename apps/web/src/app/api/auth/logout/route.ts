import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // 1. Delete all known waply cookies
    const authCookieNames = [
      "waply_demo_auth",
      "waply_user_email",
      "waply_user_name",
      "waply_user_role",
      "waply_user_id",
    ];

    authCookieNames.forEach((name) => {
      cookieStore.delete(name);
      cookieStore.set(name, "", { path: "/", maxAge: 0, expires: new Date(0) });
    });

    // 2. Delete any lingering session or Supabase cookies
    allCookies.forEach((c) => {
      if (
        c.name.startsWith("waply_") ||
        c.name.startsWith("sb-") ||
        c.name.includes("supabase") ||
        c.name.includes("auth")
      ) {
        cookieStore.delete(c.name);
        cookieStore.set(c.name, "", { path: "/", maxAge: 0, expires: new Date(0) });
      }
    });

    // 3. Supabase sign out
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {}

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Explicitly append expired Set-Cookie headers
    const expiredCookies = [
      "waply_demo_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax",
      "waply_user_email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax",
      "waply_user_name=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax",
      "waply_user_role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax",
      "waply_user_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax",
    ];

    expiredCookies.forEach((h) => response.headers.append("Set-Cookie", h));

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
