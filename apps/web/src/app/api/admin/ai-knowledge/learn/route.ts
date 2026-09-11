import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getAllTickets } from "@/lib/support-tickets";
import { batchLearnFromAllResolvedTickets } from "@/lib/ai-knowledge";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const allTickets = getAllTickets();
    const result = batchLearnFromAllResolvedTickets(allTickets);

    return NextResponse.json({
      success: true,
      message: `Berhasil mengekstrak ${result.learnedCount} materi pengetahuan baru dari riwayat tiket selesai.`,
      data: result,
    });
  } catch (error: any) {
    console.error("[Admin AI Learn API] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
