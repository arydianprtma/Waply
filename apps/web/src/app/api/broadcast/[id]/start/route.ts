import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { authenticateApiRequest } from "@/lib/api-auth";
import { startBroadcastCampaign } from "@/lib/broadcast";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await resolveUserFromRequest(request);

    const result = await startBroadcastCampaign(user.id, id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Pengiriman broadcast dimulai di background" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start broadcast" },
      { status: 500 }
    );
  }
}
