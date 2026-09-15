import type { NextConfig } from "next";

import { SECURITY_HEADERS } from "./src/lib/config/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // การอ่านไพ่เป็น streaming ที่ใช้เวลานาน จึงต้องกันไม่ให้ถูกตัดกลางคัน
    proxyTimeout: 120_000,
    optimizePackageImports: ["motion", "motion/react", "zod"],
    /*
     * 🚫 อย่าเปิด `inlineCss: true` — **วัดแล้วแย่ลง อย่าเชื่อคำแนะนำทั่วไป** (2026-09-14)
     *
     * Lighthouse ขึ้นข้อความ "Render-blocking requests · Est savings of 250 ms" ชี้ไปที่
     * `<link rel="stylesheet">` สองไฟล์ ทางแก้ที่ทุกคู่มือแนะนำคือฝัง CSS ลง HTML
     * ลองแล้ววัดจริงบนบิลด์ production ด้วย Lighthouse ตัวเต็ม:
     *
     *   |            | ก่อน | เปิด inlineCss |
     *   | คะแนนรวม    |  74  | **68**        |
     *   | FCP (จำลอง) | 1326 | **1575**      |
     *
     * เหตุผล: เมื่อ CSS แยกไฟล์ ตัวสแกนล่วงหน้าของเบราว์เซอร์เห็น `<link>` ตั้งแต่ต้น HTML
     * แล้วดึง CSS **ขนานไป**กับที่ HTML ยังสตรีมอยู่ · พอฝังลงไป HTML โตขึ้นราว 20 KB gzip
     * และเบราว์เซอร์ต้องรอ **ทั้งก้อน**มาถึงก่อนจึงวาดได้ บนเน็ตจำลอง 1.6 Mbps
     * ไบต์ที่เพิ่มมาแพงกว่ารอบเครือข่ายที่ประหยัดได้
     *
     * ⚠️ ถ้าจะลองอีกครั้งในอนาคต ต้องยิง Lighthouse เทียบก่อน/หลังเสมอ ห้ามเปิดทิ้งไว้
     *    เพราะ "Est savings" ในรายงานบอกแค่ด้านที่ประหยัด ไม่ได้หักต้นทุนที่จ่ายเพิ่ม
     */
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  webpack: (config) => {
    config.output = config.output || {};
    config.output.hashFunction = "sha256";
    return config;
  },
  async redirects() {
    return [
      /**
       * 🌐 www.seertarot.net ➔ seertarot.net (301) — กันเนื้อหาซ้ำสองโฮสต์
       *
       * ทั้งสองโฮสต์ชี้มาที่ Worker ตัวเดียวกัน ของเดิมจึงตอบ 200 เหมือนกันทั้งคู่
       * `canonical` ช่วยบอก Google ไว้แล้วก็จริง แต่เป็นแค่ "คำแนะนำ" ไม่ใช่คำสั่ง
       * ลิงก์ที่คนอื่นแปะมาที่ www จึงกระจายน้ำหนัก SEO ออกไปอีกโฮสต์
       *
       * ⚠️ ต้องอยู่ **บนสุด** ของรายการ เพราะ Next.js ไล่กฎจากบนลงล่างแล้วหยุดที่ตัวแรกที่ตรง
       *
       * 💡 ทางที่ถูกกว่านี้: ตั้ง Redirect Rule บน Cloudflare (เด้งที่ขอบ ไม่ต้องปลุก Worker เลย)
       *    แต่ต้องใช้สิทธิ์ dashboard ของเจ้าของ — กฎนี้จึงทำหน้าที่แทนไปก่อนและอยู่ร่วมกันได้
       *    ถ้าวันหนึ่งตั้ง Redirect Rule แล้ว คำขอจะถูกเด้งตั้งแต่ขอบ กฎนี้จะไม่ถูกเรียกเอง
       */
      /**
       * 🐞 หน้าแรกของ www ต้องมีกฎของตัวเอง — `/:path*` ครอบไม่ถึง (วัดจริง 2026-09-09)
       *
       *   $ curl -sI https://www.seertarot.net/
       *   location: https://seertarot.net/:path*      ← ตัวอักษรดิบ ไม่ถูกแทนค่า → 404
       *   $ curl -sI https://www.seertarot.net/cards
       *   location: https://seertarot.net/cards        ← path ที่มีค่าจริงถูกต้องอยู่แล้ว
       *
       * เมื่อ catch-all ที่เป็น optional จับได้ "ว่างเปล่า" Next.js ไม่ได้ลบโทเคน `:path*`
       * ออกจาก destination ที่เป็น URL เต็ม — หน้าแรกซึ่งเป็น URL ที่คนแปะลิงก์มามากที่สุด
       * จึงเด้งไปหน้า 404 มาตั้งแต่วันที่วางกฎ www
       *
       * ⚠️ ต้องอยู่ **เหนือ** กฎ `/:path*` ด้านล่าง เพราะ Next.js หยุดที่กฎแรกที่ตรง
       */
      {
        source: "/",
        has: [{ type: "host", value: "www.seertarot.net" }],
        destination: "https://seertarot.net/",
        statusCode: 301,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.seertarot.net" }],
        destination: "https://seertarot.net/:path*",
        // ใช้ 301 ตรง ๆ แทน `permanent: true` (ซึ่งให้ 308)
        // 308 ถูกต้องตามสเปกและ Google มองเท่ากัน แต่ 301 คือรหัสมาตรฐานของการย้ายโฮสต์
        // ที่เครื่องมือ SEO และบอตรุ่นเก่ารู้จักกันทั่วหน้า จึงไม่มีเหตุให้เสี่ยง
        statusCode: 301,
      },
      {
        source: "/blog/celtic-cross-spread-deep-dive",
        destination: "/blog/celtic-cross-spread-guide",
        permanent: true,
      },
      {
        source: "/blog/jungian-psychology-and-tarot",
        destination: "/blog/tarot-and-carl-jung-psychology",
        permanent: true,
      },
      {
        source: "/tarot-daily",
        destination: "/daily",
        permanent: true,
      },
      {
        source: "/daily-tarot",
        destination: "/daily",
        permanent: true,
      },
      {
        source: "/tarot-love",
        destination: "/love/1-card",
        permanent: true,
      },
      {
        source: "/love",
        destination: "/love/1-card",
        permanent: true,
      },
      {
        source: "/love-tarot",
        destination: "/love/1-card",
        permanent: true,
      },
      {
        source: "/tarot",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, OPTIONS",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
      {
        source: "/llms.txt",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, OPTIONS",
          },
          {
            key: "Content-Type",
            value: "text/plain; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, OPTIONS",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
