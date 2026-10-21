/**
 * 🗓️ วันแก้ไขล่าสุดของหน้า — แหล่งเดียวของ sitemap `lastmod` · JSON-LD `dateModified` · วันที่ที่มองเห็นบนหน้า
 * ---------------------------------------------------------------------------
 * B3-02/03/04 (ตรวจ 2026-10-20): ค่าเดิมกระจายอยู่หลายที่และขัดกันเอง — sitemap บอก 16 ต.ค. แต่ JSON-LD ของบทความ
 * บอก 2 ก.ย. · หน้าไพ่ 156 หน้าบอก "ไม่เปลี่ยนตั้งแต่ 5 ก.ย." ทั้งที่ข้อความเปลี่ยนมาก · คู่ไทย/อังกฤษไม่เท่ากัน
 * Google เลิกเชื่อสัญญาณเวลาของทั้งเว็บเมื่อสองแหล่งขัดกัน
 *
 * ⚠️ ห้ามใช้ "เวลา deploy" (`new Date()`) — ทุก deploy จะประทับ "แก้เมื่อกี้" ลงหน้าที่ไม่ได้เปลี่ยน
 * อัปเดตค่าด้านล่างด้วยมือเมื่อ "ข้อความ/ลิงก์ที่มองเห็น" เปลี่ยนจริงเท่านั้น
 */

import { bangkokParts } from "@/lib/time/bangkok";

/** UI 2.0 ลงทุกหน้า (2026-10-17): ส่วน "ไปต่อจากตรงนี้" + หัวหน้าแบบใหม่ — ลิงก์/ข้อความที่มองเห็นเปลี่ยนทุกหน้าสาธารณะ */
export const SITE_TEMPLATE_UPDATED_AT = "2026-10-17T17:00:00+07:00";

/** แถว "บทความที่เกี่ยวข้อง" หมุนวนตามบทความ (2026-10-16) — ลิงก์บนหน้าบทความเปลี่ยนจริงทุกหน้า */
const ARTICLE_RELATED_UPDATED_AT = "2026-10-16T17:00:00+07:00";

/** ค่าที่ใหม่ที่สุดในชุด (คืนรูป ISO แบบ UTC — มีเขตเวลากำกับเสมอ) */
export function latestIso(...dates: Array<string | Date | null | undefined>): string {
  let best = 0;
  for (const d of dates) {
    if (!d) continue;
    const t = (d instanceof Date ? d : new Date(d)).getTime();
    if (Number.isFinite(t) && t > best) best = t;
  }
  return new Date(best).toISOString();
}

/** วันแก้ไขของบทความ = ใหม่สุดของ (เนื้อบทความ · แถวลิงก์ที่เกี่ยวข้อง · แม่แบบหน้า) */
export function articleModifiedAt(article: { updatedAt: string }): string {
  return latestIso(article.updatedAt, ARTICLE_RELATED_UPDATED_AT, SITE_TEMPLATE_UPDATED_AT);
}

/** วันแก้ไขของหน้าคำถาม (`updatedAt` เป็นวันที่ล้วน ➔ เที่ยงวันเวลาไทย) */
export function questionModifiedAt(q: { updatedAt: string }): string {
  return latestIso(`${q.updatedAt}T12:00:00+07:00`, SITE_TEMPLATE_UPDATED_AT);
}

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * วันที่ที่มองเห็นบนหน้า — ตามนาฬิกากรุงเทพฯ (`bangkokParts` ให้ผลเดียวกันทุกเครื่อง/ทุก locale)
 * ชื่อเดือนจากตารางของเราเอง ไม่พึ่งข้อมูลภาษาของเครื่อง
 */
export function formatPageDate(iso: string, isEnglish: boolean): string {
  const { year, month, day } = bangkokParts(new Date(iso).getTime()); // month เริ่มที่ 0 (แบบ Date)
  return isEnglish ? `${EN_MONTHS[month]} ${day}, ${year}` : `${day} ${TH_MONTHS[month]} ${year + 543}`;
}
