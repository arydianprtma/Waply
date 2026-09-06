import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import {
  getAllAnnouncements,
  markAnnouncementAsRead,
  markAllAnnouncementsAsRead,
} from "@/lib/announcements";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    const all = getAllAnnouncements();

    // Filter only active announcements
    const active = all.filter((a) => a.isActive !== false);

    // Map each item with user-specific read status
    const data = active.map((a) => ({
      ...a,
      isRead: a.readBy ? a.readBy.includes(user.id) : false,
    }));

    // Sort pinned items first, then by createdAt desc
    data.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const unreadCount = data.filter((a) => !a.isRead).length;

    return NextResponse.json({
      success: true,
      data,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json();

    if (body.action === "mark_all_read") {
      markAllAnnouncementsAsRead(user.id);
      return NextResponse.json({ success: true, message: "Semua pengumuman ditandai telah dibaca" });
    }

    if (body.announcementId) {
      markAnnouncementAsRead(body.announcementId, user.id);
      return NextResponse.json({ success: true, message: "Pengumuman ditandai telah dibaca" });
    }

    return NextResponse.json({ success: false, error: "Parameter tidak lengkap" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
