/**
 * 🚪 "เปิดพิธีดูดวงครั้งนี้เพราะอะไร" — ตรรกะล้วน ไม่มี React ไม่มี I/O
 * ===========================================================================
 *
 * `TarotFlow` ถูกเปิดได้จากสองที่ และแต่ละที่มีทางเข้าที่ **แย่งกันเอง** ถ้าไม่ตัดสินลำดับให้ชัด:
 *
 *   • หน้าดูดวงรายผัง `/read/<ผัง>` — ปลายทางของปุ่ม "เริ่มดูดวงด้วยผังนี้" ทุกปุ่มในเว็บ
 *   • หน้าแรก `/` — เลือกผังเองที่ขั้นที่ 1
 *
 * ผลที่ได้มีสามแบบ:
 *
 *   1. `deepLink` — เริ่มรอบใหม่ด้วยผังของหน้า `/read/<ผัง>` (ตรงขั้นตั้งคำถามเลย)
 *   2. `resume`   — มีรอบดูดวงค้างอยู่ในแท็บนี้ (ยังไม่เกิน 60 นาที) ให้กู้คืน
 *   3. `fresh`    — หน้าแรกเปล่า ๆ เริ่มที่ขั้นเลือกผัง
 *
 * ## ทำไมหน้า `/read/<ผัง>` ต้องชนะรอบที่ค้าง (บทเรียนรอบ 132)
 *
 * คนที่เพิ่งเปิดไพ่ในแท็บนี้ภายในชั่วโมงเดียวกัน กดปุ่มเริ่มดูดวงผังใหม่แล้ว
 * ถ้าตัวกู้คืนชนะ = ถูกลากกลับไปรอบเก่าผังเก่าเงียบ ๆ ทั้งที่เพิ่งกดปุ่ม "เริ่มดูดวงด้วยผังนี้"
 * การกดปุ่มคือคำสั่งที่ชัดเจนกว่า "ของค้างในแท็บ" เสมอ
 *
 * ## ข้อยกเว้นเดียว: "กลับมาหน้าเดิม" (`returning`)
 *
 * URL `/read/<ผัง>` อยู่ถาวรในแถบที่อยู่ (ต่างจาก `?spread=` เดิมที่ล้างทิ้งได้)
 * ถ้าไม่แยก "เปิดใหม่" ออกจาก "รีเฟรช/กดย้อนกลับมา" การรีเฟรชกลางพิธีจะล้างไพ่ที่เปิดอยู่ทิ้ง
 * ➔ กลับมาหน้าเดิม **และ** รอบที่ค้างเป็นผังเดียวกัน = กู้คืน · นอกนั้นเริ่มใหม่
 * (ผู้เรียกดูจาก `PerformanceNavigationTiming.type` — `reload` / `back_forward`)
 */

import type { RitualStep } from "@/components/home/ritual-step";

export type EntryIntent =
  | { kind: "deepLink"; spreadId: string }
  | { kind: "resume" }
  | { kind: "fresh" };

/** ภาษาของหน้า/ของรอบที่ค้าง — ตรงกับฟิลด์ `lang` ที่ตัวบันทึก flow เขียนไว้ */
export type FlowLang = "th" | "en";

/**
 * รอบที่ค้างถูกสร้างจากหน้าอีกภาษา = ห้ามกู้คืนข้ามภาษา (A4-05)
 * หน้าแรกไม่มี `routeSpread` จึงเคยคืน `resume` ให้ทุกรอบที่ค้าง ผู้ใช้กดสลับ TH ↔ EN กลางพิธี
 * แล้วเห็นคำถาม/คำอ่านภาษาเดิมครอบหน้าภาษาใหม่ · รอบเก่าที่ไม่มีฟิลด์ `lang` ถือว่ากู้ได้เหมือนเดิม
 */
export function isCrossLanguageFlow(savedLang: FlowLang | null | undefined, pageLang: FlowLang | null | undefined): boolean {
  return Boolean(savedLang && pageLang && savedLang !== pageLang);
}

/**
 * กู้คืนมาแล้วอยู่ที่ขั้นเลือกไพ่ ครบทุกใบแต่ยังไม่มีไพ่จากเซิร์ฟเวอร์ = รีเฟรชตอน `/shuffle` ยังบินอยู่ (A4-02)
 * ตัวบันทึก flow เขียน `pickedIndices` ครบทันทีที่แตะใบสุดท้าย แต่ไพ่มาทีหลังคำตอบ `/shuffle`
 * ถ้าไม่ส่งซ้ำ หน้าจะค้าง "กำลังวางไพ่ลงผัง" ตลอดกาล · ส่งซ้ำปลอดภัย: เซิร์ฟเวอร์คืนไพ่ชุดเดิมที่จั่วไว้แล้ว ไม่จั่วใหม่
 */
export function needsFinalizeOnResume(opts: {
  step: RitualStep;
  pickedCount: number;
  drawnCount: number;
  /** จำนวนใบที่ผังต้องการ — `0`/ไม่ทราบ = ไม่ส่งซ้ำ */
  capacity: number;
  /** ต้องมีเซสชันเดิมให้ส่งต่อ */
  hasSession: boolean;
}): boolean {
  return (
    opts.step === "PICK_CARDS" &&
    opts.hasSession &&
    opts.capacity > 0 &&
    opts.pickedCount >= opts.capacity &&
    opts.drawnCount === 0
  );
}

export interface EntryContext {
  /** ผังของหน้า `/read/<ผัง>` — `null` = เปิดจากหน้าแรก */
  routeSpread: string | null;
  /** ผังนี้มีอยู่จริงในสารบบไหม — ส่งเข้ามาเพื่อไม่ให้ไฟล์นี้ต้องแตะข้อมูลผัง 85 KB */
  isKnownSpread: (id: string) => boolean;
  /** รีเฟรชหรือกดย้อนกลับมาที่หน้าเดิม (ไม่ใช่กดลิงก์เข้ามาใหม่) */
  returning?: boolean;
  /** ขั้นของรอบที่ค้างอยู่ในแท็บนี้ — `null` = ไม่มีอะไรค้าง */
  savedStep: RitualStep | null;
  /** ผังของรอบที่ค้างอยู่ */
  savedSpread?: string | null;
  /** ภาษาของรอบที่ค้าง และภาษาของหน้านี้ — ต่างกัน = ไม่นับว่ามีอะไรค้าง (A4-05) */
  savedLang?: FlowLang | null;
  pageLang?: FlowLang | null;
}

/** ค้างอยู่ที่ขั้นเลือกผัง = ยังไม่ได้เริ่มอะไรเลย ไม่มีอะไรให้กู้คืน */
function hasSomethingToResume(savedStep: RitualStep | null): boolean {
  return Boolean(savedStep && savedStep !== "SPREAD_SELECT");
}

export function resolveEntryIntent({
  routeSpread,
  isKnownSpread,
  returning = false,
  savedStep: savedStepRaw,
  savedSpread = null,
  savedLang = null,
  pageLang = null,
}: EntryContext): EntryIntent {
  // รอบของอีกภาษาเท่ากับไม่มีรอบค้าง — ไม่กู้คืนข้ามภาษา (A4-05)
  const savedStep = isCrossLanguageFlow(savedLang, pageLang) ? null : savedStepRaw;
  if (routeSpread && isKnownSpread(routeSpread)) {
    if (returning && savedSpread === routeSpread && hasSomethingToResume(savedStep)) {
      return { kind: "resume" };
    }
    return { kind: "deepLink", spreadId: routeSpread };
  }
  if (hasSomethingToResume(savedStep)) {
    return { kind: "resume" };
  }
  return { kind: "fresh" };
}
