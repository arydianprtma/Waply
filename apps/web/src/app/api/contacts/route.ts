import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-user";
import { getLocalContacts, createContact } from "@/lib/contacts";
import { sanitizePhoneNumber, sanitizeText } from "@/lib/sanitizer";
import { hasUserPlanFeature } from "@/lib/billing";

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser();
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
    const status = error.message?.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    if (!hasUserPlanFeature(user.id, "contacts", user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Fitur Manajemen Kontak terkunci pada paket Anda. Silakan upgrade paket langganan Anda.",
          code: "PLAN_FEATURE_LOCKED",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (!body.phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp wajib diisi" },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizePhoneNumber(body.phoneNumber);
    if (!cleanPhone || cleanPhone.length < 9) {
      return NextResponse.json(
        { success: false, error: "Format nomor WhatsApp tidak valid" },
        { status: 400 }
      );
    }

    const result = createContact(user.id, {
      name: sanitizeText(body.name || "Kontak", 100),
      phoneNumber: cleanPhone,
      groupId: body.groupId || null,
      customVariables: body.customVariables || {},
      notes: body.notes ? sanitizeText(body.notes, 500) : null,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.contact });
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create contact" },
      { status }
    );
  }
}
