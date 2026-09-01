import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/admin/", "/readers/console", "/readers/console/"],
    },
    sitemap: "https://tarot.luminuy.com/sitemap.xml",
  };
}
