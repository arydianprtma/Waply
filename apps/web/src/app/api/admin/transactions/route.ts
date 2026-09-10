import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import {
  getAllTransactions,
  syncMidtransTransaction,
  clearAllTransactions,
  deleteTransaction,
} from "@/lib/admin-transactions";
import { sendEmailInvoiceNotification } from "@/lib/email-service";
import { getInvoices } from "@/lib/billing";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = getAllTransactions();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action, orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID wajib disertakan" },
        { status: 400 }
      );
    }

    if (action === "sync") {
      const result = await syncMidtransTransaction(orderId);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        status: result.status,
      });
    }

    if (action === "resend_email") {
      const { transactions } = getAllTransactions();
      const target = transactions.find(
        (t) => t.orderId === orderId || t.id === orderId
      );

      if (!target || !target.userEmail) {
        return NextResponse.json(
          { error: "Transaksi atau email penerima tidak valid" },
          { status: 400 }
        );
      }

      await sendEmailInvoiceNotification({
        orderId: target.orderId || target.id,
        customerName: target.userName || "Customer",
        customerEmail: target.userEmail,
        planName: target.planName || target.planId || "Plan",
        amount: Number(target.amount) || 0,
        status: target.status === "PAID" ? "PAID" : "PENDING",
        paymentMethod: target.paymentMethod || "QRIS",
        vaNumber: target.vaNumber,
        paymentUrl: target.paymentUrl,
      });

      return NextResponse.json({
        success: true,
        message: `Bukti transaksi berhasil dikirim ulang ke ${target.userEmail}`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      clearAllTransactions();
      return NextResponse.json({
        success: true,
        message: "Seluruh riwayat transaksi berhasil dihapus dan dinolkan.",
      });
    }

    if (orderId) {
      deleteTransaction(orderId);
      return NextResponse.json({
        success: true,
        message: `Transaksi ${orderId} berhasil dihapus.`,
      });
    }

    return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
