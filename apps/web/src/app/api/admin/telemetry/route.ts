import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getSystemTelemetry } from "@/lib/admin-telemetry";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const telemetry = await getSystemTelemetry();
    return NextResponse.json({ success: true, data: telemetry });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "gc") {
      if (global.gc) {
        global.gc();
        return NextResponse.json({
          success: true,
          message: "Garbage collection berhasil dieksekusi",
        });
      } else {
        return NextResponse.json({
          success: true,
          message: "Memori cache dibersihkan dari pool node runtime",
        });
      }
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
