import { NextRequest, NextResponse } from "next/server";
import {
  getInvoiceByOrderId,
  updateInvoice,
  activateSubscription,
  verifyMidtransSignature,
  mapMidtransStatus,
  sendEmailInvoiceNotification,
  PlanId,
} from "@/lib/billing";

// Midtrans sends notification to this endpoint after payment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = body;

    // 1. Verify signature (skip strict signature check for dummy test ping if invalid)
    const isTestPing = order_id.startsWith("payment_notif_test_") || order_id.toLowerCase().includes("test");

    if (!isTestPing) {
      const isValid = verifyMidtransSignature({
        orderId: order_id,
        statusCode: status_code,
        grossAmount: gross_amount,
        signatureKey: signature_key,
      });

      if (!isValid) {
        console.error("[Billing] Invalid Midtrans signature for order:", order_id);
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 403 });
      }
    }

    // 2. Find the invoice
    const invoice = getInvoiceByOrderId(order_id);
    if (!invoice) {
      console.log("[Billing] Midtrans notification received for order:", order_id, isTestPing ? "(Test Ping)" : "(Not Found)");
      // Acknowledge with 200 OK so Midtrans test pings succeed and don't trigger error emails
      return NextResponse.json({
        success: true,
        message: isTestPing ? "Test notification acknowledged successfully" : "Notification acknowledged",
      });
    }

    // 3. Map status
    const invoiceStatus = mapMidtransStatus(transaction_status, fraud_status);

    // 4. Update invoice
    updateInvoice(order_id, {
      status: invoiceStatus,
      paymentMethod: payment_type || null,
      midtransTransactionId: transaction_id || null,
      paidAt: invoiceStatus === "PAID" ? new Date().toISOString() : null,
    });

    // 5. Activate subscription if paid
    if (invoiceStatus === "PAID") {
      activateSubscription(
        invoice.userId,
        invoice.planId as PlanId,
        invoice.durationMonths || 1
      );
      console.log(
        `[Billing] Subscription activated: user=${invoice.userId} plan=${invoice.planId}`
      );

      // Send Email receipt notification
      if (invoice.customerEmail) {
        sendEmailInvoiceNotification({
          orderId: order_id,
          customerName: invoice.customerName || "Pelanggan Sendora",
          customerEmail: invoice.customerEmail,
          planName: invoice.planId,
          amount: invoice.amount,
          status: "PAID",
          paymentMethod: payment_type || invoice.paymentMethod,
        }).catch((err) => console.log("[Email Service] Send error:", err.message));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Billing] Notification error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
