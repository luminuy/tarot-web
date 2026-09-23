/**
 * 🚪 "เปิดหน้าแรกครั้งนี้เพราะอะไร" — ตรรกะล้วน ไม่มี React ไม่มี I/O
 * ===========================================================================
 *
 * หน้าแรกถูกเปิดได้สามแบบ และสามแบบนี้ **แย่งกันเอง** ถ้าไม่ตัดสินลำดับให้ชัด:
 *
 *   1. `deepLink` — มาจากปุ่ม "เริ่มดูดวงด้วยผังนี้" ที่หน้าอื่น (`/?spread=<id>`)
 *                   หรือเพิ่งล็อกอินกลับมาหลังติดกำแพงตอนกดปุ่มนั้น (ผังที่ค้างใน `pendingSpread`)
 *   2. `resume`   — มีรอบดูดวงค้างอยู่ในแท็บนี้ (ยังไม่เกิน 60 นาที)
 *   3. `fresh`    — เปิดเปล่า ๆ เริ่มที่ขั้นเลือกผัง
 *
 * ## ทำไม `deepLink` ต้องชนะ `resume` เสมอ (บทเรียนรอบ 132)
 *
 * ของเดิมให้ `resume` มาก่อน ➔ ใครที่เพิ่งเปิดไพ่ในแท็บนี้ภายในชั่วโมงเดียวกัน
 * กดปุ่มเริ่มดูดวงผังใหม่แล้ว **ไม่มีอะไรเกิดขึ้น** เพราะถูกพากลับไปรอบเก่าผังเก่าเงียบ ๆ
 * ทั้งที่เพิ่งกดปุ่มที่เขียนตรง ๆ ว่า "เริ่มดูดวงด้วยผังนี้" มาหมาด ๆ
 * การกดปุ่มคือคำสั่งที่ชัดเจนกว่า "ของค้างในแท็บ" เสมอ
 *
 * ⚠️ ผู้เรียกต้องล้าง `?spread=` ออกจาก URL ทันทีที่รับคำสั่งแล้ว ไม่งั้นการกดรีเฟรช
 *    ระหว่างดูดวงจะถูกอ่านเป็นคำสั่งเริ่มใหม่ซ้ำ แล้วล้างรอบที่กำลังเปิดไพ่อยู่ทิ้ง
 */

import type { RitualStep } from "@/components/home/ritual-step";

export type EntryIntent =
  | { kind: "deepLink"; spreadId: string }
  | { kind: "resume" }
  | { kind: "fresh" };

export interface EntryContext {
  /** ค่า `?spread=` ดิบจาก URL (ยังไม่รู้ว่ามีผังนี้จริงไหม) */
  spreadParam: string | null;
  /** ผังที่กดเริ่มมาแล้วแต่ติดกำแพงเข้าสู่ระบบ — `null` = ไม่มี */
  pendingSpread?: string | null;
  /** ผังนี้มีอยู่จริงในสารบบไหม — ส่งเข้ามาเพื่อไม่ให้ไฟล์นี้ต้องแตะข้อมูลผัง 85 KB */
  isKnownSpread: (id: string) => boolean;
  /** ขั้นของรอบที่ค้างอยู่ในแท็บนี้ — `null` = ไม่มีอะไรค้าง */
  savedStep: RitualStep | null;
}

export function resolveEntryIntent({ spreadParam, pendingSpread, isKnownSpread, savedStep }: EntryContext): EntryIntent {
  // ผังที่ไม่มีอยู่จริง (ลิงก์เก่า/พิมพ์มั่ว) = ไม่ใช่คำสั่ง — ปล่อยให้ของค้างหรือหน้าเปล่าทำงานต่อ
  if (spreadParam && isKnownSpread(spreadParam)) {
    return { kind: "deepLink", spreadId: spreadParam };
  }
  // ล็อกอินกลับมาหลังติดกำแพง = คำสั่งเดิมที่ยังไม่ได้ทำ ชนะรอบค้างด้วยเหตุผลเดียวกับลิงก์
  if (pendingSpread && isKnownSpread(pendingSpread)) {
    return { kind: "deepLink", spreadId: pendingSpread };
  }
  // ค้างอยู่ที่ขั้นเลือกผัง = ยังไม่ได้เริ่มอะไรเลย ไม่มีอะไรให้กู้คืน
  if (savedStep && savedStep !== "SPREAD_SELECT") {
    return { kind: "resume" };
  }
  return { kind: "fresh" };
}
