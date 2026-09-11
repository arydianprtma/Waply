import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

async function handleLogout(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // 1. Delete all known waply auth cookies
    const authCookieNames = [
      "waply_demo_auth",
      "waply_user_email",
      "waply_user_name",
      "waply_user_role",
      "waply_user_id",
      "waply_session",
      "waply_user",
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
        c.name.includes("auth") ||
        c.name.includes("session")
      ) {
        cookieStore.delete(c.name);
        cookieStore.set(c.name, "", { path: "/", maxAge: 0, expires: new Date(0) });
      }
    });

    // 3. Supabase server sign out
    try {
      const supabase = await createClient();
      await supabase.auth.signOut({ scope: "global" });
    } catch {}

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Explicitly append expired Set-Cookie headers for both host and domains
    const hostname = request.headers.get("host") || "ardp.my.id";
    const cleanHost = hostname.split(":")[0];

    const cookiesToWipe = [...authCookieNames, ...allCookies.map((c) => c.name)];
    const uniqueCookies = Array.from(new Set(cookiesToWipe));

    uniqueCookies.forEach((name) => {
      response.headers.append("Set-Cookie", `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax`);
      response.headers.append("Set-Cookie", `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`);
      if (cleanHost && !cleanHost.includes("localhost") && !cleanHost.includes("0.0.0.0")) {
        response.headers.append("Set-Cookie", `${name}=; Path=/; Domain=.${cleanHost}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax`);
      }
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
