import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { findMatchingRule } from "@/lib/autoreply";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json();

    const text = body.text || "";
    const deviceId = body.deviceId;

    const result = findMatchingRule(user.id, text, deviceId);

    if (!result) {
      return NextResponse.json({
        success: true,
        matched: false,
        message: "Tidak ada aturan auto-reply yang cocok dengan pesan ini.",
      });
    }

    return NextResponse.json({
      success: true,
      matched: true,
      ruleName: result.rule.name,
      matchType: result.rule.matchType,
      delaySec: result.rule.delaySec,
      renderedReply: result.renderedReply,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
