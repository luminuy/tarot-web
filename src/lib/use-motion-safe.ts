"use client";

import { useSyncExternalStore } from "react";

/**
 * ♿ `useMotionSafe()` ฉบับไม่พึ่ง `motion` เลยสักไบต์
 * ---------------------------------------------------------------------------
 * เดิมฮุกนี้อยู่ใน `@/lib/motion` และเรียก `useReducedMotion()` ของไลบรารี `motion`
 * ผลข้างเคียงคือ **ทุกไฟล์ที่อยากได้แค่ค่า boolean ตัวเดียว ต้องลากไลบรารี 40 KB (gzip)
 * เข้าบันเดิลไปด้วย** — และเพราะ `lib/motion.ts` ถูก import จากเปลือกของหน้าแรก
 * ไลบรารีทั้งก้อนจึงติดอยู่ในบันเดิลตั้งต้นของ `/` และ `/en` ทั้งที่แอนิเมชันจริง ๆ
 * อยู่หลัง `next/dynamic` หมดแล้ว (วัดจริง 2026-09-09: chunk `6928-*` = 40,675 B gzip)
 *
 * ตัวนี้ใช้ `matchMedia` ตรง ๆ ผ่าน `useSyncExternalStore` จึง:
 *   • ไม่มี dependency เลย (0 B เพิ่มในบันเดิล)
 *   • ไม่เกิด hydration mismatch — `getServerSnapshot` คืน `true` เสมอ ตรงกับ HTML ที่ prerender ไว้
 *   • อัปเดตทันทีเมื่อผู้ใช้สลับการตั้งค่าระบบระหว่างใช้งาน (ของเดิมก็ทำได้ ไม่ถอยหลัง)
 *
 * ⚠️ ห้าม import อะไรจาก `motion/react` ในไฟล์นี้เด็ดขาด — นั่นคือทั้งหมดที่ไฟล์นี้มีไว้กัน
 */

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** true = ผู้ใช้ไม่ได้ขอลดการเคลื่อนไหว → เล่นแอนิเมชันได้ตามปกติ */
function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return !window.matchMedia(QUERY).matches;
}

/**
 * ฝั่งเซิร์ฟเวอร์ถือว่า "เล่นได้" เสมอ
 * เหตุผล: HTML ที่ prerender ไว้ถูกใช้ร่วมกันทุกคน จะเดาค่าของเครื่องผู้ใช้ไม่ได้
 * คืน `true` ให้ตรงกับเรนเดอร์แรกฝั่งไคลเอนต์ แล้วค่อยแก้เป็นค่าจริงหลัง hydrate (ISSUE-008)
 */
function getServerSnapshot(): boolean {
  return true;
}

export function useMotionSafe(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
