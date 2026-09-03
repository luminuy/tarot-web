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
