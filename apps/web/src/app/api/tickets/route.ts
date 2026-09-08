import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import {
  getAllTickets,
  getUserTickets,
  createTicket,
  replyToTicket,
  escalateTicketToHuman,
  getTicketById,
  CreateTicketInput,
  TicketCategory,
  TicketPriority,
} from "@/lib/support-tickets";
import { generateAiTicketResponse } from "@/lib/gemini-support";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");

    if (user.role === "admin" && scope !== "user") {
      const tickets = getAllTickets();
      return NextResponse.json({
        success: true,
        data: tickets,
      });
    }

    const tickets = getUserTickets(user.id, user.email);
    return NextResponse.json({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    console.error("[Tickets API] GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await req.json();

    const { subject, category, priority, message, phone } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: "Subjek tiket wajib diisi" }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Pesan tiket wajib diisi" }, { status: 400 });
    }

    const input: CreateTicketInput = {
      userId: user.id,
      userName: user.name || "Sendora User",
      userEmail: user.email,
      userPhone: phone || undefined,
      subject: subject.trim(),
      category: (category as TicketCategory) || "TECHNICAL",
      priority: (priority as TicketPriority) || "MEDIUM",
      message: message.trim(),
    };

    let ticket = createTicket(input);

    // AI First-Line Support Trigger
    if (ticket.handlingMode === "AI") {
      try {
        const aiResult = await generateAiTicketResponse(ticket, input.message);
        if (aiResult && aiResult.replyText) {
          replyToTicket(ticket.id, {
            senderId: "ai_assistant",
            senderName: "Sendora AI Assistant",
            senderEmail: "ai@sendora.id",
            senderRole: "ai",
            message: aiResult.replyText,
          });

          if (aiResult.shouldEscalate) {
            escalateTicketToHuman(
              ticket.id,
              aiResult.escalationReason || "Deteksi eskalasi otomatis oleh AI"
            );
          }

          ticket = getTicketById(ticket.id) || ticket;
        }
      } catch (aiErr) {
        console.error("[Tickets API] AI response generation failed:", aiErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tiket bantuan berhasil dibuat",
      data: ticket,
    });
  } catch (error: any) {
    console.error("[Tickets API] POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
