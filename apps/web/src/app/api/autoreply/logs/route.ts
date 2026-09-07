import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getAutoReplyLogs } from "@/lib/autoreply-logs";

export async function GET() {
  try {
    const user = await getAuthUser();
    const logs = getAutoReplyLogs(user.id);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
