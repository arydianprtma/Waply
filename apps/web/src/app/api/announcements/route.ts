import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import {
  getAllAnnouncements,
  markAnnouncementAsRead,
  markAllAnnouncementsAsRead,
} from "@/lib/announcements";
import {
  getSubscription,
  getAllPlans,
  DEFAULT_PLANS,
  markExpiredNotificationRead,
} from "@/lib/billing";

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

    // Inject dynamic notification if user's subscription expired and reverted to Free
    try {
      const sub = getSubscription(user.id);
      if (sub && sub.expiredPlanId) {
        const allPlans = getAllPlans();
        const planObj = allPlans[sub.expiredPlanId] || DEFAULT_PLANS[sub.expiredPlanId];
        const planName =
          planObj?.name ||
          (sub.expiredPlanId === "STARTER"
            ? "Starter"
            : sub.expiredPlanId === "PRO"
            ? "Pro"
            : "Enterprise");

        const isRead = Boolean(sub.expiredReadAt);
        const expiredAtIso = sub.expiredAt || sub.updatedAt || new Date().toISOString();
        const annId = `ann_sub_expired_${sub.expiredPlanId}_${new Date(expiredAtIso).getTime()}`;

        data.unshift({
          id: annId,
          title: `Paket ${planName} Telah Berakhir`,
          message: `Masa aktif paket ${planName} Anda telah berakhir. Akun Anda saat ini otomatis dialihkan ke Paket Free Trial.\n\nKuota pesan dan fitur kini disesuaikan dengan batasan paket Free. Silakan perpanjang atau upgrade paket untuk mengaktifkan kembali seluruh fitur dan kuota tanpa batas.`,
          type: "WARNING" as const,
          targetAudience: "ALL" as const,
          isPinned: true,
          isActive: true,
          isPopup: true,
          popupActionText: "Perpanjang / Upgrade Sekarang",
          popupActionUrl: "/dashboard/billing",
          createdAt: expiredAtIso,
          updatedAt: expiredAtIso,
          readBy: isRead ? [user.id] : [],
          isRead,
        });
      }
    } catch (subErr) {
      console.error("Failed to check subscription expiration for announcements:", subErr);
    }

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
      markExpiredNotificationRead(user.id);
      return NextResponse.json({ success: true, message: "Semua pengumuman ditandai telah dibaca" });
    }

    if (body.announcementId) {
      if (typeof body.announcementId === "string" && body.announcementId.startsWith("ann_sub_expired_")) {
        markExpiredNotificationRead(user.id);
        return NextResponse.json({ success: true, message: "Pengumuman ditandai telah dibaca" });
      }
      markAnnouncementAsRead(body.announcementId, user.id);
      return NextResponse.json({ success: true, message: "Pengumuman ditandai telah dibaca" });
    }

    return NextResponse.json({ success: false, error: "Parameter tidak lengkap" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
