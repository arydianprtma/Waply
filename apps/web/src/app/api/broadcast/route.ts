import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getLocalCampaigns, createBroadcastCampaign } from "@/lib/broadcast";
import { hasUserPlanFeature } from "@/lib/billing";

async function resolveUserFromRequest(request?: Request) {
  if (request) {
    const authHeader = request.headers.get("authorization") || request.headers.get("x-api-key");
    if (authHeader) {
      const auth = await authenticateApiRequest(request);
      if (auth.authenticated && auth.user) {
        return {
          id: auth.user.id,
          role: auth.user.role,
        };
      }
    }
  }
  const sessionUser = await getSessionUser();
  return {
    id: sessionUser.id,
    role: sessionUser.role,
  };
}

export async function GET(request: Request) {
  try {
    const user = await resolveUserFromRequest(request);
    const campaigns = getLocalCampaigns(user.id);
    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await resolveUserFromRequest(request);
    if (!hasUserPlanFeature(user.id, "broadcast", user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Fitur Broadcast Massal terkunci pada paket Anda. Silakan upgrade paket langganan Anda.",
          code: "PLAN_FEATURE_LOCKED",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: "Nama kampanye wajib diisi" }, { status: 400 });
    }

    if (!body.messageTemplate?.trim()) {
      return NextResponse.json({ success: false, error: "Template pesan wajib diisi" }, { status: 400 });
    }

    if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Daftar nomor penerima tidak boleh kosong" },
        { status: 400 }
      );
    }

    const campaign = createBroadcastCampaign(user.id, {
      name: body.name,
      deviceId: body.deviceId,
      messageTemplate: body.messageTemplate,
      recipients: body.recipients,
      batchSize: body.batchSize,
      batchDelaySec: body.batchDelaySec,
      minDelaySec: body.minDelaySec,
      maxDelaySec: body.maxDelaySec,
    });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}
