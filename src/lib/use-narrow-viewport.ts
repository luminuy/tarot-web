"use client";

import { useSyncExternalStore } from "react";

/**
 * 📱 `useNarrowViewport()` — "ตอนนี้อยู่บนจอมือถือหรือเปล่า" แบบไม่มี dependency
 * ---------------------------------------------------------------------------
 * ใช้เส้นแบ่งเดียวกับ `sm:` ของ Tailwind (640px) เพื่อให้ตรรกะฝั่ง JS กับคลาสฝั่ง CSS
 * พูดตรงกันเสมอ — ถ้าใช้ตัวเลขคนละตัว จะเกิดช่วงกว้างที่ "โค้ดคิดอย่าง ตาเห็นอีกอย่าง"
 *
 * เขียนด้วย `useSyncExternalStore` ตามแพตเทิร์นเดียวกับ `use-motion-safe.ts`:
 *   • ไม่ลากไลบรารีไหนเข้าบันเดิลเลยสักไบต์
 *   • ปรับตามทันทีเมื่อผู้ใช้หมุนจอหรือย่อหน้าต่าง
 *   • `getServerSnapshot` คืน `false` (ถือว่าจอกว้าง) ให้ตรงกับ HTML ที่ prerender ไว้
 *
 * ⚠️ ใช้กับคอมโพเนนต์ที่ **ไม่ได้ prerender** เท่านั้น (เช่นผังไพ่ที่โผล่หลังผู้ใช้กดเริ่มดูดวง)
 *    ถ้าเอาไปใช้กับหน้าที่เรนเดอร์ฝั่งเซิร์ฟเวอร์ ผู้ใช้มือถือจะเห็นเลย์เอาต์จอกว้างแวบหนึ่ง
 *    ก่อนสลับ — ให้ใช้คลาส `sm:` ของ Tailwind แทนในกรณีนั้น
 */

const QUERY = "(max-width: 639.98px)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** true = จอแคบกว่าเส้นแบ่ง `sm:` ของ Tailwind (มือถือ) */
export function useNarrowViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
