import { NatalChartApp, type NatalCardItem } from "@/components/natal/NatalChartApp";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🪐 เครื่องสร้างผังดวงกำเนิด — ส่วนเดียวของหน้า `/natal-chart` ที่ต้องใช้ JS
 * ⚠️ รับ `cards` เป็น prop ที่คัดฟิลด์แล้ว (`NATAL_CARDS`) ห้าม import ข้อมูลไพ่/ตัวคำนวณดาวที่นี่
 *    ตัวคำนวณโหลดด้วย import() ตอนกดสร้างผัง (ด่าน `test-natal-chart` ข้อ 7)
 */
export function NatalChartRoot({ cards, locale }: { cards: NatalCardItem[]; locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <NatalChartApp cards={cards} />
    </LocaleProvider>
  );
}
