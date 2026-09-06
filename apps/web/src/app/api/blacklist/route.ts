import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@sendora/database";
import { getSessionUser } from "@/lib/auth-user";

interface LocalBlacklistItem {
  id: string;
  userId: string;
  phoneNumber: string;
  reason: string;
  notes: string | null;
  createdAt: string;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".sendora-data");
const LOCAL_BLACKLIST_FILE = path.join(LOCAL_STORAGE_DIR, "blacklist.json");

function getLocalBlacklist(): LocalBlacklistItem[] {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_BLACKLIST_FILE)) {
      fs.writeFileSync(LOCAL_BLACKLIST_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(LOCAL_BLACKLIST_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function saveLocalBlacklist(items: LocalBlacklistItem[]) {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_BLACKLIST_FILE, JSON.stringify(items, null, 2));
  } catch (err) {
    console.error("Failed to save local blacklist:", err);
  }
}

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    try {
      const blacklist = await prisma.blacklist.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, data: blacklist });
    } catch (dbErr) {
      console.warn("DB offline, loading local blacklist:", (dbErr as Error).message);
      const local = getLocalBlacklist();
      return NextResponse.json({ success: true, data: local });
    }
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json().catch(() => ({}));

    if (!body.phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    const phoneNumber = normalizePhoneNumber(body.phoneNumber);

    try {
      const existing = await prisma.blacklist.findFirst({
        where: { userId: user.id, phoneNumber },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "This phone number is already blacklisted" },
          { status: 400 }
        );
      }

      const item = await prisma.blacklist.create({
        data: {
          userId: user.id,
          phoneNumber,
          reason: body.reason || "MANUAL_BLOCK",
          notes: body.notes || null,
        },
      });

      return NextResponse.json({ success: true, data: item });
    } catch (dbErr) {
      console.warn("DB offline, saving to local blacklist:", (dbErr as Error).message);
      const items = getLocalBlacklist();
      if (items.some((i) => i.phoneNumber === phoneNumber)) {
        return NextResponse.json(
          { success: false, error: "This phone number is already blacklisted" },
          { status: 400 }
        );
      }

      const newItem: LocalBlacklistItem = {
        id: `bl_${Date.now()}`,
        userId: user.id,
        phoneNumber,
        reason: body.reason || "MANUAL_BLOCK",
        notes: body.notes || null,
        createdAt: new Date().toISOString(),
      };

      items.unshift(newItem);
      saveLocalBlacklist(items);
      return NextResponse.json({ success: true, data: newItem });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add to blacklist" },
      { status: 500 }
    );
  }
}
