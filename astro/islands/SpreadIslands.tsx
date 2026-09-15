import { SpreadDetailClient } from "@/components/spread/SpreadDetailClient";
import { SpreadsLibrary } from "@/components/spread/SpreadsLibrary";
import { TopicSpreadList } from "@/components/spread/TopicSpreadList";
import { SPREADS } from "@/data/spreads";
import type { ComponentProps } from "react";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 📐 ส่วนที่ต้องใช้ JS จริงของกลุ่มหน้าผังพยากรณ์
 *
 * ⚠️ `SPREADS` ถูกนำเข้าที่นี่เฉพาะสำหรับหน้ารวม (`/spreads`) ซึ่งแสดงผังทั้ง 25 แบบอยู่แล้ว
 *    หน้าคู่มือรายผังกับหน้าหมวด **ต้องรับข้อมูลเป็น prop** ห้ามนำเข้าคลังผังมาหาเอง
 *    ไม่งั้นข้อมูลผังทั้งก้อน (85 KB) จะถูกมัดลงบันเดิลของทั้ง 54 หน้า
 */
export function SpreadsLibraryRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SpreadsLibrary spreads={SPREADS} />
    </LocaleProvider>
  );
}

export function SpreadDetailRoot({
  locale,
  ...props
}: ComponentProps<typeof SpreadDetailClient> & { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SpreadDetailClient {...props} />
    </LocaleProvider>
  );
}

export function TopicSpreadListRoot({
  spreads,
  locale,
}: ComponentProps<typeof TopicSpreadList> & { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <TopicSpreadList spreads={spreads} />
    </LocaleProvider>
  );
}
