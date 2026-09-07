import type { Locale } from "@/lib/i18n/types";

/**
 * 🌐 โดเมนหลักของเว็บ — แหล่งความจริงเดียว (Single Source of Truth)
 * ---------------------------------------------------------------------------
 * บทเรียน: ก่อนหน้านี้โดเมนถูกฮาร์ดโค้ดกระจายอยู่ 9 ไฟล์ (metadata, sitemap, robots,
 * allowlist ความปลอดภัย, อีเมล, ลิงก์แชร์) พอเปลี่ยนโดเมนจริงต้องไล่แก้ทีละจุด
 * และมีโอกาสตกหล่นจนลิงก์ในอีเมล/OAuth ชี้ผิดโดเมน
 *
 * ⚠️ เปลี่ยนโดเมนในอนาคต → แก้ `SITE_DOMAIN` ที่ไฟล์นี้ที่เดียว
 *
 * หมายเหตุเรื่อง `APP_ORIGIN`:
 * ค่าคงที่ในไฟล์นี้ถูกฝังตอน build (metadata / sitemap / robots ต้องใช้ตั้งแต่ตอน build)
 * ส่วนการประกอบลิงก์ตอน runtime (อีเมลยืนยัน, ตั้งรหัสผ่านใหม่, OAuth redirect_uri)
 * จะให้ secret `APP_ORIGIN` ทับได้เสมอ — ดู `src/lib/security/app-origin.ts`
 */

/** โดเมนหลักที่ผูกกับ Cloudflare Workers (custom domain) */
export const SITE_DOMAIN = "seertarot.net";

/** origin เต็มรูปแบบ เช่น `https://seertarot.net` */
export const SITE_ORIGIN = `https://${SITE_DOMAIN}` as const;

/**
 * 🖼️ ภาพพรีวิวตอนแชร์ลิงก์ (Open Graph / Twitter Card) — 1200×630 (~1.91:1)
 * ⚠️ ห้ามชี้ไปที่ภาพไพ่ใน `/cards/` เด็ดขาด ภาพไพ่เป็นแนวตั้ง 825×1429
 * Facebook / LINE / X จะครอบตัดกลางภาพจนอ่านไม่ออกทุกครั้งที่มีคนแชร์
 * สร้างไฟล์ใหม่ได้ด้วย `npm run og:image` (scripts/generate-og-image.py)
 * ทุกหน้าที่ประกาศ `openGraph` ของตัวเองต้องใส่ `images` ด้วยเสมอ —
 * Next.js **แทนที่** อ็อบเจกต์ openGraph ทั้งก้อน ไม่ได้ผสานทีละฟิลด์
 */
/**
 * ☁️ ชื่อคลาวด์ Cloudinary — ค่าเริ่มต้นที่ฝังไว้ในโค้ด (ไม่ใช่ความลับ)
 * ---------------------------------------------------------------------------
 * ⚠️ บทเรียน INC (ภาพแชร์ 299 หน้าตายเงียบ):
 * `NEXT_PUBLIC_*` ถูกฝังตอน `next build` เท่านั้น ค่าใน `wrangler.jsonc` เป็น var
 * ของ Worker ตอน **runtime** จึงไม่ถึงขั้น build เลย · ผลคือ CI build โดยไม่มีค่านี้
 * แล้ว `buildCloudinaryShareImageUrl()` คืน null → ทุกหน้าถอยไป `og/default.png`
 * เหมือนกันหมด 309 หน้า ทั้ง ๆ ที่ระบบประกอบภาพทำงานได้สมบูรณ์
 *
 * cloud name ไม่ใช่ความลับ — มันโผล่อยู่ใน URL ภาพทุกใบที่ส่งให้เบราว์เซอร์อยู่แล้ว
 * (`https://res.cloudinary.com/<cloud name>/...`) และถูก commit ไว้ใน `wrangler.jsonc`
 * มาก่อนแล้ว · ฝังเป็นค่าเริ่มต้นตรงนี้เพื่อไม่ให้ระบบภาพแชร์ตายเงียบอีกเมื่อลืมตั้ง env
 * ที่ใดที่หนึ่ง · ยัง override ด้วย `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` ได้ตามเดิม
 */
export const DEFAULT_CLOUDINARY_CLOUD_NAME = "xtgpasdc" as const;

export const OG_IMAGE_URL = `${SITE_ORIGIN}/og/default.png` as const;
export const OG_IMAGE_ALT = "SeerTarot · ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite";

/**
 * @public (D-02)
 * บล็อก `openGraph.images` / `twitter.images` มาตรฐาน ใช้ซ้ำได้ทุกหน้า
 * Exported for standard OG image block metadata across static and dynamic pages.
 */
export const OG_IMAGE_BLOCK = [
  { url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT },
] as const;


/** ชื่อเว็บสำหรับข้อความ/ลายน้ำ/ไฟล์ส่งออกข้อมูล */
export const SITE_NAME_TH = "วิหารพยากรณ์ไพ่ทาโรต์";

/** อีเมลผู้ส่งเริ่มต้น (ทับได้ด้วย env `EMAIL_FROM` เมื่อ verify โดเมนกับผู้ให้บริการอีเมลแล้ว) */
export const DEFAULT_EMAIL_FROM = `แม่หมอทาโรต์ <noreply@${SITE_DOMAIN}>`;

/**
 * อีเมลรับเรื่อง — ใช้เป็น `Reply-To` ของอีเมลระบบทุกฉบับ เพื่อให้ผู้ใช้กด "ตอบกลับ"
 * จาก noreply แล้วมีปลายทางจริง · ต้องตั้ง Cloudflare Email Routing forward เข้ากล่องจริง
 * (ดู `docs/plans/CLOUDFLARE_FREE_STACK.md` §Wave 1-2) · ทับได้ด้วย env `SUPPORT_EMAIL`
 */
export const DEFAULT_SUPPORT_EMAIL = `support@${SITE_DOMAIN}`;

/**
 * host ที่ถือว่าเป็น "เว็บเรา" — ใช้ทั้ง allowlist กันปลอม host และกันดูดเนื้อหา
 * รวม `www.` และโดเมน preview ของ Cloudflare (`*.workers.dev`) กับเครื่อง dev
 */
export const SITE_HOSTS: readonly string[] = [
  SITE_DOMAIN,
  `www.${SITE_DOMAIN}`,
  "localhost:3000",
  "127.0.0.1:3000",
];

/** true ถ้า hostname (ไม่รวมพอร์ต) เป็นของเว็บเราเอง */
export function isOwnHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === SITE_DOMAIN ||
    hostname.endsWith(`.${SITE_DOMAIN}`) ||
    hostname.endsWith(".workers.dev")
  );
}

/**
 * 🔗 ตัวช่วยสร้าง Canonical และ Hreflang สำหรับทุกหน้า (SEO Single Source of Truth)
 * ---------------------------------------------------------------------------
 * Next.js จะ override อ็อบเจกต์ alternates ทั้งก้อนหากหน้าย่อยระบุ alternates: { canonical }
 * ทำให้แท็ก hreflang ใน root layout หลุดหายทั้งเว็บ (S-01)
 * ทุกหน้าจึงต้องใช้ buildAlternates(path) เพื่อคงทั้ง canonical และ hreflang เสมอ
 *
 * ⚠️ **กฎเหล็กของ hreflang: ห้ามประกาศฝาแฝดที่ไม่มีอยู่จริงเด็ดขาด**
 * -------------------------------------------------------------------------
 * Google กำหนดว่าปลายทางของ `hreflang` ต้องเป็น URL ที่ canonical ชี้หาตัวเอง
 * ของเดิมเคยประกาศ `en-US` ชี้ไป `?lang=en` ซึ่งเป็นหน้า SSG ชุดเดียวกับฉบับไทย
 * และ self-canonical กลับมาที่ URL สะอาด → **Google ทิ้งคำประกาศ hreflang ทั้งชุด**
 * ไม่ใช่แค่ตัวที่ผิด เท่ากับเว็บไม่มีตัวตนในผลค้นหาภาษาอังกฤษเลยสักหน้า
 *
 * ค่าเริ่มต้นของ `englishTwin` จึงเป็น `false` — หน้าไหนมีฝาแฝด `/en/...` จริง
 * ต้อง **เปิดเองอย่างจงใจ** ไม่ใช่ได้มาฟรีแล้วลืมปิดตอนไม่มี
 */
export interface AlternatesOptions {
  /** ภาษาของหน้าที่กำลังสร้าง metadata อยู่ — ตัดสินว่า canonical ชี้ไปที่ `/` หรือ `/en` */
  locale?: Locale;
  /** หน้านี้มีฝาแฝดภาษาอังกฤษที่ prerender ไว้จริงหรือไม่ (ค่าเริ่มต้น: ไม่มี) */
  englishTwin?: boolean;
}

/** เติม `/` นำหน้าและตัด `/` ท้ายทิ้ง — `"/"` และค่าว่างกลายเป็นสตริงว่าง */
function normalizeRoutePath(path: string): string {
  if (!path || path === "/") return "";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "");
}

/** URL ของหน้าเดียวกันในแต่ละภาษา — ไทยอยู่ราก อังกฤษอยู่ใต้ `/en` */
export function localizedUrl(path: string, locale: Locale): string {
  const normalized = normalizeRoutePath(path);
  return locale === "en" ? `${SITE_ORIGIN}/en${normalized}` : `${SITE_ORIGIN}${normalized}`;
}

export function buildAlternates(path: string = "/", options: AlternatesOptions = {}) {
  const { locale = "th", englishTwin = false } = options;

  const thaiUrl = localizedUrl(path, "th");
  const englishUrl = localizedUrl(path, "en");
  const canonical = locale === "en" ? englishUrl : thaiUrl;

  // หน้าที่ไม่มีฝาแฝดอังกฤษ ประกาศแค่ภาษาเดียว — ไม่ต้องมี hreflang ให้ Google สับสน
  if (!englishTwin) {
    return { canonical };
  }

  return {
    canonical,
    languages: {
      "th-TH": thaiUrl,
      "en-US": englishUrl,
      "x-default": thaiUrl,
    },
  };
}
