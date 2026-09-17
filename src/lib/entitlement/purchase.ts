/**
 * 💰 ตรรกะกลางของเส้นทางเงิน — ตัดสินว่า "แจกโควตาได้หรือไม่" โดยไม่แตะ I/O
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้ (บทเรียน R-08)
 *
 * รอบตรวจ 2026-09-17 พบว่า `checkout` · `checkout/confirm` · `payments/webhook`
 * **ไม่มีสคริปต์ QA ตัวไหนอ้างถึงเลยสักตัว** ทั้งที่เป็นเส้นทางที่เงินจริงวิ่งผ่าน
 * เหตุผลเชิงโครงสร้างคือตรรกะทั้งหมดฝังอยู่ใน route handler ที่ต้องมี
 * `cookies()` / บริบทคำขอของ Next จึงเรียกจากสคริปต์ทดสอบตรง ๆ ไม่ได้
 *
 * ไฟล์นี้จึงแยก **การตัดสินใจ** (บริสุทธิ์ ทดสอบได้) ออกจาก **การลงมือ** (I/O)
 * เหมือนที่ `sw-register.ts` ทำกับ Service Worker ใน R-01
 *
 * ## กฎเหล็กของเส้นทางนี้
 *
 * 1. **กุญแจกันจ่ายซ้ำต้องมาจากที่เดียว** — `purchaseGrantReason()`
 *    `user_bonus` มี `UNIQUE(user_id, reason)` เป็นตัวกันจ่ายซ้ำ ถ้าสองเส้นทาง
 *    (webhook กับ return_uri) สร้างคีย์คนละแบบ ผู้ใช้จะได้เครดิตสองเท่าจากเงินก้อนเดียว
 * 2. **ยอดเงินต้องมาจากฝั่งเซิร์ฟเวอร์เสมอ** — เทียบกับ `pkg.amountSatang` ไม่ใช่ค่าที่ส่งมา
 * 3. **เขียนเครดิตไม่ลง = ตอบไม่ใช่ 2xx** — "จ่ายแล้วแต่ของไม่ถึงมือ" ต้องรู้ทันที (T-04)
 */

import type { CreditPackage } from "./packages";

/** แถว `payments` เท่าที่ตรรกะการแจกโควตาต้องใช้ */
export interface PaymentRowForGrant {
  id: string;
  /** เลขออร์เดอร์ของเส้นทางเติมเครดิต (คอลัมน์ใหม่ตั้งแต่ migrations/0015) */
  order_id?: string | null;
  /** แถวยุคก่อน 0015 เก็บเลขออร์เดอร์ไว้ที่นี่ · แถวจองแม่หมอใช้คอลัมน์นี้จริง ๆ */
  booking_id?: string | null;
  user_id?: string | null;
  ticket_id?: string | null;
  amount_satang: number;
  currency: string;
  status: string;
  provider: string;
}

export type GrantRefusal = {
  ok: false;
  /** ใช้เป็นรหัสให้ด่านตรวจยืนยันได้ว่า "ปฏิเสธด้วยเหตุผลที่ตั้งใจ" ไม่ใช่บังเอิญ */
  code:
    | "bad_input"
    | "not_owner"
    | "order_not_found"
    | "amount_mismatch"
    | "not_paid"
    | "payment_failed";
  status: 400 | 401 | 402 | 404;
  message: string;
};

export type GrantDecision = { ok: true; credits: number; reason: string } | GrantRefusal;

/**
 * 🔑 กุญแจกันจ่ายซ้ำ — **แหล่งความจริงเดียวของทั้งสองเส้นทาง**
 *
 * ⚠️ ห้ามประกอบสตริงนี้เองที่อื่นเด็ดขาด เคยเกิดมาแล้ว: webhook ใช้ `payments.booking_id`
 * ซึ่งเป็น NULL สำหรับการเติมเครดิต (เลขออร์เดอร์อยู่ที่ `order_id` ตั้งแต่ migrations/0015)
 * คีย์จึงกลายเป็นค่าเดียวกันทุกออร์เดอร์ ➔ **ผู้ใช้ซื้อครั้งที่สองแล้วไม่ได้เครดิต**
 * และในครั้งแรกยังได้สองเท่า เพราะ return_uri ใช้คีย์อีกแบบ
 */
export function purchaseGrantReason(orderId: string): string {
  return `purchase_${orderId}`;
}

/** เลขออร์เดอร์ที่แท้จริงของแถวนี้ — รองรับแถวยุคก่อน migrations/0015 */
export function orderIdOfPaymentRow(row: PaymentRowForGrant): string {
  const id = row.order_id || row.booking_id || "";
  return typeof id === "string" ? id : "";
}

/**
 * ตัดสินว่าแถวการชำระเงินนี้แจกโควตาได้หรือไม่ — ไม่แตะฐานข้อมูล ไม่แตะคุกกี้
 *
 * @param allowSimulator เปิดได้เฉพาะนอก production (ดู NODE_ENV ที่จุดเรียก)
 */
export function decidePurchaseGrant(input: {
  row: PaymentRowForGrant | null;
  pkg: CreditPackage | undefined;
  userId: string;
  orderId: string;
  allowSimulator: boolean;
}): GrantDecision {
  const { row, pkg, userId, orderId, allowSimulator } = input;

  if (!pkg || !userId || !orderId) {
    return { ok: false, code: "bad_input", status: 400, message: "ข้อมูลการชำระเงินไม่ถูกต้อง" };
  }

  if (!row) {
    return { ok: false, code: "order_not_found", status: 404, message: "ไม่พบรายการสั่งซื้อนี้ในระบบ" };
  }

  // แถวก่อน migrations/0015 มี `user_id` เป็น NULL เพราะไม่เคยเก็บไว้เลย — ปล่อยผ่านได้เฉพาะแถวเหล่านั้น
  if (row.user_id && row.user_id !== userId) {
    return {
      ok: false,
      code: "not_owner",
      status: 401,
      message: "รายการสั่งซื้อนี้ไม่ได้เป็นของบัญชีที่เข้าสู่ระบบอยู่",
    };
  }

  // รายการที่ผูก `ticket_id` คือค่าปรึกษาแม่หมอ ไม่ใช่การเติมโควตา
  if (row.ticket_id || row.currency !== "THB" || Number(row.amount_satang) !== pkg.amountSatang) {
    return {
      ok: false,
      code: "amount_mismatch",
      status: 400,
      message: "ยอดชำระไม่ตรงกับแพ็กเกจที่สั่งซื้อ",
    };
  }

  const isSimulator = row.provider === "simulator" && allowSimulator;
  if (row.status !== "paid" && !isSimulator) {
    if (row.status === "failed") {
      return {
        ok: false,
        code: "payment_failed",
        status: 402,
        message: "รายการชำระเงินนี้ไม่สำเร็จ กรุณาสั่งซื้อใหม่อีกครั้ง",
      };
    }
    return {
      ok: false,
      code: "not_paid",
      status: 402,
      message: "ระบบยังไม่ได้รับการยืนยันจากผู้ให้บริการชำระเงิน กรุณารอสักครู่แล้วรีเฟรชอีกครั้ง",
    };
  }

  return { ok: true, credits: pkg.credits, reason: purchaseGrantReason(orderId) };
}

/** ข้อความที่ผู้ใช้เห็นเมื่อจ่ายเงินแล้วแต่เขียนเครดิตไม่ลง (T-04) */
export const GRANT_WRITE_FAILED_MESSAGE =
  "ระบบรับชำระเงินเรียบร้อยแล้ว แต่บันทึกโควตาไม่สำเร็จ ทีมงานได้รับแจ้งแล้ว กรุณาติดต่อ support@seertarot.net พร้อมเลขคำสั่งซื้อนี้";
