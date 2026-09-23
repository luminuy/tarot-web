import type { ReactNode } from "react";

import TarotFlow from "@/components/home/TarotFlow";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🏠 พิธีเปิดไพ่เต็มรูปแบบของหน้าแรก — island ก้อนเดียวที่ครอบทั้งหน้า
 *
 * ⚠️ หน้าแรก **ไม่มี section layout** ที่ใส่หัวเว็บ/ฟุตเตอร์ให้ — `TarotFlow`
 *    เรนเดอร์ `<SiteHeader/>` กับ `<SiteFooter/>` ของตัวเองอยู่ข้างใน (INC-0130)
 *    ห้ามเติม `SiteHeaderRoot` เข้าไปในหน้า `.astro` เด็ดขาด ไม่งั้นจะได้หัวเว็บซ้อนสองชั้น
 *
 * ⚠️ ต้อง `client:load` — ทั้งหน้าคือแอปเปิดไพ่ ผู้ใช้กดปุ่มแรกภายในไม่กี่วินาที
 *
 * ⚠️ `seoContent` มาจาก slot ของ Astro (HTML ที่เรนเดอร์เสร็จแล้ว) เนื้อหา SEO ยาว ๆ
 *    ของหน้าแรกจึงไม่กินบันเดิลเลยสักไบต์ และบอตยังเห็นครบเหมือนเดิม
 *
 * ✦ `initialSpreadId` — มาจากหน้าดูดวงรายผัง `/read/<ผัง>` เท่านั้น (หน้าแรกไม่ส่ง)
 *    ส่งเป็นสตริงเปล่า ๆ ห้ามส่งอ็อบเจกต์ผังทั้งก้อนข้าม island (กติกา island ข้อ 1)
 */
export function TarotFlowRoot({
  locale,
  seoContent,
  initialSpreadId,
}: {
  locale: Locale;
  seoContent?: ReactNode;
  initialSpreadId?: string;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <TarotFlow seoContent={seoContent} initialSpreadId={initialSpreadId} />
    </LocaleProvider>
  );
}
