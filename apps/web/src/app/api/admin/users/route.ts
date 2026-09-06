import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-user";
import {
  getAllManagedUsers,
  getAdminUserStats,
  updateUserStatus,
  updateUserPlan,
  deleteUser,
  UserAccountStatus,
} from "@/lib/admin-users";

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const users = getAllManagedUsers();
    const stats = getAdminUserStats();

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q")?.toLowerCase() || "";
    const statusFilter = searchParams.get("status");
    const planFilter = searchParams.get("plan");

    let filtered = users;
    if (query) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.id.toLowerCase().includes(query)
      );
    }
    if (statusFilter && statusFilter !== "ALL") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }
    if (planFilter && planFilter !== "ALL") {
      filtered = filtered.filter((u) => u.planId === planFilter);
    }

    return NextResponse.json({
      success: true,
      data: {
        users: filtered,
        stats,
      },
    });
  } catch (err: any) {
    const status = err.message.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID diperlukan" }, { status: 400 });
    }

    if (action === "update_status") {
      const { status, banReason } = body;
      const updated = updateUserStatus(userId, status as UserAccountStatus, banReason);
      if (!updated) {
        return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, message: `Status user diubah menjadi ${status}` });
    }

    if (action === "update_plan") {
      const { planId, durationDays = 30 } = body;
      const updated = updateUserPlan(userId, planId, durationDays);
      if (!updated) {
        return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, message: `Paket user berhasil diubah menjadi ${planId}` });
    }

    if (action === "delete_user") {
      const res = deleteUser(userId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error || "Gagal menghapus user" }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus secara permanen dari sistem." });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak valid" }, { status: 400 });
  } catch (err: any) {
    const status = err.message.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminUser();
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId") || searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID diperlukan" }, { status: 400 });
    }

    const res = deleteUser(userId);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error || "Gagal menghapus user" }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus secara permanen dari sistem." });
  } catch (err: any) {
    const status = err.message.includes("403") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
