import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { deleteGroup } from "@/lib/contacts";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    deleteGroup(user.id, id);
    return NextResponse.json({ success: true, message: "Grup berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete group" },
      { status: 500 }
    );
  }
}
