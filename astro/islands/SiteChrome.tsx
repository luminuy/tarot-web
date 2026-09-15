import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { AntiTheftShield } from "@/components/security/AntiTheftShield";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { TikTokFloatingButton } from "@/components/ui/TikTokFloatingButton";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🏛️ ของประจำทุกหน้าที่ Next วางไว้ใน `RootHtml` — ฉบับที่ Astro ใช้
 * ===========================================================================
 *
 * ทำไมต้องแยกเป็นสามก้อน
 * ---------------------
 * ใน Astro เนื้อหาของหน้า (`<slot/>`) ถูกเรนเดอร์โดย Astro ไม่ใช่ React
 * จึง **ครอบด้วย provider ของ React ก้อนเดียวทั้งหน้าไม่ได้** เหมือนใน Next
 * ต้องแยกเป็นรากของ React หลายต้น แต่ละต้นพก `LocaleProvider` ของตัวเอง
 *
 * ⚠️ ทุกก้อนต้องรับ `locale` แล้วส่งเข้า `forcedLocale` เสมอ
 *    หน้าที่เรนเดอร์ด้วย Astro ตรึงภาษาตาม URL (ดูเหตุผลใน `BaseLayout.astro`)
 *    ถ้าปล่อยว่าง ราก React แต่ละต้นจะไปอ่าน cookie เองแล้วสลับไม่พร้อมกัน
 *    ผู้ใช้จะเห็นหัวเว็บเป็นภาษาหนึ่งแต่เนื้อหาเป็นอีกภาษาหนึ่ง
 */

/** ⏭️ ต้องเป็น element แรกสุดใน <body> เสมอ (WCAG SC 2.4.1) — ไม่ต้องใช้ JS */
export function SkipLinkRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SkipToContent />
    </LocaleProvider>
  );
}

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

/** ปุ่มลอย TikTok — เป็นลิงก์ล้วน ไม่มีสถานะ จึงเรนเดอร์เป็น HTML แล้วจบ ไม่ต้อง hydrate */
export function FloatingChromeRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <TikTokFloatingButton />
    </LocaleProvider>
  );
}
