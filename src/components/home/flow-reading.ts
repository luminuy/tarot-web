"use client";

/**
 * 📜 คำอ่านที่กำลังไหลเข้ามา — ตัวลดเดียว (R-26 ขั้นที่ 2)
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้
 *
 * ของเดิมเก็บสถานะการอ่านไว้เป็น `useState` อิสระ **3 ตัว**:
 * `isStreaming` · `readingResult` · `errorMsg`
 * ซึ่งทำให้สถานะที่ขัดแย้งกันในตัวเองอย่าง **"กำลังสตรีมอยู่ พร้อมกับขึ้นข้อความว่าพัง"**
 * เขียนออกมาได้ (และเกิดขึ้นจริงเมื่อโค้ดเส้นอื่นเรียก `setErrorMsg` ระหว่างที่สตรีมวิ่งอยู่)
 *
 * ## กติกาที่ตัวลดนี้บังคับ
 *
 * 1. **กำลังสตรีม = ไม่มีข้อความผิดพลาดค้างอยู่** (`streaming` ⇒ `error === null`)
 * 2. **เฟรมที่มาช้าเขียนอะไรไม่ได้** — ชิ้นส่วนคำอ่าน (`opening` · `card` · `connections` ·
 *    `summary` · `done`) ถูกรับเฉพาะตอนที่ยังสตรีมอยู่เท่านั้น
 *    ของเดิมเฟรมที่มาถึงหลังผู้ใช้กด "เริ่มดูดวงใหม่" ยังเขียนทับ `readingResult` ได้
 *    (จุดเรียกต้องจำไป `abort()` ให้ครบทุกเส้น — ลืมเส้นเดียวคือคำอ่านของรอบเก่าโผล่ในรอบใหม่)
 * 3. **ล้มเหลวแล้วไม่ทิ้งของที่อ่านไปแล้ว** — สตรีมสะดุดกลางทาง ผู้ใช้ยังเห็นย่อหน้าที่มาถึงแล้ว
 *    พร้อมปุ่ม "โหลดใหม่อีกครั้ง" (พฤติกรรมเดิม เก็บไว้ครบ)
 *
 * ⚠️ ไฟล์นี้ **ไม่มี I/O และไม่พึ่ง React** จึงทดสอบได้ตรง ๆ
 * ด่าน `scripts/qa/test-flow-state.ts` ยิงลำดับการกระทำจริงใส่ตัวลดนี้
 */

import type { Reading } from "@/lib/schema/reading";

type CardReading = NonNullable<Reading["cards"]>[number];

export interface ReadingState {
  /** `streaming` = แม่หมอกำลังอ่านอยู่ · `done` = ได้คำอ่านครบแล้ว · `idle` = ยังไม่เริ่ม/หยุดแล้ว */
  status: "idle" | "streaming" | "done";
  /** คำอ่านเท่าที่มาถึงแล้ว — `null` แปลว่ายังไม่มีอะไรเลย */
  reading: Partial<Reading> | null;
  /** ข้อความผิดพลาดที่แสดงให้ผู้ใช้เห็น — ห้ามมีค่าพร้อมกับ `status === "streaming"` */
  error: string | null;
  /**
   * คำอ่านที่ได้มาจากคลังความหมายไพ่ (AI ทุกเจ้าไม่ว่าง) ไม่ใช่จากแม่หมอ AI
   * ผู้ใช้ต้องรู้ตรง ๆ และกดให้ AI อ่านใหม่ได้ (ดู `FallbackNotice`) — มีค่าได้เฉพาะตอน `done`
   */
  fallback: boolean;
}

export type ReadingAction =
  | { type: "start" }
  | { type: "opening"; text: string }
  | { type: "card"; card: CardReading }
  | { type: "connections"; text: string }
  | { type: "summary"; text: string }
  /** เซิร์ฟเวอร์สั่งเริ่มเรียบเรียงใหม่ระหว่างทาง (เฟรม `reset`) */
  | { type: "clearPartial" }
  | { type: "done"; reading?: Partial<Reading> | null; fallback?: boolean }
  /** สตรีมสะดุด / ระบบขัดข้อง / ผู้ใช้กรอกไม่ครบ — ข้อความเดียวกันทั้งหมด */
  | { type: "fail"; message: string }
  /** หยุดสตรีมโดยไม่มีข้อความผิดพลาด (เช่นถูกกำแพงสิทธิ์กั้น — หน้าต่างสิทธิ์อธิบายแทน) */
  | { type: "stop" }
  /** ล้างข้อความผิดพลาดก่อนลองใหม่ */
  | { type: "clearError" }
  | { type: "restore"; reading: Partial<Reading> | null }
  | { type: "reset" };

export const READING_INITIAL: ReadingState = { status: "idle", reading: null, error: null, fallback: false };

/** รวมคำอ่านรายใบแบบไม่ให้ซ้ำตำแหน่ง และเรียงตามตำแหน่งเสมอ */
function mergeCard(current: Partial<Reading>, card: CardReading): Partial<Reading> {
  const existing = current.cards ?? [];
  const filtered = existing.filter((c) => c.position !== card.position);
  return { ...current, cards: [...filtered, card].sort((a, b) => a.position - b.position) };
}

export function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  // เฟรมของคำอ่านรับได้เฉพาะตอนที่ยังสตรีมอยู่ (กติกาข้อ 2)
  const streaming = state.status === "streaming";

  switch (action.type) {
    case "start":
      return { status: "streaming", reading: {}, error: null, fallback: false };
    case "opening":
      return streaming ? { ...state, reading: { ...(state.reading ?? {}), opening: action.text } } : state;
    case "connections":
      return streaming ? { ...state, reading: { ...(state.reading ?? {}), connections: action.text } } : state;
    case "summary":
      return streaming ? { ...state, reading: { ...(state.reading ?? {}), summary: action.text } } : state;
    case "card":
      return streaming ? { ...state, reading: mergeCard(state.reading ?? {}, action.card) } : state;
    case "clearPartial":
      return streaming ? { ...state, reading: {} } : state;
    case "done":
      if (!streaming) return state;
      return { status: "done", reading: action.reading ?? state.reading ?? {}, error: null, fallback: Boolean(action.fallback) };
    case "fail":
      /*
       * หยุดสตรีม (ถ้ากำลังวิ่งอยู่) แล้วขึ้นข้อความ — แต่ **เก็บคำอ่านเท่าที่มาถึงแล้วไว้**
       * ผู้ใช้จะได้อ่านต่อจากตรงนั้นเมื่อกด "โหลดใหม่อีกครั้ง"
       */
      return { status: streaming ? "idle" : state.status, reading: state.reading, error: action.message, fallback: false };
    case "stop":
      return streaming ? { ...state, status: "idle" } : state;
    case "clearError":
      return state.error === null ? state : { ...state, error: null };
    case "restore":
      return { status: action.reading ? "done" : "idle", reading: action.reading, error: null, fallback: false };
    case "reset":
      return READING_INITIAL;
    default:
      return state;
  }
}
