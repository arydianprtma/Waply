import { NextResponse } from "next/server";
import { fetchGateway } from "@/lib/gateway-client";
import { requireActiveUser } from "@/lib/auth-user";

export async function GET() {
  try {
    await requireActiveUser();
    const res = await fetchGateway("/api/sessions", {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 503;
    return NextResponse.json(
      { success: false, error: error.message || "Gateway service is unreachable" },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireActiveUser();
    const body = await request.json();
    const res = await fetchGateway("/api/sessions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 503;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create session on Gateway" },
      { status }
    );
  }
}
