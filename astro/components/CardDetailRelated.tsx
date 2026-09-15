import { CardDetailRelated } from "@/app/_shared/pages/card-detail";
import type { TarotCard } from "@/data/cards/types";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🔗 ลิงก์ท้ายหน้าไพ่รายใบ — เรนเดอร์เป็น HTML ตั้งแต่ตอนบิลด์ **ไม่ hydrate**
 *
 * ⚠️ ต้องอยู่คนละไฟล์กับ island เสมอ (ห้ามย้ายกลับไปรวมกับ `islands/CardDetailRoot.tsx`)
 * -------------------------------------------------------------------------
 * Astro มัดรวม **ทั้งไฟล์** ที่มี island อยู่ลงบันเดิลฝั่งไคลเอนต์ ตอนที่สองตัวนี้
 * อยู่ไฟล์เดียวกัน ข้อมูลไพ่ย่อ 78 ใบ + ตารางไพ่ใกล้เคียง 312 รายการ + ผังทั้งหมด
 * ถูกลากตามไปด้วย = **928 KB ต่อหน้า** ทั้งที่ไม่มีบรรทัดไหนต้องรันในเบราว์เซอร์เลย
 */
export function CardDetailRelatedRoot({ card, locale }: { card: TarotCard; locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <CardDetailRelated card={card} locale={locale} />
    </LocaleProvider>
  );
}
