/**
 * 🧯 ตัวรายงานข้อผิดพลาดที่ถูก `catch` ไว้ — **ทางเดียวที่ความล้มเหลวจะถูกมองเห็น**
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้ (บทเรียน R-27)
 *
 * รอบตรวจ 2026-09-17 นับ `catch` ได้ **448 จุด 4 แนวทางที่เข้ากันไม่ได้**
 * (กลืนเงียบ 14 · `console.error` 99 · `console.warn` 61 · โยนต่อ 83)
 * และ grep หา `captureError|recordMetric|trackError|logError|reportError` ทั้งรีโปได้ **ศูนย์**
 *
 * ผลจริง: ความล้มเหลวฝั่ง Worker บน production **มองเห็นได้เฉพาะตอนมีคนนั่งดู log อยู่**
 * ทั้งที่ `/admin` มี `SystemHealthPanel` กับ `AiHealthPanel` เป็นพื้นผิวสำหรับดูอยู่แล้ว
 * แต่ไม่มี `catch` ไหนป้อนข้อมูลให้มันเลยสักจุด
 *
 * ## สิ่งที่ไฟล์นี้ทำ (และไม่ทำ)
 *
 * **ทำ** — ส่งตัวนับเข้า `recordEvent()` ซึ่งเป็นท่อสถิติที่ `/admin` อ่านอยู่แล้ว
 * และพิมพ์ log ที่มีรูปแบบเดียวกันทุกจุด
 *
 * **ไม่ทำ** — ไม่ส่งข้อความ error ดิบเข้า metric เด็ดขาด `recordEvent` เขียนลง KV
 * และข้อความ error มี PII ปนได้ (อีเมล · URL ที่มีโทเคน · เนื้อคำถามของผู้ใช้)
 * ชื่อ metric จึงประกอบจาก `scope` ที่ผู้เรียกกำหนดเองเท่านั้น
 *
 * ## วิธีใช้
 *
 * ```ts
 * try { ... } catch (err) {
 *   recordCaughtError("read.karmic_memory", err);   // ➔ metric `err:read.karmic_memory`
 * }
 * ```
 *
 * `catch` ที่ตั้งใจกลืนจริง ๆ (เช่น `localStorage` ในโหมดส่วนตัว) ไม่ต้องเรียกฟังก์ชันนี้
 * แต่ **ต้องเขียนคอมเมนต์กำกับว่าทำไมถึงกลืนได้** — ด่าน `scripts/qa/test-catch-telemetry.ts` บังคับไว้
 */

import { recordEvent } from "@/lib/stats/record";

/** ชื่อ scope ที่ยอมรับ — ตัวอักษรเล็ก ตัวเลข จุด ขีดล่าง เท่านั้น (กัน PII หลุดเข้า metric) */
const SAFE_SCOPE = /^[a-z0-9_]+(\.[a-z0-9_]+)*$/;

/** ตัดข้อความ error ให้สั้นและปลอดภัยพอจะขึ้น log ได้ */
function describe(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  return Object.prototype.toString.call(err);
}

/**
 * บันทึกว่ามี error ถูกจับได้ที่ `scope` — เข้าทั้งตัวนับของ `/admin` และ log
 *
 * ปลอดภัยที่จะเรียกจากทุกที่ ทั้งฝั่งเซิร์ฟเวอร์และไคลเอนต์ และ **จะไม่โยน error ออกมาเอง**
 * (ตัวรายงานที่พังแล้วทำให้เส้นทางหลักพังตามคือสิ่งที่แย่กว่าไม่มีตัวรายงาน)
 */
export function recordCaughtError(scope: string, err: unknown): void {
  try {
    const safe = SAFE_SCOPE.test(scope) ? scope : "unknown_scope";
    recordEvent(`err:${safe}`);
    console.error(`[caught] ${safe} — ${describe(err)}`);
  } catch {
    /* ตัวรายงานพังเอง — ห้ามลากเส้นทางหลักล้มตาม และไม่มีที่ไหนให้รายงานต่อแล้ว */
  }
}

/**
 * เหมือน `recordCaughtError` แต่สำหรับกรณีที่ระบบ **เสื่อมลงแต่ยังทำงานต่อได้**
 * แยก metric กันเพื่อให้ `/admin` แยก "พังจริง" ออกจาก "ถอยไปใช้ทางสำรอง" ได้
 */
export function recordDegraded(scope: string, detail?: unknown): void {
  try {
    const safe = SAFE_SCOPE.test(scope) ? scope : "unknown_scope";
    recordEvent(`degraded:${safe}`);
    console.warn(`[degraded] ${safe}${detail === undefined ? "" : ` — ${describe(detail)}`}`);
  } catch {
    /* เหมือนข้างบน */
  }
}
