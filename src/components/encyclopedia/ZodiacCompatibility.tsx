"use client";

import { useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CardImage } from "@/components/card/CardImage";
import { useLocale } from "@/lib/i18n";
import { ZODIAC_ASPECTS, zodiacDistance } from "@/data/zodiac-compat";
import { zodiacSignPath } from "@/lib/tarot/zodiac";
import type { ZodiacFinderItem } from "@/components/encyclopedia/ZodiacFinder";

/**
 * ✦ ความเข้ากันของสองราศี + ไพ่คู่ — ใช้รายการราศีแบบย่อชุดเดียวกับเครื่องหาราศี
 * (ต้องเรียงตามลำดับจักรราศี เมษ ➔ มีน เพราะระยะห่างคิดจากลำดับในรายการ)
 */
export function ZodiacCompatibility({ signs }: { signs: ZodiacFinderItem[] }) {
  const { isEnglish } = useLocale();
  const [a, setA] = useState(0);
  const [b, setB] = useState(4);
  const [shown, setShown] = useState<{ a: number; b: number } | null>(null);

  const signA = shown ? signs[shown.a] : undefined;
  const signB = shown ? signs[shown.b] : undefined;
  const aspect = shown ? ZODIAC_ASPECTS[zodiacDistance(shown.a, shown.b)][isEnglish ? "en" : "th"] : undefined;
  const name = (i: number) => (isEnglish ? signs[i].nameEn : signs[i].nameTh);
  const cardName = (s: ZodiacFinderItem) => (isEnglish ? s.major.nameEn : `${s.major.nameTh} (${s.major.nameEn})`);

  const select = (id: string, label: string, value: number, onChange: (v: number) => void) => (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-serif-th font-semibold text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        className="glass-field w-full rounded-xl border border-line-interactive-warm px-3.5 py-2.5 text-xs sm:text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors"
      >
        {signs.map((s, i) => (
          <option key={s.id} value={i}>
            {name(i)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <section className="altar-panel rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6" aria-labelledby="zodiac-compat-title">
      <div className="text-center space-y-1.5">
        <h2 id="zodiac-compat-title" className="text-lg sm:text-xl font-serif-th font-bold text-ink">
          {isEnglish ? "Zodiac compatibility & your card pair" : "ความเข้ากันของสองราศี + ไพ่คู่"}
        </h2>
        <p className="text-xs sm:text-sm text-muted font-sans">
          {isEnglish
            ? "Choose two signs to see how their elements meet and which pair of cards you make."
            : "เลือกราศีของคุณกับอีกคน ดูว่าธาตุของทั้งคู่เข้ากันแบบไหน และไพ่ประจำราศีของสองคนคู่กันเป็นอย่างไร"}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShown({ a, b });
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          {select("compat-a", isEnglish ? "Your sign" : "ราศีของคุณ", a, setA)}
          {select("compat-b", isEnglish ? "Their sign" : "ราศีของอีกคน", b, setB)}
        </div>
        <button
          type="submit"
          className="btn-gold-glass w-full py-3 px-6 text-xs sm:text-sm font-serif-th font-bold duration-200 cursor-pointer active:scale-95 tracking-wide"
        >
          {isEnglish ? "Check compatibility" : "ดูความเข้ากัน"}
        </button>
      </form>

      <div aria-live="polite">
        {signA && signB && aspect && shown && (
          <div className="altar-card-porcelain rounded-xl p-5 sm:p-6 space-y-5 anim-swap-rise">
            <div className="text-center space-y-1">
              <p className="text-base sm:text-lg font-serif-th font-bold text-ink">
                {name(shown.a)} × {name(shown.b)}
              </p>
              <p className="text-sm font-serif-th font-semibold text-gold-ink">
                {aspect.name}
                <span className="sr-only">
                  {isEnglish ? ` — harmony ${aspect.harmony} of 5` : ` — ความกลมกลืน ${aspect.harmony} จาก 5`}
                </span>
              </p>
              <p aria-hidden="true" className="text-gold-ink tracking-[0.3em] text-sm">
                {"✦".repeat(aspect.harmony)}
                <span className="text-line">{"✦".repeat(5 - aspect.harmony)}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[signA, signB].map((s, i) => (
                <Link key={`${s.id}-${i}`} href={zodiacSignPath(s.id)} className="group flex flex-col items-center text-center gap-1.5">
                  <CardImage
                    image={s.major.image}
                    cardId={s.major.id}
                    alt={cardName(s)}
                    sizes="(min-width: 640px) 120px, 100px"
                    className="w-[100px] sm:w-[120px] aspect-[1/1.7] rounded-lg border border-line-warm shadow-xs object-cover"
                  />
                  <span className="text-xs sm:text-sm font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
                    {cardName(s)}
                  </span>
                </Link>
              ))}
            </div>
            <p className="text-sm text-ink font-sans leading-relaxed">{aspect.summary}</p>
            <p className="text-sm text-muted font-sans leading-relaxed">
              {aspect.advice.replace("{a}", signA.major.nameEn).replace("{b}", signB.major.nameEn)}
            </p>
            <p className="text-[13px] text-muted font-sans text-center">
              {isEnglish
                ? "Compatibility shows tendencies, not fate. How two people care for each other matters more."
                : "ความเข้ากันบอกแนวโน้ม ไม่ได้ตัดสินว่าจะไปรอดหรือไม่ วิธีที่สองคนดูแลกันสำคัญกว่าเสมอ"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
