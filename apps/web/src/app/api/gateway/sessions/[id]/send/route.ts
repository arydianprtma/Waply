import { NextResponse } from "next/server";
import { fetchGateway } from "@/lib/gateway-client";
import { requireActiveUser } from "@/lib/auth-user";
import { applyWatermarkIfFree } from "@/lib/watermark";
import { sanitizePhoneNumber } from "@/lib/sanitizer";
import { canUserSendMessage, recordSentMessage } from "@/lib/messages";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const body = await request.json();

    // Quota Enforcement
    const quotaCheck = canUserSendMessage(user.id, user.role);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.reason || "Kuota pesan Anda telah habis. Silakan upgrade paket untuk melanjutkan.",
        },
        { status: 403 }
      );
    }

    let outgoingMessage = body.message;
    if (typeof outgoingMessage === "string" && outgoingMessage.trim()) {
      const { finalMessage } = applyWatermarkIfFree(user.id, outgoingMessage, user.role);
      outgoingMessage = finalMessage;
    }

    const normalizedTo = body.to ? sanitizePhoneNumber(body.to) : body.to;

    const payload = {
      ...body,
      to: normalizedTo,
      message: outgoingMessage,
    };

    const res = await fetchGateway(`/api/sessions/${id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    // Record the sent message so quota and analytics update immediately
    if (res.ok && data.success) {
      await recordSentMessage({
        userId: user.id,
        deviceId: id,
        recipient: normalizedTo,
        content: outgoingMessage,
        rawContent: body.message,
        status: "SENT",
        providerMessageId: data.data?.messageId || null,
        sentAt: data.data?.sentAt || new Date().toISOString(),
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 503;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send message via Gateway service" },
      { status }
    );
  }
}
