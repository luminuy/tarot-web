/**
 * 📅 สำรับประจำวันของหน้า Pick A Card
 * ===========================================================================
 * ## ทำไมต้องมี
 *
 * การจั่วแบบสุ่มล้วนทำให้ทุกคนเห็นไม่เหมือนกันและไม่มีเหตุผลให้กลับมาพรุ่งนี้
 * สำรับประจำวันคือสูตรเดียวกับ pick-a-pile สายคลิปสั้นทั่วโลก — **วันนี้ทั้งเว็บเห็นชุดเดียวกัน**
 * คุยกันได้ แชร์กันได้ และพรุ่งนี้เปลี่ยนใหม่ทั้งหมด ผู้ใช้จึงมีเหตุผลกลับมาทุกวัน
 *
 * ผู้ใช้ที่อยากได้ชุดใหม่เดี๋ยวนั้นยังกด "เลือกกองอื่น" เพื่อสับใหม่แบบสุ่มได้เสมอ
 * (ดู `drawPicks` ใน compose.ts) — สำรับประจำวันเป็นแค่ "หน้าแรกของวัน" ไม่ใช่กรงขัง
 *
 * ## กติกา
 *
 * - เมล็ดคือ `<วันของกรุงเทพฯ>:<หัวข้อ>` จึงเปลี่ยนทุกเที่ยงคืนตามเวลาไทย และคนละหัวข้อได้คนละสำรับ
 * - ผลลัพธ์ต้องเหมือนกันทุกครั้งที่เมล็ดเท่ากัน (deterministic) ไม่งั้นคำว่า "ประจำวัน" ไม่มีความหมาย
 * - ต้องเรียกฝั่งเบราว์เซอร์เท่านั้น (ใน `useEffect`) เพราะหน้านี้เป็น HTML นิ่งที่บิลด์ไว้ล่วงหน้า
 *   วันของตอนบิลด์กับวันของตอนที่ผู้ใช้เปิดหน้าเป็นคนละวันได้
 */
import type { PickACardDraw } from "./compose";

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
 * สำรับประจำวันของหัวข้อหนึ่ง
 * @param seedKey เมล็ด เช่น `2026-09-17:love-feelings`
 */
export function dailyDraw(seedKey: string, poolSize: number, slotCount: number): PickACardDraw {
  const random = seededRandom(hashSeed(seedKey));

  const order = Array.from({ length: poolSize }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return {
    anchorOrder: order.slice(0, Math.min(slotCount, poolSize)),
    hiddenPick: Math.floor(random() * poolSize),
    advicePick: Math.floor(random() * poolSize),
  };
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
