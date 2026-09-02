import { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/admin/", "/readers/console", "/readers/console/"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
