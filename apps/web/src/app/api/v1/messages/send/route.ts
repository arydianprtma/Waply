import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@sendora/database";
import { authenticateApiRequest } from "@/lib/api-auth";
import { parseSpintax } from "@/lib/spintax";
import { getNextRotatedDevice } from "@/lib/device-rotation";
import { apiMessageRateLimiter, checkRateLimitResponse } from "@/lib/rate-limiter";
import { sendMessageSchema, validateSchema } from "@/lib/validation-schemas";
import { sanitizePhoneNumber, isValidPhoneNumber } from "@/lib/sanitizer";
import { applyWatermarkIfFree } from "@/lib/watermark";
import { canUserSendMessage, recordSentMessage } from "@/lib/messages";
import { getUserPlanAccess } from "@/lib/billing";
import { getTemplates, incrementTemplateUsage } from "@/lib/templates";

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || "http://localhost:3002";
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || "sendora_internal_gateway_token_key";

function isBlacklistedLocally(userId: string, phoneNumber: string): boolean {
  try {
    const file = path.join(process.cwd(), ".sendora-data", "blacklist.json");
    if (fs.existsSync(file)) {
      const items = JSON.parse(fs.readFileSync(file, "utf-8") || "[]");
      return items.some((i: any) => i.phoneNumber === phoneNumber);
    }
  } catch {}
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    const rateLimitRes = checkRateLimitResponse(request, apiMessageRateLimiter);
    if (rateLimitRes) {
      return rateLimitRes;
    }

    // 2. Authenticate API Key
    const auth = await authenticateApiRequest(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: auth.status || 401 }
      );
    }

    const userId = auth.user.id;

    // Check Quota
    const quotaCheck = canUserSendMessage(userId, auth.user.role);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: quotaCheck.reason || "Kuota pengiriman pesan akun Anda telah habis. Silakan upgrade paket untuk melanjutkan.",
        },
        { status: 403 }
      );
    }

    // 3. Validate & Sanitize Request Body
    const body = await request.json().catch(() => ({}));
    const validation = validateSchema(sendMessageSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.message,
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const { deviceId, recipient: rawRecipient, to, message, template, templateId, variables } = validation.data;
    const targetRecipient = rawRecipient || to;

    if (!targetRecipient) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp penerima ('to' atau 'recipient') wajib diisi" },
        { status: 400 }
      );
    }

    // Resolve template if template / templateId is supplied
    let rawContent = message;
    if (template || templateId) {
      const tKey = template || templateId;
      const userTemplates = getTemplates(userId);
      const foundTemplate = userTemplates.find(
        (t) => t.id === tKey || t.shortcode === tKey
      );

      if (!foundTemplate) {
        return NextResponse.json(
          {
            success: false,
            error: `Template '${tKey}' tidak ditemukan pada akun Anda. Pastikan ID atau Shortcode sesuai dengan yang ada di menu Templates.`,
          },
          { status: 404 }
        );
      }

      rawContent = foundTemplate.content;
      incrementTemplateUsage(foundTemplate.id);
    }

    if (!rawContent || !rawContent.trim()) {
      return NextResponse.json(
        { success: false, error: "Harap sertakan parameter 'message' atau 'template' (shortcode / templateId)." },
        { status: 400 }
      );
    }

    const recipient = sanitizePhoneNumber(targetRecipient);

    if (!isValidPhoneNumber(recipient)) {
      return NextResponse.json(
        { success: false, error: `Format nomor WhatsApp '${targetRecipient}' tidak valid. Gunakan format internasional (contoh: 6281234567890).` },
        { status: 400 }
      );
    }

    // 4. Blacklist Check (DB + local fallback) - Safety Engine to prevent WhatsApp bans
    let isBlocked = isBlacklistedLocally(userId, recipient);
    if (!isBlocked) {
      try {
        const bl = await prisma.blacklist.findFirst({
          where: { userId, phoneNumber: recipient },
        });
        if (bl) isBlocked = true;
      } catch {}
    }

    if (isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Nomor penerima ${recipient} terdaftar di Blacklist / Do-Not-Disturb (Opt-Out). Pesan dibatalkan demi keamanan akun WhatsApp Anda.`,
        },
        { status: 400 }
      );
    }

    // 5. Find Device (Support Auto-Rotation Round-Robin & Fallback)
    const selectedDevice = await getNextRotatedDevice(deviceId);
    let targetDeviceId = selectedDevice?.id;

    if (!targetDeviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada perangkat WhatsApp yang terhubung. Silakan scan QR device di dashboard.",
        },
        { status: 404 }
      );
    }

    // 6. Parse Spintax & Dynamic Variables
    const parsedContent = parseSpintax(rawContent, variables || {});

    // 7. Apply Watermark for Free/Trial Plan Users
    const { finalMessage: finalContent, isWatermarked } = applyWatermarkIfFree(
      userId,
      parsedContent,
      auth.user.role
    );

    // 7. Send to Gateway with internal secret token
    let gatewayRes;
    let providerMessageId: string | null = null;
    let status: "SENT" | "FAILED" = "SENT";
    let failReason: string | null = null;

    try {
      const response = await fetch(`${GATEWAY_URL}/api/sessions/${targetDeviceId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gateway-secret": GATEWAY_SECRET,
        },
        body: JSON.stringify({
          to: recipient,
          message: finalContent,
        }),
      });

      gatewayRes = await response.json();

      if (!response.ok || !gatewayRes.success) {
        status = "FAILED";
        failReason = gatewayRes.error || `Gateway returned status ${response.status}`;
      } else {
        providerMessageId = gatewayRes.data?.messageId || null;
      }
    } catch (err: any) {
      status = "FAILED";
      failReason = `Gateway connection error: ${err.message}`;
    }

    // 8. Save Message to Database and local storage
    const msgId = `msg_${Date.now()}`;
    const sentAt = status === "SENT" ? new Date().toISOString() : null;

    await recordSentMessage({
      id: msgId,
      userId,
      deviceId: targetDeviceId,
      recipient,
      content: finalContent,
      rawContent: message,
      status: status === "SENT" ? "SENT" : "FAILED",
      failReason,
      providerMessageId,
      sentAt,
    });

    if (status === "FAILED") {
      return NextResponse.json(
        {
          success: false,
          error: failReason,
          messageId: msgId,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: msgId,
        providerMessageId,
        recipient,
        content: finalContent,
        status: "SENT",
        sentAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
