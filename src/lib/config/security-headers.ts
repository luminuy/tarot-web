/**
 * 🛡️ ส่วนหัวความปลอดภัยของทุกการตอบกลับที่เป็นหน้าเว็บ — แหล่งความจริงเดียว
 * ===========================================================================
 * ใช้สองที่ และ **ต้องตรงกันเสมอ**:
 *
 *   1. `next.config.ts` ➔ ใส่ให้ทุกคำตอบที่ออกจาก Worker (หน้าแอป · API)
 *   2. `public/_headers` ➔ ใส่ให้ไฟล์ static ที่ Cloudflare ตอบเองที่ขอบ
 *      (หน้าเนื้อหาที่เรนเดอร์ด้วย Astro **ไม่ผ่าน Worker เลย** จึงไม่ได้รับ
 *       ส่วนหัวจากข้อ 1 แม้แต่ตัวเดียว — ถ้าลืม เว็บครึ่งหนึ่งจะไม่มี CSP เงียบ ๆ)
 *
 * ด่าน `scripts/qa/test-static-headers.ts` เทียบสองที่นี้ให้อัตโนมัติทุกครั้ง
 */
export const SECURITY_HEADERS: { key: string; value: string }[] = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // ⚠️ โฮสต์ของ GA4 กับ Meta Pixel ต้องอยู่ใน allowlist ไม่งั้น CSP บล็อกเงียบ
      // `AnalyticsTracker` โหลด gtag จาก googletagmanager และ fbevents จาก connect.facebook.net
      // ก่อนหน้านี้ทั้งสองตัวถูกบล็อกทั้งหมด = ตั้ง NEXT_PUBLIC_GA_ID ไปก็ไม่มีข้อมูลเข้า GA เลย
      // และไม่มี field data ให้ PageSpeed/CrUX ใช้วัดผลการปรับ SEO ที่ทำไป
      // `static.cloudflareinsights.com` = beacon ของ Cloudflare Web Analytics ที่ Cloudflare
      // แทรกให้อัตโนมัติทุกหน้า (ISSUE-035) ของเดิมไม่มีในรายการนี้ CSP จึงบล็อกทิ้งทุกครั้ง
      // ➔ บริการเปิดอยู่แต่ไม่เคยเก็บข้อมูลได้เลยสักหน้าเดียว
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://connect.facebook.net https://static.cloudflareinsights.com",
      // next/font โฮสต์ฟอนต์เองในโดเมนเรา จึงไม่เคยเรียก fonts.googleapis.com / fonts.gstatic.com เลย
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://generativelanguage.googleapis.com https://api.groq.com https://ik.imagekit.io https://res.cloudinary.com https://challenges.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://pagead2.googlesyndication.com https://www.facebook.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
      // A4-05: โดเมนตามคู่มือ CSP ของ Google Tag — Google Signals ยิงไป *.analytics.google.com
      // และ Google Ads conversion ใช้ googleadservices/doubleclick/google.com + iframe td.doubleclick.net
      // ขาดตัวใดตัวหนึ่ง = ยอด GA4/conversion หายเงียบ เห็นแค่ใน console
      "frame-src 'self' https://challenges.cloudflare.com https://td.doubleclick.net https://www.googletagmanager.com",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];
