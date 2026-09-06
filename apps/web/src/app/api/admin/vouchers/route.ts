import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-user";
import {
  getAllVouchers,
  saveVoucher,
  deleteVoucher,
  toggleVoucher,
  Voucher,
} from "@/lib/vouchers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminUser();
    const vouchers = getAllVouchers();
    return NextResponse.json({ success: true, data: vouchers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = await req.json();

    if (!body.code || !body.name || body.discountValue === undefined) {
      return NextResponse.json(
        { success: false, error: "Kode voucher, nama, dan nilai diskon wajib diisi" },
        { status: 400 }
      );
    }

    const saved = saveVoucher(body);
    return NextResponse.json({
      success: true,
      message: `Voucher "${saved.code}" berhasil disimpan`,
      data: saved,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = await req.json();

    if (body.action === "toggle" && body.id) {
      const toggled = toggleVoucher(body.id);
      if (!toggled) {
        return NextResponse.json({ success: false, error: "Voucher tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Status voucher "${toggled.code}" berhasil diubah menjadi ${toggled.isActive ? "Aktif" : "Nonaktif"}`,
        data: toggled,
      });
    }

    if (body.id && body.code) {
      const updated = saveVoucher(body);
      return NextResponse.json({
        success: true,
        message: `Voucher "${updated.code}" berhasil diperbarui`,
        data: updated,
      });
    }

    return NextResponse.json({ success: false, error: "Parameter tidak valid" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID voucher wajib disertakan" }, { status: 400 });
    }

    const deleted = deleteVoucher(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Voucher tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Voucher berhasil dihapus",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
