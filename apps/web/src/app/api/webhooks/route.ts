import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getWebhooks, createWebhook } from "@/lib/webhooks";
import { hasUserPlanFeature } from "@/lib/billing";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const webhooks = getWebhooks(user.id);
    return NextResponse.json({ success: true, data: webhooks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!hasUserPlanFeature(user.id, "webhooks", user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Fitur Webhook Integration terkunci pada paket Anda. Silakan upgrade paket langganan Anda.",
          code: "PLAN_FEATURE_LOCKED",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.name || !body.url) {
      return NextResponse.json(
        { success: false, error: "Nama dan URL endpoint webhook wajib diisi" },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Format URL endpoint tidak valid (harus diawali http:// atau https://)" },
        { status: 400 }
      );
    }

    const secret = body.secret?.trim() || "whsec_" + crypto.randomBytes(16).toString("hex");

    const webhook = createWebhook(user.id, {
      name: body.name.trim(),
      url: body.url.trim(),
      secret,
      events: Array.isArray(body.events) && body.events.length > 0 ? body.events : ["message.received"],
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({ success: true, data: webhook });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
