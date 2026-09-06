import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File gambar tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate mime type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format file harus berupa gambar (JPG, PNG, WebP, GIF, SVG)" },
        { status: 400 }
      );
    }

    // Limit 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Ukuran gambar maksimal 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.resolve(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name) || ".png";
    const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunggah gambar" },
      { status: 500 }
    );
  }
}
