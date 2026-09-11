import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getAllKnowledge, saveKnowledge } from "@/lib/ai-knowledge";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const source = searchParams.get("source") || undefined;
    const search = searchParams.get("search") || undefined;
    const onlyActive = searchParams.get("onlyActive") === "true";

    const items = getAllKnowledge({
      category,
      source,
      search,
      onlyActive,
    });

    return NextResponse.json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error: any) {
    console.error("[Admin AI Knowledge API] GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title?.trim() || !body.solution?.trim()) {
      return NextResponse.json(
        { success: false, error: "Judul kendala dan solusi wajib diisi." },
        { status: 400 }
      );
    }

    const saved = saveKnowledge({
      title: body.title,
      category: body.category || "GENERAL",
      problemDescription: body.problemDescription,
      solution: body.solution,
      keywords: Array.isArray(body.keywords) ? body.keywords : undefined,
      source: "admin_manual",
      isActive: body.isActive !== false,
    });

    return NextResponse.json({
      success: true,
      message: "Materi pengetahuan AI berhasil disimpan",
      data: saved,
    });
  } catch (error: any) {
    console.error("[Admin AI Knowledge API] POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
