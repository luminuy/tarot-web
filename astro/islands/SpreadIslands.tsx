import { SpreadDetailClient } from "@/components/spread/SpreadDetailClient";
import { SpreadsLibrary } from "@/components/spread/SpreadsLibrary";
import { TopicSpreadList } from "@/components/spread/TopicSpreadList";
import { PUBLIC_SPREADS } from "@/data/spreads";
import type { ComponentProps } from "react";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 📐 ส่วนที่ต้องใช้ JS จริงของกลุ่มหน้าผังพยากรณ์
 *
 * ⚠️ `PUBLIC_SPREADS` ถูกนำเข้าที่นี่เฉพาะสำหรับหน้ารวม (`/spreads`) ซึ่งแสดงผังทั้ง 25 แบบอยู่แล้ว
 *    หน้าคู่มือรายผังกับหน้าหมวด **ต้องรับข้อมูลเป็น prop** ห้ามนำเข้าคลังผังมาหาเอง
 *    ไม่งั้นข้อมูลผังทั้งก้อน (85 KB) จะถูกมัดลงบันเดิลของทั้ง 54 หน้า
 *
 * 🚫 **ห้ามส่ง `SPREADS` (28 รายการ) เข้า `<SpreadsLibrary>` เด็ดขาด**
 *    ในนั้นมีผังภายในอีก 3 แบบ (`love-one` · `birth-card` · `pick-a-card`) ที่ไม่มีหน้าคู่มือ
 *    ของตัวเอง (หน้า `/spreads/[id]` สร้างจาก `PUBLIC_SPREADS`) ผู้ใช้กด "อ่านคู่มือผังนี้"
 *    แล้วเจอ 404 · แถบหมวด "ผังทั้งหมด" ยังขึ้นเลข 28 ขัดกับหัวข้อ "25 รูปแบบ" ของหน้าเดียวกัน
 */
export function SpreadsLibraryRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SpreadsLibrary spreads={PUBLIC_SPREADS} />
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
