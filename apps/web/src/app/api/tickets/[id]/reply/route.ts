import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import {
  getTicketById,
  replyToTicket,
  escalateTicketToHuman,
  updateTicketStatus,
} from "@/lib/support-tickets";
import { generateAiTicketResponse } from "@/lib/gemini-support";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const body = await req.json();

    const { message, attachments } = body;
    const cleanMessage = (message || "").trim();

    if (!cleanMessage && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ success: false, error: "Pesan balasan atau lampiran tidak boleh kosong" }, { status: 400 });
    }

    const ticket = getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    // Sesi sudah diakhiri / ditutup -> chat dinonaktifkan
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      return NextResponse.json({
        success: false,
        error: "Sesi tiket bantuan ini telah selesai dan ditutup. Percakapan dinonaktifkan.",
      }, { status: 400 });
    }

    const isOwner =
      ticket.userId === user.id ||
      ticket.userEmail.toLowerCase() === user.email.toLowerCase();
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const senderRole = isAdmin ? "support" : "user";
    const senderName = isAdmin ? "Waply Support Agent" : (user.name || "Waply User");

    let updated = replyToTicket(id, {
      senderId: user.id,
      senderName,
      senderEmail: user.email,
      senderRole,
      message: cleanMessage || (attachments && attachments.length > 0 ? `[Mengirim ${attachments.length} lampiran file]` : ""),
      attachments: Array.isArray(attachments) ? attachments : undefined,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Gagal mengirim balasan" }, { status: 500 });
    }

    // If client replied and ticket is currently in AI handling mode, trigger AI follow-up
    if (!isAdmin && updated.handlingMode === "AI") {
      try {
        const attachmentNote = attachments && attachments.length > 0
          ? ` [Pengguna melampirkan file: ${attachments.map((a: any) => `${a.name}`).join(", ")}]`
          : "";
        const aiQuery = (cleanMessage || "Pengguna melampirkan file/gambar") + attachmentNote;

        const aiResult = await generateAiTicketResponse(updated, aiQuery);
        if (aiResult && aiResult.replyText) {
          replyToTicket(id, {
            senderId: "ai_assistant",
            senderName: "Waply AI Assistant",
            senderEmail: "ai@waply.id",
            senderRole: "ai",
            message: aiResult.replyText,
          });

          if (aiResult.shouldEscalate) {
            escalateTicketToHuman(
              id,
              aiResult.escalationReason || "Eskalasi otomatis oleh AI"
            );
          } else if (aiResult.shouldClose) {
            // Automatically mark ticket as resolved when client requests closing session
            updateTicketStatus(id, "RESOLVED");
          }

          updated = getTicketById(id) || updated;
        }
      } catch (aiErr) {
        console.error("[Ticket Reply API] AI follow-up response failed:", aiErr);
      }
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
