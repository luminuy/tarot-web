import { settleConsultationPayment, type SettleState } from "@/lib/marketplace/booking.repo";
import { COMP_PROVIDER, createPaymentRecord } from "@/lib/marketplace/payments.repo";
import { normalizeEmail } from "@/lib/users/users.repo";

/**
 * ✦ บัญชีที่ปรึกษาแม่หมอคนจริงได้โดยไม่ต้องจ่ายเงิน (เจ้าของสั่ง 2026-10-25: "ดูแม่หมอจริงไม่จ่ายตังค์")
 * ---------------------------------------------------------------------------
 * แยกจาก `UNLIMITED_EMAILS` (บัญชี VIP) โดยตั้งใจ — สิทธิ์ VIP ข้ามแค่ค่า AI ของเว็บ
 * ส่วนสิทธิ์นี้คือเวลาของแม่หมอคนจริง จึงไม่ติดไปกับหุ้นส่วน/ทีมงานทุกคนที่อยู่ในรายชื่อ VIP
 *
 * รายชื่ออยู่ในโค้ด ไม่ใช่ secret: อีเมลแบรนด์เป็นของสาธารณะอยู่แล้ว และการเพิ่ม/ถอดต้องผ่าน PR ให้เห็นในประวัติ
 * ต้องล็อกอินและยืนยันอีเมลแล้วเท่านั้น (`ownsVerifiedEmail`) — สมัครด้วยอีเมลนี้โดยไม่ยืนยันไม่ได้สิทธิ์ (A1-11)
 */
const FREE_CONSULT_EMAILS: readonly string[] = ["seerada.tarot@gmail.com"];

export function isFreeConsultEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const target = normalizeEmail(email);
  return FREE_CONSULT_EMAILS.some((e) => normalizeEmail(e) === target);
}

/** บัญชีที่ล็อกอินอยู่ได้สิทธิ์ปรึกษาฟรีไหม (อีเมลอยู่ในรายชื่อ + ยืนยันอีเมลแล้วตามฐานข้อมูล) */
export async function hasFreeConsult(user: { id: string; email?: string | null } | null | undefined): Promise<boolean> {
  if (!user?.email || !isFreeConsultEmail(user.email)) return false;
  const { ownsVerifiedEmail } = await import("@/lib/security/privileged");
  return ownsVerifiedEmail(user.id, user.email);
}

/**
 * ยืนยันการจองฟรีแทนหน้าจ่ายเงิน — บันทึกแถว payments ยอด 0 (`provider = comp`) แล้วผ่านจุดยืนยันจุดเดียวกับเงินจริง
 * (`settleConsultationPayment`) ตั๋วจึงเข้าคิว/ได้นัด ส่งอีเมลยืนยัน และแม่หมอเรียกคิวได้ตามปกติ
 * ยอด 0 = ไม่นับเป็นรายได้แม่หมอ ไม่นับเป็นยอดขาย และไม่ยิง GA4 purchase
 */
export async function confirmComplimentaryConsultation(input: {
  ticketId: string;
  bookingId: string;
  userId: string;
  email: string;
}): Promise<SettleState> {
  const payment = await createPaymentRecord({
    bookingId: input.bookingId,
    ticketId: input.ticketId,
    userId: input.userId,
    provider: COMP_PROVIDER,
    providerRef: `comp_${input.bookingId}`,
    amountSatang: 0,
    currency: "THB",
  });
  return settleConsultationPayment(payment.id, { email: input.email });
}
