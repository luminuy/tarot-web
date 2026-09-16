import { SkipToContent } from "@/components/layout/SkipToContent";
import { TikTokFloatingButton } from "@/components/ui/TikTokFloatingButton";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/** ⏭️ ต้องเป็น element แรกสุดใน <body> เสมอ (WCAG SC 2.4.1) — ไม่ต้องใช้ JS */
export function SkipLinkRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SkipToContent />
    </LocaleProvider>
  );
}

/** ปุ่มลอย TikTok — เป็นลิงก์ล้วน ไม่มีสถานะ จึงเรนเดอร์เป็น HTML แล้วจบ ไม่ต้อง hydrate */
export function FloatingChromeRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <TikTokFloatingButton />
    </LocaleProvider>
  );
}
