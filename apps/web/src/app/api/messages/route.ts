import { NextResponse } from "next/server";
import { prisma } from "@sendora/database";
import { getSessionUser } from "@/lib/auth-user";
import { getStoredMessages } from "@/lib/messages";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").toLowerCase();
    const status = searchParams.get("status") || "";

    let dbMessages: any[] = [];
    try {
      const whereClause: any = {
        userId: user.id,
      };

      if (status && status !== "ALL") {
        whereClause.status = status;
      }

      if (search) {
        whereClause.OR = [
          { recipient: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ];
      }

      dbMessages = await prisma.message.findMany({
        where: whereClause,
        include: {
          device: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch (dbErr: any) {
      console.warn("Failed to fetch messages from DB, using stored messages:", dbErr.message);
    }

    if (dbMessages.length > 0) {
      return NextResponse.json({ success: true, data: dbMessages });
    }

    // Local storage fallback
    let localMessages = getStoredMessages(user.id);
    if (status && status !== "ALL") {
      localMessages = localMessages.filter((m) => m.status === status);
    }
    if (search) {
      localMessages = localMessages.filter(
        (m) =>
          (m.recipient && m.recipient.toLowerCase().includes(search)) ||
          (m.content && m.content.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, data: localMessages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
