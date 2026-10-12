import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import crypto from "crypto";
import { registerOrSyncUser, getUserByEmail } from "@/lib/admin-users";
import {
  PLANS,
  DEFAULT_PLANS,
  PlanId,
  generateOrderId,
  createSnapToken,
  createInvoice,
  getPlanDiscountStatus,
  getMidtransConfig,
} from "@/lib/billing";
import { validateVoucher, recordVoucherUsage } from "@/lib/vouchers";
import { getAllAddons } from "@/lib/addons";
import { sendEmailVerification } from "@/lib/email-service";

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
    const customerPassword = (body.customerPassword || "").trim();
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

    // Guest registration & email activation check
    const isGuest = !authUser || authUser.id === "usr_default_guest" || authUser.email === "user@waply.id";
    const existingUser = getUserByEmail(customerEmail);

    let requiresActivation = false;
    let verifyToken: string | null = null;

    if (isGuest && (!existingUser || existingUser.emailVerified === false)) {
      requiresActivation = true;
      verifyToken = existingUser?.emailVerifyToken || crypto.randomBytes(32).toString("hex");
    }

    // Sync / register user in DB
    const syncedUser = registerOrSyncUser({
      id: authUser.id && authUser.id !== "usr_default_guest" ? authUser.id : (existingUser?.id || `usr_${customerEmail.replace(/[^a-zA-Z0-9]/g, "_")}`),
      email: customerEmail,
      name: customerName,
      role: customerEmail === "admin@waply.id" ? "admin" : "user",
      emailVerified: isGuest ? (existingUser?.emailVerified ?? false) : true,
      emailVerifyToken: verifyToken || existingUser?.emailVerifyToken || null,
    });

    if (requiresActivation && verifyToken) {
      // Sync to Supabase auth if configured and password provided
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (sbUrl && sbKey && customerPassword) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseAdmin = createClient(sbUrl, sbKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const sbMatch = userList?.users?.find((u) => u.email?.toLowerCase() === customerEmail.toLowerCase());
          if (!sbMatch) {
            await supabaseAdmin.auth.admin.createUser({
              email: customerEmail,
              password: customerPassword,
              email_confirm: false,
              user_metadata: { name: customerName, phone: customerPhone },
            });
          } else {
            await supabaseAdmin.auth.admin.updateUserById(sbMatch.id, {
              password: customerPassword,
              email_confirm: false,
              user_metadata: { name: customerName, phone: customerPhone },
            });
          }
        } catch (sbErr: any) {
          console.warn("[Checkout] Supabase user registration note:", sbErr.message);
        }
      }

      // Send verification email
      let origin = process.env.NEXT_PUBLIC_APP_URL || "https://ardp.my.id";
      const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host");
      const protoHeader = req.headers.get("x-forwarded-proto") || "https";
      if (hostHeader) {
        origin = `${protoHeader}://${hostHeader}`;
      }
      const verificationUrl = `${origin.replace(/\/$/, "")}/auth/callback?verify_token=${verifyToken}&email=${encodeURIComponent(customerEmail)}`;

      sendEmailVerification({
        customerEmail,
        customerName,
        verificationUrl,
      }).catch((err) => console.error("[Checkout] Error sending verification email:", err.message));
    }

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
      requiresActivation,
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
      snapRedirectUrl: snap.redirect_url || null,
      expiryTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });

    const { snapJsUrl, clientKey } = getMidtransConfig();

    return NextResponse.json({
      success: true,
      data: {
        snapToken: snap.token,
        redirectUrl: snap.redirect_url,
        orderId,
        finalAmount,
        durationMonths,
        snapJsUrl,
        clientKey,
        requiresActivation,
      },
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses checkout" }, { status: 500 });
  }
}
