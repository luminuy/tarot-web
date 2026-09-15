// @ts-check
import { fileURLToPath } from "node:url";

import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const resolve = (p) => fileURLToPath(new URL(p, import.meta.url));

/**
 * ✦ เครื่องเรนเดอร์ตัวที่สองของเว็บ — Astro สำหรับ "หน้าเนื้อหา"
 * ===========================================================================
 *
 * ทำไมต้องมีสองตัว
 * ---------------
 * หน้าเนื้อหา (ไพ่รายใบ · บทความ · ผัง) ไม่มีสถานะอะไรให้จำ ผู้ใช้แค่อ่าน
 * แต่ Next.js ส่ง React runtime + router + เพย์โหลด RSC มาให้ครบทุกหน้าเสมอ
 * วัดจริงบนบิลด์ production: หน้าไพ่รายใบส่ง JS 187 KB gzip และแท็ก <script> 20 ก้อน
 *
 * Astro เรนเดอร์คอมโพเนนต์ React ชุดเดียวกัน **เป็น HTML ตั้งแต่ตอนบิลด์**
 * แล้วส่ง JS เฉพาะชิ้นที่ต้องโต้ตอบจริง ๆ (island) — ชิ้นอื่นไม่ส่งเลยสักไบต์
 *
 * ⚠️ กติกาที่ห้ามพัง
 * ------------------
 * 1. `build.format: "file"` — ต้องได้ `cards/major-00.html` เหมือนที่ Next วางไว้เป๊ะ
 *    ด่านตรวจทุกด่านอ่านผลผ่าน `scripts/qa/lib/rendered-pages.ts` ซึ่งถอดชื่อเส้นทาง
 *    จากชื่อไฟล์ตรง ๆ — ถ้าเปลี่ยนเป็น `directory` เส้นทางจะกลายเป็น `/cards/major-00/index`
 *    แล้วด่านทั้งชุดจะมองไม่เห็นหน้าเหล่านี้ (ล้มเหลวแบบเงียบที่สุด)
 * 2. `publicDir` ชี้ไปโฟลเดอร์ว่างโดยตั้งใจ — ของสาธารณะจริง (ภาพไพ่ 1909 · ฟอนต์)
 *    อยู่ที่ `public/` ซึ่ง Next คัดลอกลง `.open-next/assets` ให้อยู่แล้ว
 *    ถ้าชี้มาที่ `public/` ตรง ๆ จะได้ภาพไพ่ซ้ำสองชุด (~90 MB) ในทุกบิลด์
 * 3. ห้ามใส่ adapter — เว็บนี้เสิร์ฟหน้าเนื้อหาเป็นไฟล์สแตติกจาก Cloudflare Assets
 *    ไม่ผ่าน Worker เลย (ไม่เสียค่าคำขอ และไม่ต้องบูต runtime)
 */
export default defineConfig({
  site: "https://seertarot.net",
  outDir: "./dist",
  srcDir: "./astro",
  publicDir: "./astro/public",
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file",
    // ไฟล์ JS/CSS ของ island อยู่ใต้ /_astro/** — คนละที่กับ /_next/** จึงไม่ชนกัน
    assets: "_astro",
  },
  devToolbar: { enabled: false },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": resolve("./src"),
        /*
         * 🔌 ชั้นแปลงปลั๊ก — คอมโพเนนต์ที่ใช้ร่วมกันทั้งเว็บนำเข้า `next/*` อยู่แล้ว
         * ตอนบิลด์ด้วย Astro ให้ชี้ไปที่ฉบับ MPA แทน (ดูเหตุผลเต็มในไฟล์ shim)
         * ⚠️ ห้ามแก้โค้ดใน `src/components/**` ให้เลิกใช้ `next/link` เพื่อการนี้
         *    ตราบใดที่ Next ยังเรนเดอร์หน้าแอปอยู่ ทั้งสองฝั่งต้องใช้ไฟล์เดียวกัน
         */
        "next/link": resolve("./astro/shims/next-link.tsx"),
        "next/navigation": resolve("./astro/shims/next-navigation.ts"),
        "next/script": resolve("./astro/shims/next-script.tsx"),
        "next/dynamic": resolve("./astro/shims/next-dynamic.tsx"),
      },
    },
    define: {
      /* `process.env.*` ไม่มีอยู่จริงในเบราว์เซอร์ — Next แทนค่าให้ตอนบิลด์
         Astro ต้องแทนให้เหมือนกัน ไม่งั้น island ล้มด้วย "process is not defined" */
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
      "process.env.NEXT_PUBLIC_GA_ID": JSON.stringify(process.env.NEXT_PUBLIC_GA_ID ?? ""),
      "process.env.NEXT_PUBLIC_META_PIXEL_ID": JSON.stringify(process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ""),
      "process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT": JSON.stringify(
        process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "",
      ),
      "process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME": JSON.stringify(
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
      ),
    },
  },
});
