import { NextResponse } from "next/server";
import { parseSpintax, generateSpintaxSamples } from "@/lib/spintax";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { template, variables, count = 3 } = body;

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template string is required" },
        { status: 400 }
      );
    }

    const parsedSingle = parseSpintax(template, variables || {});
    const samples = generateSpintaxSamples(template, variables || {}, Math.min(count, 10));

    return NextResponse.json({
      success: true,
      data: {
        single: parsedSingle,
        samples,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to parse spintax" },
      { status: 500 }
    );
  }
}
