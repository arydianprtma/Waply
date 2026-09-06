import { NextResponse } from "next/server";
import { prisma } from "@sendora/database";
import { getSessionUser } from "@/lib/auth-user";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

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

    const messages = await prisma.message.findMany({
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

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.warn("Failed to fetch messages from DB, returning fallback []", error.message);
    return NextResponse.json({ success: true, data: [] });
  }
}
