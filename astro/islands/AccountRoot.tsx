import { AccountClient } from "@/components/account/AccountClient";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🔐 หน้าบัญชีสมาชิก — island ก้อนเดียวครอบทั้งหน้า
 *
 * ทำไมต้องเป็น island ทั้งหน้า (ไม่เหมือนหน้าเนื้อหาอื่นที่แยกเนื้อหา SEO ออกมาเป็น HTML ล้วน):
 * ทุกบรรทัดที่หน้านี้แสดงมาจากเซสชันของผู้ใช้ซึ่งอ่านได้หลัง hydrate เท่านั้น
 * (T-28: HTML ที่ออกมาต้องเหมือนกันทุกคน จึงแคชที่ขอบได้โดยไม่รั่วข้อมูลใคร)
 * ไม่มีส่วนไหนของหน้านี้ที่เรนเดอร์ล่วงหน้าแล้วมีประโยชน์เลย — และหน้านี้ `noindex` อยู่แล้ว
 *
 * ⚠️ `client:load` ไม่ใช่ `client:idle` — คนกดเข้ามาหน้านี้เพื่อจัดการบัญชีทันที
 * ถ้ารอ idle จะเห็นโครงร่างเปล่าค้างอยู่หลายร้อย ms ทั้งที่ข้อมูลพร้อมแล้ว
 */
export function AccountRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <AccountClient />
    </LocaleProvider>
  );
}
