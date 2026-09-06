import { NextRequest, NextResponse } from "next/server";
import { validateVoucher } from "@/lib/vouchers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, planId, durationMonths, orderAmount } = body;

    if (!code || typeof orderAmount !== "number") {
      return NextResponse.json(
        { success: false, error: "Parameter voucher atau nominal order tidak valid" },
        { status: 400 }
      );
    }

    const result = validateVoucher({
      code,
      planId,
      durationMonths: durationMonths ? Number(durationMonths) : undefined,
      orderAmount: Number(orderAmount),
    });

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Voucher tidak valid",
          discountAmount: 0,
          finalAmount: orderAmount,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code: result.voucher?.code,
        name: result.voucher?.name,
        discountType: result.voucher?.discountType,
        discountValue: result.voucher?.discountValue,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        message: result.message,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
