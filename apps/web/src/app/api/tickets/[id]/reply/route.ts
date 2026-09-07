import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getTicketById, replyToTicket } from "@/lib/support-tickets";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const body = await req.json();

    const { message } = body;
    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Pesan balasan tidak boleh kosong" }, { status: 400 });
    }

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

    const senderRole = isAdmin ? "support" : "user";
    const senderName = isAdmin ? "Sendora Support Agent" : (user.name || "Sendora User");

    const updated = replyToTicket(id, {
      senderId: user.id,
      senderName,
      senderEmail: user.email,
      senderRole,
      message: message.trim(),
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Gagal mengirim balasan" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Balasan berhasil dikirim",
      data: updated,
    });
  } catch (error: any) {
    console.error("[Ticket Reply API] POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
