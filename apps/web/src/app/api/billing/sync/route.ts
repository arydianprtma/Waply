import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import {
  getInvoiceByOrderId,
  updateInvoice,
  activateSubscription,
  checkMidtransOrderStatus,
  mapMidtransStatus,
  sendEmailInvoiceNotification,
  PlanId,
} from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const invoice = getInvoiceByOrderId(orderId);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice tidak ditemukan" },
        { status: 404 }
      );
    }

    // Call Midtrans API directly to check status
    const midtransRes = await checkMidtransOrderStatus(orderId);
    const { transaction_status, fraud_status, payment_type, transaction_id } = midtransRes;

    const invoiceStatus = mapMidtransStatus(transaction_status, fraud_status);

    updateInvoice(orderId, {
      status: invoiceStatus,
      paymentMethod: payment_type || invoice.paymentMethod,
      midtransTransactionId: transaction_id || invoice.midtransTransactionId,
      paidAt: invoiceStatus === "PAID" ? (invoice.paidAt || new Date().toISOString()) : null,
    });

    if (invoiceStatus === "PAID") {
      activateSubscription(invoice.userId, invoice.planId as PlanId);

      // Send Email Invoice Paid Notification (Non-blocking)
      if (invoice.customerEmail) {
        sendEmailInvoiceNotification({
          orderId,
          customerName: invoice.customerName || "Pelanggan Sendora",
          customerEmail: invoice.customerEmail,
          planName: invoice.planId,
          amount: invoice.amount,
          status: "PAID",
          paymentMethod: payment_type || invoice.paymentMethod,
        }).catch((err) => console.log("[Email Service] Send error:", err.message));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        status: invoiceStatus,
        transactionStatus: transaction_status,
        midtrans: midtransRes,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal sinkronisasi dengan Midtrans" },
      { status: 500 }
    );
  }
}
