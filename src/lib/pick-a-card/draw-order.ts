/**
 * 🔀 ตัวจั่วของหน้า Pick A Card — "รอบนี้แต่ละกองได้คำอ่านชิ้นไหนจากคลัง"
 * ===========================================================================
 * ## ทำไมต้องมีไฟล์นี้
 *
 * ตอนเปิดหน้านี้ (PR #512) กองที่ 1 ผูกกับไพ่ชุดเดิม **ตลอดกาล** ผู้ใช้ที่ย้อนกลับมา
 * เลือกกองเดิมจึงเจอไพ่ 3 ใบเดิมและคำทำนายเดิมทุกครั้ง — เจ้าของโปรเจกต์ทักเองว่า
 * "เลือกใหม่จากกองเดิม ไพ่ซ้ำ ซ้ำตลอด ทุกกองเลย" (INC-0198b)
 *
 * ## กติกาของตัวจั่ว
 *
 * 1. **ห้ามช่องไหนได้ชิ้นเดิมซ้ำกับรอบก่อน** — เลือกกองเดิมสองครั้งติดกันต้องไม่ได้ของเดิม
 * 2. **ในรอบเดียวกัน ทุกช่องต้องได้คนละชิ้น** — เปิดกอง 1 แล้วกอง 2 ต้องไม่เจอคำอ่านซ้ำกัน
 * 3. คลังใหญ่กว่าจำนวนกองได้ (`poolSize ≥ slotCount`) ยิ่งคลังใหญ่ยิ่งซ้ำยาก
 *
 * ## ⚠️ สิ่งที่ห้ามเข้าใจผิด
 *
 * - **ไม่ใช่การกุไพ่** ตามกฎเหล็กข้อ 14 — ทุกชิ้นในคลังคือไพ่จริงที่มีคำทำนายเขียนคู่กันไว้แล้ว
 *   ตัวจั่วนี้แค่เลือกว่ารอบนี้หยิบชิ้นไหนมาแสดง ไม่ได้สร้างไพ่ใหม่หรือจับคู่คำทำนายผิดใบ
 * - **ห้ามเรียกตอนเรนเดอร์ฝั่งเซิร์ฟเวอร์** หน้านี้เสิร์ฟเป็น HTML นิ่งจากขอบ
 *   ถ้าสุ่มตั้งแต่ตอนเรนเดอร์ HTML กับ hydration จะไม่ตรงกัน — ต้องเรียกใน useEffect เท่านั้น
 */

/** จำนวนครั้งที่ยอมสุ่มใหม่ก่อนตกไปใช้ทางถอย */
const MAX_ATTEMPTS = 32;

/** สุ่มลำดับใหม่ของทั้งคลัง (Fisher–Yates) */
function shuffled(size: number): number[] {
  const out = Array.from({ length: size }, (_, i) => i);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * จั่วว่า "ช่องกองที่ N ได้คำอ่านชิ้นไหนจากคลัง" — คืนดัชนีคลังของแต่ละช่อง
 * @param poolSize ขนาดคลังคำอ่านของหัวข้อนี้
 * @param slotCount จำนวนกองที่ผู้ใช้เห็น (ปกติ 4)
 * @param prev ผลของรอบก่อน — ทุกช่องต้องเปลี่ยนจากค่านี้
 */
export function drawAnchors(poolSize: number, slotCount: number, prev: readonly number[]): number[] {
  const count = Math.min(slotCount, poolSize);
  if (poolSize < 2) return Array.from({ length: count }, (_, i) => i % poolSize);

  const previous = prev.length === count ? prev : Array.from({ length: count }, (_, i) => i);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const next = shuffled(poolSize).slice(0, count);
    if (next.every((value, index) => value !== previous[index])) return next;
  }

  // ทางถอยที่ยังการันตีว่าไม่ซ้ำช่องเดิม — เลื่อนดัชนีไปหนึ่งช่องในคลัง
  return previous.map((value) => (value + 1) % poolSize);
}
