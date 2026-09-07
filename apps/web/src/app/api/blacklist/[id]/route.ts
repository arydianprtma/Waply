import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@sendora/database";
import { getSessionUser } from "@/lib/auth-user";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".sendora-data");
const LOCAL_BLACKLIST_FILE = path.join(LOCAL_STORAGE_DIR, "blacklist.json");

function deleteFromLocalBlacklist(id: string, userId: string) {
  try {
    if (fs.existsSync(LOCAL_BLACKLIST_FILE)) {
      const data = fs.readFileSync(LOCAL_BLACKLIST_FILE, "utf-8");
      const list = JSON.parse(data || "[]");
      const updated = list.filter((item: any) => !(item.id === id && item.userId === userId));
      fs.writeFileSync(LOCAL_BLACKLIST_FILE, JSON.stringify(updated, null, 2));
    }
  } catch (err) {
    console.error("Failed to delete from local blacklist:", err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (id.startsWith("bl_") || !process.env.DATABASE_URL) {
      deleteFromLocalBlacklist(id, user.id);
      return NextResponse.json({ success: true, message: "Removed from blacklist" });
    }

    try {
      await prisma.blacklist.deleteMany({
        where: { id, userId: user.id },
      });
      deleteFromLocalBlacklist(id, user.id);
      return NextResponse.json({ success: true, message: "Removed from blacklist" });
    } catch {
      deleteFromLocalBlacklist(id, user.id);
      return NextResponse.json({ success: true, message: "Removed from blacklist" });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove from blacklist" },
      { status: 500 }
    );
  }
}
