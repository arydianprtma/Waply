import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { registerOrSyncUser } from "@/lib/admin-users";
import {
  PLANS,
  DEFAULT_PLANS,
  PlanId,
  generateOrderId,
  createSnapToken,
  createInvoice,
} from "@/lib/billing";
import { validateVoucher, recordVoucherUsage } from "@/lib/vouchers";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const body = await req.json();

    const planId = (body.planId || "STARTER") as PlanId;
    const durationMonths = Number(body.durationMonths || 1); // 1, 3, or 12
    const customerName = (body.customerName || authUser.name || "Sendora User").trim();
    const customerEmail = (body.customerEmail || authUser.email || "user@sendora.id").trim().toLowerCase();
    const customerPhone = (body.customerPhone || "").trim();
    const couponCode = (body.couponCode || "").trim().toUpperCase();

    // Resolve plan
    const plan = PLANS[planId] || DEFAULT_PLANS[planId];
    if (!plan) {
      return NextResponse.json({ success: false, error: "Paket tidak valid" }, { status: 400 });
    }

    if (plan.price === 0) {
      return NextResponse.json(
        { success: false, error: "Paket Free Trial tidak memerlukan pembayaran" },
        { status: 400 }
      );
    }

    // Sync / register user in DB if new
    const syncedUser = registerOrSyncUser({
      id: authUser.id && authUser.id !== "usr_default_guest" ? authUser.id : `usr_${customerEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
      email: customerEmail,
      name: customerName,
      role: customerEmail === "admin@sendora.id" ? "admin" : "user",
    });

    // Base price calculation based on duration
    const monthlyPrice = plan.price;
    let baseAmount = monthlyPrice * durationMonths;
    let durationDiscount = 0;

    if (durationMonths === 3) {
      // 5% discount for 3 months
      durationDiscount = Math.round(baseAmount * 0.05);
    } else if (durationMonths === 12) {
      // ~20% discount for 1 year
      const yearlyPlanKey = `YEARLY_${planId}`;
      if (PLANS[yearlyPlanKey] || DEFAULT_PLANS[yearlyPlanKey]) {
        const yearlyPlan = PLANS[yearlyPlanKey] || DEFAULT_PLANS[yearlyPlanKey];
        baseAmount = yearlyPlan.price;
        durationDiscount = (monthlyPrice * 12) - yearlyPlan.price;
      } else {
        durationDiscount = Math.round(baseAmount * 0.20);
      }
    }

    let totalAfterDuration = baseAmount - (durationMonths === 12 && durationDiscount > 0 && PLANS[`YEARLY_${planId}`] ? 0 : durationDiscount);

    // Apply voucher validation
    let couponDiscount = 0;
    if (couponCode) {
      const vResult = validateVoucher({
        code: couponCode,
        planId,
        durationMonths,
        orderAmount: totalAfterDuration,
      });
      if (vResult.valid) {
        couponDiscount = vResult.discountAmount;
        recordVoucherUsage(couponCode);
      }
    }

    const finalAmount = Math.max(1000, totalAfterDuration - couponDiscount);
    const orderId = generateOrderId(planId);
    const durationLabel = durationMonths === 12 ? "1 Tahun" : `${durationMonths} Bulan`;

    // Create Snap Token via Midtrans
    const snap = await createSnapToken({
      orderId,
      amount: finalAmount,
      planId,
      customerName,
      customerEmail,
      customerPhone,
      itemName: `Sendora ${plan.name} (${durationLabel})`,
    });

    // Save pending invoice to local storage
    createInvoice({
      userId: syncedUser.id,
      orderId,
      planId,
      amount: finalAmount,
      status: "PENDING",
      paymentMethod: null,
      snapToken: snap.token,
      midtransTransactionId: null,
      paidAt: null,
    });

    return NextResponse.json({
      success: true,
      data: {
        snapToken: snap.token,
        redirectUrl: snap.redirect_url,
        orderId,
        finalAmount,
        durationMonths,
      },
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses checkout" }, { status: 500 });
  }
}
