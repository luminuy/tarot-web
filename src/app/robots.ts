import { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/config/site";

/**
 * เส้นทางที่ห้ามบอตทุกตัวคลาน — เหลือแค่ API
 * ⚠️ ต้องใช้ชุดเดียวกันทั้งกฎของบอตทั่วไปและกฎของบอต AI search
 *
 * A6-06: หน้าส่วนตัว (/account · /admin · /tester · /reset-password · /readers/console · /readers/queue)
 * **ห้ามใส่ Disallow** — ทุกหน้าประกาศ `noindex` ในตัวอยู่แล้ว (ด่าน test-code-debt ข้อ 13 ตรวจ)
 * ถ้าบล็อกการคลาน บอตจะไม่เคยเห็น noindex แล้ว URL ที่มีลิงก์เข้า (/account อยู่ในหัวเว็บทุกหน้า)
 * จะโผล่ใน Google แบบ "Indexed, though blocked by robots.txt" ไม่มีคำอธิบาย
 * หน้าเหล่านี้ต้องล็อกอินหรือโทเคนอยู่แล้ว บอตคลานเข้าไปก็เห็นแค่เปลือกหน้า
 */
const PRIVATE_PATHS = ["/api/"];

/**
 * A7-06: ภาพการ์ดคำทำนายที่ผู้ใช้กดแชร์ (`og:image` ของหน้า `/s/<id>`) เสิร์ฟจาก `/api/share/image/…`
 * บอตแชร์ (X/Twitterbot ฯลฯ) ตรวจ robots กับ URL ภาพด้วย — ต้องเปิดเส้นนี้เส้นเดียวให้ชนะ `Disallow: /api/`
 * (กฎที่เจาะจงกว่า = path ยาวกว่าชนะ ตาม RFC 9309) · ใช้ทั้งบล็อกบอตทั่วไปและบล็อกบอต AI search
 */
const PUBLIC_API_PATHS = ["/api/share/image/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", ...PUBLIC_API_PATHS],
        disallow: PRIVATE_PATHS,
      },
      {
        /**
         * ✅ บอต "ค้นหา" ของ AI — เปิดให้คลานได้ (ตัดสินใจโดยเจ้าของโปรเจกต์ 2026-09-04)
         *
         * บอตกลุ่มนี้ **ไม่ได้เก็บเนื้อหาไปเทรนโมเดล** แต่ทำหน้าที่เดียวกับ Googlebot
         * คืออ่านหน้าเว็บเพื่อเอาไปตอบพร้อม **อ้างอิงลิงก์กลับมาหาเรา**
         * ปิดไว้ = หายไปจากผลค้นหาของ ChatGPT / Claude / Perplexity ทั้งหมด
         *
         * เหตุผลเชิงธุรกิจ: ทราฟฟิกจาก AI search สำคัญกว่าการหวงเนื้อหา
         * (เนื้อหาที่เราหวงก็ยังถูกคนคัดลอกด้วยมือได้อยู่ดี แต่ทราฟฟิกที่เสียไปไม่ได้คืน)
         *
         * ⚠️ ต้องระบุ `disallow` ซ้ำที่นี่ด้วย — กฎของ robots.txt ใช้เฉพาะบล็อกที่ตรงกับ
         * user-agent นั้นที่สุด บอตพวกนี้จะ **ไม่อ่าน** บล็อก `User-agent: *` ด้านบนเลย
         */
        userAgent: [
          "OAI-SearchBot", // ChatGPT Search (OpenAI)
          "ChatGPT-User", // ChatGPT ดึงหน้าเว็บตามที่ผู้ใช้สั่ง
          "Claude-SearchBot", // Claude Search (Anthropic)
          "Claude-User", // Claude ดึงหน้าเว็บตามที่ผู้ใช้สั่ง
          "PerplexityBot", // Perplexity
        ],
        allow: ["/", ...PUBLIC_API_PATHS],
        disallow: PRIVATE_PATHS,
      },
      {
        /**
         * ⛔ บอตกลุ่ม "เก็บไปเทรนโมเดล" — ยังปิดไว้เหมือนเดิม
         *
         * ต่างจากกลุ่มด้านบนตรงที่ **ไม่มีลิงก์กลับ ไม่มีการอ้างอิง ไม่มีทราฟฟิกคืนมาเลย**
         * เอาคลังไพ่ 78 ใบและบทความทั้งหมดไปอย่างเดียว จึงไม่มีเหตุผลทางธุรกิจให้เปิด
         *
         * ⚠️ ชื่อ user-agent ต้องตรงกับที่ผู้ให้บริการประกาศจริง ไม่งั้นบล็อกไม่ติดเลย
         * ของเดิมเคยใช้ `anthropic-ai` และ `Claude-Web` ซึ่งเลิกใช้ไปแล้วทั้งคู่ (บล็อกไม่ติดจริง)
         *
         * 📌 หมายเหตุ: Cloudflare แทรกบล็อก Managed Content Signals ไว้หัวไฟล์ robots.txt
         * ให้เองอีกชั้น (`ai-train=no`) ถ้าจะเปลี่ยนนโยบายข้อนี้ต้องแก้ที่ Cloudflare dashboard ด้วย
         */
        userAgent: [
          "GPTBot", // OpenAI — เทรนโมเดล
          "ClaudeBot", // Anthropic — เทรนโมเดล
          "CCBot", // Common Crawl — คลังข้อมูลตั้งต้นของโมเดลจำนวนมาก
          "Google-Extended", // Gemini (ไม่กระทบการ index ของ Google Search)
          "Applebot-Extended", // Apple Intelligence
          "Bytespider", // ByteDance
          "Amazonbot", // Amazon
          "meta-externalagent", // Meta
          "Diffbot",
        ],
        disallow: ["/"],
      },
    ],
    // sitemap หลัก (หน้าคงที่ทั้งหมด) + sitemap โปรไฟล์แม่หมอที่อ่านจาก D1 สด (`src/app/(th)/readers/sitemap.ts` · A7-04)
    sitemap: [`${SITE_ORIGIN}/sitemap.xml`, `${SITE_ORIGIN}/readers/sitemap.xml`],
    host: SITE_ORIGIN,
  };
}
