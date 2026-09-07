import { NextResponse } from "next/server";
import { fetchGateway } from "@/lib/gateway-client";
import { requireActiveUser } from "@/lib/auth-user";
import {
  getUserDeviceLimit,
  getUserSessionIds,
  registerUserDevice,
} from "@/lib/user-devices";

export async function GET() {
  try {
    const user = await requireActiveUser();
    const res = await fetchGateway("/api/sessions", {
      cache: "no-store",
    });
    const data = await res.json();
    const allSessions = Array.isArray(data.data) ? data.data : [];

    const limitInfo = getUserDeviceLimit(user.id);
    const userSessionIds = getUserSessionIds(user.id, user.email);

    // Filter sessions:
    // If admin, show all sessions on gateway.
    // If regular user, STRICTLY only show sessions registered to this user (never fallback to other users' sessions!)
    let userSessions: any[] = [];
    if (user.role === "admin") {
      userSessions = allSessions;
    } else {
      userSessions = allSessions.filter((s: any) => userSessionIds.includes(s.id));
    }

    const currentCount = userSessions.length;
    const canAddMore = currentCount < limitInfo.maxDevices;

    return NextResponse.json({
      success: true,
      data: userSessions,
      limit: {
        maxDevices: limitInfo.maxDevices,
        currentCount,
        canAddMore,
        planName: limitInfo.planName,
        planId: limitInfo.planId,
      },
    });
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 503;
    return NextResponse.json(
      { success: false, error: error.message || "Gateway service is unreachable" },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();

    const limitInfo = getUserDeviceLimit(user.id);

    // Fetch live session count
    const gwRes = await fetchGateway("/api/sessions", { cache: "no-store" });
    const gwData = await gwRes.json().catch(() => ({}));
    const allGwSessions = Array.isArray(gwData.data) ? gwData.data : [];

    const userSessionIds = getUserSessionIds(user.id, user.email);
    const liveUserSessions = user.role === "admin"
      ? allGwSessions
      : allGwSessions.filter((s: any) => userSessionIds.includes(s.id));

    // Enforce limit:
    if (liveUserSessions.length >= limitInfo.maxDevices) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas maksimal WhatsApp Device (${limitInfo.maxDevices}) untuk paket ${limitInfo.planName} telah tercapai. Silakan upgrade paket Anda untuk menambah device baru.`,
          limitReached: true,
          maxDevices: limitInfo.maxDevices,
          planName: limitInfo.planName,
        },
        { status: 403 }
      );
    }

    const res = await fetchGateway("/api/sessions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.success && body.id) {
      registerUserDevice(user.id, body.id, body.name || "WhatsApp Device", user.role, user.email);
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    const status = error.message?.includes("403") ? 403 : 503;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create session on Gateway" },
      { status }
    );
  }
}
