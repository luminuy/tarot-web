import { BirthCardCalculator } from "@/components/encyclopedia/BirthCardCalculator";
import type { BirthCardItem } from "@/lib/tarot/birth-card";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🎂 เครื่องคำนวณไพ่ประจำตัว — ส่วนเดียวของหน้านี้ที่ต้องใช้ JS
 *
 * ⚠️ รับ `majorCards` เป็น prop เพราะข้อมูลถูกคัดฟิลด์มาแล้วจากฝั่งหน้า
 *    (ดูคำเตือนเรื่องงบ HTML ใน `src/app/_shared/pages/birth-card-th.tsx`)
 */
export function BirthCardCalculatorRoot({
  majorCards,
  locale,
}: {
  majorCards: BirthCardItem[];
  locale: Locale;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <BirthCardCalculator majorCards={majorCards} />
    </LocaleProvider>
  );
}
