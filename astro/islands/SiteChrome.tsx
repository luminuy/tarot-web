import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🔐 แถบขอความยินยอม PDPA — **เรนเดอร์เป็น HTML อย่างเดียว ห้ามใส่ `client:*`**
 *
 * markup ต้องอยู่ใน HTML ตั้งแต่เฟรมแรก (ไม่งั้นแถบจะกลายเป็นตัว LCP ที่วาดช้า)
 * ส่วนการกดปุ่มมี `astro/scripts/site-chrome.ts` รับไปทำแทน React
 *
 * ⚠️ ของเดิมคือ island `ClientChromeRoot` ที่ hydrate ด้วย `client:idle` ทั้งที่ข้างใน
 * ไม่มี UI เลยนอกจากแถบนี้ — ทำให้ทุกหน้าเนื้อหาต้องโหลด React 184 KB
 * (วัดจริง `/spreads`: JS 278.7 KB ➔ 1.8 KB หลังถอด island ทั้งสองตัวออก)
 */
export function ConsentBannerRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <ConsentBanner />
    </LocaleProvider>
  );
}
