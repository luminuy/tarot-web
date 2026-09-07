/**
 * 🔐 ความยินยอมการเก็บสถิติการใช้งาน (PDPA Consent)
 * ---------------------------------------------------------------------------
 * ก่อนหน้านี้เว็บตั้ง `analytics_storage: 'granted'` เป็นค่าเริ่มต้น และยิง
 * Meta Pixel `PageView` ตั้งแต่เฟรมแรก โดยไม่เคยถามผู้ใช้เลยสักครั้ง
 * ทั้งที่ผู้ใช้หลักเป็นคนไทยซึ่งอยู่ภายใต้ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล
 *
 * แหล่งความจริงเดียวของสถานะความยินยอม อ่าน/เขียนได้ทั้งจากสคริปต์ตอนบูต
 * และจากแบนเนอร์ · เก็บใน localStorage เพราะเป็นการตัดสินใจต่อเครื่อง
 */

export const CONSENT_STORAGE_KEY = "seertarot_analytics_consent_v1";

/** เหตุการณ์ที่ยิงบน window เมื่อผู้ใช้เพิ่งตัดสินใจ เพื่อให้สคริปต์วัดผลเริ่มทำงานทันที */
export const CONSENT_CHANGED_EVENT = "seertarot:consent-changed";

export type ConsentChoice = "granted" | "denied";

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw === "granted" || raw === "denied" ? raw : null;
  } catch {
    // เบราว์เซอร์บล็อกที่เก็บข้อมูล — ถือว่ายังไม่เคยตัดสินใจ และจะไม่เก็บสถิติ
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // เขียนไม่ได้ก็ยังให้ผลกับเซสชันนี้ผ่าน event ด้านล่าง แค่จะถามใหม่ในครั้งหน้า
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: choice }));
}
