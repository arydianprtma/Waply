import { NextRequest, NextResponse } from "next/server";
import { findMatchingRule, incrementRuleTrigger } from "@/lib/autoreply";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import { isBlacklisted, addToBlacklist } from "@/lib/blacklist";
import { saveAutoReplyLog } from "@/lib/autoreply-logs";
import { getAllUserDeviceRecords } from "@/lib/user-devices";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3002";

// Keywords that trigger auto opt-out → auto-blacklist
const OPT_OUT_KEYWORDS = ["stop", "berhenti", "unsubscribe", "hentikan", "keluar", "off"];

function isOptOutMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return OPT_OUT_KEYWORDS.some((kw) => normalized === kw || normalized.startsWith(kw + " "));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, sender, senderName, text, timestamp, messageId } = body;

    if (!sender || !text) {
      return NextResponse.json({ success: false, error: "Sender and text required" }, { status: 400 });
    }

    const cleanSender = sender.replace(/\D/g, "");
    const deviceRecords = getAllUserDeviceRecords();
    const userId = (deviceId && deviceRecords[deviceId]?.userId) || "admin-default-user";

    // 1. Dispatch Inbound Webhook event `message.received`
    dispatchWebhookEvent(userId, "message.received", {
      messageId: messageId || `inmsg_${Date.now()}`,
      deviceId,
      sender: {
        number: cleanSender,
        name: senderName || cleanSender,
        jid: `${cleanSender}@s.whatsapp.net`,
      },
      text,
      timestamp: timestamp || new Date().toISOString(),
    }).catch(() => {});

    // 2. Auto Opt-Out: If message is STOP/BERHENTI → add to blacklist silently
    if (isOptOutMessage(text)) {
      addToBlacklist(userId, cleanSender, "UNSUBSCRIBE_KEYWORD");
      console.log(`[Inbound] Auto opt-out: ${cleanSender} added to blacklist (keyword: "${text}")`);

      // Dispatch webhook event for opt-out
      dispatchWebhookEvent(userId, "message.opt_out", {
        sender: cleanSender,
        keyword: text.trim(),
        timestamp: timestamp || new Date().toISOString(),
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        autoReply: false,
        reason: "Opt-out keyword detected — sender added to blacklist",
      });
    }

    // 3. Check Blacklist / DND: Do not auto-reply if sender is blacklisted
    const blacklisted = isBlacklisted(userId, cleanSender);
    if (blacklisted) {
      return NextResponse.json({
        success: true,
        autoReply: false,
        reason: "Sender is blacklisted",
      });
    }

    // 4. Evaluate Auto-Reply Rules
    const match = findMatchingRule(userId, text, deviceId);
    let autoReplySent = false;
    let autoReplyText = "";

    if (match) {
      autoReplyText = match.renderedReply.replace(/\{\{pushName\}\}/g, senderName || cleanSender);
      incrementRuleTrigger(match.rule.id);

      // Send auto-reply via Gateway
      try {
        const replyRes = await fetch(`${GATEWAY_URL}/api/sessions/${deviceId}/messages/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: cleanSender,
            message: autoReplyText,
          }),
        });
        const replyJson = await replyRes.json();
        if (replyJson.success) {
          autoReplySent = true;
        }
      } catch (err) {
        console.error("Failed to send auto-reply via gateway:", err);
      }

      // 5. Save automation log
      saveAutoReplyLog({
        userId,
        ruleId: match.rule.id,
        ruleName: match.rule.name,
        sender: cleanSender,
        inboundText: text,
        replyText: autoReplyText,
        deviceId: deviceId || "unknown",
        success: autoReplySent,
      });
    }

    return NextResponse.json({
      success: true,
      autoReply: autoReplySent,
      autoReplyText: autoReplyText || undefined,
      ruleName: match?.rule.name,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
