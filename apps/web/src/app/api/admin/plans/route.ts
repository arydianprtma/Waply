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

import { planSchema, validateSchema } from "@/lib/validation-schemas";

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = await req.json().catch(() => ({}));

    const validation = validateSchema(planSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.message, details: validation.errors },
        { status: 400 }
      );
    }

    const {
      id,
      name,
      price,
      originalPrice,
      discountPercent,
      discountBadge,
      period,
      maxDevices,
      monthlyMessages,
      features,
      access,
      isPopular,
      isActive,
      watermarkEnabled,
    } = validation.data;

    const planData: Plan = {
      id,
      name,
      price,
      originalPrice: typeof originalPrice === "number" && originalPrice > 0 ? originalPrice : undefined,
      discountPercent: typeof discountPercent === "number" && discountPercent > 0 ? discountPercent : undefined,
      discountBadge: discountBadge || undefined,
      period: (period as any) || "month",
      maxDevices: typeof maxDevices === "number" ? maxDevices : 1,
      monthlyMessages: typeof monthlyMessages === "number" ? monthlyMessages : 1000,
      features: Array.isArray(features) ? features : (typeof features === "string" ? features.split("\n").filter(Boolean) : []),
      access: {
        devices: true,
        warmupHealth: true,
        broadcast: true,
        contacts: true,
        sendMessage: true,
        messageLogs: true,
        templatesSpintax: true,
        blacklistDnd: true,
        autoReply: true,
        apiDocs: true,
        apiKeys: true,
        webhooks: true,
        ...(access || {}),
      },
      isPopular: Boolean(isPopular),
      isActive: isActive !== false,
      watermarkEnabled: typeof watermarkEnabled === "boolean" ? watermarkEnabled : (id === "FREE" || price === 0),
      createdAt: validation.data.createdAt || new Date().toISOString(),
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
      message: `Paket ${planId} berhasil dihapus`,
    });
  } catch (err: any) {
    const status = err.message.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
