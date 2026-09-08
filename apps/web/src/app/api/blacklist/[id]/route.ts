import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getUserPlanAccess } from "@/lib/billing";
import { removeFromBlacklist } from "@/lib/blacklist";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const userAccess = getUserPlanAccess(user.id);

    if (!userAccess.blacklistDnd) {
      return NextResponse.json(
        { success: false, error: "Fitur Blacklist & DND tidak aktif pada paket langganan Anda." },
        { status: 403 }
      );
    }

    await removeFromBlacklist(id, user.id);
    return NextResponse.json({ success: true, message: "Removed from blacklist" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove from blacklist" },
      { status: 500 }
    );
  }
}
