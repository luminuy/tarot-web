"use client";

import { AUTH_HINT_COOKIE_NAME } from "@/lib/auth/cookie-names";

/**
 * 🪶 "เครื่องนี้มีเซสชันอยู่ไหม" — ตอบได้โดยไม่ต้องยิงเซิร์ฟเวอร์
 * ---------------------------------------------------------------------------
 * ทุกหน้าของเว็บมีแถบโปรไฟล์ · การ์ดสิทธิ์ · ประวัติการเปิดไพ่ ซึ่งล้วนต้องรู้ว่า
 * "ใครกำลังใช้อยู่" เดิมจึงยิง `/api/auth/me` (+ `/api/journal`) ทุกครั้งที่โหลดหน้า
 * แม้ผู้ชมจะไม่เคยล็อกอินเลยสักครั้ง — ซึ่งคือผู้ชมเกือบทั้งหมดที่มาจาก Google
 * นั่นคือคำขอที่วิ่งถึง Worker จริงทุกครั้ง (หน้า HTML เสิร์ฟจาก KV แต่ `/api/*` ไม่ใช่)
 *
 * ที่นี่ใช้สองสัญญาณประกอบกัน:
 *   1. คุกกี้ใบ้ `tarot_has_session` — เซิร์ฟเวอร์ตั้งให้ตอนล็อกอินสำเร็จ (ไม่ใช่ httpOnly)
 *   2. เครื่องหมายใน sessionStorage — จำว่า "ถามไปแล้วในแท็บนี้ และคำตอบคือยังไม่ล็อกอิน"
 *
 * ⚠️ ทั้งสองอย่างเป็นแค่ตัวช่วย "ประหยัดคำขอ" เท่านั้น **ห้ามใช้ตัดสินสิทธิ์ใด ๆ**
 * การบังคับสิทธิ์ทั้งหมดยังอยู่ฝั่งเซิร์ฟเวอร์ที่ตรวจคุกกี้เซสชัน httpOnly ตัวจริงเสมอ
 * (ผู้ใช้แก้คุกกี้ใบ้เองได้ ผลที่ได้อย่างมากคือหน้าเว็บยิงถามเซิร์ฟเวอร์เพิ่มอีกครั้ง)
 */

const ANON_MARK_KEY = "tarot_anon_checked";

/** เครื่องนี้เคยล็อกอินและเซสชันยังอยู่หรือไม่ (ดูจากคุกกี้ใบ้) */
export function hasSessionHint(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith(`${AUTH_HINT_COOKIE_NAME}=1`));
}

/**
 * `true` เมื่อ "รู้แน่แล้วว่ายังไม่ล็อกอิน" จึงข้ามการยิง `/api/auth/me` ได้
 * — ต้องไม่มีคุกกี้ใบ้ **และ** เคยถามไปแล้วในแท็บนี้เท่านั้น
 *   (บัญชีที่ล็อกอินไว้ก่อนระบบคุกกี้ใบ้จะมีอยู่ ยังได้ถามครั้งแรกเสมอ ไม่หลุดออกจากระบบ)
 */
export function isKnownAnonymous(): boolean {
  if (typeof window === "undefined") return false;
  if (hasSessionHint()) return false;
  try {
    return window.sessionStorage.getItem(ANON_MARK_KEY) === "1";
  } catch {
    return false;
  }
}

/** จำว่าถามแล้วและยังไม่ล็อกอิน — หน้าถัด ๆ ไปในแท็บนี้จะไม่ยิงซ้ำ */
export function markAnonymousChecked(): void {
  try {
    window.sessionStorage.setItem(ANON_MARK_KEY, "1");
  } catch {
    // โหมดส่วนตัวบางเบราว์เซอร์เขียนไม่ได้ — แค่กลับไปยิงถามเหมือนเดิม ไม่ใช่เรื่องคอขาดบาดตาย
  }
}

/** ลืมเครื่องหมาย "ยังไม่ล็อกอิน" (เรียกเมื่อสถานะเปลี่ยน เช่น เพิ่งล็อกอิน/ออกจากระบบ) */
export function forgetAnonymousMark(): void {
  try {
    window.sessionStorage.removeItem(ANON_MARK_KEY);
  } catch {
    // เขียน sessionStorage ไม่ได้ก็ไม่มีเครื่องหมายให้ลืมอยู่แล้ว
  }
}
