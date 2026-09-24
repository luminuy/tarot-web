"use client";

import React, { useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CardImage } from "@/components/card/CardImage";
import { useLocale } from "@/lib/i18n";
import type { MonthDay } from "@/data/zodiac";
import {
  decanRanges,
  findThaiZodiacByDate,
  findZodiacByDate,
  formatMonthDay,
  isValidMonthDay,
  thaiRanges,
  zodiacSignPath,
} from "@/lib/tarot/zodiac";

/**
 * ✦ ข้อมูลราศีแบบย่อที่ island ต้องใช้จริงเท่านั้น
 * ⚠️ ห้ามส่งคำอธิบายราศี (`th` / `en`) เข้ามา — ทุกไบต์ของ prop ถูกฝังลง HTML ของหน้า
 *    คำอธิบายเต็มอยู่ในหน้าราศีแต่ละหน้าที่เรนเดอร์ฝั่งเซิร์ฟเวอร์แล้ว
 */
export interface ZodiacFinderCard {
  id: string;
  image: string;
  nameTh: string;
  nameEn: string;
}

export interface ZodiacFinderItem {
  id: string;
  nameTh: string;
  nameEn: string;
  major: ZodiacFinderCard;
  decans: { start: MonthDay; card: ZodiacFinderCard }[];
  /** วันที่ดวงอาทิตย์ยกเข้าราศีนี้แบบไทย (สุริยยาตร์) */
  thai: { start: MonthDay };
}

const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function ZodiacFinder({ signs }: { signs: ZodiacFinderItem[] }) {
  const { isEnglish } = useLocale();
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const [submitted, setSubmitted] = useState<{ day: number; month: number } | null>(null);

  const result = submitted ? findZodiacByDate(signs, submitted.month, submitted.day) : undefined;
  const range = result ? decanRanges(signs).get(result.sign.id)?.[result.decanIndex] : undefined;
  const decanCard = result ? result.sign.decans[result.decanIndex]?.card : undefined;
  const thaiSign = submitted ? findThaiZodiacByDate(signs, submitted.month, submitted.day) : undefined;
  const thaiRange = thaiSign ? thaiRanges(signs).get(thaiSign.id) : undefined;
  const signName = (x: ZodiacFinderItem) => (isEnglish ? x.nameEn : x.nameTh);
  const cardName = (c: ZodiacFinderCard) => (isEnglish ? c.nameEn : `${c.nameTh} (${c.nameEn})`);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMonthDay(month, day)) return;
    setSubmitted({ day, month });
  };

  return (
    <section className="altar-panel rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6" aria-labelledby="zodiac-finder-title">
      <div className="text-center space-y-1.5">
        <h2 id="zodiac-finder-title" className="text-lg sm:text-xl font-serif-th font-bold text-ink">
          {isEnglish ? "Find your zodiac tarot cards" : "หาไพ่ประจำราศีจากวันเกิด"}
        </h2>
        <p className="text-xs sm:text-sm text-muted font-sans">
          {isEnglish
            ? "Pick your birthday — no birth year needed."
            : "เลือกวันและเดือนเกิด ไม่ต้องใส่ปี (ใช้ราศีแบบสากล)"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="zodiac-day" className="block text-xs font-serif-th font-semibold text-ink">
              {isEnglish ? "Day" : "วันที่เกิด"}
            </label>
            <select
              id="zodiac-day"
              value={day}
              onChange={(e) => setDay(Number.parseInt(e.target.value, 10))}
              className="glass-field w-full rounded-xl border border-line-interactive-warm px-3.5 py-2.5 text-xs sm:text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors"
            >
              {Array.from({ length: DAYS_IN_MONTH[month - 1] }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {isEnglish ? `${d}` : `วันที่ ${d}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="zodiac-month" className="block text-xs font-serif-th font-semibold text-ink">
              {isEnglish ? "Month" : "เดือนเกิด"}
            </label>
            <select
              id="zodiac-month"
              value={month}
              onChange={(e) => {
                const m = Number.parseInt(e.target.value, 10);
                setMonth(m);
                // 31 ม.ค. ➔ เปลี่ยนเป็น ก.พ. ต้องไม่ค้างวันที่ที่ไม่มีจริง
                setDay((d) => Math.min(d, DAYS_IN_MONTH[m - 1]));
              }}
              className="glass-field w-full rounded-xl border border-line-interactive-warm px-3.5 py-2.5 text-xs sm:text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors"
            >
              {(isEnglish ? MONTHS_EN : MONTHS_TH).map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="btn-gold-glass w-full py-3 px-6 text-xs sm:text-sm font-serif-th font-bold duration-200 cursor-pointer active:scale-95 tracking-wide"
        >
          {isEnglish ? "Show my cards" : "ดูไพ่ประจำราศีของฉัน"}
        </button>
      </form>

      {/* ผลลัพธ์ — aria-live ให้โปรแกรมอ่านหน้าจอประกาศเมื่อผลเปลี่ยน */}
      <div aria-live="polite">
        {submitted && !result && (
          <p role="alert" className="text-center text-sm text-ink font-sans">
            {isEnglish ? "That date does not exist. Please check and try again." : "ไม่พบวันที่นี้ในปฏิทิน ลองตรวจสอบแล้วเลือกใหม่อีกครั้ง"}
          </p>
        )}
        {result && decanCard && thaiSign && (
          <div className="altar-card-porcelain rounded-xl p-5 sm:p-6 space-y-5 anim-swap-rise">
            <p className="text-center text-xs font-serif-th font-semibold text-gold-ink">
              {isEnglish ? "Your sign in both systems" : "ราศีของคุณทั้งสองระบบ"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  key: "tropical",
                  label: isEnglish ? "Western (tropical)" : "ราศีแบบสากล",
                  sign: result.sign,
                  span: range ? `${formatMonthDay(range.start, isEnglish)} – ${formatMonthDay(range.end, isEnglish)}` : "",
                  spanLabel: isEnglish ? `decan ${result.decanIndex + 1}/3` : `ช่วงที่ ${result.decanIndex + 1}/3`,
                },
                {
                  key: "thai",
                  label: isEnglish ? "Thai (sidereal)" : "ราศีแบบไทย",
                  sign: thaiSign,
                  span: thaiRange ? `${formatMonthDay(thaiRange.start, isEnglish)} – ${formatMonthDay(thaiRange.end, isEnglish)}` : "",
                  spanLabel: "",
                },
              ].map((col) => (
                <Link key={col.key} href={zodiacSignPath(col.sign.id)} className="group flex flex-col items-center text-center gap-1.5">
                  <span className="text-xs font-serif-th font-semibold text-muted">{col.label}</span>
                  <span className="text-lg sm:text-xl font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
                    {signName(col.sign)}
                  </span>
                  <CardImage
                    image={col.sign.major.image}
                    cardId={col.sign.major.id}
                    alt={cardName(col.sign.major)}
                    sizes="(min-width: 640px) 130px, 110px"
                    className="w-[110px] sm:w-[130px] aspect-[1/1.7] rounded-lg border border-line-warm shadow-xs object-cover"
                  />
                  <span className="text-xs sm:text-sm font-serif-th font-bold text-ink">{cardName(col.sign.major)}</span>
                  <span className="text-[13px] text-muted font-sans">
                    {col.spanLabel ? `${col.spanLabel} · ` : ""}
                    {col.span}
                  </span>
                </Link>
              ))}
            </div>
            <p className="text-[13px] text-muted font-sans leading-relaxed text-center">
              {result.sign.id === thaiSign.id
                ? isEnglish
                  ? "Both systems agree — this sign's cards speak strongly for you."
                  : "ทั้งสองระบบตรงกัน ไพ่ของราศีนี้จึงสะท้อนตัวคุณได้ชัดเป็นพิเศษ"
                : isEnglish
                  ? "Tarot was designed with the western zodiac, while Thai astrology follows the actual stars, about 24 days later. Read both cards and notice which one feels more like you."
                  : "ไพ่ทาโรต์ออกแบบคู่กับราศีสากล ส่วนโหราศาสตร์ไทยนับตามตำแหน่งดาวจริงซึ่งช้ากว่าราว 24 วัน ลองอ่านทั้งสองใบ แล้วดูว่าใบไหนตรงกับตัวคุณมากกว่า"}
            </p>
            <Link
              href={`/cards/${decanCard.id}`}
              className="group flex items-center gap-4 rounded-xl border border-line-warm p-3 hover:border-gold-ink transition-colors"
            >
              <CardImage
                image={decanCard.image}
                cardId={decanCard.id}
                alt={cardName(decanCard)}
                sizes="64px"
                className="w-16 aspect-[1/1.7] rounded-md border border-line-warm object-cover shrink-0"
              />
              <span className="text-left space-y-0.5">
                <span className="block text-xs font-serif-th font-semibold text-muted">
                  {isEnglish ? "Your decan card (western system)" : "ไพ่ประจำช่วงวันเกิด (ระบบสากล)"}
                </span>
                <span className="block text-sm font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
                  {cardName(decanCard)}
                </span>
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
