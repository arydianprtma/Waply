import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://waply.web.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/docs",
          "/order",
          "/status",
          "/privacy",
          "/terms",
          "/login",
          "/register",
          "/waply-icon.png",
          "/waply_brand_logo_mockup.png",
        ],
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
