import { PricingPlans } from "@/components/entitlement/PricingPlans";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 💳 การ์ดแพ็กบนหน้า /pricing — ส่วนเดียวของหน้าที่ต้อง hydrate (ปุ่มซื้อ · ล็อกอิน · รหัสแลกสิทธิ์)
 *
 * ⚠️ `client:visible` ไม่ได้ — การ์ดอยู่บนสุดของจอแรก คนเข้าหน้านี้มาเพื่อกดซื้อ
 *    รอจนเลื่อนถึงแล้วค่อยโหลด = กดปุ่มแรกแล้วไม่มีอะไรเกิดขึ้น
 */
export function PricingRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <PricingPlans />
    </LocaleProvider>
  );
}
