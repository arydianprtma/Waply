import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getTemplates, createTemplate } from "@/lib/templates";

export async function GET() {
  try {
    const user = await getAuthUser();
    const templates = getTemplates(user.id);
    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json();

    if (!body.name || !body.content) {
      return NextResponse.json(
        { success: false, error: "Nama template dan konten wajib diisi" },
        { status: 400 }
      );
    }

    // Auto-generate shortcode from name if not provided
    const shortcode =
      body.shortcode?.trim() ||
      "tpl_" +
        body.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_")
          .substring(0, 30);

    const template = createTemplate(user.id, {
      name: body.name.trim(),
      shortcode,
      category: body.category || "LAINNYA",
      content: body.content.trim(),
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
