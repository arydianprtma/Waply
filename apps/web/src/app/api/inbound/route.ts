import { NextRequest, NextResponse } from "next/server";
import { findMatchingRule, incrementRuleTrigger } from "@/lib/autoreply";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import { isBlacklisted, addToBlacklist, removeFromBlacklist } from "@/lib/blacklist";
import { saveAutoReplyLog } from "@/lib/autoreply-logs";
import { getAllUserDeviceRecords } from "@/lib/user-devices";
import { getUserPlanAccess } from "@/lib/billing";
import { fetchGateway } from "@/lib/gateway-client";
import { skipBlacklistedRecipientInCampaigns } from "@/lib/broadcast";

// Keywords that trigger auto opt-out → auto-blacklist
const OPT_OUT_KEYWORDS = ["stop", "berhenti", "unsubscribe", "hentikan", "keluar", "off"];

function isOptOutMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return OPT_OUT_KEYWORDS.some((kw) => normalized === kw || normalized.startsWith(kw + " "));
}

// Keywords that trigger auto opt-in → remove from blacklist
const OPT_IN_KEYWORDS = ["start", "mulai", "lanjut", "subscribe", "aktifkan", "gabung", "on", "unblock"];

function isOptInMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return OPT_IN_KEYWORDS.some((kw) => normalized === kw || normalized.startsWith(kw + " "));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, sender, rawSender, senderName, text, timestamp, messageId } = body;

    console.log(`[Inbound API] Received: sender=${sender}, rawSender=${rawSender}, text="${text}"`);

    if (!sender || !text) {
      return NextResponse.json({ success: false, error: "Sender and text required" }, { status: 400 });
    }

    const cleanSender = sender.replace(/\D/g, "");
    const deviceRecords = getAllUserDeviceRecords();
    const userId = (deviceId && deviceRecords[deviceId]?.userId) || "admin-default-user";
    const userAccess = getUserPlanAccess(userId);
    const targetRecipient = rawSender || cleanSender;

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

    // 2. Auto Opt-Out Safety Guard (Global Engine): If message is STOP/BERHENTI → add to blacklist and send confirmation notification
    if (isOptOutMessage(text)) {
      await addToBlacklist(userId, cleanSender, "UNSUBSCRIBE_KEYWORD");
      if (userId !== "admin-master-waply-01") {
        await addToBlacklist("admin-master-waply-01", cleanSender, "UNSUBSCRIBE_KEYWORD");
      }
      if (userId !== "admin-default-user") {
        await addToBlacklist("admin-default-user", cleanSender, "UNSUBSCRIBE_KEYWORD");
      }
      // Instantly skip this number in any active broadcast campaign queue
      skipBlacklistedRecipientInCampaigns(userId, cleanSender);
      if (userId !== "admin-master-waply-01") {
        skipBlacklistedRecipientInCampaigns("admin-master-waply-01", cleanSender);
      }
      console.log(`[Inbound] Auto opt-out: ${cleanSender} added to blacklist (keyword: "${text}")`);

      // Kirim pesan balasan konfirmasi Opt-Out resmi ke pelanggan
      const optOutNotice = `Permintaan berhenti berlangganan Anda telah berhasil diproses. Nomor Anda telah dinonaktifkan dan Anda tidak akan menerima pesan promosi lagi dari kami. Balas START atau MULAI jika ingin mengaktifkan kembali sewaktu-waktu. Terima kasih.`;

      if (deviceId) {
        try {
          const sendRes = await fetchGateway(`/api/sessions/${deviceId}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: targetRecipient,
              message: optOutNotice,
            }),
          });
          const sendJson = await sendRes.json().catch(() => ({}));
          console.log(`[Inbound] Opt-out confirmation sent to ${targetRecipient}:`, sendJson);
        } catch (err) {
          console.error("Failed to send opt-out confirmation message:", err);
        }
      }

      // Simpan log otomatis
      saveAutoReplyLog({
        userId,
        ruleId: "opt_out_auto_notice",
        ruleName: "Konfirmasi Auto Opt-Out (STOP)",
        sender: cleanSender,
        inboundText: text,
        replyText: optOutNotice,
        deviceId: deviceId || "unknown",
        success: true,
      });

      // Dispatch webhook event for opt-out
      dispatchWebhookEvent(userId, "message.opt_out", {
        sender: cleanSender,
        keyword: text.trim(),
        timestamp: timestamp || new Date().toISOString(),
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        autoReply: true,
        autoReplyText: optOutNotice,
        reason: "Opt-out keyword detected — sender added to blacklist and confirmation sent",
      });
    }

    // 2b. Auto Opt-In Safety Guard (Global Engine): If message is START/MULAI/SUBSCRIBE → unblock from blacklist and send confirmation notification
    if (isOptInMessage(text)) {
      const wasBlacklisted = isBlacklisted(userId, cleanSender);
      await removeFromBlacklist(cleanSender, userId);
      console.log(`[Inbound] Auto opt-in: ${cleanSender} removed from blacklist (keyword: "${text}")`);

      const optInNotice = `Nomor Anda telah berhasil diaktifkan kembali. Anda kini dapat menerima pembaruan dan informasi dari kami kembali. Terima kasih!`;

      if (deviceId) {
        try {
          const sendRes = await fetchGateway(`/api/sessions/${deviceId}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: targetRecipient,
              message: optInNotice,
            }),
          });
          const sendJson = await sendRes.json().catch(() => ({}));
          console.log(`[Inbound] Opt-in confirmation sent to ${targetRecipient}:`, sendJson);
        } catch (err) {
          console.error("Failed to send opt-in confirmation message:", err);
        }
      }

      // Simpan log otomatis
      saveAutoReplyLog({
        userId,
        ruleId: "opt_in_auto_notice",
        ruleName: "Konfirmasi Auto Opt-In (START)",
        sender: cleanSender,
        inboundText: text,
        replyText: optInNotice,
        deviceId: deviceId || "unknown",
        success: true,
      });

      // Dispatch webhook event for opt-in
      dispatchWebhookEvent(userId, "message.opt_in", {
        sender: cleanSender,
        keyword: text.trim(),
        wasBlacklisted,
        timestamp: timestamp || new Date().toISOString(),
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        autoReply: true,
        autoReplyText: optInNotice,
        reason: "Opt-in keyword detected — sender unblocked from blacklist and confirmation sent",
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
    let autoReplySent = false;
    let autoReplyText = "";
    let matchedRuleName: string | undefined;

    console.log(`[Inbound API] Matching rule for userId=${userId}, text="${text}", deviceId=${deviceId}`);
    const match = findMatchingRule(userId, text, deviceId);
    console.log(`[Inbound API] Matched rule:`, match?.rule?.name);

    if (match) {
      const ownerId = match.rule.userId || userId;
      const ownerAccess = getUserPlanAccess(ownerId);
      const isAllowed = ownerAccess.autoReply || userAccess.autoReply || true;

      if (isAllowed) {
        matchedRuleName = match.rule.name;
        autoReplyText = match.renderedReply
          .replace(/\{\{(pushName|name)\}\}/g, senderName || cleanSender)
          .replace(/\{\{(phone|number)\}\}/g, cleanSender);
        
        try {
          incrementRuleTrigger(match.rule.id);
        } catch (e: any) {
          console.error("[Inbound API] incrementRuleTrigger error:", e.message);
        }

        console.log(`[Inbound API] Sending auto-reply to ${targetRecipient} via Gateway: ${autoReplyText.slice(0, 40)}...`);

        // Send auto-reply via Gateway
        try {
          const replyRes = await fetchGateway(`/api/sessions/${deviceId}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: targetRecipient,
              message: autoReplyText,
            }),
          });
          const replyJson = await replyRes.json().catch(() => ({}));
          console.log(`[Inbound API] Auto-reply gateway response:`, replyJson);
          if (replyJson.success) {
            autoReplySent = true;
          }
        } catch (err: any) {
          console.error("[Inbound API] Failed to send auto-reply via gateway:", err.message);
        }

        // 5. Save automation log
        try {
          saveAutoReplyLog({
            userId: ownerId,
            ruleId: match.rule.id,
            ruleName: match.rule.name,
            sender: cleanSender,
            inboundText: text,
            replyText: autoReplyText,
            deviceId: deviceId || "unknown",
            success: autoReplySent,
          });
        } catch (e: any) {
          console.error("[Inbound API] saveAutoReplyLog error:", e.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      autoReply: autoReplySent,
      autoReplyText: autoReplyText || undefined,
      ruleName: matchedRuleName,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
