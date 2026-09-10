import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, requireActiveUser } from "@/lib/auth-user";
import { getSettings, saveSettings } from "@/lib/settings";
import { updateUserAvatar } from "@/lib/admin-users";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File foto profil tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate mime type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format file harus berupa gambar (JPG, PNG, WebP, GIF)" },
        { status: 400 }
      );
    }

    // Limit 3MB
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Ukuran foto maksimal 3MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.resolve(process.cwd(), "public", "uploads", "avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanUserId = user.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const rawExt = path.extname(file.name) || ".png";
    const ext = rawExt.toLowerCase().startsWith(".") ? rawExt.toLowerCase() : `.${rawExt.toLowerCase()}`;
    const fileName = `avatar_${cleanUserId}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/avatars/${fileName}`;

    // Update settings and user registry
    const currentSettings = getSettings(user.id, { name: user.name, email: user.email });
    saveSettings(
      user.id,
      {
        profile: {
          ...currentSettings.profile,
          avatarUrl: publicUrl,
        },
      },
      { name: user.name, email: user.email }
    );
    updateUserAvatar(user.id, publicUrl);
    if (user.email) {
      updateUserAvatar(user.email, publicUrl);
    }

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
      message: "Foto profil berhasil diperbarui",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunggah foto profil" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await requireActiveUser();
    const currentSettings = getSettings(user.id, { name: user.name, email: user.email });

    saveSettings(
      user.id,
      {
        profile: {
          ...currentSettings.profile,
          avatarUrl: "",
        },
      },
      { name: user.name, email: user.email }
    );
    updateUserAvatar(user.id, null);
    if (user.email) {
      updateUserAvatar(user.email, null);
    }

    return NextResponse.json({
      success: true,
      avatarUrl: null,
      message: "Foto profil berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus foto profil" },
      { status: 500 }
    );
  }
}
