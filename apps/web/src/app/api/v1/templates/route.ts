import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getTemplates } from "@/lib/templates";

export async function GET(request: Request) {
  try {
    const auth = await authenticateApiRequest(request);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: auth.status || 401 }
      );
    }

    const templates = getTemplates(auth.user.id);
    return NextResponse.json({
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        name: t.name,
        shortcode: t.shortcode,
        category: t.category,
        content: t.content,
        variables: t.variables,
        usageCount: t.usageCount,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
