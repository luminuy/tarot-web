/**
 * 📅 สำรับประจำวันของหน้า Pick A Card
 * ===========================================================================
 * ## ทำไมต้องมี
 *
 * การจั่วแบบสุ่มล้วนทำให้ทุกคนเห็นไม่เหมือนกันและไม่มีเหตุผลให้กลับมาพรุ่งนี้
 * สำรับประจำวันคือสูตรเดียวกับ pick-a-pile สายคลิปสั้นทั่วโลก — **วันนี้ทั้งเว็บเห็นชุดเดียวกัน**
 * คุยกันได้ แชร์กันได้ และพรุ่งนี้เปลี่ยนใหม่ทั้งหมด ผู้ใช้จึงมีเหตุผลกลับมาทุกวัน
 *
 * ## ใครเป็นผู้ใช้ไฟล์นี้ (เปลี่ยนแล้วในคลื่นที่ 2 · 2026-09-18)
 *
 * ตัวสุ่มในไฟล์นี้ถูกเรียกจาก **ฝั่งเซิร์ฟเวอร์** เท่านั้น (`src/lib/reading/derived-draw.ts`)
 * เพราะทุกทางเข้าเปิดไพ่ต้องผ่านท่อ AI + กำแพงสมาชิก เบราว์เซอร์จึงไม่จั่วอะไรเองอีกแล้ว
 * (ฝั่งเบราว์เซอร์ยังใช้ `dayLabel()` เพื่อโชว์ป้ายวันที่ของสำรับที่เซิร์ฟเวอร์ส่งกลับมา)
 *
 * ## กติกา
 *
 * - ผลลัพธ์ต้องเหมือนกันทุกครั้งที่เมล็ดเท่ากัน (deterministic) ไม่งั้นคำว่า "ประจำวัน" ไม่มีความหมาย
 * - ห้ามมี `Math.random()` โผล่ในไฟล์นี้เด็ดขาด
 */

/** แฮชสตริงเป็นเลข 32 บิต (FNV-1a) — เล็ก เร็ว และให้ผลเท่ากันทุกเครื่อง */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** ตัวสุ่มที่ทำซ้ำได้ (mulberry32) — เมล็ดเดียวกันให้ลำดับเดียวกันเสมอ */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * ลำดับสับของคลังทั้งก้อนจากเมล็ดหนึ่ง — เมล็ดเดียวกันให้ลำดับเดียวกันเสมอ
 *
 * @param seedKey เมล็ด เช่น `love-feelings:anchor`
 * @returns การเรียงสับเปลี่ยนของ `0..size-1` ครบทุกตัว ไม่ขาดไม่เกิน
 */
export function seededOrder(seedKey: string, size: number): number[] {
  const random = seededRandom(hashSeed(seedKey));
  const order = Array.from({ length: size }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** ป้ายวันที่แบบสั้นสำหรับโชว์บนหน้า เช่น "17 ก.ย." / "17 Sep" */
export function dayLabel(dayKey: string, isEnglish: boolean): string {
  const [, month, day] = dayKey.split("-");
  const monthsTh = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const index = Number(month) - 1;
  const name = (isEnglish ? monthsEn : monthsTh)[index] ?? month;
  return isEnglish ? `${name} ${Number(day)}` : `${Number(day)} ${name}`;
}
