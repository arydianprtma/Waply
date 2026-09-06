import { NextResponse } from "next/server";
import { getAllPlans } from "@/lib/billing";

export async function GET() {
  try {
    const plans = getAllPlans();
    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
