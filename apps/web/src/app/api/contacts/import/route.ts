import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { importContactsBulk } from "@/lib/contacts";
import { hasUserPlanFeature } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
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
