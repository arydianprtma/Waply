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
import { getAllAddons } from "@/lib/addons";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const body = await req.json();

    const isAddonOnly = body.isAddonOnly === true || body.planId === "ADDON" || body.planId === "ADDON_ONLY";
    const planId = isAddonOnly ? ("ADDON" as any) : ((body.planId || "STARTER") as PlanId);
    const durationMonths = isAddonOnly ? 0 : Number(body.durationMonths || 1); // 1, 3, or 12
    const customerName = (body.customerName || authUser.name || "Waply User").trim();
    const customerEmail = (body.customerEmail || authUser.email || "user@waply.id").trim().toLowerCase();
    const customerPhone = (body.customerPhone || "").trim();
    const couponCode = (body.couponCode || "").trim().toUpperCase();

    // Addons calculation
    const selectedAddonIds: string[] = Array.isArray(body.selectedAddonIds) ? body.selectedAddonIds : [];
    const allAddons = getAllAddons();
    let addonsAmount = 0;
    for (const addId of selectedAddonIds) {
      if (allAddons[addId] && allAddons[addId].isActive) {
        addonsAmount += allAddons[addId].price;
      }
    }

    if (isAddonOnly && selectedAddonIds.length === 0) {
      return NextResponse.json({ success: false, error: "Pilih minimal 1 addon untuk checkout" }, { status: 400 });
    }

    // Resolve plan
    const plan = isAddonOnly ? null : (PLANS[planId] || DEFAULT_PLANS[planId]);
    if (!isAddonOnly && !plan) {
      return NextResponse.json({ success: false, error: "Paket tidak valid" }, { status: 400 });
    }

    if (!isAddonOnly && plan && plan.price === 0) {
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
      role: customerEmail === "admin@waply.id" ? "admin" : "user",
    });

    // Base price & duration calculation
    let baseAmount = 0;
    if (!isAddonOnly && plan) {
      const isYearly = plan.period === "year";
      const isFixedPeriod = plan.period && plan.period !== "month" && !isYearly;
      baseAmount = plan.price;

      if (isYearly) {
        const years = Math.max(1, Math.round(durationMonths / 12));
        baseAmount = plan.price * years;
      } else if (!isFixedPeriod) {
        baseAmount = plan.price * durationMonths;
      }
    }

    let totalAfterDuration = baseAmount + addonsAmount;

    // Apply voucher validation
    let couponDiscount = 0;
    if (couponCode) {
      const vResult = validateVoucher({
        code: couponCode,
        planId: isAddonOnly ? "STARTER" : planId,
        durationMonths: isAddonOnly ? 1 : durationMonths,
        orderAmount: totalAfterDuration,
      });
      if (vResult.valid) {
        couponDiscount = vResult.discountAmount;
        recordVoucherUsage(couponCode);
      }
    }

    const finalAmount = Math.max(1000, totalAfterDuration - couponDiscount);
    const orderId = isAddonOnly ? `WAPLY-ADDON-${Date.now()}` : generateOrderId(planId);
    const durationLabel =
      durationMonths === 36
        ? "3 Tahun"
        : durationMonths === 24
        ? "2 Tahun"
        : durationMonths === 12
        ? "1 Tahun"
        : `${durationMonths} Bulan`;

    const addonNames = selectedAddonIds.map((id: string) => allAddons[id]?.name).filter(Boolean);
    const addonLabel = addonNames.length > 0 ? addonNames.join(", ") : "Top-Up";

    // Create Snap Token via Midtrans
    const snap = await createSnapToken({
      orderId,
      amount: finalAmount,
      planId,
      customerName,
      customerEmail,
      customerPhone,
      itemName: isAddonOnly
        ? `Waply Addon (${addonLabel})`
        : `Waply ${plan?.name || planId} (${durationLabel})`,
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
      customerName,
      customerEmail,
      customerPhone,
      durationMonths,
      selectedAddonIds,
      addonsAmount,
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
