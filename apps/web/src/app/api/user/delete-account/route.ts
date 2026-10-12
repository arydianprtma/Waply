import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { deleteUser } from "@/lib/admin-users";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const user = await getSessionUser();

    if (!user || user.id === "usr_default_guest") {
      return NextResponse.json(
        { success: false, error: "Sesi pengguna tidak valid." },
        { status: 401 }
      );
    }

    if (
      user.role === "admin" ||
      user.email === "admin@waply.id" ||
      user.id === "admin-master-waply-01"
    ) {
      return NextResponse.json(
        { success: false, error: "Akun Super Admin utama tidak dapat dihapus." },
        { status: 403 }
      );
    }

    // Delete user from registry and auth backend
    const delRes = await deleteUser(user.id);
    if (!delRes.success) {
      return NextResponse.json(
        { success: false, error: delRes.error || "Gagal menghapus akun." },
        { status: 400 }
      );
    }

    // Purge session cookies
    const cookieStore = await cookies();
    cookieStore.delete("waply_demo_auth");
    cookieStore.delete("waply_user_email");
    cookieStore.delete("waply_user_name");
    cookieStore.delete("waply_user_role");
    cookieStore.delete("waply_user_id");

    const response = NextResponse.json({
      success: true,
      message: "Akun Anda telah berhasil dihapus secara permanen.",
    });

    response.cookies.delete("waply_demo_auth");
    response.cookies.delete("waply_user_email");
    response.cookies.delete("waply_user_name");
    response.cookies.delete("waply_user_role");
    response.cookies.delete("waply_user_id");

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memproses penghapusan akun." },
      { status: 500 }
    );
  }
}
