import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getCampaignById, deleteBroadcastCampaign } from "@/lib/broadcast";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const campaign = getCampaignById(user.id, id);

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Kampanye tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    deleteBroadcastCampaign(user.id, id);
    return NextResponse.json({ success: true, message: "Kampanye berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
