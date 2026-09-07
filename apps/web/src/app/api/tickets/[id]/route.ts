import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import {
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  deleteTicket,
  TicketStatus,
  TicketPriority,
} from "@/lib/support-tickets";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const ticket = getTicketById(id);

    if (!ticket) {
      return NextResponse.json({ success: false, error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    // Check authorization: admin or owner
    if (
      user.role !== "admin" &&
      ticket.userId !== user.id &&
      ticket.userEmail.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error("[Ticket Detail API] GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const body = await req.json();

    const ticket = getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    // Permission check
    const isOwner =
      ticket.userId === user.id ||
      ticket.userEmail.toLowerCase() === user.email.toLowerCase();
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    let updated = ticket;

    // Status change
    if (body.status) {
      if (
        (ticket.status === "RESOLVED" || ticket.status === "CLOSED") &&
        body.status !== "RESOLVED" &&
        body.status !== "CLOSED"
      ) {
        return NextResponse.json({
          success: false,
          error: "Tiket yang sudah selesai atau ditutup tidak dapat dibuka kembali.",
        }, { status: 400 });
      }

      // Non-admin can only resolve or close their own ticket
      if (!isAdmin && body.status !== "RESOLVED" && body.status !== "CLOSED") {
        return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400 });
      }
      updated = updateTicketStatus(id, body.status as TicketStatus) || updated;
    }

    // Priority change (Admin only)
    if (body.priority) {
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: "Hanya admin yang dapat mengubah prioritas" }, { status: 403 });
      }
      updated = updateTicketPriority(id, body.priority as TicketPriority) || updated;
    }

    return NextResponse.json({
      success: true,
      message: "Tiket berhasil diperbarui",
      data: updated,
    });
  } catch (error: any) {
    console.error("[Ticket Detail API] PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Hanya admin yang dapat menghapus tiket" }, { status: 403 });
    }

    const success = deleteTicket(id);
    if (!success) {
      return NextResponse.json({ success: false, error: "Gagal menghapus tiket atau tiket tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Tiket berhasil dihapus",
    });
  } catch (error: any) {
    console.error("[Ticket Detail API] DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
