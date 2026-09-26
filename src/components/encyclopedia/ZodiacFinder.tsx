"use client";

import React, { useEffect, useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CardImage } from "@/components/card/CardImage";
import { ZodiacWheel } from "@/components/encyclopedia/ZodiacWheel";
import { useLocale } from "@/lib/i18n";
import { localeHref } from "@/lib/i18n/paths";
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
import { announceSign, clearMySign, readMySign, saveMySign, type MySign } from "@/lib/zodiac/my-sign";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

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

/**
 * ✦ วงล้อจักรราศี + ช่องใส่วันเกิดกลางวง (หัวหน้า `/cards/zodiac`)
 *
 * - ไพ่ประจำ 12 ราศีเป็นลิงก์ไปหน้าราศี (อยู่ใน HTML ตั้งแต่เรนเดอร์ฝั่งเซิร์ฟเวอร์ บอทเห็นครบ)
 * - หาเจอแล้ว ➔ ไฮไลต์ราศีสากล (วงทองทึบ) + ราศีไทย (วงประ) บนวงล้อ แล้วโชว์ผลใต้วง
 *   และประกาศให้ island ดวงวันนี้/ความเข้ากันสลับไปราศีเดียวกัน (`announceSign`)
 * - ฤดูราศีตอนนี้ (ดวงอาทิตย์อยู่ราศีไหน) คิดจากปฏิทินในเครื่อง — เป็นแค่วันที่ ไม่ใช่การจั่วไพ่
 * - มือถือ: ช่องใส่วันเกิดอยู่ใต้วงล้อ · จอ `sm:` ขึ้นไป: อยู่กลางวง (ตัววงล้ออยู่ที่ `ZodiacWheel`)
 * - รับวันเกิดจากลิงก์ได้ `?day=<1-31>&month=<1-12>` — ฟอร์มวงล้อบนหน้าแรก (HTML นิ่ง ไม่มี JS)
 *   ส่งมาแบบ GET แล้วหน้านี้หาให้ทันทีที่ hydrate
 */
export function ZodiacFinder({ signs }: { signs: ZodiacFinderItem[] }) {
  const { isEnglish, locale } = useLocale();
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const [submitted, setSubmitted] = useState<{ day: number; month: number } | null>(null);
  /** "saved" = บันทึกราศีให้แม่หมอแล้ว · "failed" = เบราว์เซอร์ไม่ยอมให้เก็บ (โหมดส่วนตัว) */
  const [memory, setMemory] = useState<"idle" | "saved" | "failed" | "cleared">("idle");
  /** ราศีที่ผู้ใช้เคยบันทึกไว้ — อ่านหลัง hydrate เท่านั้น (ฝั่งเซิร์ฟเวอร์ไม่มี storage) */
  const [saved, setSaved] = useState<MySign | undefined>(undefined);
  const [seasonId, setSeasonId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSaved(readMySign());
    const now = new Date();
    setSeasonId(findZodiacByDate(signs, now.getMonth() + 1, now.getDate())?.sign.id);
  }, [signs]);

  /* มาจากฟอร์มวงล้อหน้าแรก (`?day=&month=`) ➔ หาให้เลยแล้วเลื่อนจอไปที่ผล */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = Number.parseInt(params.get("day") ?? "", 10);
    const m = Number.parseInt(params.get("month") ?? "", 10);
    if (!Number.isInteger(d) || !Number.isInteger(m) || m < 1 || m > 12 || d < 1 || d > 31) return;
    setMonth(m);
    setDay(Math.min(d, DAYS_IN_MONTH[m - 1]));
    setSubmitted({ day: d, month: m });
    const found = findZodiacByDate(signs, m, d);
    if (found) {
      announceSign({ tropical: found.sign.id, thai: findThaiZodiacByDate(signs, m, d)?.id, decan: found.decanIndex });
    }
    requestAnimationFrame(() => document.getElementById("zodiac-finder-result")?.scrollIntoView({ block: "start" }));
  }, [signs]);

  const result = submitted ? findZodiacByDate(signs, submitted.month, submitted.day) : undefined;
  const range = result ? decanRanges(signs).get(result.sign.id)?.[result.decanIndex] : undefined;
  const decanCard = result ? result.sign.decans[result.decanIndex]?.card : undefined;
  const thaiSign = submitted ? findThaiZodiacByDate(signs, submitted.month, submitted.day) : undefined;
  const thaiRange = thaiSign ? thaiRanges(signs).get(thaiSign.id) : undefined;
  const signName = (x: ZodiacFinderItem) => (isEnglish ? x.nameEn : x.nameTh);
  const cardName = (c: ZodiacFinderCard) => (isEnglish ? c.nameEn : `${c.nameTh} (${c.nameEn})`);

  /* วงล้อไฮไลต์ผลที่เพิ่งหา ถ้ายังไม่หา ใช้ราศีที่บันทึกไว้ */
  const markTropical = result?.sign.id ?? saved?.tropical;
  const markThai = thaiSign?.id ?? saved?.thai;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMonthDay(month, day)) return;
    setSubmitted({ day, month });
    setMemory("idle");
    const found = findZodiacByDate(signs, month, day);
    const foundThai = findThaiZodiacByDate(signs, month, day);
    if (found) announceSign({ tropical: found.sign.id, thai: foundThai?.id, decan: found.decanIndex });
  };

  const selectClass =
    "glass-field w-full rounded-xl border border-line-interactive-warm px-3 py-2.5 text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors";

  return (
    <section aria-labelledby="zodiac-finder-title" className="space-y-6">
      <ZodiacWheel
        signs={signs}
        isEnglish={isEnglish}
        hrefFor={(id) => localeHref(zodiacSignPath(id), locale)}
        markTropical={markTropical}
        markThai={markThai}
        seasonId={seasonId}
      >
        {/* ── ช่องใส่วันเกิด: กลางวง (sm+) / ใต้วง (มือถือ) ── */}
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="text-center space-y-0.5">
            <h2 id="zodiac-finder-title" className="text-base sm:text-lg font-serif-th font-bold text-ink"><ThaiPhrases>
              {isEnglish ? "When were you born?" : "คุณเกิดวันไหน?"}
            </ThaiPhrases></h2>
            <p className="text-[12px] text-muted font-sans">
              {isEnglish ? "No year needed · western + Thai" : "ไม่ต้องใส่ปี · บอกทั้งราศีสากลและไทย"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            <label className="block">
              <span className="sr-only">{isEnglish ? "Day" : "วันที่เกิด"}</span>
              <select id="zodiac-day" value={day} onChange={(e) => setDay(Number.parseInt(e.target.value, 10))} className={selectClass}>
                {Array.from({ length: DAYS_IN_MONTH[month - 1] }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {isEnglish ? `Day ${d}` : `วันที่ ${d}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">{isEnglish ? "Month" : "เดือนเกิด"}</span>
              <select
                id="zodiac-month"
                value={month}
                onChange={(e) => {
                  const m = Number.parseInt(e.target.value, 10);
                  setMonth(m);
                  // 31 ม.ค. ➔ เปลี่ยนเป็น ก.พ. ต้องไม่ค้างวันที่ที่ไม่มีจริง
                  setDay((d) => Math.min(d, DAYS_IN_MONTH[m - 1]));
                }}
                className={selectClass}
              >
                {(isEnglish ? MONTHS_EN : MONTHS_TH).map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="btn-gold-glass w-full min-h-[44px] py-2.5 px-4 text-sm font-serif-th font-bold duration-200 cursor-pointer active:scale-95"
          >
            {isEnglish ? "Find my cards" : "ดูไพ่ของฉัน"}
          </button>
        </form>
      </ZodiacWheel>

      <p className="text-center text-[12px] text-muted font-sans">
        {isEnglish
          ? "Gold ring = your western sign · dashed ring = your Thai sign · tap any sign to read more"
          : "กรอบทอง = ราศีสากลของคุณ · กรอบเส้นประ = ราศีไทย · แตะราศีไหนก็ได้เพื่ออ่านต่อ"}
      </p>

      {/* ผลลัพธ์ — aria-live ให้โปรแกรมอ่านหน้าจอประกาศเมื่อผลเปลี่ยน */}
      <div id="zodiac-finder-result" aria-live="polite" className="scroll-mt-20">
        {submitted && !result && (
          <p role="alert" className="text-center text-sm text-ink font-sans">
            {isEnglish ? "That date does not exist. Please check and try again." : "ไม่พบวันที่นี้ในปฏิทิน ลองตรวจสอบแล้วเลือกใหม่อีกครั้ง"}
          </p>
        )}
        {result && decanCard && thaiSign && (
          <div className="altar-panel rounded-2xl p-5 sm:p-7 space-y-5 max-w-2xl mx-auto anim-swap-rise">
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
            {/* ✦ ให้แม่หมอจำราศีไว้ — ส่งไปเป็นบริบทตอนเปิดไพ่ครั้งถัดไป (เก็บในเบราว์เซอร์นี้เท่านั้น) */}
            <div className="rounded-xl bg-surface-warm border border-line-warm p-4 space-y-2 text-center">
              {memory === "saved" ? (
                <>
                  <p className="text-sm font-serif-th font-bold text-ink">
                    {isEnglish ? "Saved. The oracle will know your sign next time." : "บันทึกแล้ว แม่หมอจะรู้ราศีของคุณตอนเปิดไพ่ครั้งถัดไป"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 text-xs font-serif-th">
                    <Link href="/" className="text-gold-ink font-bold hover:underline">
                      {isEnglish ? "Start a reading" : "ไปเปิดไพ่เลย"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        clearMySign();
                        setSaved(undefined);
                        setMemory("cleared");
                      }}
                      className="tap-overlay-y text-muted hover:text-ink underline cursor-pointer"
                    >
                      {isEnglish ? "Forget my sign" : "ลบราศีที่บันทึกไว้"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted font-sans">
                    {memory === "failed"
                      ? isEnglish
                        ? "This browser does not allow saving (private mode?). Readings still work as usual."
                        : "เบราว์เซอร์นี้ไม่ให้บันทึก (อาจเป็นโหมดส่วนตัว) เปิดไพ่ได้ตามปกติ แค่แม่หมอจะไม่รู้ราศี"
                      : memory === "cleared"
                        ? isEnglish
                          ? "Your saved sign has been removed."
                          : "ลบราศีที่บันทึกไว้แล้ว"
                        : isEnglish
                          ? "Want the oracle to notice when your own cards appear in a reading?"
                          : "อยากให้แม่หมอทักเมื่อไพ่ประจำราศีของคุณโผล่ในผังไหม?"}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setMemory(
                        saveMySign({ tropical: result.sign.id, thai: thaiSign.id, decan: result.decanIndex })
                          ? (setSaved({ tropical: result.sign.id, thai: thaiSign.id, decan: result.decanIndex }), "saved")
                          : "failed",
                      )
                    }
                    className="tap-overlay-y glass-chip px-4 py-2 text-xs sm:text-sm font-serif-th font-bold text-ink hover:text-gold-ink transition-colors cursor-pointer"
                  >
                    {isEnglish ? "Remember my sign for readings" : "ให้แม่หมอจำราศีของฉัน"}
                  </button>
                  <p className="text-[12px] text-muted font-sans">
                    {isEnglish
                      ? "Stored only in this browser. Your birthday itself is not sent."
                      : "เก็บไว้ในเบราว์เซอร์นี้เท่านั้น ไม่ได้ส่งวันเกิดของคุณไปไหน ส่งแค่ชื่อราศี"}
                  </p>
                </>
              )}
            </div>
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
