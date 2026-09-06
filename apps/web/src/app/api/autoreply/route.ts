import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getAutoReplyRules, createAutoReplyRule } from "@/lib/autoreply";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const rules = getAutoReplyRules(user.id);
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json();

    if (!body.name || !body.replyMessage) {
      return NextResponse.json(
        { success: false, error: "Nama aturan dan pesan balasan wajib diisi" },
        { status: 400 }
      );
    }

    const rule = createAutoReplyRule(user.id, {
      name: body.name.trim(),
      matchType: body.matchType || "CONTAINS",
      keywords: Array.isArray(body.keywords)
        ? body.keywords.map((k: string) => k.trim()).filter(Boolean)
        : [],
      replyMessage: body.replyMessage.trim(),
      deviceId: body.deviceId || null,
      delaySec: Number(body.delaySec) || 1,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create rule" },
      { status: 500 }
    );
  }
}
