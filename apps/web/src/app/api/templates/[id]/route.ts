import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getTemplateById, updateTemplate, deleteTemplate, incrementTemplateUsage } from "@/lib/templates";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const template = getTemplateById(id, user.id);
    if (!template) return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const body = await req.json();

    const updated = updateTemplate(id, user.id, {
      name: body.name,
      shortcode: body.shortcode,
      category: body.category,
      content: body.content,
    });

    if (!updated) return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const body = await req.json();

    // Handle usage increment
    if (body.action === "increment_usage") {
      incrementTemplateUsage(id);
      return NextResponse.json({ success: true });
    }

    const updated = updateTemplate(id, user.id, body);
    if (!updated) return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const deleted = deleteTemplate(id, user.id);
    if (!deleted) return NextResponse.json({ success: false, error: "Gagal menghapus template" }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
