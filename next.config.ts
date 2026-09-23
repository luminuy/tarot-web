import type { NextConfig } from "next";

import { ALTERNATE_HOSTS, CANONICAL_ORIGIN } from "./src/lib/config/canonical-host";
import { SECURITY_HEADERS } from "./src/lib/config/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // การอ่านไพ่เป็น streaming ที่ใช้เวลานาน จึงต้องกันไม่ให้ถูกตัดกลางคัน
    proxyTimeout: 120_000,
    optimizePackageImports: ["motion", "motion/react", "zod"],
    // รองรับ root 404 เมื่อแอปแบ่ง layout เป็น route group (th)/(en) โดยไม่มี src/app/layout.tsx (แก้ ISSUE-051)
    globalNotFound: true,
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
       * 🌐 โฮสต์รอง (www.*) ➔ โดเมนหลัก ด้วย 301 — กันเนื้อหาซ้ำสองโฮสต์
       *
       * ทั้งสองโฮสต์ชี้มาที่ Worker ตัวเดียวกัน ถ้าไม่เด้งก็ตอบ 200 เหมือนกันทั้งคู่
       * `canonical` ช่วยบอก Google ไว้แล้วก็จริง แต่เป็นแค่ "คำแนะนำ" ไม่ใช่คำสั่ง
       * ลิงก์ที่คนอื่นแปะมาที่ www จึงกระจายน้ำหนัก SEO ออกไปอีกโฮสต์
       *
       * ⚠️ ต้องอยู่ **บนสุด** ของรายการ เพราะ Next.js ไล่กฎจากบนลงล่างแล้วหยุดที่ตัวแรกที่ตรง
       * รายชื่อโฮสต์อยู่ที่ `src/lib/config/canonical-host.ts` ที่เดียว (ชั้นขอบอ่านไฟล์เดียวกัน)
       */
      /**
       * 🔴 **กฎชุดนี้เป็นชั้นสำรอง ไม่ใช่ชั้นหลักอีกต่อไป** (INC-0203)
       *
       * ตั้งแต่หน้าเนื้อหาย้ายไป Astro หน้าเหล่านั้นถูก Cloudflare ตอบจากชั้น assets
       * **ก่อนถึง Worker** กฎใน `redirects()` จึงไม่ถูกเรียกเลยสำหรับหน้าเหล่านั้น
       * วัดจริงบน production 2026-09-21 ตอนที่มีแต่ชั้นนี้ชั้นเดียว:
       *
       *   https://www.seertarot.net/cards      ➔ 200 (เนื้อหาเต็ม · เว็บซ้ำสองโฮสต์)
       *   https://www.seertarot.net/robots.txt ➔ 301 (อยู่ใน `run_worker_first` จึงถึง Worker)
       *
       * ชั้นที่ครอบคลุมจริงคือ Single Redirect บนขอบ — ดัน/ตรวจด้วย
       * `npm run cf:canonical-host` (สคริปต์อ่านรายชื่อโฮสต์จากไฟล์เดียวกันนี้)
       * ชั้นนี้ยังเก็บไว้เพราะไม่เสียอะไร และรับหน้าที่ทันทีถ้ากฎบนขอบถูกลบ
       */
      ...ALTERNATE_HOSTS.flatMap((host) => [
        /**
         * 🐞 หน้าแรกต้องมีกฎของตัวเอง — `/:path*` ครอบไม่ถึง (วัดจริง 2026-09-09)
         *
         *   $ curl -sI https://www.seertarot.net/
         *   location: https://seertarot.net/:path*      ← ตัวอักษรดิบ ไม่ถูกแทนค่า → 404
         *
         * เมื่อ catch-all ที่เป็น optional จับได้ "ว่างเปล่า" Next.js ไม่ได้ลบโทเคน `:path*`
         * ออกจาก destination ที่เป็น URL เต็ม — จึงต้องแยกกฎของ `/` ไว้ **เหนือ** กฎล่าง
         */
        {
          source: "/",
          has: [{ type: "host" as const, value: host }],
          destination: `${CANONICAL_ORIGIN}/`,
          statusCode: 301,
        },
        {
          source: "/:path*",
          has: [{ type: "host" as const, value: host }],
          destination: `${CANONICAL_ORIGIN}/:path*`,
          // ใช้ 301 ตรง ๆ แทน `permanent: true` (ซึ่งให้ 308)
          // 308 ถูกต้องตามสเปกและ Google มองเท่ากัน แต่ 301 คือรหัสมาตรฐานของการย้ายโฮสต์
          // ที่เครื่องมือ SEO และบอตรุ่นเก่ารู้จักกันทั่วหน้า จึงไม่มีเหตุให้เสี่ยง
          statusCode: 301,
        },
      ]),
      // ⚠️ redirect ของ URL เก่า (บทความเปลี่ยน slug · /love · /tarot ฯลฯ) ย้ายไป `public/_redirects` แล้ว (A6-05)
      //    ที่นี่ไม่เคยทำงานบน production: เส้นที่ไม่ตรงไฟล์ static และไม่อยู่ใน `run_worker_first`
      //    ถูกขอบตอบ 404.html ทันที ไม่ถึง Worker · `_redirects` ของ Workers Assets ทำงานที่ขอบก่อน
      //    ห้ามเพิ่ม redirect แบบ path ที่นี่อีก — ด่าน test-worker-first-routes จะตก
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
      /*
       * 📄 T-21 — ถอด `no-store` ออกจากหน้าที่ Worker เรนเดอร์
       * ---------------------------------------------------------------------
       * `dynamic = "force-dynamic"` ทำให้ Next ตั้ง
       * `private, no-cache, no-store, max-age=0, must-revalidate` ให้เอง
       * และ **`no-store` บน HTML คือตัวตัด bfcache ขาดทั้งใน Chrome และ Safari**
       *
       * `/s/[id]` คือลิงก์แชร์ — หน้าที่คนเปิดเข้ามาแล้วกดย้อนกลับ ทุกครั้งที่กดย้อน
       * จึงเป็น Worker รอบเต็ม + hydrate ใหม่ แทนที่จะเป็นการคืนสภาพทันที
       */
      {
        source: "/s/:id",
        headers: [
          {
            key: "Cache-Control",
            /*
             * ⚠️ ทำไมไม่ใช่ `s-maxage` ตามที่ผลตรวจเสนอ
             * หน้านี้อ่านคุกกี้ `seertarot_lang` เพื่อเลือกภาษาให้ "คนที่เปิดลิงก์"
             * คำตอบจึงต่างกันตามคุกกี้ของผู้เปิด — แคชสาธารณะที่ขอบจะเสิร์ฟภาษาผิดข้ามคน
             * `private` + ไม่มี `no-store` ได้ bfcache กลับมาครบโดยไม่แลกกับความถูกต้อง
             * (ถ้าวันหนึ่งถอดการอ่านคุกกี้ออก ค่อยเปลี่ยนเป็น s-maxage ยาว ๆ ได้ทันที)
             */
            value: "private, max-age=0, must-revalidate",
          },
        ],
      },
      {
        // ไดเรกทอรีแม่หมอเป็นข้อมูลสาธารณะล้วน ไม่อ่านคุกกี้/เซสชันเลย → แคชที่ขอบได้จริง
        source: "/readers",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
          },
        ],
      },
      {
        source: "/readers/:id",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
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
