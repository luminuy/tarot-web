import { JournalApp } from "@/components/journal/JournalApp";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * ✦ สมุดดวงของฉัน — island ก้อนเดียวครอบทั้งหน้า (เหตุผลเดียวกับ `AccountRoot`)
 * ทุกบรรทัดมาจากเครื่อง/เซสชันของผู้ใช้ซึ่งอ่านได้หลัง hydrate เท่านั้น — HTML เหมือนกันทุกคน แคชที่ขอบได้
 * ⚠️ `client:load` — คนเปิดหน้านี้เพื่ออ่าน/เขียนสมุดทันที
 */
export function JournalRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <JournalApp />
    </LocaleProvider>
  );
}
