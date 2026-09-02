import { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/tester",
          "/tester/",
          "/reset-password",
          "/reset-password/",
          "/readers/console",
          "/readers/console/",
        ],
      },
      {
        // ป้องกัน AI Scrapers ดูดข้อมูลคลังไพ่ 78 ใบและบทความไปเทรนโมเดลโดยไม่ได้รับอนุญาต
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "Google-Extended",
          "anthropic-ai",
          "Claude-Web",
          "Bytespider",
          "Diffbot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
