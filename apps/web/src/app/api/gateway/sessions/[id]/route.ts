import { NextResponse } from "next/server";
import { fetchGateway } from "@/lib/gateway-client";
import { requireActiveUser } from "@/lib/auth-user";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireActiveUser();
    const { id } = await params;
    const res = await fetchGateway(`/api/sessions/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 503;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect session on Gateway" },
      { status }
    );
  }
}
