import type { Metadata, Viewport } from "next";

import { buildAlternates, OG_IMAGE_ALT, OG_IMAGE_URL } from "@/lib/config/site";

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

/**
 * title ของหน้าที่ **ไม่ได้ประกาศ title ของตัวเอง** (ตอนนี้มีหน้าเดียวคือหน้าแรก)
 *
 * ⚠️ ค่านี้ไม่ผ่านแม่แบบ `TITLE_TEMPLATE` — Next ใช้ `title.default` ตรง ๆ
 *    ถ้าเผลอต่อ " · SeerTarot" ให้อีกรอบ จะกลายเป็นชื่อแบรนด์ซ้ำสองครั้งในหน้าเดียว
 *    (ด่าน `test-meta-length` มีข้อตรวจ "ชื่อแบรนด์ซ้ำสองรอบใน title" ไว้แล้ว)
 */
export const ROOT_TITLE_DEFAULT: Record<"th" | "en", string> = {
  th: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI",
  en: "Free Online Tarot Reading With an AI Tarot Reader",
};

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
 * 📄 คำอธิบายและ canonical/hreflang ระดับราก
 *
 * ⚠️ Next ให้หน้าย่อยที่ไม่ได้ประกาศเองสืบทอดสองช่องนี้ไปด้วย — หน้าเดียวในเว็บที่เข้าข่าย
 *    คือห้องแชท (`/reading/chat`) ซึ่งประกาศแค่ `title` กับ `robots: noindex`
 * ⚠️ ข้อความทั้งสองชุดต้อง **คัดลอกมาจาก root layout เดิมแบบเป๊ะทุกตัวอักษร** ห้ามเขียนใหม่เอง
 *    (รอบแรกเผลอเขียนข้อความอังกฤษขึ้นเองแล้วมันยาวเกินเพดาน SERP จน CI ตก — ดู INC ล่าสุด)
 *
 *    ถ้าไม่ผสานให้เหมือนกัน หน้านั้นจะไม่มี `description` และ `canonical` เลย
 *    (หน้า noindex อยู่แล้วก็จริง แต่ "เหมือนเดิมเป๊ะ" สำคัญกว่าความเห็นของเราตอนย้ายบ้าน
 *     ถ้าจะแก้ให้ดีขึ้นกว่าเดิม ให้แก้เป็นงานแยกที่ตั้งใจ ไม่ใช่ผลข้างเคียงของการย้าย)
 */
export const ROOT_DESCRIPTION: Record<"th" | "en", string> = {
  th: "ดูดวงไพ่ยิปซี (ไพ่ทาโรต์) ออนไลน์ฟรี สับไพ่และหยิบไพ่ด้วยมือคุณเอง 78 ใบ ให้แม่หมอ AI ทำนายสดทีละใบ มีผัง 26 แบบ ทั้งรายวัน ความรัก การงาน การเงิน",
  en: "Free online tarot reading with the original 1909 Rider-Waite deck. Shuffle and draw all 78 cards yourself, then read a live AI interpretation.",
};

export const ROOT_ALTERNATES: Record<"th" | "en", Metadata["alternates"]> = {
  th: buildAlternates("/", { locale: "th", englishTwin: true }),
  en: buildAlternates("/", { locale: "en", englishTwin: true }),
};

/**
 * 🖼️ Open Graph / Twitter ระดับรากของแต่ละภาษา
 *
 * ⚠️ Next ให้หน้าย่อยที่ **ไม่ได้ประกาศ `openGraph` ของตัวเอง** สืบทอดชุดนี้ไปทั้งก้อน
 *    (ถ้าหน้าย่อยประกาศเอง จะ **แทนที่ทั้งก้อน** ไม่ผสานทีละฟิลด์ — ดู `buildAlternates` ใน site.ts)
 *    `BaseLayout.astro` จึงต้องผสานแบบ "ทั้งก้อน" เหมือนกันเป๊ะ
 *    ถ้าลืม หน้าอย่าง `/reading/chat` ที่ไม่ได้ประกาศเองจะ **ไม่มีภาพแชร์เลย**
 *    (เจอจริงตอนย้ายห้องแชท — ด่าน `test-og-images` จับได้)
 */
export const ROOT_OPEN_GRAPH: Record<"th" | "en", Metadata["openGraph"]> = {
  th: {
    type: "website",
    locale: "th_TH",
    siteName: "SeerTarot",
    title: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI",
    description:
      "สับไพ่และเลือกหยิบไพ่ 78 ใบด้วยมือคุณเอง ให้แม่หมอ AI พยากรณ์ลึกซึ้งทีละใบ พร้อมหลักฐานความโปร่งใส Provably-Fair",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
  en: {
    type: "website",
    locale: "en_US",
    siteName: "SeerTarot",
    title: "Free Online Tarot Reading · Shuffle & Draw With an AI Tarot Reader",
    description:
      "Shuffle and draw all 78 Rider-Waite cards with your own hand, then read a live card-by-card interpretation — provably fair with SHA-256.",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
};

export const ROOT_TWITTER: Record<"th" | "en", Metadata["twitter"]> = {
  th: {
    card: "summary_large_image",
    title: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI",
    description: "ดูดวงไพ่ทาโรต์ออนไลน์ สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง พร้อมระบบ Provably-Fair",
    images: [OG_IMAGE_URL],
  },
  en: {
    card: "summary_large_image",
    title: "Free Online Tarot Reading · Shuffle & Draw With an AI Tarot Reader",
    description: "Draw all 78 Rider-Waite cards yourself and read a live, provably fair interpretation.",
    images: [OG_IMAGE_URL],
  },
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

/**
 * ฟอนต์ที่ทุกหน้าพรีโหลด — ต้องเป็นชุดย่อยของ `@font-face` ใน `globals.css`
 *
 * 🔴 บทเรียน T-22: ของเดิมพรีโหลดครบทั้ง 4 ไฟล์ (รวม 67,828 B) ทุกหน้า
 * ทั้งสี่ถูกขอด้วยลำดับความสำคัญสูงสุด **ก่อนภาพทุกใบ** บนการเชื่อมต่อที่ต้องโหลด
 * สไตล์ชีต 22 KB พร้อมกันด้วย — เป็นการแย่งแบนด์วิดท์กับภาพที่เป็น LCP จริง
 *
 * ตอนนี้เหลือเฉพาะน้ำหนักปกติของทั้งสองตระกูล ซึ่งครอบ "เนื้อความ" ที่กินพื้นที่
 * มากที่สุดในทุกหน้า · น้ำหนักหนา (700/600) ใช้กับหัวข้อซึ่งมีพื้นที่น้อยกว่ามาก
 *
 * ⚠️ ปลอดภัยจาก CLS เพราะ `globals.css` ประกาศฟอนต์สำรองที่ชดเชยเมตริกไว้แล้ว
 * (`ascent-override` · `descent-override` · `size-adjust` คัดลอกมาจาก next/font)
 * คู่กับ `font-display: swap` — การสลับฟอนต์จึงไม่ขยับ layout แม้แต่พิกเซลเดียว
 * ถ้าวันหนึ่งวัดแล้วหัวข้อกระพริบจนน่ารำคาญ ให้เติมสองไฟล์ที่เหลือกลับเข้ามาได้ทันที
 */
export const FONT_PRELOADS = [
  "/fonts/noto-serif-thai-400.woff2",
  "/fonts/sarabun-400.woff2",
] as const;
