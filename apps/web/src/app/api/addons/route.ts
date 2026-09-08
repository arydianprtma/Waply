import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-user";
import { getAllAddons, getUserAddons, getUserAddonTotals } from "@/lib/addons";

export async function GET() {
  try {
    const all = getAllAddons();
    const activeCatalog = Object.values(all).filter((a) => a.isActive);

    let userAddons: any[] = [];
    let totals = { extraDevices: 0, extraMessages: 0 };

    try {
      const user = await getAuthUser();
      if (user && user.id) {
        userAddons = getUserAddons(user.id);
        const t = getUserAddonTotals(user.id);
        totals = { extraDevices: t.extraDevices, extraMessages: t.extraMessages };
      }
    } catch {
      // User not logged in
    }

    return NextResponse.json({
      success: true,
      data: {
        catalog: activeCatalog,
        userAddons,
        totals,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
