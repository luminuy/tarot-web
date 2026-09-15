import { DailyClient } from "@/components/daily/DailyClient";
import { LoveOneCardClient } from "@/components/love/LoveOneCardClient";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🔮 พิธีเปิดไพ่ของหน้าไพ่ประจำวันและหน้าไพ่ความรัก — island ตัวเดียวของแต่ละหน้า
 *
 * ⚠️ ต้อง `client:load` ไม่ใช่ `client:idle` — ผู้ใช้เข้ามาที่หน้านี้เพื่อ "กดเปิดไพ่"
 *    เป็นอย่างแรก ถ้ารอจังหวะว่างก่อน ปุ่มจะกดไม่ติดในวินาทีที่สำคัญที่สุดของหน้า
 *
 * ⚠️ เนื้อหา SEO ยาว ๆ ท้ายหน้าไม่ได้อยู่ใน island — มันถูกเรนเดอร์เป็น HTML ล้วน
 *    โดยหน้า `.astro` (ดู `_shared/pages/daily-*.tsx`) จึงไม่กินบันเดิลและบอตเห็นครบ
 */
export function DailyRitualRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <DailyClient />
    </LocaleProvider>
  );
}

export function LoveOneCardRitualRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <LoveOneCardClient />
    </LocaleProvider>
  );
}
