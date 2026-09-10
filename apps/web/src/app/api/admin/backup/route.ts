import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import {
  listBackups,
  createSystemBackup,
  getBackupContent,
} from "@/lib/admin-backup";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const downloadId = searchParams.get("download");

    if (downloadId) {
      const content = getBackupContent(downloadId);
      if (!content) {
        return NextResponse.json(
          { error: "File backup tidak ditemukan" },
          { status: 404 }
        );
      }

      return new NextResponse(JSON.stringify(content, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${downloadId}.json"`,
        },
      });
    }

    const backups = listBackups();
    return NextResponse.json({ success: true, data: backups });
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

    const result = createSystemBackup();
    if (!result.success) {
      return NextResponse.json(
        { error: "Gagal membuat snapshot backup" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.backup,
      message: `Snapshot backup ${result.backup?.id} berhasil dibuat`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
