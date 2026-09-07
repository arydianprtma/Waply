import { getSubscription } from "./billing";
import { getAdminSettings } from "./admin-settings";

/**
 * Applies a watermark/footer to outgoing WhatsApp messages if the user is on the Free or Trial plan.
 * Paid plans (PRO, BUSINESS, ENTERPRISE, etc.) and Admin accounts are white-labeled (no watermark).
 */
export function applyWatermarkIfFree(
  userId: string,
  message: string,
  userRole?: string
): { finalMessage: string; isWatermarked: boolean } {
  try {
    // Admin is always white-labeled
    if (userRole === "admin" || userId === "admin" || userId === "usr_admin_default") {
      return { finalMessage: message, isWatermarked: false };
    }

    const settings = getAdminSettings();
    const config = settings.watermarkConfig || {
      enabled: true,
      text: "\n\n—\n⚡ *Sendora.com*",
      applyToFreeOnly: true,
    };

    if (!config.enabled) {
      return { finalMessage: message, isWatermarked: false };
    }

    // Check user subscription
    const sub = getSubscription(userId);
    const isPaidActive = sub.status === "ACTIVE" && sub.planId && sub.planId !== "FREE";

    if (config.applyToFreeOnly && isPaidActive) {
      // User is on an active paid subscription -> white-labeled (no watermark)
      return { finalMessage: message, isWatermarked: false };
    }

    // Append watermark
    const watermarkText = config.text || "\n\n—\n⚡ *Sendora.com*";
    const finalMessage = `${message.trimEnd()}${watermarkText}`;

    return {
      finalMessage,
      isWatermarked: true,
    };
  } catch (err) {
    console.warn("[Watermark] Error evaluating message watermark:", err);
    return { finalMessage: message, isWatermarked: false };
  }
}
