import type { Metadata, Viewport } from "next";

/**
 * 🏷️ metadata ระดับรากที่ "จริงกับทุกหน้าในเว็บ" — แหล่งความจริงเดียว
 * ===========================================================================
 * ใช้ร่วมกันสามที่: root layout ไทย · root layout อังกฤษ · `astro/layouts/BaseLayout.astro`
 *
 * ทำไมต้องแยกออกมา
 * ---------------
 * ตั้งแต่หน้าเนื้อหาย้ายไปเรนเดอร์ด้วย Astro ค่าพวกนี้ต้องถูกเขียนออกมาโดยเครื่องมือ
 * **สองตัว** ถ้าปล่อยให้แต่ละที่ประกาศเอง วันหนึ่งจะเพี้ยนกันโดยไม่มีใครรู้
 * (เช่น เว็บครึ่งหนึ่งมี `max-image-preview:large` อีกครึ่งไม่มี — Google จะเห็น
 *  สองมาตรฐานในเว็บเดียวกันโดยที่ไม่มีด่านไหนจับได้เลย)
 *
 * ⚠️ ห้ามใส่ของที่ "จริงเฉพาะบางหน้า" ลงในไฟล์นี้ (เช่น `title` · `openGraph` ของหน้า)
 */

/** ต่อท้ายทุก title ของหน้าย่อย — `astro/lib/metadata.ts` ใช้ค่าเดียวกันนี้ */
export const TITLE_TEMPLATE = "%s · SeerTarot";

export const SITE_AUTHORS: Metadata["authors"] = [{ name: "SeerTarot Sanctuary" }];
export const SITE_CREATOR = "SeerTarot Sanctuary";
export const SITE_PUBLISHER = "SeerTarot Sanctuary";

export const SITE_ICONS: Metadata["icons"] = {
  icon: [
    { url: "/icon.svg", type: "image/svg+xml" },
    { url: "/favicon.ico", sizes: "any" },
  ],
  apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
};

export const SITE_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};


/**
 * 🔑 คำค้นระดับรากของแต่ละภาษา — หน้าย่อยที่ไม่ประกาศ `keywords` ของตัวเองจะได้ชุดนี้
 *
 * ⚠️ Next ผสาน `keywords` จาก root layout ให้หน้าย่อยโดยอัตโนมัติ
 *    `BaseLayout.astro` จึงต้องผสานให้เหมือนกัน ไม่งั้นหน้าที่ย้ายมา Astro
 *    จะ **หายไปหนึ่งแท็กเทียบกับตอนอยู่กับ Next** โดยไม่มีใครเห็น
 *    (เจอจริงตอนย้าย `/spreads` และ `/spreads/topic/*` — จับได้ด้วยการ diff กับบิลด์เดิม)
 */
export const ROOT_KEYWORDS: Record<"th" | "en", string[]> = {
  th: [
    "ดูดวงไพ่ยิปซี",
    "ไพ่ยิปซี",
    "เปิดไพ่ยิปซี",
    "ดูดวงไพ่ยิปซีฟรี",
    "ไพ่ยิปซีรายวัน",
    "ไพ่ยิปซีรายเดือน",
    "ไพ่ยิปซีความรัก",
    "ดูดวงไพ่ทาโรต์",
    "ไพ่ทาโรต์",
    "ความหมายไพ่ยิปซี 78 ใบ",
    "แม่หมอ AI",
    "SeerTarot",
  ],
  en: [
    "free tarot reading",
    "online tarot",
    "tarot card meanings",
    "rider waite tarot",
    "AI tarot reader",
    "tarot spreads",
    "daily tarot",
    "love tarot reading",
    "78 tarot cards",
    "SeerTarot",
  ],
};

/**
 * ช่องที่ root layout ทั้งสองภาษาประกาศเหมือนกันทุกตัว — หน้าย่อยทับได้ทีละช่องตามปกติ
 * (Next ผสาน metadata ของ layout กับของหน้าแบบทีละฟิลด์ · `BaseLayout.astro` ทำแบบเดียวกัน)
 */
export const ROOT_SHARED_METADATA: Metadata = {
  authors: SITE_AUTHORS,
  creator: SITE_CREATOR,
  publisher: SITE_PUBLISHER,
  robots: SITE_ROBOTS,
};

/** โค้ดยืนยันความเป็นเจ้าของใน Google Search Console (ประกาศเฉพาะต้นไม้ไทยตามเดิม) */
export const GOOGLE_SITE_VERIFICATION = "google2c921e9d8c8c3a55";

export const SITE_THEME_COLOR = "#FAF7F2";

export const SITE_VIEWPORT: Viewport = {
  themeColor: SITE_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

/** ข้อความ `content` ของ `<meta name="viewport">` ที่ Next เขียนออกมาจาก `SITE_VIEWPORT` */
export const VIEWPORT_CONTENT =
  "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover";

/** ฟอนต์ที่ทุกหน้าต้องพรีโหลด — ต้องตรงกับ `@font-face` ใน `globals.css` */
export const FONT_PRELOADS = [
  "/fonts/noto-serif-thai-400.woff2",
  "/fonts/noto-serif-thai-700.woff2",
  "/fonts/sarabun-400.woff2",
  "/fonts/sarabun-600.woff2",
] as const;
