import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/api/",
          "/auth/",
          "/favorites",
          "/saved-searches",
        ],
      },
    ],
    sitemap: `${brand.url}/sitemap.xml`,
    host: brand.url,
  };
}
