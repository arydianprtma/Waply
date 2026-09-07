import { getSubscription, getAllPlans } from "./billing";
import { DEFAULT_PLANS } from "./billing-types";
import { getAdminSettings } from "./admin-settings";

/**
 * Applies a watermark/footer to outgoing WhatsApp messages if the user's plan has watermark enabled
 * or if the user is on the Free/Trial plan.
 * Paid plans with watermark disabled and Admin accounts are 100% white-labeled.
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
      text: "\n\n—\n```Sendora.com```",
      applyToFreeOnly: true,
    };

    if (!config.enabled) {
      return { finalMessage: message, isWatermarked: false };
    }

    // Check user subscription & corresponding plan config
    const sub = getSubscription(userId);
    const planId = sub?.planId || "FREE";
    const allPlans = getAllPlans();
    const currentPlan = allPlans[planId] || DEFAULT_PLANS[planId];

    let shouldApplyWatermark = false;

    if (currentPlan && typeof currentPlan.watermarkEnabled === "boolean") {
      shouldApplyWatermark = currentPlan.watermarkEnabled;
    } else {
      // Fallback if not specified on plan: Free/expired = true, Active paid = false
      const isPaidActive = sub.status === "ACTIVE" && planId && planId !== "FREE";
      shouldApplyWatermark = !isPaidActive;
    }

    if (!shouldApplyWatermark) {
      return { finalMessage: message, isWatermarked: false };
    }

    // Append watermark
    const watermarkText = config.text || "\n\n—\n```Sendora.com```";
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
