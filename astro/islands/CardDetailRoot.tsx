import type { ReactNode } from "react";

import { CardDetailView, type CardNavRef } from "@/components/encyclopedia/CardDetailView";
import type { TarotCard } from "@/data/cards/types";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🃏 เนื้อหาหน้าไพ่รายใบ — ใช้คอมโพเนนต์ตัวเดียวกับที่ Next เรนเดอร์
 *
 * ⚠️ ห้ามนำเข้า `DECK` หรือ `cardById` ในไฟล์นี้เด็ดขาด
 * -------------------------------------------------------------------------
 * ทุกอย่างที่ island นำเข้าจะถูกมัดรวมลง JS ที่ส่งให้เบราว์เซอร์
 * ครั้งแรกที่เขียนไฟล์นี้เผลอนำเข้า `cardById` เข้ามา ผลคือ **สำรับทั้ง 78 ใบ
 * พร้อมคำทำนายครบ 5 หมวดถูกมัดลงบันเดิลของทุกหน้า — 980 KB** (วัดจริง)
 * ไพ่ใบที่หน้านี้ต้องใช้จึงต้องถูก "ส่งเข้ามา" จากฝั่ง Astro เสมอ
 *
 * ⚠️ `related` มาจาก slot ของ Astro (HTML ที่เรนเดอร์เสร็จแล้ว) ไม่ใช่คอมโพเนนต์
 *    ลิงก์ไพ่ใกล้เคียง 4 ใบและผังที่เกี่ยวข้องจึงอยู่ใน HTML ครบโดยไม่กินบันเดิลเลย
 */
export function CardDetailViewRoot({
  card,
  prevCard,
  nextCard,
  currentIndex,
  totalCards,
  locale,
  related,
}: {
  card: TarotCard;
  prevCard?: CardNavRef;
  nextCard?: CardNavRef;
  currentIndex: number;
  totalCards: number;
  locale: Locale;
  related?: ReactNode;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <CardDetailView
        card={card}
        prevCard={prevCard}
        nextCard={nextCard}
        totalCards={totalCards}
        currentIndex={currentIndex}
        related={related}
      />
    </LocaleProvider>
  );
}
