import { ZodiacFinder, type ZodiacFinderItem } from "@/components/encyclopedia/ZodiacFinder";
import { ZodiacCompatibility } from "@/components/encyclopedia/ZodiacCompatibility";
import { ZodiacDaily, type ZodiacDailySignName } from "@/components/encyclopedia/ZodiacDaily";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * ✦ เครื่องหาราศีจากวันเกิด — ส่วนเดียวของหน้า `/cards/zodiac` ที่ต้องใช้ JS
 * ⚠️ รับ `signs` เป็น prop ที่คัดฟิลด์แล้ว (`ZODIAC_FINDER_ITEMS`) ห้าม import `@/data/zodiac` ที่นี่
 */
export function ZodiacFinderRoot({ signs, locale }: { signs: ZodiacFinderItem[]; locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <ZodiacFinder signs={signs} />
    </LocaleProvider>
  );
}

/** ✦ ความเข้ากันของสองราศี — island แยกเพราะวางคนละตำแหน่งในหน้า (ใช้ข้อมูลชุดเดียวกัน) */
export function ZodiacCompatibilityRoot({ signs, locale }: { signs: ZodiacFinderItem[]; locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <ZodiacCompatibility signs={signs} />
    </LocaleProvider>
  );
}

/** ✦ ดวงรายวัน 12 ราศี + ไพ่ประจำฤดูราศี — `sign` ไม่ส่ง = หน้ารวม · ส่ง = หน้ารายราศี */
export function ZodiacDailyRoot({
  signs,
  sign,
  locale,
}: {
  signs: ZodiacDailySignName[];
  sign?: string;
  locale: Locale;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <ZodiacDaily signs={signs} sign={sign} />
    </LocaleProvider>
  );
}
