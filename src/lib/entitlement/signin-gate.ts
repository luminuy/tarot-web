import { DAILY_LIMIT, GUEST_BLOCK_REASON, REQUIRE_SIGNUP_TO_READ } from "@/lib/entitlement/limits";

/**
 * ด่าน "ต้องล็อกอินก่อนเปิดไพ่" — **ต้องทำงานแม้ธงระบบสิทธิ์จะถูกปิด**
 * ---------------------------------------------------------------------
 * ⚠️ บทเรียนจาก production (2026-09-09): ด่านสิทธิ์ทุกด่านเคยถูกครอบด้วย
 * `if (await isEntitlementEnabled())` ทั้งก้อน · บน production ธง
 * `app:flag:entitlement.enforced` ถูกตั้งเป็น `false` ค้างไว้ ทุกด่านจึงถูกข้ามหมด
 * ใครก็เปิดไพ่ได้ไม่จำกัดโดยไม่ต้องสมัครสมาชิก และการแก้ `GUEST_LIMIT` เป็น 0
 * ก็ไม่มีผลอะไรเลย เพราะโค้ดไม่เคยเดินมาถึงบรรทัดนั้น
 *
 * ธงนั้นคือสวิตช์ฉุกเฉินของ **การนับโควตา** (กันโควตาพังตอน D1/KV ล่ม)
 * ส่วน "ต้องสมัครสมาชิกก่อนใช้ฟรี" คือ **นโยบายผลิตภัณฑ์** ที่เจ้าของสั่งไว้ไม่มีเงื่อนไข
 * สองเรื่องนี้จึงต้องแยกกัน — ปิดสวิตช์โควตาได้ แต่ห้ามเปิดเว็บให้คนไม่ล็อกอินโดยไม่ตั้งใจ
 *
 * ไฟล์นี้ไม่แตะฐานข้อมูลและไม่ import `entitlement.ts` — เรียกจาก route ไหนก็ได้ราคาถูก
 */

/** viewer แบบบางที่สุดที่ด่านนี้ต้องรู้ (ตรงกับ `Viewer` ใน entitlement.ts) */
export interface SignInGateViewer {
  kind: "guest" | "member";
}

/** true = ต้องกั้นไว้ก่อน เพราะเว็บบังคับสมัครสมาชิกและคนนี้ยังไม่ล็อกอิน */
export function isSignInRequired(viewer: SignInGateViewer): boolean {
  return REQUIRE_SIGNUP_TO_READ && viewer.kind !== "member";
}

/** เหตุผลที่ส่งให้ UI เลือกถ้อยคำ — `signup_required` ไม่ใช่ `guest_used` */
export const SIGN_IN_GATE_REASON = GUEST_BLOCK_REASON;

/** ข้อความสำหรับด่านเปิดไพ่ */
export const SIGN_IN_GATE_MESSAGE = `สมัครสมาชิกฟรีหรือเข้าสู่ระบบก่อนเปิดไพ่ แล้วดูดวงได้ฟรีวันละ ${DAILY_LIMIT} ครั้ง`;

/** ข้อความสำหรับด่านคุยต่อกับแม่หมอ (สมาชิกเท่านั้นมาแต่ไหนแต่ไร) */
export const MEMBERS_ONLY_CHAT_MESSAGE =
  "สมัครสมาชิกเพื่อถามแม่หมอต่อ และเก็บดวงไว้ดูย้อนหลังได้ทุกเครื่อง";
