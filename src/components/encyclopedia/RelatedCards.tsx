"use client";

import Link from "next/link";
import { CardImage } from "@/components/card/CardImage";
import { cardById } from "@/data/cards";
import { RELATED_CARDS } from "@/data/cards/related.generated";
import { useLocale } from "@/lib/i18n";

/**
 * ไพ่ที่พลังงานใกล้เคียง — เรนเดอร์ฝั่งเซิร์ฟเวอร์ ลิงก์อยู่ใน HTML ตั้งแต่ต้น (SSR)
 * 312 ลิงก์ภายใน (78 × 4) ปรากฏใน DOM ทันที บอทค้นพบได้โดยไม่ต้องรอ JS
 */
export function RelatedCards({ cardId }: { cardId: string }) {
  const { isEnglish } = useLocale();
  const refs = RELATED_CARDS[cardId];
  if (!refs) return null;

  const cards = refs.map(cardById).filter((c): c is NonNullable<typeof c> => !!c);
  if (cards.length === 0) return null;

  return (
    <section className="pt-8 border-t border-[#D5CEC2]/40">
      <h2 className="font-serif-th text-sm font-bold text-[#8F5C1A] mb-4">
        {isEnglish ? "✦ Resonant & Harmonious Cards" : "✦ ไพ่ที่พลังงานใกล้เคียง"}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link
            key={c.id}
            href={`/cards/${c.id}`}
            className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-[#D5CEC2] bg-white hover:border-[#A58A5C] transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
          >
            <div className="w-8 h-12 shrink-0 overflow-hidden rounded border border-[#D5CEC2] bg-[#EAE7E0]">
              <CardImage
                image={c.image}
                cardId={c.id}
                alt=""
                className="w-full h-full object-cover tarot-hd-card-image"
                sizes="32px"
              />
            </div>
            <div className="min-w-0">
              <span className="font-serif-th text-xs font-bold text-[#29261F] group-hover:text-[#A58A5C] block truncate">
                {isEnglish ? c.nameEn : c.nameTh}
              </span>
              <span className="font-serif-th text-[11px] text-[#635B4E] block truncate">
                {isEnglish ? c.nameTh : c.nameEn}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
