import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { pauseBroadcastCampaign } from "@/lib/broadcast";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    pauseBroadcastCampaign(user.id, id);
    return NextResponse.json({ success: true, message: "Pengiriman broadcast dijeda (Paused)" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to pause broadcast" },
      { status: 500 }
    );
  }
}
