import type { Metadata } from "next";

/**
 * 🔐 metadata ของหน้าบัญชีสมาชิก `/account`
 * ---------------------------------------------------------------------------
 * แยกไฟล์ออกมาเพราะหน้านี้ถูกเรนเดอร์โดย Astro (ดู `astro/pages/account.astro`)
 * แต่ยังใช้รูปข้อมูล `Metadata` ของ Next ชุดเดียวกับทั้งเว็บ — `renderMetadata()`
 * ของ Astro อ่านอ็อบเจกต์เดียวกันนี้แล้วเขียนแท็กออกมาให้เหมือน Next เป๊ะ
 *
 * ⚠️ `robots: { index: false, follow: false }` ห้ามหายไปเด็ดขาด (S-03)
 * หน้านี้เป็นหน้าส่วนตัว — ต้องประกาศ noindex ในตัวหน้าเอง ไม่ใช่พึ่ง `robots.txt` อย่างเดียว
 */
export const accountMetadataTh: Metadata = {
  title: "บัญชีและประวัติการดูดวง | Sacred Account & Archive",
  description: "จัดการข้อมูลส่วนบุคคล สิทธิ์ความเป็นส่วนตัว และบันทึกประวัติการดูดวงไพ่ทาโรต์",
  robots: { index: false, follow: false },
};
