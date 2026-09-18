/**
 * 🗑️ ปุ่มลบข้อมูล PDPA ของหน้านโยบาย — สคริปต์ธรรมดาแทน island ทั้งก้อน
 * ===========================================================================
 *
 * `/privacy` กับ `/en/privacy` เคยโหลด React ทั้ง 184 KB เพียงเพื่อปุ่มนี้ปุ่มเดียว
 * (ตรวจโค้ดแล้ว `DeleteAllDataButton` มี `useState` ตัวเดียวคือป้าย "กำลังลบข้อมูล...")
 *
 * ตอนนี้ปุ่มถูกเรนเดอร์เป็น HTML ล้วนจากคอมโพเนนต์ตัวเดิม แล้วไฟล์นี้ผูกพฤติกรรมให้
 * ตรรกะการลบยังเป็นก้อนเดียวกับที่ `/account` ใช้ (`@/lib/account/delete-all-data`)
 *
 * ⚠️ ห้ามนำเข้าไฟล์นี้ในหน้าที่ hydrate ปุ่มนั้นอยู่แล้ว (เช่น `/account`)
 *    ไม่งั้นจะได้ตัวจัดการสองตัวบนปุ่มเดียว = ถามยืนยันสองรอบ
 * ⚠️ ห้ามนำเข้าอะไรที่ลาก React ตามมา
 */

import { deleteAllData } from "@/lib/account/delete-all-data";

const button = document.querySelector<HTMLButtonElement>("[data-delete-all-data]");

if (button) {
  const label = button.querySelector<HTMLElement>("[data-delete-all-data-label]");
  const isEn = button.dataset.locale === "en";
  const labelIdle = button.dataset.labelIdle ?? label?.textContent ?? "";
  const labelBusy = button.dataset.labelBusy ?? labelIdle;

  button.addEventListener("click", async () => {
    if (button.disabled) return;

    button.disabled = true;
    if (label) label.textContent = labelBusy;

    /* คืนปุ่มให้กดได้เมื่อผู้ใช้กดยกเลิกตอนถามยืนยัน — ถ้าลบจริงหน้าจะถูกพาออกไปแล้ว
       จึงไม่มีใครเห็นการคืนสถานะตรงนี้ (กติกาเดียวกับ `setLoading(false)` ฝั่ง React) */
    const proceeded = await deleteAllData(isEn);
    if (!proceeded) {
      button.disabled = false;
      if (label) label.textContent = labelIdle;
    }
  });
}
