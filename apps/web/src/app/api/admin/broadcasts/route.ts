import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import {
  getAllSystemBroadcasts,
  adminPauseBroadcast,
  adminCancelBroadcast,
} from "@/lib/admin-broadcasts";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = getAllSystemBroadcasts();
    return NextResponse.json({ success: true, data });
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
    const { action, id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID wajib disertakan" },
        { status: 400 }
      );
    }

    if (action === "pause") {
      const campaign = adminPauseBroadcast(id);
      if (!campaign) {
        return NextResponse.json(
          { error: "Kampanye tidak ditemukan atau sudah selesai" },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        data: campaign,
        message: "Kampanye broadcast berhasil dijeda (PAUSED)",
      });
    }

    if (action === "cancel") {
      const campaign = adminCancelBroadcast(id);
      if (!campaign) {
        return NextResponse.json(
          { error: "Kampanye tidak ditemukan atau sudah selesai" },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        data: campaign,
        message: "Kampanye broadcast berhasil dibatalkan (CANCELLED)",
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
