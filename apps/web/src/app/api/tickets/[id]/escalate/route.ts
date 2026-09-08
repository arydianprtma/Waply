import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getTicketById, escalateTicketToHuman } from "@/lib/support-tickets";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const ticket = getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    const isOwner =
      ticket.userId === user.id ||
      ticket.userEmail.toLowerCase() === user.email.toLowerCase();
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const reason = body.reason || (isAdmin ? "Admin mengambil alih tiket" : "Klien meminta bantuan CS Manusia");
    const notice = isAdmin
      ? "Admin telah mengambil alih penanganan tiket ini."
      : "Permintaan Anda telah kami teruskan ke Tim Customer Support (Admin). Mohon tunggu balasan dari staf kami.";

    const updated = escalateTicketToHuman(id, reason, notice);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Gagal mengalihkan tiket" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Tiket berhasil dialihkan ke CS Manusia",
      data: updated,
    });
  } catch (error: any) {
    console.error("[Ticket Escalate API] POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
