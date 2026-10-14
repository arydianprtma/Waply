import { NextResponse } from "next/server";
import { getAllPlans } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const plans = getAllPlans();
    return NextResponse.json(
      {
        success: true,
        data: plans,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
