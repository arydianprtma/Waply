import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { prisma } from "@sendora/database";
import { authenticateApiRequest } from "@/lib/api-auth";
import { parseSpintax } from "@/lib/spintax";
import { getNextRotatedDevice } from "@/lib/device-rotation";

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || "http://localhost:3002";

const sendSchema = z.object({
  deviceId: z.string().optional(),
  recipient: z.string().optional(),
  to: z.string().optional(),
  message: z.string().min(1, "Message content is required"),
  variables: z.record(z.union([z.string(), z.number()])).optional(),
});

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

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
    // 1. Authenticate API Key
    const auth = await authenticateApiRequest(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: auth.status || 401 }
      );
    }

    const userId = auth.user.id;

    // 2. Validate Request Body
    const body = await request.json().catch(() => ({}));
    const parseResult = sendSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { deviceId, recipient: rawRecipient, to, message, variables } = parseResult.data;
    const targetRecipient = rawRecipient || to;

    if (!targetRecipient) {
      return NextResponse.json(
        { success: false, error: "Recipient phone number ('to' or 'recipient') is required" },
        { status: 400 }
      );
    }

    const recipient = normalizePhoneNumber(targetRecipient);

    // 3. Blacklist Check (DB + local fallback)
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
          error: `Recipient ${recipient} is in the Blacklist / Do-Not-Disturb list. Message cancelled.`,
        },
        { status: 400 }
      );
    }

    // 4. Find Device (Support Auto-Rotation Round-Robin & Fallback)
    const selectedDevice = await getNextRotatedDevice(deviceId);
    let targetDeviceId = selectedDevice?.id;

    if (!targetDeviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "No connected WhatsApp device found. Please connect a device in WhatsApp Devices dashboard.",
        },
        { status: 404 }
      );
    }

    // 5. Parse Spintax & Dynamic Variables
    const finalContent = parseSpintax(message, variables || {});

    // 6. Send to Gateway
    let gatewayRes;
    let providerMessageId: string | null = null;
    let status: "SENT" | "FAILED" = "SENT";
    let failReason: string | null = null;

    try {
      const response = await fetch(`${GATEWAY_URL}/api/sessions/${targetDeviceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    // 7. Save Message to Database (with local fallback)
    const msgId = `msg_${Date.now()}`;
    const sentAt = status === "SENT" ? new Date().toISOString() : null;

    try {
      await prisma.message.create({
        data: {
          id: msgId,
          userId,
          deviceId: targetDeviceId,
          recipient,
          content: finalContent,
          rawContent: message,
          status: status === "SENT" ? "SENT" : "FAILED",
          failReason,
          providerMessageId,
          sentAt: status === "SENT" ? new Date() : null,
        },
      });
    } catch (dbErr) {
      console.warn("DB save message skipped:", (dbErr as Error).message);
    }

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
