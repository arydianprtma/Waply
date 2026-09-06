import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getAdminSettings, saveAdminSettings } from "@/lib/admin-settings";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const settings = getAdminSettings();
    
    // Mask sensitive keys for safety
    const safeSettings = {
      ...settings,
      systemProfile: {
        ...settings.systemProfile,
        adminName: user.name || settings.systemProfile.adminName,
        adminEmail: user.email || settings.systemProfile.adminEmail,
      },
      paymentConfig: {
        ...settings.paymentConfig,
        serverKey: settings.paymentConfig.serverKey
          ? `${settings.paymentConfig.serverKey.slice(0, 8)}...${settings.paymentConfig.serverKey.slice(-4)}`
          : "",
      },
      smtpConfig: {
        ...settings.smtpConfig,
        password: settings.smtpConfig.password ? "••••••••" : "",
      },
    };

    return NextResponse.json({ success: true, data: safeSettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await req.json();

    // Handle Ping Gateway Action
    if (body.action === "ping_gateway") {
      const targetUrl = (body.url || "http://localhost:3002").replace(/\/+$/, "");
      const start = Date.now();
      try {
        const gwRes = await fetch(`${targetUrl}/health`, {
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        });
        const latencyMs = Date.now() - start;

        if (gwRes.ok) {
          const json = await gwRes.json().catch(() => ({}));
          return NextResponse.json({
            success: true,
            status: "online",
            latencyMs,
            message: `Gateway Engine Online (HTTP 200 OK • Latency: ${latencyMs}ms)`,
            details: json,
          });
        } else {
          return NextResponse.json({
            success: false,
            status: "error",
            latencyMs,
            message: `Gateway merespons status HTTP ${gwRes.status}`,
          });
        }
      } catch (err: any) {
        // Fallback check on sessions endpoint if /health wasn't directly exposed
        try {
          const sessRes = await fetch(`${targetUrl}/api/sessions`, {
            cache: "no-store",
            signal: AbortSignal.timeout(2000),
          });
          const latencyMs = Date.now() - start;
          if (sessRes.ok) {
            return NextResponse.json({
              success: true,
              status: "online",
              latencyMs,
              message: `Gateway Engine Online (HTTP 200 OK • Latency: ${latencyMs}ms)`,
            });
          }
        } catch {}

        const latencyMs = Date.now() - start;
        return NextResponse.json({
          success: false,
          status: "offline",
          latencyMs,
          message: `Gagal terhubung ke ${targetUrl}: ${err.message || "Connection refused"}`,
        });
      }
    }

    // Preserve existing password / server key if not changed or if masked
    const existing = getAdminSettings();

    let serverKey = body.paymentConfig?.serverKey;
    if (!serverKey || serverKey.includes("...")) {
      serverKey = existing.paymentConfig.serverKey;
    }

    let smtpPassword = body.smtpConfig?.password;
    if (!smtpPassword || smtpPassword === "••••••••") {
      smtpPassword = existing.smtpConfig.password;
    }

    const updated = saveAdminSettings({
      systemProfile: body.systemProfile,
      gatewayConfig: body.gatewayConfig,
      paymentConfig: {
        ...body.paymentConfig,
        serverKey,
      },
      smtpConfig: {
        ...body.smtpConfig,
        password: smtpPassword,
      },
      maintenanceConfig: body.maintenanceConfig,
      dataRetentionDays: body.dataRetentionDays,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
