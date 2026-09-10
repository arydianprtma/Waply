import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import {
  getSecurityConfig,
  saveSecurityConfig,
  getSecurityLogs,
} from "@/lib/security-guard";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = getSecurityConfig();
    const logs = getSecurityLogs();

    return NextResponse.json({
      success: true,
      data: { config, logs },
    });
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
    const { action, config, keyword } = body;

    if (action === "update_config" && config) {
      const updated = saveSecurityConfig(config);
      return NextResponse.json({
        success: true,
        data: updated,
        message: "Konfigurasi keamanan berhasil disimpan",
      });
    }

    if (action === "add_keyword" && keyword) {
      const current = getSecurityConfig();
      const clean = keyword.trim().toLowerCase();
      if (!current.blockedKeywords.includes(clean)) {
        current.blockedKeywords.push(clean);
        saveSecurityConfig(current);
      }
      return NextResponse.json({
        success: true,
        data: current,
        message: `Kata kunci "${clean}" berhasil ditambahkan ke daftar blokir`,
      });
    }

    if (action === "remove_keyword" && keyword) {
      const current = getSecurityConfig();
      const clean = keyword.trim().toLowerCase();
      current.blockedKeywords = current.blockedKeywords.filter(
        (k) => k !== clean
      );
      saveSecurityConfig(current);
      return NextResponse.json({
        success: true,
        data: current,
        message: `Kata kunci "${clean}" dihapus dari daftar blokir`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
