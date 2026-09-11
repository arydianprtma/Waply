import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { registerOrSyncUser } from "@/lib/admin-users";
import {
  PLANS,
  DEFAULT_PLANS,
  PlanId,
  generateOrderId,
  chargeMidtransCoreApi,
  createInvoice,
  sendEmailInvoiceNotification,
  getPlanDiscountStatus,
} from "@/lib/billing";
import { getAllAddons } from "@/lib/addons";
import { validateVoucher, recordVoucherUsage } from "@/lib/vouchers";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const body = await req.json();

    const isAddonOnly = body.isAddonOnly === true || body.planId === "ADDON" || body.planId === "ADDON_ONLY";
    const planId = isAddonOnly ? ("ADDON" as any) : ((body.planId || "STARTER") as PlanId);
    const durationMonths = isAddonOnly ? 0 : Number(body.durationMonths || 1); // 1, 3, 12
    const paymentType = (body.paymentType || "qris") as "qris" | "bank_transfer" | "gopay" | "shopeepay";
    const bank = (body.bank || "bca") as "bca" | "bni" | "bri" | "permata" | "mandiri" | "cimb";

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

    // Sync / register user in DB
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
      const discStatus = getPlanDiscountStatus(plan);
      const effectivePlanPrice = discStatus.effectivePrice;
      baseAmount = effectivePlanPrice;

      if (isYearly) {
        const years = Math.max(1, Math.round(durationMonths / 12));
        baseAmount = effectivePlanPrice * years;
      } else if (!isFixedPeriod) {
        baseAmount = effectivePlanPrice * durationMonths;
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

    // Charge directly via Midtrans Core API
    const addonNames = selectedAddonIds.map((id: string) => allAddons[id]?.name).filter(Boolean);
    const addonLabel = addonNames.length > 0 ? addonNames.join(", ") : "Top-Up";

    const chargeResult = await chargeMidtransCoreApi({
      paymentType,
      bank,
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

    // Extract payment details
    let qrCodeUrl: string | null = null;
    let qrString: string | null = null;
    let vaNumber: string | null = null;
    let billerCode: string | null = null;
    let billKey: string | null = null;
    let deeplinkUrl: string | null = null;

    if (chargeResult.actions && Array.isArray(chargeResult.actions)) {
      const qrAction = chargeResult.actions.find((a: any) => a.name === "generate-qr-code");
      if (qrAction) qrCodeUrl = qrAction.url;
      const deepAction = chargeResult.actions.find((a: any) => a.name === "deeplink-redirect");
      if (deepAction) deeplinkUrl = deepAction.url;
    }

    if (chargeResult.qr_string) {
      qrString = chargeResult.qr_string;
    }

    if (chargeResult.va_numbers && chargeResult.va_numbers.length > 0) {
      vaNumber = chargeResult.va_numbers[0].va_number;
    } else if (chargeResult.permata_va_number) {
      vaNumber = chargeResult.permata_va_number;
    }

    if (chargeResult.biller_code) {
      billerCode = chargeResult.biller_code;
      billKey = chargeResult.bill_key;
    }

    // Save pending invoice
    createInvoice({
      userId: syncedUser.id,
      orderId,
      planId,
      amount: finalAmount,
      status: "PENDING",
      paymentMethod: paymentType === "bank_transfer" ? `VA ${bank.toUpperCase()}` : paymentType.toUpperCase(),
      snapToken: null,
      midtransTransactionId: chargeResult.transaction_id || null,
      paidAt: null,
      customerName,
      customerEmail,
      customerPhone,
      durationMonths,
      selectedAddonIds,
      addonsAmount,
    });

    // Send Email Invoice Notification (Non-blocking)
    if (customerEmail) {
      sendEmailInvoiceNotification({
        orderId,
        customerName,
        customerEmail,
        planName: isAddonOnly ? "Addon / Top-Up" : (plan?.name || planId),
        amount: finalAmount,
        status: "PENDING",
        paymentMethod: paymentType === "bank_transfer" ? `Virtual Account ${bank.toUpperCase()}` : paymentType.toUpperCase(),
        vaNumber: vaNumber || (billerCode ? `${billerCode} / ${billKey}` : undefined),
      }).catch((err) => console.log("[Email Service] Send error:", err.message));
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        grossAmount: finalAmount,
        paymentType,
        bank: paymentType === "bank_transfer" ? bank : undefined,
        qrCodeUrl,
        qrString,
        vaNumber,
        billerCode,
        billKey,
        deeplinkUrl,
        expiryTime: chargeResult.expiry_time || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        transactionStatus: chargeResult.transaction_status || "pending",
        transactionId: chargeResult.transaction_id,
      },
    });
  } catch (error: any) {
    console.error("Direct Charge error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses pembayaran" }, { status: 500 });
  }
}

