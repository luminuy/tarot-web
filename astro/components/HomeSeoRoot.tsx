import { HomeSeoContent } from "@/components/seo/HomeSeoContent";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 📄 เนื้อหา SEO ท้ายหน้าแรก — เรนเดอร์เป็น HTML ตั้งแต่ตอนบิลด์ **ไม่ hydrate**
 * ⚠️ ต้องอยู่คนละไฟล์กับ island เสมอ (ดูเหตุผลใน `astro/components/PageBodies.tsx`)
 */
export function HomeSeoRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <HomeSeoContent isEnglish={locale === "en"} />
    </LocaleProvider>
  );
}
