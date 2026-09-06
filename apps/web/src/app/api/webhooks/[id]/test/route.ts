import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getWebhookById, generateSignature, recordWebhookLog, updateWebhook } from "@/lib/webhooks";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const webhook = getWebhookById(id, user.id);

    if (!webhook) {
      return NextResponse.json({ success: false, error: "Webhook tidak ditemukan" }, { status: 404 });
    }

    const testPayload = {
      event: "test.ping",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test ping from Sendora WhatsApp Gateway webhook engine.",
        sender: {
          id: "6281234567890@s.whatsapp.net",
          name: "Sendora Test Bot",
        },
        messageId: `test_msg_${Date.now()}`,
        status: "DELIVERED",
      },
    };

    const signature = generateSignature(testPayload, webhook.secret);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sendora-Signature": signature,
          "X-Sendora-Event": "test.ping",
          "User-Agent": "Sendora-Webhook-Tester/1.0",
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const durationMs = Date.now() - startTime;
      const respText = await res.text().catch(() => "");

      recordWebhookLog({
        userId: user.id,
        webhookId: webhook.id,
        event: "test.ping",
        url: webhook.url,
        payload: testPayload,
        responseStatus: res.status,
        responseBody: respText.slice(0, 300),
        durationMs,
        success: res.ok,
      });

      updateWebhook(webhook.id, user.id, {
        lastPingAt: new Date().toISOString(),
        lastPingStatus: res.ok ? "SUCCESS" : "FAILED",
        lastPingCode: res.status,
      });

      return NextResponse.json({
        success: true,
        statusCode: res.status,
        statusText: res.statusText,
        durationMs,
        responseSnippet: respText.slice(0, 200),
        message: res.ok ? "Ping berhasil dikirim dan diterima (HTTP 200/2xx)" : `Endpoint merespons dengan HTTP ${res.status}`,
      });
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      recordWebhookLog({
        userId: user.id,
        webhookId: webhook.id,
        event: "test.ping",
        url: webhook.url,
        payload: testPayload,
        responseStatus: 0,
        responseBody: err.message || "Network Error / Timeout",
        durationMs,
        success: false,
      });

      updateWebhook(webhook.id, user.id, {
        lastPingAt: new Date().toISOString(),
        lastPingStatus: "FAILED",
        lastPingCode: 0,
      });

      return NextResponse.json({
        success: false,
        statusCode: 0,
        error: err.message || "Gagal menghubungi endpoint webhook (Network/Timeout Error)",
        durationMs,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
