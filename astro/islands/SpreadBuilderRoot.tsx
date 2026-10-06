import { SpreadBuilder } from "@/components/spread/custom/SpreadBuilder";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * ✦ ห้องออกแบบผัง — island ก้อนเดียวครอบทั้งหน้า (REFLECTION_JOURNAL_PLAN 1.8)
 * ผังของฉันอ่านได้หลัง hydrate เท่านั้น (บัญชี/เครื่อง) — HTML เหมือนกันทุกคน แคชที่ขอบได้
 * ⚠️ `client:load` — คนเปิดหน้านี้เพื่อสร้างผังทันที
 */
export function SpreadBuilderRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SpreadBuilder />
    </LocaleProvider>
  );
}
