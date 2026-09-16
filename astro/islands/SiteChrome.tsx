import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { AntiTheftShield } from "@/components/security/AntiTheftShield";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * ก้อนที่ต้องมี JS จริง ๆ — เกราะกันดูดเนื้อหา · Service Worker · เครื่องมือวัดผล
 * (แถบขอความยินยอม PDPA ถูกเรนเดอร์อยู่ข้างใน `AnalyticsTracker`)
 *
 * ⚠️ ต้อง hydrate ด้วย `client:idle` เท่านั้น ห้าม `client:load`
 *    ทั้งสามตัวไม่มีอะไรที่ผู้ใช้ต้องกดทันทีที่เห็นหน้า การแย่งคิวตอนวาดหน้าแรก
 *    คือสิ่งที่ทำให้หน้าแรกเคยมี LCP 9.6 วินาที (บทเรียน #473)
 */
export function ClientChromeRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <AntiTheftShield />
      <ServiceWorkerRegister />
      <AnalyticsTracker />
    </LocaleProvider>
  );
}

