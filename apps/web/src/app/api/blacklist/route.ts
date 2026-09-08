import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@sendora/database";
import { getSessionUser } from "@/lib/auth-user";
import { getUserPlanAccess } from "@/lib/billing";

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

function getLocalBlacklist(userId?: string): LocalBlacklistItem[] {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_BLACKLIST_FILE)) {
      fs.writeFileSync(LOCAL_BLACKLIST_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(LOCAL_BLACKLIST_FILE, "utf-8");
    const list = JSON.parse(data || "[]");
    if (userId) {
      return list.filter((item: any) => item.userId === userId);
    }
    return list;
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
    const userAccess = getUserPlanAccess(user.id);
    if (!userAccess.blacklistDnd) {
      return NextResponse.json(
        { success: false, error: "Fitur Blacklist & DND tidak aktif pada paket langganan Anda.", data: [] },
        { status: 403 }
      );
    }

    let dbList: any[] = [];
    try {
      dbList = await prisma.blacklist.findMany({
        where: {
          OR: [
            { userId: user.id },
            { userId: "admin-default-user" },
            ...(user.role === "admin" ? [{ userId: "admin-master-sendora-01" }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (dbErr) {
      // DB might be offline, fallback to local list
    }

    const localList = getLocalBlacklist(user.id);

    // Merge DB list & Local list deduplicating by clean phoneNumber
    const mergedMap = new Map<string, any>();
    for (const item of [...dbList, ...localList]) {
      const cleanPhone = item.phoneNumber ? item.phoneNumber.replace(/\D/g, "") : "";
      if (cleanPhone && !mergedMap.has(cleanPhone)) {
        mergedMap.set(cleanPhone, {
          ...item,
          phoneNumber: cleanPhone,
        });
      }
    }

    const result = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const userAccess = getUserPlanAccess(user.id);
    if (!userAccess.blacklistDnd) {
      return NextResponse.json(
        { success: false, error: "Fitur Blacklist & DND tidak aktif pada paket langganan Anda." },
        { status: 403 }
      );
    }
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
      const allItems = getLocalBlacklist();
      if (allItems.some((i) => i.userId === user.id && i.phoneNumber === phoneNumber)) {
        return NextResponse.json(
          { success: false, error: "This phone number is already blacklisted" },
          { status: 400 }
        );
      }

      const newItem: LocalBlacklistItem = {
        id: `bl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        phoneNumber,
        reason: body.reason || "MANUAL_BLOCK",
        notes: body.notes || null,
        createdAt: new Date().toISOString(),
      };

      allItems.unshift(newItem);
      saveLocalBlacklist(allItems);
      return NextResponse.json({ success: true, data: newItem });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add to blacklist" },
      { status: 500 }
    );
  }
}
