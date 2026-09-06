import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcements";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const announcements = getAllAnnouncements();
    return NextResponse.json({ success: true, data: announcements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await req.json();

    if (body.id) {
      // Update
      const updated = updateAnnouncement(body.id, {
        title: body.title,
        message: body.message,
        type: body.type,
        targetAudience: body.targetAudience,
        isPinned: body.isPinned,
        isActive: body.isActive,
      });

      if (!updated) {
        return NextResponse.json({ success: false, error: "Pengumuman tidak ditemukan" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: updated });
    } else {
      // Create
      if (!body.title || !body.message) {
        return NextResponse.json({ success: false, error: "Judul dan isi pengumuman wajib diisi" }, { status: 400 });
      }

      const created = createAnnouncement({
        title: body.title,
        message: body.message,
        type: body.type || "INFO",
        targetAudience: body.targetAudience || "ALL",
        isPinned: body.isPinned ?? false,
        isActive: body.isActive ?? true,
      });

      return NextResponse.json({ success: true, data: created });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID pengumuman wajib disertakan" }, { status: 400 });
    }

    const ok = deleteAnnouncement(id);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
