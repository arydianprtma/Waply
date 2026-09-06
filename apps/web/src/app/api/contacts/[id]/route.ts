import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { updateContact, deleteContact } from "@/lib/contacts";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const body = await request.json().catch(() => ({}));

    const result = updateContact(user.id, id, body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.contact });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update contact" },
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

    deleteContact(user.id, id);
    return NextResponse.json({ success: true, message: "Kontak berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete contact" },
      { status: 500 }
    );
  }
}
