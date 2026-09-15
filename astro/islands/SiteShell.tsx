import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🧭 หัวเว็บและฟุตเตอร์ — ฝาแฝดของ section layout ใน `src/app/(th)/<หมวด>/layout.tsx`
 *
 * แยกเป็นสองราก React เพราะเนื้อหาหน้าที่ Astro เรนเดอร์คั่นอยู่ตรงกลาง (ดู `SiteChrome.tsx`)
 *
 * ⚠️ หัวเว็บต้อง hydrate (`client:idle`) — มีเมนูดรอปดาวน์ ปุ่มสลับภาษา และแผงบัญชี
 * ⚠️ ฟุตเตอร์ไม่ต้อง hydrate — เป็นลิงก์ล้วน ไม่มีสถานะสักตัว
 */
export function SiteHeaderRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SiteHeader />
    </LocaleProvider>
  );
}

export function SiteFooterRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SiteFooter />
    </LocaleProvider>
  );
}
