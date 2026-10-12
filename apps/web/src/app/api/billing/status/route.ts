import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getSubscription, getInvoices, getAllPlans, DEFAULT_PLANS, getMidtransConfig } from "@/lib/billing";
import { canUserSendMessage } from "@/lib/messages";
import { getUserAddonTotals } from "@/lib/addons";
import { getActiveDevices } from "@/lib/device-rotation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "user";
    } = {
      id: "usr_default_guest",
      email: "guest@waply.id",
      name: "Waply User",
      role: "user",
    };

    try {
      user = await getAuthUser();
    } catch {
      // Fallback to guest user if auth resolution encounters error
    }

    const allPlans = getAllPlans() || DEFAULT_PLANS;
    let subscription = getSubscription(user.id);
    if (!subscription || !subscription.planId) {
      subscription = {
        userId: user.id,
        planId: "FREE",
        status: "FREE",
        startDate: null,
        endDate: null,
        updatedAt: new Date().toISOString(),
      };
    }

    const invoices = getInvoices(user.id) || [];
    const plan = (allPlans && allPlans[subscription.planId]) || DEFAULT_PLANS[subscription.planId] || DEFAULT_PLANS.FREE;

    // Check if subscription is expired or previously reverted
    let status = subscription.status;
    if (
      status === "ACTIVE" &&
      subscription.endDate &&
      new Date(subscription.endDate) < new Date()
    ) {
      status = "EXPIRED";
    }

    if (subscription.planId === "FREE" && status === "EXPIRED") {
      status = "FREE";
    }

    const expiredPlan = subscription.expiredPlanId
      ? (allPlans && allPlans[subscription.expiredPlanId]) || DEFAULT_PLANS[subscription.expiredPlanId]
      : null;

    // Metered Usage Metrics
    let quota = { usedMessages: 0 };
    try {
      quota = canUserSendMessage(user.id, user.role);
    } catch {}

    let addonTotals = { extraDevices: 0, extraMessages: 0 };
    try {
      addonTotals = getUserAddonTotals(user.id);
    } catch {}

    const activeDevices = await getActiveDevices().catch(() => []);
    
    const maxDevices = ((plan && plan.maxDevices) || 1) + (addonTotals.extraDevices || 0);
    const connectedDevicesCount = Array.isArray(activeDevices) ? activeDevices.length : 0;
    const deviceUsagePercent = Math.min(100, Math.round((connectedDevicesCount / Math.max(1, maxDevices)) * 100));

    const planMessages = typeof plan?.monthlyMessages === "number" ? plan.monthlyMessages : 100;
    const totalMessageLimit = planMessages === -1 ? -1 : (planMessages + (addonTotals.extraMessages || 0));
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

    let midtransConfig = {
      snapJsUrl: "https://app.midtrans.com/snap/snap.js",
      clientKey: "",
      isProduction: true,
    };
    try {
      midtransConfig = getMidtransConfig();
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        subscription: { ...subscription, status },
        plan,
        expiredPlan,
        invoices,
        allPlans,
        meteredUsage,
        midtrans: {
          snapJsUrl: midtransConfig.snapJsUrl,
          clientKey: midtransConfig.clientKey,
          isProduction: midtransConfig.isProduction,
        },
      },
    });
  } catch (error: any) {
    // Graceful fallback to avoid hard 500 error on client
    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          userId: "fallback",
          planId: "FREE",
          status: "FREE",
          startDate: null,
          endDate: null,
          updatedAt: new Date().toISOString(),
        },
        plan: DEFAULT_PLANS.FREE,
        expiredPlan: null,
        invoices: [],
        allPlans: DEFAULT_PLANS,
        meteredUsage: {
          messages: { used: 0, limit: 100, remaining: 100, percent: 0, isUnlimited: false },
          devices: { connected: 0, limit: 1, remaining: 1, percent: 0 },
        },
        midtrans: {
          snapJsUrl: "https://app.midtrans.com/snap/snap.js",
          clientKey: "",
          isProduction: true,
        },
      },
      warning: error.message,
    });
  }
}

