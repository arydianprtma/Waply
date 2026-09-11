import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-user";
import { getTicketById } from "@/lib/support-tickets";
import { validateAttachmentFile } from "@/lib/file-security";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ticketId = formData.get("ticketId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File lampiran tidak ditemukan." },
        { status: 400 }
      );
    }

    // If ticketId is provided, verify access
    if (ticketId) {
      const ticket = getTicketById(ticketId);
      if (ticket) {
        const isOwner =
          ticket.userId === user.id ||
          ticket.userEmail.toLowerCase() === user.email.toLowerCase();
        const isAdmin = user.role === "admin";
        if (!isOwner && !isAdmin) {
          return NextResponse.json(
            { success: false, error: "Akses tiket tidak diizinkan." },
            { status: 403 }
          );
        }
      }
    }

    // Security Validation (Anti-Malware & Anti-Injection)
    const validation = validateAttachmentFile(file.name, file.size, file.type);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || "File tidak diizinkan karena alasan keamanan sistem.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.resolve(process.cwd(), "public", "uploads", "tickets");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const randomHash = crypto.randomBytes(6).toString("hex");
    const safeExt = validation.extension || path.extname(file.name).toLowerCase() || ".dat";
    const baseCleanName = path
      .basename(validation.sanitizedName || file.name, safeExt)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 40);

    const uniqueFileName = `att_${Date.now()}_${randomHash}_${baseCleanName}${safeExt}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/tickets/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      attachment: {
        id: `att_${Date.now()}_${randomHash}`,
        name: validation.sanitizedName || file.name,
        url: publicUrl,
        size: file.size,
        type: file.type || "application/octet-stream",
        isImage: validation.isImage,
      },
    });
  } catch (error: any) {
    console.error("[Ticket Upload API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunggah file lampiran." },
      { status: 500 }
    );
  }
}
