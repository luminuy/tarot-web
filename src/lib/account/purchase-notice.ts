/**
 * 💳 ข้อความแจ้งผลการชำระเงินบนหน้าแรก (`?purchase_error=` · `?credits=`) — A1-07
 * ===========================================================================
 *
 * ค่าที่มากับ query string ใครก็ตั้งเองได้ จึง **ห้ามเอาไปแสดงบนจอตรง ๆ**
 * (แบบเดียวกับ `describeAuthError` ใน `src/lib/auth/use-session.ts`) — ไม่งั้นลิงก์ที่ชี้มาโดเมนเรา
 * จะทำให้กล่อง "การชำระเงินไม่สำเร็จ" แสดงข้อความอะไรก็ได้ที่คนส่งลิงก์พิมพ์มา
 *
 * รับได้สองแบบ แล้วแปลเป็นข้อความที่เราเขียนเองเท่านั้น:
 *   1. รหัส (`grant_failed` · `not_paid` ฯลฯ) — รูปแบบที่เส้น `/api/entitlement/checkout/confirm` ส่งมาแล้ว
 *   2. ประโยคเดิมที่เส้นนั้นเคยส่ง (ตรงตัวอักษรเท่านั้น) — เหลือไว้ให้ลิงก์/แท็บที่ออกก่อนเปลี่ยนเป็นรหัสยังแสดงผลถูก
 * ค่าอื่นทั้งหมดได้ข้อความกลาง
 */

export type PurchaseErrorCode =
  | "invalid"
  | "signin_required"
  | "not_owner"
  | "order_not_found"
  | "amount_mismatch"
  | "payment_failed"
  | "not_paid"
  | "grant_failed"
  | "confirm_failed";

const MESSAGES: Record<PurchaseErrorCode, { th: string; en: string }> = {
  invalid: {
    th: "ข้อมูลการชำระเงินไม่ครบถ้วน กรุณาสั่งซื้อใหม่อีกครั้ง",
    en: "Incomplete payment details. Please try purchasing again.",
  },
  signin_required: {
    th: "กรุณาเข้าสู่ระบบด้วยบัญชีที่สั่งซื้อก่อนยืนยันรายการ",
    en: "Please sign in with the account that made the purchase.",
  },
  not_owner: {
    th: "รายการสั่งซื้อนี้ไม่ได้เป็นของบัญชีที่เข้าสู่ระบบอยู่",
    en: "This order does not belong to the account you are signed in with.",
  },
  order_not_found: {
    th: "ไม่พบรายการสั่งซื้อนี้ในระบบ",
    en: "We could not find this order.",
  },
  amount_mismatch: {
    th: "ยอดชำระไม่ตรงกับแพ็กเกจที่สั่งซื้อ",
    en: "The payment amount does not match the package.",
  },
  payment_failed: {
    th: "รายการชำระเงินนี้ไม่สำเร็จ กรุณาสั่งซื้อใหม่อีกครั้ง",
    en: "This payment was not successful. Please try purchasing again.",
  },
  not_paid: {
    th: "ระบบยังไม่ได้รับการยืนยันจากผู้ให้บริการชำระเงิน กรุณารอสักครู่แล้วรีเฟรชอีกครั้ง",
    en: "We have not received confirmation from the payment provider yet. Please wait a moment and refresh.",
  },
  grant_failed: {
    th: "ระบบรับชำระเงินเรียบร้อยแล้ว แต่บันทึกโควตาไม่สำเร็จ ทีมงานได้รับแจ้งแล้ว กรุณาติดต่อ support@seertarot.net พร้อมเลขคำสั่งซื้อนี้",
    en: "Your payment was received but we could not add the credits. Our team has been notified. Please contact support@seertarot.net with your order number.",
  },
  confirm_failed: {
    th: "การยืนยันรายการชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง",
    en: "Payment confirmation failed. Please try again.",
  },
};

/** ประโยคที่เส้น `/api/entitlement/checkout/confirm` เคยส่งมาก่อนเปลี่ยนเป็นรหัส ➔ รหัส (ตรงตัวอักษรเท่านั้น) */
const LEGACY_MESSAGES: Record<string, PurchaseErrorCode> = {
  "ข้อมูลการชำระเงินไม่ครบถ้วน": "invalid",
  "Incomplete payment details": "invalid",
  "ข้อมูลการชำระเงินไม่ถูกต้อง": "invalid",
  "กรุณาเข้าสู่ระบบด้วยบัญชีที่สั่งซื้อก่อนยืนยันรายการ": "signin_required",
  "รายการสั่งซื้อนี้ไม่ได้เป็นของบัญชีที่เข้าสู่ระบบอยู่": "not_owner",
  "ไม่พบรายการสั่งซื้อนี้ในระบบ": "order_not_found",
  "ยอดชำระไม่ตรงกับแพ็กเกจที่สั่งซื้อ": "amount_mismatch",
  "รายการชำระเงินนี้ไม่สำเร็จ กรุณาสั่งซื้อใหม่อีกครั้ง": "payment_failed",
  "ระบบยังไม่ได้รับการยืนยันจากผู้ให้บริการชำระเงิน กรุณารอสักครู่แล้วรีเฟรชอีกครั้ง": "not_paid",
  "ระบบรับชำระเงินเรียบร้อยแล้ว แต่บันทึกโควตาไม่สำเร็จ ทีมงานได้รับแจ้งแล้ว กรุณาติดต่อ support@seertarot.net พร้อมเลขคำสั่งซื้อนี้":
    "grant_failed",
  "การยืนยันรายการชำระเงินล้มเหลว": "confirm_failed",
  "Payment confirmation failed": "confirm_failed",
};

const FALLBACK = {
  th: "การชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หากถูกตัดเงินแล้วติดต่อ support@seertarot.net",
  en: "The payment did not go through. Please try again. If you were charged, contact support@seertarot.net.",
};

function isCode(value: string): value is PurchaseErrorCode {
  return Object.prototype.hasOwnProperty.call(MESSAGES, value);
}

/** แปลงค่า `?purchase_error=` เป็นข้อความที่เราเขียนเอง — ค่าที่ไม่รู้จักได้ข้อความกลางเสมอ */
export function describePurchaseError(raw: string | null | undefined, lang: "th" | "en" = "th"): string {
  const value = (raw ?? "").trim();
  const code = isCode(value)
    ? value
    : Object.prototype.hasOwnProperty.call(LEGACY_MESSAGES, value)
      ? LEGACY_MESSAGES[value]
      : null;
  return code ? MESSAGES[code][lang] : FALLBACK[lang];
}

/** จำนวนเครดิตจาก `?credits=` — รับเฉพาะตัวเลขล้วน 1–4 หลัก นอกนั้นคืนสตริงว่าง */
export function safeCreditCount(raw: string | null | undefined): string {
  return raw && /^\d{1,4}$/.test(raw) ? raw : "";
}
