import type { Dictionary, Locale } from "./types";
import { th } from "./dictionaries/th";
import { en } from "./dictionaries/en";

/**
 * 🌐 พจนานุกรมฝั่งเซิร์ฟเวอร์ (lookup ด้วย locale ที่ระบุมาตรง ๆ เท่านั้น)
 * ---------------------------------------------------------------------------
 * ⚠️ ไฟล์นี้เคยมี `getServerLocale()` / `getServerDictionary()` ที่อ่าน `headers()`
 * และ `cookies()` เพื่อเดาภาษาจากคำขอ — **ถอดออกแล้วเมื่อ 2026-09-06 ห้ามเอากลับมา**
 *
 * เหตุผล: มันถูกเรียกใน `src/app/layout.tsx` (root layout) การแตะ dynamic API ที่นั่น
 * ทำให้ **ทุก route ในเว็บกลายเป็น dynamic** — วัดจริงตอนบิลด์: prerender ได้ 0 หน้า
 * และ Next ตอบ `cache-control: private, no-cache, no-store` ทุกหน้า จน edge cache
 * และ `enableCacheInterception` ของ OpenNext ไม่มีอะไรให้เสิร์ฟเลย
 * หลังถอดออก: prerender ได้ 167 หน้า
 *
 * การเลือกภาษาเป็นหน้าที่ของ `LocaleProvider` ฝั่ง client (`src/lib/i18n/context.tsx`)
 */
const dictionaries: Record<Locale, Dictionary> = {
  th,
  en,
};

/**
 * @public (D-02)
 * Synchronous dictionary lookup by explicit locale code (th | en)
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || th;
}
