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
          "/readers/queue/",
        ],
      },
      {
        // ป้องกัน AI Scrapers ดูดข้อมูลคลังไพ่ 78 ใบและบทความไปเทรนโมเดลโดยไม่ได้รับอนุญาต
        //
        // ⚠️ ชื่อ user-agent ต้องตรงกับที่ผู้ให้บริการประกาศจริง ไม่งั้นบล็อกไม่ติดเลย
        // ของเดิมใช้ `anthropic-ai` และ `Claude-Web` ซึ่งเป็นชื่อรุ่นเก่าที่เลิกใช้แล้ว
        // ปัจจุบันคือ ClaudeBot (เทรน) · Claude-SearchBot / Claude-User (ค้นหาแทนผู้ใช้)
        //
        // 💡 ข้อพิจารณาเชิงธุรกิจ (เจ้าของโปรเจกต์ตัดสินใจ — ดู KNOWN_ISSUES ISSUE-017):
        // บอตกลุ่ม "ค้นหา" (OAI-SearchBot, Claude-SearchBot, PerplexityBot) ไม่ได้เอาไปเทรน
        // แต่เป็นตัวที่ทำให้เว็บถูกอ้างอิงและมีคนคลิกเข้ามาจาก ChatGPT / Claude / Perplexity
        // ตอนนี้เลือก "ปิดทั้งหมด" ตามนโยบายเดิม — ถ้าอยากได้ทราฟฟิกจาก AI search
        // ให้ย้าย 3 ตัวนั้นออกมาเป็นกฎ allow แยกต่างหาก
        userAgent: [
          // กลุ่มเก็บข้อมูลไปเทรนโมเดล
          "GPTBot",
          "ClaudeBot",
          "CCBot",
          "Google-Extended",
          "Applebot-Extended",
          "Bytespider",
          "Amazonbot",
          "meta-externalagent",
          "Diffbot",
          // กลุ่มดึงหน้าเว็บแทนผู้ใช้ / ป้อน AI search
          "ChatGPT-User",
          "OAI-SearchBot",
          "Claude-User",
          "Claude-SearchBot",
          "PerplexityBot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
