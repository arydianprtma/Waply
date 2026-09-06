import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getSettings, saveSettings, resetLocalData } from "@/lib/settings";
import { getAdminSettings } from "@/lib/admin-settings";

export async function GET() {
  try {
    const user = await getAuthUser();
    const settings = getSettings(user.id, {
      name: user.name,
      email: user.email,
    });
    const adminSettings = getAdminSettings();
    return NextResponse.json({
      success: true,
      data: settings,
      maintenance: adminSettings.maintenanceConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json();

    if (body.action === "reset_local_data") {
      const deleted = resetLocalData();
      return NextResponse.json({ success: true, deleted });
    }

    const updated = saveSettings(
      user.id,
      {
        profile: body.profile,
        security: body.security,
        gateway: body.gateway,
        workingHours: body.workingHours,
        notifications: body.notifications,
      },
      {
        name: user.name,
        email: user.email,
      }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
