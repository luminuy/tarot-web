import { PickACardClient } from "@/components/pick-a-card/PickACardClient";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🔮 พิธีเลือกกองไพ่พยากรณ์ Pick A Card — Island ตัวเดียวของหน้านี้
 *
 * ⚠️ ต้องใช้ client:load เพื่อให้ผู้ใช้ที่เข้ามาพร้อมกดเลือกกองไพ่ได้ทันที
 */
export function PickACardIsland({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <PickACardClient />
    </LocaleProvider>
  );
}
