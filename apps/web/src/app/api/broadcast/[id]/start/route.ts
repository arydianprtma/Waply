import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { startBroadcastCampaign } from "@/lib/broadcast";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    const result = await startBroadcastCampaign(user.id, id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Pengiriman broadcast dimulai di background" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start broadcast" },
      { status: 500 }
    );
  }
}
