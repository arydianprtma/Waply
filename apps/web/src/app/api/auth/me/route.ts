import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve user session" },
      { status: 401 }
    );
  }
}
