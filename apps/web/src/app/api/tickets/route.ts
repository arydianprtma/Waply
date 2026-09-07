import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import {
  getAllTickets,
  getUserTickets,
  createTicket,
  CreateTicketInput,
  TicketCategory,
  TicketPriority,
} from "@/lib/support-tickets";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope"); // "all" for admin or "user"

    if (user.role === "admin" && scope === "all") {
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

    const newTicket = createTicket(input);

    return NextResponse.json({
      success: true,
      message: "Tiket bantuan berhasil dibuat",
      data: newTicket,
    });
  } catch (error: any) {
    console.error("[Tickets API] POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
