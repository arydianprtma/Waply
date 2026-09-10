import { NextResponse } from "next/server";
import {
  getAdminSettings,
  AVAILABLE_PAYMENT_CHANNELS,
  DEFAULT_ENABLED_PAYMENT_CHANNELS,
} from "@/lib/admin-settings";

export async function GET() {
  try {
    const settings = getAdminSettings();
    const enabledChannels =
      settings.paymentConfig?.enabledChannels && Array.isArray(settings.paymentConfig.enabledChannels)
        ? settings.paymentConfig.enabledChannels
        : DEFAULT_ENABLED_PAYMENT_CHANNELS;

    return NextResponse.json({
      success: true,
      enabledChannels,
      allChannels: AVAILABLE_PAYMENT_CHANNELS,
      environment: settings.paymentConfig?.environment || "sandbox",
      clientKey: settings.paymentConfig?.clientKey || "",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
