/**
 * 🔐 ด่านสิทธิ์ก่อนเริ่มพิธีดูดวง — ตรรกะล้วน ไม่มี React ไม่มี I/O
 * ===========================================================================
 *
 * ทำไมต้องแยกออกมาจาก `TarotFlow.tsx`
 * ---------------------------------------------------------------------------
 * ทางเข้าสู่ขั้น "ตั้งจิตถามคำถาม" มีหลายทางและเพิ่มขึ้นเรื่อย ๆ:
 *
 *   1. ปุ่มหลักบนหน้าแรก (`handleBeginReading`)
 *   2. ลิงก์ `/?spread=<id>` จากคลังผัง · หน้าคู่มือรายผัง · หน้าหมวด · หน้าไพ่รายใบ
 *   3. ตอนกดยืนยันคำถามจริง (`executeStartSession`)
 *
 * ของเดิมแต่ละทางคัดลอกเงื่อนไขสิทธิ์ไปเขียนเอง — ซึ่งแปลว่าวันใดมีทางที่ 4
 * คนเขียนต้องจำให้ได้ว่ามี "สามชั้น" และเรียงชั้นให้ถูก ไม่งั้นผังใหญ่จะหลุดฟรี
 * หรือคนที่จ่ายเงินแล้วจะโดนกำแพงใส่หน้า · รวมศูนย์ไว้ที่นี่ที่เดียวแล้วให้ทุกทางเรียกใช้
 *
 * ⚠️ ห้ามตัดชั้นใดชั้นหนึ่งทิ้งเด็ดขาด และห้ามเดาสิทธิ์เองฝั่งเบราว์เซอร์
 *    ฟังก์ชันนี้แค่ "อ่านคำตอบที่เซิร์ฟเวอร์ส่งมา" การบังคับสิทธิ์จริงอยู่ฝั่งเซิร์ฟเวอร์ทุกเส้น
 *    (ด่าน `scripts/qa/test-flow-state.ts` หัวข้อ 13 ยิงเคสจริงใส่ฟังก์ชันนี้)
 */

import type { ClientEntitlement } from "@/lib/entitlement/use-entitlement";
import {
  GUEST_BLOCK_REASON,
  describeEntitlement,
  isMasterPersona,
  isStandardSpread,
  type UpgradeReason,
} from "@/lib/entitlement/copy";

/** ผ่าน = พาไปขั้นต่อไปได้ · ไม่ผ่าน = เปิดกำแพงสิทธิ์ด้วยเหตุผลที่ระบุ */
export type AccessDecision = { allowed: true } | { allowed: false; reason: UpgradeReason };

export const ALLOWED: AccessDecision = { allowed: true };

/**
 * "ผู้ถือสิทธิ์เต็ม" — คนที่ไม่ควรเจอกำแพงผังใหญ่หรือปรมาจารย์ลับ
 *
 * รวมกรณีแอดมินปิดระบบสิทธิ์ทั้งเว็บ (`enabled === false`) ด้วย ไม่งั้นการ์ดจะค้าง "ล็อก"
 * ทั้งที่หลังบ้านอนุญาตให้เปิดผังใหญ่แล้ว (`describeEntitlement` คืน `null` ตอนปิด
 * จึงไม่มี `isUnlimited` ให้ดู)
 */
export function isPassHolderOf(ent: ClientEntitlement | null): boolean {
  const view = describeEntitlement(ent);
  return Boolean(view?.isUnlimited || ent?.hasPaidCredits || (ent && !ent.enabled));
}

/**
 * เข้าสู่ขั้นตั้งจิตด้วยผังนี้ได้ไหม — ใช้ร่วมกันทุกทางเข้า
 *
 * ชั้นที่ 1: โควตาหมด / ต้องสมัครก่อนเล่น ➔ เหตุผลตามที่เซิร์ฟเวอร์บอก
 * ชั้นที่ 2: ผังใหญ่ (ไม่ใช่ผังมาตรฐาน) แต่ไม่ใช่ผู้ถือสิทธิ์เต็ม ➔ `grand_spread`
 */
export function decideSpreadAccess(ent: ClientEntitlement | null, spreadId: string): AccessDecision {
  const view = describeEntitlement(ent);
  if (view?.blocked) {
    return { allowed: false, reason: view.blockedReason ?? GUEST_BLOCK_REASON };
  }
  if (!isPassHolderOf(ent) && !isStandardSpread(spreadId)) {
    return { allowed: false, reason: "grand_spread" };
  }
  return ALLOWED;
}

/**
 * ยิงเซสชันเปิดไพ่จริงได้ไหม — สองชั้นแรกเหมือนกัน บวกชั้นที่ 3 เรื่องแม่หมอปรมาจารย์
 */
export function decideStartSessionAccess(
  ent: ClientEntitlement | null,
  spreadId: string,
  personaId: string,
): AccessDecision {
  const spreadDecision = decideSpreadAccess(ent, spreadId);
  if (!spreadDecision.allowed) return spreadDecision;
  if (!isPassHolderOf(ent) && isMasterPersona(personaId)) {
    return { allowed: false, reason: "master_persona" };
  }
  return ALLOWED;
}
