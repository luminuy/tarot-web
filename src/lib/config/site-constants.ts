/**
 * 🌐 ข้อมูลคงที่พื้นฐานของเว็บ (Client-Safe Lightweight Constants)
 * ---------------------------------------------------------------------------
 * สกัดออกมาจาก `site.ts` เพื่อให้ client component (เช่น AntiTheftShield, AnalyticsTracker)
 * นำเข้าไปใช้ได้โดยตรงโดยไม่ลากฟังก์ชันฝั่งเซิร์ฟเวอร์/เมตาดาตา (เช่น buildAlternates)
 * เข้ามาแตกเป็น chunk ย่อยที่ทำให้เกิด critical request chain บน Lighthouse
 */

/** โดเมนหลักที่ผูกกับ Cloudflare Workers (custom domain) */
export const SITE_DOMAIN = "seertarot.net";

/** origin เต็มรูปแบบ เช่น `https://seertarot.net` */
export const SITE_ORIGIN = `https://${SITE_DOMAIN}` as const;

/** ชื่อเว็บสำหรับข้อความ/ลายน้ำ/ไฟล์ส่งออกข้อมูล */
export const SITE_NAME_TH = "วิหารพยากรณ์ไพ่ทาโรต์";

/**
 * โดเมนที่อนุญาตให้ยิงแท็กวัดผล (GA4, Google Ads, Meta Pixel)
 * ป้องกันไม่ให้ทราฟฟิกตอนเทสต์หรือ dev ปนเข้าระบบวัดผลจริง
 */
export function isMeasurableHostname(hostname: string): boolean {
  return hostname === SITE_DOMAIN;
}
