import { CardsExplorer } from "@/components/encyclopedia/CardsExplorer";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🔍 ช่องค้นหา + ตัวกรองไพ่ 78 ใบ — ส่วนเดียวของหน้า `/cards` ที่ต้องใช้ JS
 *
 * ⚠️ ข้อมูลไพ่ย่อถูก **นำเข้าในไฟล์นี้** ไม่ได้ส่งเป็น prop จากหน้า `.astro`
 *    prop ของ island ถูก serialize ลง HTML ทุกหน้า ส่วน import ไปอยู่ในไฟล์ JS
 *    ที่โหลดตอนว่าง (`client:idle`) และแคชข้ามหน้าได้ — ผู้ใช้จึงได้ HTML ที่เบากว่า
 */
export function CardsExplorerRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <CardsExplorer cards={CARD_SUMMARIES} />
    </LocaleProvider>
  );
}
