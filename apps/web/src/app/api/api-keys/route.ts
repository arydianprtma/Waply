import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { generateApiKey, listApiKeys } from "@/lib/api-auth";
import { hasUserPlanFeature } from "@/lib/billing";

export async function GET() {
  try {
    const user = await getSessionUser();
    const keys = await listApiKeys(user.id);
    return NextResponse.json({ success: true, data: keys });
  } catch (error: any) {
    console.warn("Failed to fetch API keys:", error.message);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!hasUserPlanFeature(user.id, "apiKeys", user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Fitur API Keys Developer terkunci pada paket Anda. Silakan upgrade paket langganan Anda.",
          code: "PLAN_FEATURE_LOCKED",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name?.trim() || "Default API Key";

    const { rawKey, apiKeyRecord } = await generateApiKey(user.id, name);

    return NextResponse.json({
      success: true,
      data: {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        keyPrefix: apiKeyRecord.keyPrefix,
        rawKey, // Only returned once upon creation!
        createdAt: apiKeyRecord.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create API key" },
      { status: 500 }
    );
  }
}
