/**
 * 🗑️ ลบข้อมูลและบัญชีทั้งหมดตาม PDPA — ตรรกะกลาง ไม่ผูกกับ React
 * ===========================================================================
 *
 * ปุ่มนี้ปรากฏสองที่ที่เรนเดอร์คนละแบบ:
 *
 *   • `/account` — อยู่ใน island ที่ hydrate จริง (`AccountClient`) จึงเรียกจาก `onClick` ของ React
 *   • `/privacy` · `/en/privacy` — เป็น HTML ล้วนที่ไม่ hydrate เลย จึงเรียกจาก
 *     `astro/scripts/delete-all-data.ts` ซึ่งเป็นสคริปต์ธรรมดาไม่กี่บรรทัด
 *
 * ⚠️ **ห้ามคัดลอกตรรกะไปไว้ที่ปลายทางทั้งสอง** — นี่คือขั้นตอนที่ลบข้อมูลผู้ใช้ถาวร
 * ตรรกะที่อยู่สองที่จะหลุดจากกันเสมอ แล้ววันหนึ่งทางใดทางหนึ่งจะลบไม่ครบโดยไม่มีใครรู้
 *
 * ⚠️ **ต้องเป็น `clear()` ทั้งก้อนเท่านั้น ห้ามวนลบจากทะเบียนคีย์** — ทะเบียนที่ขาดไป
 * หนึ่งคีย์แปลว่าข้อมูลผู้ใช้ยังค้างอยู่จริงทั้งที่บอกเขาว่าลบแล้ว (ดู `src/lib/storage/keys.ts`)
 * ด่าน `test-code-debt` เฝ้าไฟล์นี้อยู่
 */

const CONFIRM_TH =
  "ยืนยันการลบข้อมูลทั้งหมด?\n\nการดำเนินการนี้จะลบ:\n• ประวัติการเปิดไพ่ทั้งหมด (ทั้งในเครื่องและบนบัญชี)\n• ข้อมูลบัญชีผู้ใช้และบันทึกส่วนตัว\n• การตั้งค่าทั้งหมด\n\nข้อมูลจะไม่สามารถกู้คืนได้";

const CONFIRM_EN =
  "Confirm permanent deletion of all data?\n\nThis action will delete:\n• All reading history (both local and cloud)\n• User account details and personal reflection notes\n• All preferences and settings\n\nThis action cannot be undone.";

/** ข้อความยืนยันก่อนลบ — แยกออกมาให้ทั้งสองปลายทางถามคำถามเดียวกันเป๊ะ */
export function deleteAllDataConfirmMessage(isEn: boolean): string {
  return isEn ? CONFIRM_EN : CONFIRM_TH;
}

/**
 * ถามยืนยัน → ลบบนเซิร์ฟเวอร์ → ล้างที่เก็บในเครื่อง → พากลับหน้าแรก
 *
 * คืนค่า `false` เมื่อผู้ใช้กดยกเลิก (ปลายทางจะได้เลิกโชว์สถานะ "กำลังลบ")
 * ถ้าลบสำเร็จจะไม่คืนค่าอะไรที่ใช้ได้ เพราะหน้าถูกพาออกไปแล้ว
 */
export async function deleteAllData(isEn: boolean): Promise<boolean> {
  if (!window.confirm(deleteAllDataConfirmMessage(isEn))) return false;

  /* ฝั่งเซิร์ฟเวอร์ล้มก็ต้องล้างเครื่องต่อให้จบ — ผู้ใช้กดลบแล้ว ห้ามค้างครึ่งทาง
     (เคสจริง: ออฟไลน์ หรือเซสชันหมดอายุจน API ตอบ 401) */
  try {
    await fetch("/api/account", { method: "DELETE" }).catch(() => {});
  } catch {
    // ไม่มีอะไรให้ทำต่อ — ขั้นล้างเครื่องข้างล่างสำคัญกว่า
  }

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // โหมดส่วนตัว/บล็อกที่เก็บข้อมูล — ไม่มีอะไรให้ลบอยู่แล้ว
  }

  window.location.href = isEn ? "/en" : "/";
  return true;
}
