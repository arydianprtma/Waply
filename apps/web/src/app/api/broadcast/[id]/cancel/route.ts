import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { cancelBroadcastCampaign } from "@/lib/broadcast";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    cancelBroadcastCampaign(user.id, id);
    return NextResponse.json({ success: true, message: "Pengiriman broadcast dibatalkan (Cancelled)" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel broadcast" },
      { status: 500 }
    );
  }
}
