import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-user";
import { getAllPlans, saveCustomPlan, deleteCustomPlan, Plan } from "@/lib/billing";

export async function GET() {
  try {
    await requireAdminUser();
    const plans = getAllPlans();
    return NextResponse.json({
      success: true,
      data: Object.values(plans),
    });
  } catch (err: any) {
    const status = err.message.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = await req.json();

    const { id, name, price, period, maxDevices, monthlyMessages, features, access, isPopular, isActive } = body;

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: "ID dan Nama Paket wajib diisi" },
        { status: 400 }
      );
    }

    const planData: Plan = {
      id: id.trim().toUpperCase().replace(/\s+/g, "_"),
      name: name.trim(),
      price: Number(price) || 0,
      period: period || "month",
      maxDevices: Number(maxDevices) || 1,
      monthlyMessages: Number(monthlyMessages) || 1000,
      features: Array.isArray(features) ? features : (typeof features === "string" ? features.split("\n").filter(Boolean) : []),
      access: access || {
        broadcast: true,
        autoReply: true,
        apiAccess: true,
        webhooks: true,
        warmupHealth: true,
        templatesSpintax: true,
        blacklistDnd: true,
        contactsUnlimited: true,
      },
      isPopular: Boolean(isPopular),
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    };

    const saved = saveCustomPlan(planData);
    return NextResponse.json({
      success: true,
      data: saved,
      message: `Paket ${saved.name} berhasil disimpan`,
    });
  } catch (err: any) {
    const status = err.message.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("id");

    if (!planId) {
      return NextResponse.json({ success: false, error: "Plan ID diperlukan" }, { status: 400 });
    }

    const deleted = deleteCustomPlan(planId);
    return NextResponse.json({
      success: true,
      deleted,
      message: `Paket ${planId} dinonaktifkan`,
    });
  } catch (err: any) {
    const status = err.message.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
