"use client";

import { CardImage } from "@/components/card/CardImage";
import type { Lang } from "@/data/natal/content";
import type { NatalCardItem } from "./NatalChartApp";

/** ไพ่คว่ำหน้า ผู้ใช้แตะพลิกเอง (กฎเหล็กข้อ 4) · ใช้ร่วมกันในผลผังและดวงวันนี้ */
export function FlipCard({
  card,
  revealed,
  onReveal,
  label,
  lang,
}: {
  card: NatalCardItem | undefined;
  revealed: boolean;
  onReveal: () => void;
  label: string;
  lang: Lang;
}) {
  // กฎข้อ 14: รหัสไพ่หาไม่เจอ = ไม่แสดงไพ่ ห้ามเดาใบอื่น
  if (!card) return null;
  return (
    <button
      type="button"
      onClick={onReveal}
      disabled={revealed}
      aria-label={revealed ? `${label}: ${lang === "en" ? card.nameEn : card.nameTh}` : label}
      className="card-scene w-[92px] sm:w-[112px] aspect-[1/1.7] rounded-lg cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <span
        className="card-inner card-flip relative block w-full h-full rounded-lg"
        data-revealed={revealed ? "true" : "false"}
      >
        <span className="card-face absolute inset-0 rounded-lg card-back-pattern border-2 border-line-warm/60 shadow-xs flex items-center justify-center">
          <span className="rounded-full bg-surface border border-line-warm px-2 py-0.5 text-[11px] font-serif-th font-bold text-ink">
            {lang === "en" ? "Tap" : "แตะเปิด"}
          </span>
        </span>
        <span className="card-face card-face--back absolute inset-0 rounded-lg overflow-hidden border-2 border-line-warm shadow-xs bg-inset-warm">
          {revealed && (
            <CardImage
              image={card.image}
              cardId={card.id}
              alt={lang === "en" ? card.nameEn : `${card.nameTh} (${card.nameEn})`}
              sizes="112px"
              className="w-full h-full object-cover"
            />
          )}
        </span>
      </span>
    </button>
  );
}
