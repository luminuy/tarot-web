/**
 * 🧹 ล้างข้อมูลรายบุคคลที่เก็บในเบราว์เซอร์ตอนออกจากระบบ (A5-05 · A5-06)
 * ===========================================================================
 *
 * สมาชิกที่เปิดสมุดดวง/หน้าแรก ได้สำเนาสมุดจากเซิร์ฟเวอร์ (คำถาม · ไพ่ · คำอ่าน · บันทึก)
 * เก็บไว้ใน localStorage ข้ามเซสชัน · ถ้าออกจากระบบแล้วไม่ล้าง เครื่องที่ใช้ร่วมกันจะ:
 *   1. ให้คนถัดไปเปิด `/journal` แล้วเห็นสมุดของเจ้าของบัญชีเดิม
 *   2. นำ "ประวัติผู้เยี่ยมชม" (ซึ่งที่จริงคือสมุดของคนก่อน) เข้าบัญชีของคนที่ล็อกอินถัดไปถาวร
 *   3. ใช้ภาพสิทธิ์ (โควตา/สตรีก) ของคนก่อนกับคนที่ล็อกอินถัดไปในแท็บเดิม
 *
 * ต่างจาก `delete-all-data.ts` (ปุ่ม PDPA ที่ `clear()` ทั้งก้อน) — ตรงนี้คือการออกจากระบบ
 * ธรรมดา จึงลบเฉพาะคีย์ที่ผูกกับตัวบุคคล และเก็บค่าตั้งของเครื่องไว้ (ภาษา · โหมดสี · เสียง ·
 * ความยินยอมคุกกี้) ไม่ให้ผู้ใช้ต้องตั้งใหม่ทุกครั้งที่ออกจากระบบ
 *
 * ⚠️ เพิ่มคีย์ใหม่ใน `src/lib/storage/keys.ts` ที่เก็บข้อมูลของผู้ใช้คนใดคนหนึ่ง ➔ ใส่ในรายการนี้ด้วย
 */
import { STORAGE_KEYS } from "@/lib/storage/keys";

const PER_USER_KEYS = [
  STORAGE_KEYS.journal,
  STORAGE_KEYS.journalPendingPatches,
  STORAGE_KEYS.journalTrimNotice,
  STORAGE_KEYS.entitlementSnapshot,
  STORAGE_KEYS.flowState,
  STORAGE_KEYS.mySign,
  STORAGE_KEYS.nickname,
  STORAGE_KEYS.pendingCheckout,
  STORAGE_KEYS.questionPrefill,
  STORAGE_KEYS.customSpreadLaunch,
] as const;

export function clearPerUserBrowserData(): void {
  if (typeof window === "undefined") return;
  // บางคีย์อยู่ localStorage บางคีย์อยู่ sessionStorage — ลบจากทั้งสองที่ ไม่ต้องจำว่าคีย์ไหนอยู่ไหน
  for (const store of [() => window.localStorage, () => window.sessionStorage]) {
    try {
      const s = store();
      for (const key of PER_USER_KEYS) s.removeItem(key);
    } catch {
      // โหมดส่วนตัว/บล็อกที่เก็บข้อมูล — ไม่มีอะไรให้ลบอยู่แล้ว
    }
  }
}
