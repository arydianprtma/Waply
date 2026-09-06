import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { deleteApiKey } from "@/lib/api-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    await deleteApiKey(id, user.id);

    return NextResponse.json({ success: true, message: "API key deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete API key" },
      { status: 500 }
    );
  }
}
