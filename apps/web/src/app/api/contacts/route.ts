import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getLocalContacts, createContact } from "@/lib/contacts";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const groupId = searchParams.get("groupId") || "";

    let contacts = getLocalContacts(user.id);

    if (groupId && groupId !== "ALL") {
      contacts = contacts.filter((c) => c.groupId === groupId);
    }

    if (search) {
      contacts = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.phoneNumber.includes(search) ||
          (c.notes && c.notes.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, data: contacts });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json().catch(() => ({}));

    if (!body.phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp wajib diisi" },
        { status: 400 }
      );
    }

    const result = createContact(user.id, {
      name: body.name || "",
      phoneNumber: body.phoneNumber,
      groupId: body.groupId || null,
      customVariables: body.customVariables || {},
      notes: body.notes || null,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.contact });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create contact" },
      { status: 500 }
    );
  }
}
