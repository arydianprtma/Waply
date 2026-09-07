import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getWebhookLogs } from "@/lib/webhooks";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const logs = getWebhookLogs(user.id);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
