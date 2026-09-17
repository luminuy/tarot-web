/**
 * ✉️ ซองจดหมายของคำตอบ API — รูปเดียวสำหรับของใหม่ · ตัวอ่านที่เข้าใจของเก่าทั้งสี่แบบ
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้ (บทเรียน R-29)
 *
 * รอบตรวจ 2026-09-17 นับซองจดหมายได้ **4 แบบใน 68 route**:
 *
 * | รูป | จำนวน |
 * | :--- | ---: |
 * | `{ error }` | 218 |
 * | `{ ok }` | 24 |
 * | `{ success }` | 8 |
 * | `{ message }` | 2 |
 *
 * ความสำเร็จสื่อด้วย `ok` บ้าง `success` บ้าง `message` บ้าง หรือด้วย **การไม่มี `error`**
 * แล้วแต่เส้นทาง — ทุกจุดที่เรียกจึงต้องรู้เป็นราย ๆ ไปว่าคีย์ไหนแปลว่าสำเร็จ
 * นี่คือเหตุผลที่แผงแอดมิน 9 แผงเขียนชุด fetch/loading/error เองซ้ำกันทั้ง 9 ครั้ง (R-28)
 *
 * ## 📌 ขอบเขตที่ทำจริงในรอบนี้ และเหตุผล
 *
 * ผลตรวจเสนอให้ "ย้าย 8 + 2 จุดก่อน" — **ตรวจโค้ดจริงแล้วพบว่ามากกว่านั้น**
 * (`{ success }` มี 20 กว่าจุด ไม่ใช่ 8) การเปลี่ยนรูปคำตอบของ route ที่มีผู้ใช้อยู่จริง
 * ต้องแก้ทั้งฝั่งส่งและฝั่งรับพร้อมกัน ถ้าพลาดจุดใดจุดหนึ่ง **หน้าเว็บจะพังเงียบ ๆ**
 * โดยที่ typecheck ไม่ฟ้อง เพราะทั้งสองฝั่งคุยกันด้วย JSON
 *
 * รอบนี้จึงทำสองอย่างที่ปลดล็อก R-28 ได้จริงโดยไม่ต้องแตะ route ที่ยังทำงานอยู่:
 *
 * 1. **`apiOk()` / `apiFail()`** — รูปเดียวสำหรับ route ใหม่ทุกเส้นนับจากนี้
 * 2. **`readEnvelope()`** — ตัวอ่านที่เข้าใจทั้งสี่แบบ ฝั่งเรียกจึงเขียนครั้งเดียวจบ
 *
 * ด่าน `scripts/qa/test-api-envelope.ts` ตรึงรายชื่อ route ที่ยังใช้รูปเก่าไว้เป็น **ratchet**
 * (รายชื่อลดได้อย่างเดียว ห้ามเพิ่ม) — route ใหม่ที่ใช้รูปเก่าจะถูกฟ้องทันที
 */

import { NextResponse } from "next/server";

/** รูปมาตรฐานของคำตอบที่สำเร็จ */
export type ApiOk<T> = { ok: true } & T;

/** รูปมาตรฐานของคำตอบที่ล้มเหลว — `error` คงไว้เพื่อให้ของเก่า 218 จุดยังอ่านได้ */
export interface ApiFail {
  ok: false;
  error: string;
  /** รหัสให้เครื่องอ่าน (ฝั่ง UI ใช้แยกกรณีโดยไม่ต้องเทียบข้อความภาษาไทย) */
  code?: string;
}

/** คำตอบสำเร็จ — `{ ok: true, ...data }` */
export function apiOk<T extends Record<string, unknown>>(
  data: T = {} as T,
  init?: ResponseInit,
): NextResponse {
  return NextResponse.json({ ok: true, ...data }, init);
}

/**
 * คำตอบล้มเหลว — `{ ok: false, error }` พร้อม status ที่ไม่ใช่ 2xx เสมอ
 *
 * ⚠️ `status` บังคับให้ระบุ และต้องไม่ใช่ 2xx — "ล้มเหลวแต่ตอบ 200" คือรูปแบบ
 * ที่ทำให้ฝั่งเรียกเข้าใจว่าสำเร็จ และเป็นสิ่งที่ด่านเส้นทางเงิน (R-08) มีไว้จับพอดี
 */
export function apiFail(error: string, status: number, code?: string): NextResponse {
  const safeStatus = status >= 200 && status < 300 ? 500 : status;
  return NextResponse.json({ ok: false, error, ...(code ? { code } : {}) }, { status: safeStatus });
}

/** ผลการอ่านซองจดหมาย — สรุปจากทุกรูปให้เหลือคำตอบเดียว */
export interface ReadEnvelopeResult<T = Record<string, unknown>> {
  ok: boolean;
  /** ข้อความผิดพลาดที่แสดงให้ผู้ใช้เห็นได้ (ว่างเมื่อสำเร็จ) */
  error: string;
  /** เนื้อคำตอบทั้งก้อน — ฝั่งเรียกหยิบฟิลด์ที่ต้องการเอง */
  data: T;
}

/**
 * อ่านคำตอบ JSON ให้เข้าใจได้ทุกรูปที่รีโปนี้เคยใช้
 *
 * ลำดับการตัดสิน — **เรียงจากสัญญาณที่ชัดที่สุดไปหาที่อ้อมที่สุด**
 *   1. `ok` เป็น boolean ➔ เชื่อค่านั้น
 *   2. `success` เป็น boolean ➔ เชื่อค่านั้น
 *   3. มี `error` ที่เป็นข้อความ ➔ ล้มเหลว
 *   4. ไม่มีอะไรเลย ➔ ใช้ status ของ HTTP เป็นตัวตัดสิน (พารามิเตอร์ `httpOk`)
 *
 * ⚠️ `message` **ไม่ถูกใช้ตัดสินว่าสำเร็จหรือไม่** — สองจุดที่ใช้รูปนั้นส่ง `message`
 * มาคู่กับ `success` อยู่แล้ว และมี route อื่นที่ส่ง `message` มาพร้อมความล้มเหลวด้วย
 */
export function readEnvelope<T = Record<string, unknown>>(
  body: unknown,
  httpOk: boolean,
): ReadEnvelopeResult<T> {
  const obj = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const errorText =
    typeof obj.error === "string" && obj.error.trim() !== ""
      ? obj.error
      : typeof obj.message === "string" && !httpOk
        ? obj.message
        : "";

  let ok: boolean;
  if (typeof obj.ok === "boolean") ok = obj.ok;
  else if (typeof obj.success === "boolean") ok = obj.success;
  else if (errorText !== "") ok = false;
  else ok = httpOk;

  return {
    ok,
    error: ok ? "" : errorText || "ระบบตอบกลับไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    data: obj as T,
  };
}
