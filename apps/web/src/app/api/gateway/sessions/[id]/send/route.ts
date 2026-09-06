import { NextResponse } from "next/server";
import { fetchGateway } from "@/lib/gateway-client";
import { requireActiveUser } from "@/lib/auth-user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireActiveUser();
    const { id } = await params;
    const body = await request.json();

    const res = await fetchGateway(`/api/sessions/${id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 503;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send message via Gateway service" },
      { status }
    );
  }
}
