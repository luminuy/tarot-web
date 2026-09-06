import type { Locale } from "./types";

/**
 * 🧭 แผนที่เส้นทางสองภาษา — แหล่งความจริงเดียวว่า "หน้าไหนมีฝาแฝดอังกฤษบ้าง"
 * ---------------------------------------------------------------------------
 * ไทยอยู่ที่ราก (`/cards`) · อังกฤษอยู่ใต้ `/en` (`/en/cards`)
 *
 * ⚠️ รายการนี้ต้องตรงกับไฟล์ `page.tsx` ที่มีอยู่จริงใน `src/app/(en)/en/**` เสมอ
 * ถ้าประกาศเส้นทางที่ยังไม่มีไฟล์ ลิงก์ในหน้าอังกฤษจะพาไป 404
 * และ `hreflang` จะกลายเป็นคำโกหกที่ทำให้ Google ทิ้งคำประกาศทั้งชุด
 * มีด่านตรวจใน `scripts/qa/test-en-routing.ts` คอยจับให้
 *
 * หน้าที่ **ยังไม่มี** ฝาแฝดโดยตั้งใจ: `/blog` (เนื้อบทความยังไม่มีฉบับอังกฤษ)
 * · `/privacy` (ข้อความ PDPA ต้องให้ฝ่ายกฎหมายรับรองก่อนแปล) · หน้าที่ปิด index อยู่แล้ว
 */
export const EN_TWIN_ROUTES = [
  "/",
  "/cards",
  "/cards/all",
  "/cards/major",
  "/cards/minor",
  "/cards/wands",
  "/cards/cups",
  "/cards/swords",
  "/cards/pentacles",
  "/spreads",
  "/daily",
  "/love/1-card",
  "/blog",
] as const;

/** เส้นทางที่มีพารามิเตอร์ — ลูกทุกใบใต้ prefix นี้มีฝาแฝดครบ */
const EN_TWIN_DYNAMIC_PREFIXES = ["/cards/", "/spreads/", "/blog/"] as const;

/**
 * เส้นทางที่อยู่ใต้ prefix ข้างบนก็จริง แต่ **ไม่มี** ฝาแฝด — ต้องยกเว้นเป็นรายตัว
 *
 * เหตุผลเดียวกันทุกข้อ: เนื้อหาบรรณาธิการของหน้านั้นยังเป็นภาษาไทยล้วน
 * การเปิดหน้าอังกฤษที่มีแต่โครงแต่เนื้อเป็นไทย = thin content ซึ่ง **แย่กว่าไม่มีหน้าเลย**
 *
 * - `/cards/birth-card` — บทความประกอบเครื่องคำนวณยาวกว่า 800 คำ ยังไม่ได้แปล
 */
const EN_TWIN_EXCEPTIONS: string[] = ["/cards/birth-card"];

/** prefix ที่ต้องยกเว้นทั้งกิ่ง (ลูกทุกใบไม่มีฝาแฝด) */
const EN_TWIN_EXCEPTION_PREFIXES: readonly string[] = [];

/** ตัด query/hash และ `/` ท้ายออก เหลือเฉพาะ pathname สำหรับเทียบ */
function pathnameOf(href: string): string {
  const withoutHash = href.split("#")[0].split("?")[0];
  if (withoutHash.length > 1 && withoutHash.endsWith("/")) return withoutHash.slice(0, -1);
  return withoutHash;
}

/** หน้านี้มีฝาแฝดภาษาอังกฤษที่ prerender ไว้จริงหรือไม่ */
export function hasEnglishTwin(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  const pathname = pathnameOf(href);
  if (pathname === "" || pathname === "/") return true;
  if (EN_TWIN_EXCEPTIONS.includes(pathname)) return false;
  if (EN_TWIN_EXCEPTION_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  if ((EN_TWIN_ROUTES as readonly string[]).includes(pathname)) return true;
  return EN_TWIN_DYNAMIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * แปลงลิงก์ภายในให้ชี้ไปยังต้นไม้ภาษาที่ผู้ใช้กำลังอ่านอยู่
 *
 * - ภาษาไทย → คืนค่าเดิมเสมอ (ไทยอยู่ที่ราก)
 * - ภาษาอังกฤษ → เติม `/en` ให้เฉพาะหน้าที่มีฝาแฝดจริง
 *   หน้าที่ไม่มีฝาแฝด (เช่น `/blog`) คงเดิม — ผู้ใช้ยังอ่านได้ และ `LocaleProvider`
 *   ฝั่งไทยจะสลับภาษาให้ตาม cookie เหมือนเดิม ดีกว่าพาไป 404
 */
export function localeHref(href: string, locale: Locale): string {
  if (locale !== "en") return href;
  if (!href.startsWith("/") || href.startsWith("/en/") || href === "/en") return href;
  if (!hasEnglishTwin(href)) return href;
  return href === "/" ? "/en" : `/en${href}`;
}

/** ตัด prefix `/en` ออกเพื่อหา URL ฝาแฝดฝั่งไทย (ใช้ตอนกดปุ่มสลับภาษา) */
export function stripLocalePrefix(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}
