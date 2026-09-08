import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-user";
import {
  getAllAddons,
  createOrUpdateAddon,
  deleteAddon,
  grantUserAddon,
  getUserAddons,
} from "@/lib/addons";
import { AddonItem } from "@/lib/addon-types";

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = req.nextUrl;
    const targetUserId = searchParams.get("userId");

    if (targetUserId) {
      const userAddons = getUserAddons(targetUserId);
      return NextResponse.json({
        success: true,
        data: { userAddons },
      });
    }

    const all = getAllAddons();
    return NextResponse.json({
      success: true,
      data: {
        addons: Object.values(all),
      },
    });
  } catch (err: any) {
    const status = err.message?.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const { id, name, type, amount, price, description, badge, isActive } = body;

    if (!id || !name || !type || amount === undefined || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Data addon tidak lengkap (id, name, type, amount, price wajib diisi)" },
        { status: 400 }
      );
    }

    const addon: AddonItem = {
      id: String(id).trim().toUpperCase(),
      name: String(name).trim(),
      type: type === "DEVICE" ? "DEVICE" : "MESSAGES",
      amount: Math.max(1, Number(amount)),
      price: Math.max(0, Number(price)),
      description: description ? String(description).trim() : undefined,
      badge: badge ? String(badge).trim() : undefined,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    };

    const saved = createOrUpdateAddon(addon);
    return NextResponse.json({
      success: true,
      data: saved,
      message: `Addon ${saved.name} berhasil disimpan`,
    });
  } catch (err: any) {
    const status = err.message?.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID addon wajib disertakan" }, { status: 400 });
    }

    const ok = deleteAddon(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Addon tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Addon ${id} berhasil dihapus`,
    });
  } catch (err: any) {
    const status = err.message?.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const { action, userId, addonId, customAmount, expiresAt } = body;

    if (action === "grant") {
      if (!userId || !addonId) {
        return NextResponse.json(
          { success: false, error: "userId dan addonId wajib diisi" },
          { status: 400 }
        );
      }
      const granted = grantUserAddon({
        userId,
        addonId,
        customAmount,
        expiresAt,
      });
      return NextResponse.json({
        success: true,
        data: granted,
        message: `Addon ${granted.name} berhasil diberikan ke user`,
      });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err: any) {
    const status = err.message?.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
