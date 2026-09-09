import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getSubscription, getInvoices, getAllPlans, DEFAULT_PLANS } from "@/lib/billing";
import { canUserSendMessage } from "@/lib/messages";
import { getUserAddonTotals } from "@/lib/addons";
import { getActiveDevices } from "@/lib/device-rotation";

export async function GET() {
  try {
    const user = await getAuthUser();
    const subscription = getSubscription(user.id);
    const invoices = getInvoices(user.id);
    const allPlans = getAllPlans();
    const plan = allPlans[subscription.planId] || DEFAULT_PLANS[subscription.planId] || DEFAULT_PLANS.FREE;

    // Check if subscription is expired
    let status = subscription.status;
    if (
      status === "ACTIVE" &&
      subscription.endDate &&
      new Date(subscription.endDate) < new Date()
    ) {
      status = "EXPIRED";
    }

    // Metered Usage Metrics
    const quota = canUserSendMessage(user.id, user.role);
    const addonTotals = getUserAddonTotals(user.id);
    const activeDevices = await getActiveDevices().catch(() => []);
    
    const maxDevices = (plan.maxDevices || 1) + addonTotals.extraDevices;
    const connectedDevicesCount = activeDevices.length;
    const deviceUsagePercent = Math.min(100, Math.round((connectedDevicesCount / maxDevices) * 100));

    const totalMessageLimit = plan.monthlyMessages === -1 ? -1 : (plan.monthlyMessages + addonTotals.extraMessages);
    const messageUsagePercent = totalMessageLimit === -1 
      ? 0 
      : Math.min(100, Math.round((quota.usedMessages / Math.max(1, totalMessageLimit)) * 100));

    const meteredUsage = {
      messages: {
        used: quota.usedMessages,
        limit: totalMessageLimit,
        remaining: totalMessageLimit === -1 ? -1 : Math.max(0, totalMessageLimit - quota.usedMessages),
        percent: messageUsagePercent,
        isUnlimited: totalMessageLimit === -1,
      },
      devices: {
        connected: connectedDevicesCount,
        limit: maxDevices,
        remaining: Math.max(0, maxDevices - connectedDevicesCount),
        percent: deviceUsagePercent,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        subscription: { ...subscription, status },
        plan,
        invoices,
        allPlans,
        meteredUsage,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

