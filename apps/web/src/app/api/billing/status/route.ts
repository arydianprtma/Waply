import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getSubscription, getInvoices, getAllPlans, DEFAULT_PLANS } from "@/lib/billing";

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

    return NextResponse.json({
      success: true,
      data: {
        subscription: { ...subscription, status },
        plan,
        invoices,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
