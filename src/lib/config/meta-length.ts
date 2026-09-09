/**
 * เพดานความยาว title / description ของทุกหน้า — แหล่งความจริงเดียว
 * ------------------------------------------------------------------
 * ⚠️ บทเรียนจาก production (2026-09-09): เทมเพลตหลายอันต่อท้อยคำต่อกันไปเรื่อย ๆ
 * โดยไม่มีใครวัดความยาวผลลัพธ์เลยสักที่ · หน้าผังอังกฤษจึงได้ title ยาว 118 ตัวอักษร
 * (`nameEn` มี "(10 Cards)" อยู่แล้ว แต่เทมเพลตต่อ "Tarot Spread: 10-Card Layout…" ซ้ำอีก)
 * และ description ยาว 326 ตัวอักษร — Google ตัดทิ้งเกินครึ่ง คนหาไม่เห็นใจความ
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ล้วน ไม่แตะ DOM ไม่แตะ network
 * ทุกหน้า **ต้อง** สร้าง title ผ่าน `pickTitle()` และ description ผ่าน `clampDescription()`
 * ด่านที่ 41 (`scripts/qa/test-meta-length.ts`) วัดจาก HTML ที่ build ออกมาจริงทุกหน้า
 */

/** ท้าย title ที่ `template: "%s · SeerTarot"` ใน layout เติมให้เองทุกหน้า */
export const BRAND_SUFFIX = " · SeerTarot";

/**
 * เพดาน title **เฉพาะส่วนที่หน้าเขียนเอง** (ยังไม่รวมท้ายแบรนด์)
 * Google แสดงได้ราว 60 ตัวอักษร · ท้ายแบรนด์ที่ถูกตัดทิ้งไม่เสียหาย
 * เพราะคำค้นสำคัญอยู่ต้นประโยคอยู่แล้ว — แต่ "ใจความ" ต้องอยู่ครบใน 60 ตัวแรก
 */
export const TITLE_MAX = 60;

/** เพดาน description — Google แสดงราว 155–160 ตัวอักษร */
export const DESCRIPTION_MAX = 155;

/** ตัดข้อความที่ขอบคำ (ช่องว่าง) ไม่ให้เกิน `max` — ไม่ตัดกลางคำ */
export function clampText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const room = max - 1; // เผื่อที่ให้ "…"
  const cut = clean.slice(0, room);
  const lastSpace = cut.lastIndexOf(" ");
  // ถ้าไม่มีช่องว่างเลย (เช่นวลีไทยติดกันยาว) ตัดตรง ๆ ดีกว่าคืนข้อความยาวเกิน
  const body = lastSpace > room * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${body.replace(/[\s·—–,:;-]+$/u, "")}…`;
}

/**
 * เลือก title ตัวแรกที่ยาวไม่เกินเพดาน — เรียงจาก "ครบที่สุด" ไป "สั้นที่สุด"
 * ถ้าไม่มีตัวไหนพอดีเลย จะตัดตัวสุดท้าย (ตัวที่สั้นที่สุด) ที่ขอบคำให้
 */
export function pickTitle(candidates: string[], max: number = TITLE_MAX): string {
  const cleaned = candidates.map((c) => c.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  return cleaned.find((c) => c.length <= max) ?? clampText(cleaned[cleaned.length - 1], max);
}

/**
 * ประกอบ description จาก "ใจความหลัก" + "ส่วนขยาย" ให้ไม่เกินเพดาน
 * - ถ้าต่อกันแล้วพอดี → ได้ทั้งสองส่วน
 * - ถ้าเกิน → เอาแค่ใจความหลัก (ตัดที่ขอบคำถ้าใจความหลักยังยาวเกิน)
 * ใจความหลักต้องมาก่อนเสมอ เพื่อให้ทุกหน้ายังมี description ไม่ซ้ำกัน
 */
export function clampDescription(lead: string, tail = "", max: number = DESCRIPTION_MAX): string {
  const head = lead.replace(/\s+/g, " ").trim();
  const extra = tail.replace(/\s+/g, " ").trim();
  if (extra) {
    const joined = `${head} ${extra}`;
    if (joined.length <= max) return joined;
  }
  return clampText(head, max);
}

/** ตัดวงเล็บบอกจำนวนไพ่ท้ายชื่อผัง เช่น "Celtic Cross (10 Cards)" → "Celtic Cross" */
export function stripCardCount(name: string): string {
  return name.replace(/\s*\(\s*\d+\s*cards?\s*\)\s*/gi, " ").replace(/\s+/g, " ").trim();
}

/** เอาเฉพาะวรรคแรกของชื่อ (ก่อน ":" หรือ "—") เช่น "The Celtic Cross: 10 Dimensions…" → "The Celtic Cross" */
export function headline(name: string): string {
  return name.split(/\s*[:—–]\s*/u)[0].trim();
}
