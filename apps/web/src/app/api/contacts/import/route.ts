import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { importContactsBulk } from "@/lib/contacts";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json().catch(() => ({}));
    const items = body.contacts || body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Daftar kontak untuk diimpor tidak boleh kosong" },
        { status: 400 }
      );
    }

    const result = importContactsBulk(user.id, items);

    return NextResponse.json({
      success: true,
      data: {
        imported: result.imported,
        skipped: result.skipped,
        total: items.length,
        errors: result.errors,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import contacts" },
      { status: 500 }
    );
  }
}
