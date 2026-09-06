import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getLocalGroups, createGroup } from "@/lib/contacts";

export async function GET() {
  try {
    const user = await getSessionUser();
    const groups = getLocalGroups(user.id);
    return NextResponse.json({ success: true, data: groups });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json().catch(() => ({}));

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: "Nama grup wajib diisi" }, { status: 400 });
    }

    const group = createGroup(user.id, body.name, body.color || "#10b981");
    return NextResponse.json({ success: true, data: group });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create group" },
      { status: 500 }
    );
  }
}
