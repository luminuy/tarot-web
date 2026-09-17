/**
 * 🗺️ หน้าไหนถูกเรนเดอร์ด้วย Astro แล้วบ้าง — แหล่งความจริงเดียว
 * ===========================================================================
 *
 * ระหว่างการย้ายหน้าเนื้อหาออกจาก Next ทีละกลุ่ม เว็บนี้มีเครื่องมือเรนเดอร์สองตัว
 * อยู่ร่วมกัน · ไฟล์นี้บอกว่าเส้นไหนเป็นของใคร และมีผู้ใช้สองราย:
 *
 *   1. `LocaleLink` — ลิงก์ที่ชี้ไปหน้า Astro ต้องเป็น `<a>` ธรรมดา ห้ามใช้ `next/link`
 *      เพราะ router ของ Next จะพยายามดึงเพย์โหลด RSC ของหน้าปลายทาง ซึ่งไม่มีอยู่จริง
 *      (หน้านั้นเป็นไฟล์ HTML ที่ Cloudflare ตอบเองที่ขอบ ไม่เคยผ่าน Worker)
 *   2. ด่าน `scripts/qa/test-astro-routes.ts` — เทียบรายการนี้กับไฟล์ที่บิลด์ออกมาจริง
 *      ทั้งสองฝั่ง ถ้าย้ายหน้าแล้วลืมมาแก้ที่นี่ (หรือแก้ที่นี่แล้วลืมย้ายหน้า) ด่านตก
 *
 * 📌 ย้ายกลุ่มหน้าใหม่ไป Astro: เพิ่ม prefix ที่นี่ที่เดียว
 */

/**
 * หน้าแรกย้ายไป Astro แล้ว — ต้องแยกออกมาจากรายการ prefix
 * เพราะ `"/"` ในฐานะ prefix จะครอบ **ทั้งเว็บ** รวมหน้าที่ยังอยู่กับ Next ด้วย
 *
 * `/404` ก็อยู่ที่นี่ด้วยตั้งแต่ R-25 — Astro สร้าง `404.html` กับ `en/404.html`
 * ให้ Cloudflare เสิร์ฟจากขอบ (`not_found_handling: "404-page"` ใน `wrangler.jsonc`)
 * ไม่ได้ใส่เป็น prefix เพราะไม่มีหน้าลูกใต้ `/404`
 *
 * ℹ️ ไม่มีใครลิงก์ไป `/404` ตรง ๆ อยู่แล้ว — ที่ต้องประกาศไว้เพราะด่าน
 * `test-astro-routes.ts` เทียบรายการนี้กับหน้าที่บิลด์ออกมาจริงทุกครั้ง
 */
const ASTRO_EXACT_ROUTES = ["/", "/404", "/account"] as const;

/** เส้นทาง (ฝั่งไทย) ที่ตัวมันเองและลูกทุกใบถูกเรนเดอร์ด้วย Astro */
export const ASTRO_ROUTE_PREFIXES = [
  "/cards",
  "/blog",
  "/spreads",
  "/about",
  "/privacy",
  "/contact",
  "/reading",
  "/daily",
  "/love",
  "/pick-a-card",
] as const;

/** ตัด `/en` นำหน้าออก เพื่อเทียบกับรายการฝั่งไทยชุดเดียว */
function withoutLocalePrefix(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}

/** หน้านี้ถูกเรนเดอร์ด้วย Astro (เสิร์ฟเป็นไฟล์ static ที่ขอบ) หรือไม่ */
export function isAstroRoute(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  const pathname = withoutLocalePrefix(href.split("#")[0].split("?")[0].replace(/\/+$/, "") || "/");
  if ((ASTRO_EXACT_ROUTES as readonly string[]).includes(pathname)) return true;
  return ASTRO_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
