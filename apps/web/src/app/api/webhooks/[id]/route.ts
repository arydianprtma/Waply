import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { updateWebhook, deleteWebhook, getWebhookById } from "@/lib/webhooks";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const webhook = getWebhookById(id, user.id);

    if (!webhook) {
      return NextResponse.json({ success: false, error: "Webhook tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: webhook });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const body = await req.json();

    const updated = updateWebhook(id, user.id, {
      name: body.name,
      url: body.url,
      secret: body.secret,
      events: body.events,
      isActive: body.isActive,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Webhook tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;
    const body = await req.json();

    const updated = updateWebhook(id, user.id, {
      isActive: body.isActive,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Webhook tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;

    const deleted = deleteWebhook(id, user.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Gagal menghapus webhook" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Webhook berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
