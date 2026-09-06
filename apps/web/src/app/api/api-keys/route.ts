import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { generateApiKey, listApiKeys } from "@/lib/api-auth";

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
