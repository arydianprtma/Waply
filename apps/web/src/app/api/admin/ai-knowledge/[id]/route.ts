import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getKnowledgeById, saveKnowledge, deleteKnowledge, toggleKnowledge } from "@/lib/ai-knowledge";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const { id } = await params;
    const item = getKnowledgeById(id);
    if (!item) {
      return NextResponse.json({ success: false, error: "Materi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const { id } = await params;
    const existing = getKnowledgeById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Materi tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const updated = saveKnowledge({
      ...existing,
      ...body,
      id,
    });

    return NextResponse.json({
      success: true,
      message: "Materi pengetahuan AI berhasil diperbarui",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const success = toggleKnowledge(id, body.isActive);

    if (!success) {
      return NextResponse.json({ success: false, error: "Materi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Status pengetahuan AI berhasil diperbarui",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const { id } = await params;
    const success = deleteKnowledge(id);
    if (!success) {
      return NextResponse.json({ success: false, error: "Gagal menghapus materi" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Materi pengetahuan AI berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
