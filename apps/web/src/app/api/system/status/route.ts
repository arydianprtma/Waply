import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/admin-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminSettings = getAdminSettings();
    return NextResponse.json({
      success: true,
      maintenance: adminSettings.maintenanceConfig,
      appName: adminSettings.systemProfile.appName,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        maintenance: {
          enabled: false,
          message: "",
          allowAdminBypass: true,
        },
        error: error.message,
      },
      { status: 200 }
    );
  }
}
