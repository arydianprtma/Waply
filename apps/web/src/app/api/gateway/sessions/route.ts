import { NextResponse } from "next/server";
import { fetchGateway } from "@/lib/gateway-client";
import { requireActiveUser } from "@/lib/auth-user";
import {
  getUserDeviceLimit,
  getUserSessionIds,
  registerUserDevice,
  getAllUserDeviceRecords,
  setDeviceWarmupStage,
  updateUserDevicePhone,
} from "@/lib/user-devices";
import { getAllDevicesSentTodayMap } from "@/lib/messages";
import { getAllManagedUsers, ManagedUser } from "@/lib/admin-users";
import { getSubscription, getAllPlans, DEFAULT_PLANS } from "@/lib/billing";

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

    const deviceRecords = (getAllUserDeviceRecords && getAllUserDeviceRecords()) || {};
    let managedUsers: ManagedUser[] = [];
    try {
      managedUsers = (getAllManagedUsers && getAllManagedUsers()) || [];
    } catch {
      managedUsers = [];
    }
    const userMap = new Map<string, ManagedUser>();
    if (Array.isArray(managedUsers)) {
      managedUsers.forEach((u) => {
        if (u?.id) userMap.set(String(u.id).toLowerCase(), u);
        if (u?.email) userMap.set(String(u.email).toLowerCase(), u);
      });
    }

    const sentTodayMap = getAllDevicesSentTodayMap();
    const enrichedSessions = userSessions.map((s: any) => {
      const devRecord = deviceRecords[s.id];
      const phoneNumber = s.phoneNumber || devRecord?.phoneNumber || null;
      if (s.phoneNumber && devRecord && devRecord.phoneNumber !== s.phoneNumber) {
        updateUserDevicePhone(s.id, s.phoneNumber);
      }

      let ownerUserId = devRecord?.userId || s.userId || null;
      let ownerUserEmail = devRecord?.userEmail || s.userEmail || null;
      let ownerUserName = devRecord?.name || s.name || null;

      if (ownerUserId || ownerUserEmail) {
        const found =
          userMap.get((ownerUserId || "").toLowerCase()) ||
          userMap.get((ownerUserEmail || "").toLowerCase());
        if (found) {
          ownerUserName = found.name || ownerUserName;
          ownerUserEmail = found.email || ownerUserEmail;
          ownerUserId = found.id || ownerUserId;
        }
      }

      const sentToday = sentTodayMap[s.id] || 0;

      // 1. Calculate device connection age (days active)
      let deviceCreatedAt = devRecord?.createdAt || null;
      if (!deviceCreatedAt && typeof s.id === "string" && s.id.startsWith("dev_")) {
        const ts = parseInt(s.id.replace("dev_", ""), 10);
        if (!isNaN(ts) && ts > 1000000000000) {
          deviceCreatedAt = new Date(ts).toISOString();
        }
      }
      if (!deviceCreatedAt && s.lastConnectedAt) {
        deviceCreatedAt = new Date(s.lastConnectedAt).toISOString();
      }

      const diffMs = deviceCreatedAt ? Math.max(0, Date.now() - new Date(deviceCreatedAt).getTime()) : 0;
      const currentDay = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

      // 2. Stage Progression based on days connected:
      // Hari 1-3: Cold
      // Hari 4-7: Warm
      // Hari 8-14: Active
      // Hari 15+: Mature
      let autoStage: "Cold" | "Warm" | "Active" | "Mature" = "Cold";
      if (currentDay >= 15) {
        autoStage = "Mature";
      } else if (currentDay >= 8) {
        autoStage = "Active";
      } else if (currentDay >= 4) {
        autoStage = "Warm";
      } else {
        autoStage = "Cold";
      }

      // Check if user manually unlocked or set a stage:
      const warmupStage: "Cold" | "Warm" | "Active" | "Mature" = devRecord?.warmupStage || autoStage;

      let dailyLimit = 50;

      try {
        const targetUserId = ownerUserId || user.id;
        const sub = getSubscription(targetUserId);
        const allPlans = getAllPlans();
        const plan = allPlans[sub.planId] || DEFAULT_PLANS[sub.planId] || DEFAULT_PLANS.FREE;
        const totalMessages = plan.monthlyMessages ?? 500;
        const isUnlimited = totalMessages === -1;
        const periodDays = plan.period === "day" ? 1 : plan.period === "year" ? 365 : 30;
        const dailyQuota = isUnlimited
          ? 1000
          : Math.max(10, Math.round(totalMessages / periodDays));

        // Proportional Stages: Cold 10%, Warm 30%, Active 60%, Mature 100%
        const limitCold = Math.max(10, Math.round(dailyQuota * 0.10));
        const limitWarm = Math.max(30, Math.round(dailyQuota * 0.30));
        const limitActive = Math.max(60, Math.round(dailyQuota * 0.60));
        const limitMature = isUnlimited ? -1 : totalMessages;

        if (warmupStage === "Mature") {
          dailyLimit = limitMature;
        } else if (warmupStage === "Active") {
          dailyLimit = limitActive;
        } else if (warmupStage === "Warm") {
          dailyLimit = limitWarm;
        } else {
          dailyLimit = limitCold;
        }
      } catch {
        if (warmupStage === "Mature") {
          dailyLimit = 10000;
        } else if (warmupStage === "Active") {
          dailyLimit = 250;
        } else if (warmupStage === "Warm") {
          dailyLimit = 100;
        } else {
          dailyLimit = 50;
        }
      }

      return {
        ...s,
        phoneNumber,
        ownerUserId,
        ownerUserEmail,
        ownerUserName,
        sentToday,
        warmupStage,
        dailyLimit,
        currentDay,
        deviceCreatedAt,
      };
    });

    const currentCount = userSessions.length;
    const canAddMore = currentCount < limitInfo.maxDevices;

    return NextResponse.json({
      success: true,
      data: enrichedSessions,
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

    if (body.action === "update_warmup_stage" && body.sessionId && body.stage) {
      setDeviceWarmupStage(body.sessionId, body.stage, user.id, user.email);
      return NextResponse.json({
        success: true,
        message: `Status warmup berhasil diubah ke ${body.stage}`,
      });
    }

    const limitInfo = getUserDeviceLimit(user.id);

    // Fetch live session count
    const gwRes = await fetchGateway("/api/sessions", { cache: "no-store" });
    const gwData = await gwRes.json().catch(() => ({}));
    const allGwSessions = Array.isArray(gwData.data) ? gwData.data : [];

    const userSessionIds = getUserSessionIds(user.id, user.email);
    const liveUserSessions = user.role === "admin"
      ? allGwSessions
      : allGwSessions.filter((s: any) => userSessionIds.includes(s.id));

    // Check if this is an existing session being reconnected:
    const isExistingSession =
      liveUserSessions.some((s: any) => s.id === body.id) ||
      userSessionIds.includes(body.id) ||
      Boolean(body.reconnect);

    // Enforce limit only if adding a brand-new device slot:
    if (!isExistingSession && liveUserSessions.length >= limitInfo.maxDevices) {
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
      registerUserDevice(
        user.id,
        body.id,
        body.name || "WhatsApp Device",
        user.role,
        user.email,
        body.phoneNumber
      );
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
