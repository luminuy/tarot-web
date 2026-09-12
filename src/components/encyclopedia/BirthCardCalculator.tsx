"use client";

import { useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { calculateBirthCard, type BirthCardResult, type BirthCardItem } from "@/lib/tarot/birth-card";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";

const TarotCard = dynamic(
  () => import("@/components/card/TarotCard").then((mod) => mod.TarotCard),
  {
    loading: () => (
      <div className="w-[140px] h-[238px] rounded-xl border border-line-warm bg-surface-warm animate-pulse" />
    ),
  },
);

const MONTHS = [
  { value: 1, nameTh: "มกราคม", nameEn: "January" },
  { value: 2, nameTh: "กุมภาพันธ์", nameEn: "February" },
  { value: 3, nameTh: "มีนาคม", nameEn: "March" },
  { value: 4, nameTh: "เมษายน", nameEn: "April" },
  { value: 5, nameTh: "พฤษภาคม", nameEn: "May" },
  { value: 6, nameTh: "มิถุนายน", nameEn: "June" },
  { value: 7, nameTh: "กรกฎาคม", nameEn: "July" },
  { value: 8, nameTh: "สิงหาคม", nameEn: "August" },
  { value: 9, nameTh: "กันยายน", nameEn: "September" },
  { value: 10, nameTh: "ตุลาคม", nameEn: "October" },
  { value: 11, nameTh: "พฤศจิกายน", nameEn: "November" },
  { value: 12, nameTh: "ธันวาคม", nameEn: "December" },
];

export interface BirthCardCalculatorProps {
  majorCards?: readonly BirthCardItem[];
}

export function BirthCardCalculator({ majorCards }: BirthCardCalculatorProps = {}) {
  const { isEnglish } = useLocale();
  const [, startTransition] = useTransition();

  const [day, setDay] = useState<number>(1);
  const [month, setMonth] = useState<number>(1);
  const [yearInput, setYearInput] = useState<string>("2540");
  const [era, setEra] = useState<"be" | "ce">("be");
  const [result, setResult] = useState<BirthCardResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ตรวจสอบ query string ใน URL เพื่อคำนวณอัตโนมัติหากมีการแชร์ลิงก์มา
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qd = Number.parseInt(params.get("d") || "", 10);
      const qm = Number.parseInt(params.get("m") || "", 10);
      const qy = Number.parseInt(params.get("y") || "", 10);
      const qera = params.get("era") === "ce" ? "ce" : "be";

      if (qd >= 1 && qd <= 31 && qm >= 1 && qm <= 12 && qy > 0) {
        setDay(qd);
        setMonth(qm);
        setYearInput(qy.toString());
        setEra(qera);
        const res = calculateBirthCard(qd, qm, qy, qera === "be", majorCards);
        if (res) {
          setResult(res);
        }
      }
    }
  }, [majorCards]);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundManager.playCardSelectSound();
    setErrorMsg(null);

    const parsedYear = Number.parseInt(yearInput.trim(), 10);
    if (!parsedYear || Number.isNaN(parsedYear)) {
      setErrorMsg(
        isEnglish
          ? "Please enter a valid numeric birth year."
          : "กรุณากรอกปีเกิดเป็นตัวเลขที่ถูกต้อง"
      );
      return;
    }

    const isBe = era === "be";
    const minYear = isBe ? 2343 : 1800;
    const maxYear = isBe ? 2743 : 2200;

    if (parsedYear < minYear || parsedYear > maxYear) {
      setErrorMsg(
        isEnglish
          ? `Please enter a birth year between ${minYear} and ${maxYear}.`
          : `กรุณากรอกปีเกิดระหว่าง ${minYear} ถึง ${maxYear}`
      );
      return;
    }

    const calcResult = calculateBirthCard(day, month, parsedYear, isBe, majorCards);

    if (!calcResult) {
      setErrorMsg(
        isEnglish
          ? "Unable to calculate birth card. Please verify your date and try again."
          : "ไม่สามารถคำนวณไพ่ประจำตัวได้ กรุณาตรวจสอบวันเดือนปีเกิดแล้วลองใหม่อีกครั้ง"
      );
      setResult(null);
      return;
    }

    startTransition(() => {
      setResult(calcResult);
      soundManager.playCardFlipSound();
      if (typeof window !== "undefined") {
        const newUrl = `${window.location.pathname}?d=${day}&m=${month}&y=${parsedYear}&era=${era}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }
    });
  };

  const handleShare = async () => {
    if (!result) return;
    soundManager.playCardSelectSound();
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = isEnglish
      ? `My Tarot Birth Card is ${result.primaryCard.nameEn}`
      : `ไพ่ทาโรต์ประจำตัวของฉันคือ ${result.primaryCard.nameTh} (${result.primaryCard.nameEn})`;
    const shareText = isEnglish
      ? `My Tarot Birth Card is ${result.primaryCard.nameEn}. Calculate your own birth card at SeerTarot`
      : `ฉันได้ไพ่ทาโรต์ประจำตัวคือ ${result.primaryCard.nameTh} (${result.primaryCard.nameEn}) มาคำนวณไพ่ประจำวันเกิดของคุณกันที่ SeerTarot`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-8">
      {/* Interactive Form Panel */}
      <form
        onSubmit={handleCalculate}
        className="altar-panel rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center space-y-1.5">
          <span className="text-xs uppercase tracking-wider font-serif-th font-semibold text-gold-ink">
            {isEnglish ? "Natal Numerology Oracle" : "เลขศาสตร์วันเกิด"}
          </span>
          <h2 className="font-serif-th text-xl sm:text-2xl font-bold text-ink">
            {isEnglish ? "Enter Your Date of Birth" : "ใส่วันเดือนปีเกิดของคุณ"}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#7A6F5D]">
            {isEnglish
              ? "Calculated using 1909 Rider-Waite Major Arcana numerological reduction."
              : "ระบบคำนวณตามหลักเลขศาสตร์ไพ่ทาโรต์สากล 1909 Rider-Waite Major Arcana"}
          </p>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Day */}
          <div className="space-y-1">
            <label htmlFor="birth-day" className="block text-xs font-serif-th font-semibold text-ink">
              {isEnglish ? "Day" : "วันที่เกิด"}
            </label>
            <select
              id="birth-day"
              value={day}
              onChange={(e) => setDay(Number.parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-line-warm bg-surface-warm px-3.5 py-2.5 text-xs sm:text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {isEnglish ? `${d}` : `วันที่ ${d}`}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div className="space-y-1">
            <label htmlFor="birth-month" className="block text-xs font-serif-th font-semibold text-ink">
              {isEnglish ? "Month" : "เดือนเกิด"}
            </label>
            <select
              id="birth-month"
              value={month}
              onChange={(e) => setMonth(Number.parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-line-warm bg-surface-warm px-3.5 py-2.5 text-xs sm:text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {isEnglish ? m.nameEn : m.nameTh}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="birth-year" className="block text-xs font-serif-th font-semibold text-ink">
                {isEnglish ? "Year" : "ปีเกิด"}
              </label>
              <div className="flex items-center gap-1 text-[11px] font-sans">
                <button
                  type="button"
                  onClick={() => setEra("be")}
                  className={`tap-overlay-y px-2 py-0.5 rounded transition-colors ${
                    era === "be"
                      ? "bg-ink text-surface-warm font-bold"
                      : "text-[#7A6F5D] hover:text-ink"
                  }`}
                >
                  {isEnglish ? "BE" : "พ.ศ."}
                </button>
                <span className="text-line">/</span>
                <button
                  type="button"
                  onClick={() => setEra("ce")}
                  className={`tap-overlay-y px-2 py-0.5 rounded transition-colors ${
                    era === "ce"
                      ? "bg-ink text-surface-warm font-bold"
                      : "text-[#7A6F5D] hover:text-ink"
                  }`}
                >
                  {isEnglish ? "CE" : "ค.ศ."}
                </button>
              </div>
            </div>
            <input
              id="birth-year"
              type="number"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              placeholder={era === "be" ? "2540" : "1997"}
              className="w-full rounded-xl border border-line-warm bg-surface-warm px-3.5 py-2.5 text-xs sm:text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[#FAF0ED] border border-[#E8C5BE] text-xs font-sans text-[#8F2E1A] text-center">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 px-6 rounded-full bg-ink text-surface-warm text-xs sm:text-sm font-serif-th font-bold hover:bg-gold transition duration-200 cursor-pointer shadow-raised active:scale-95 tracking-wide"
        >
          {isEnglish ? "Calculate Your Birth Card" : "คำนวณไพ่ประจำตัวของคุณ"}
        </button>
      </form>

      {/* Result Presentation */}
      {result && (
        <div className="altar-panel rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto space-y-8 anim-swap-rise">
          {/* Header & Arithmetic Trail */}
          <div className="text-center space-y-2.5 border-b border-line-warm/40 pb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-line-warm bg-surface-warm text-xs font-sans font-semibold text-gold-ink">
              <span>{isEnglish ? "Birth Date:" : "วันเกิด:"}</span>
              <span>
                {result.day} {isEnglish ? MONTHS[result.month - 1].nameEn : MONTHS[result.month - 1].nameTh} {result.yearBe} (ค.ศ. {result.yearCe})
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold font-serif-th text-ink">
              {isEnglish
                ? `Your Birth Card is ${result.primaryCard.nameEn}`
                : `ไพ่ประจำตัวของคุณคือ ${result.primaryCard.nameTh}`}
            </h3>

            <p className="text-xs sm:text-sm font-sans text-[#7A6F5D]">
              {result.primaryCard.nameEn} · {isEnglish ? `Card #${result.primaryNumber} of Major Arcana` : `หมายเลข ${result.primaryNumber} แห่งสำรับไพ่ชุดใหญ่ (Major Arcana)`}
            </p>

            <div className="pt-1">
              <span className="inline-block px-3 py-1 rounded-full bg-surface-warm border border-line-warm text-[11px] font-sans text-[#7A6F5D]">
                {isEnglish
                  ? `Numerological Sum: ${result.day} + ${result.month} + ${result.yearCe} = ${result.calculatedSum} → Card #${result.primaryNumber}`
                  : `ผลรวมเลขศาสตร์: ${result.day} + ${result.month} + ${result.yearCe} = ${result.calculatedSum} → ไพ่หมายเลข ${result.primaryNumber}`}
              </span>
            </div>
          </div>

          {/* Altar Cloth Stage for Twin Vitrines */}
          <div className="altar-cloth p-6 sm:p-8 rounded-2xl">
            <div
              className={`grid gap-6 items-start ${
                result.secondaryCard ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"
              }`}
            >
              {/* Primary Card (Personality Card) */}
              <div className="altar-card-porcelain rounded-xl p-5 sm:p-6 space-y-4 flex flex-col items-center text-center shadow-xs">
                <span className="px-3 py-1 rounded-full bg-surface-warm border border-line-warm text-xs font-serif-th font-semibold text-gold-ink">
                  {isEnglish ? "Personality Card" : "ไพ่บุคลิกภาพ & พลังงานหลัก"}
                </span>

                <div className="py-2 flex justify-center">
                  <TarotCard
                    card={result.primaryCard}
                    isRevealed={true}
                    size="lg"
                    className="shadow-overlay"
                  />
                </div>

                <div className="space-y-1 w-full text-center">
                  <div className="text-lg sm:text-xl font-bold font-serif-th text-ink">
                    {result.primaryCard.nameTh} ({result.primaryCard.nameEn})
                  </div>
                  <div className="text-xs font-sans text-[#7A6F5D]">
                    {isEnglish
                      ? `Element: ${result.primaryCard.element} · Astrology: ${result.primaryCard.astrologyEn || result.primaryCard.astrology}`
                      : `ธาตุ: ${result.primaryCard.element || "มิติแห่งดวงดาว"} · โหราศาสตร์: ${result.primaryCard.astrology}`}
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-sans text-ink leading-relaxed text-left pt-3 border-t border-line-warm/40 w-full space-y-2">
                  <p>
                    {isEnglish && result.primaryCard.numerologyEn
                      ? result.primaryCard.numerologyEn
                      : result.primaryCard.numerology ||
                        result.primaryCard.meanings?.self?.upright ||
                        result.primaryCard.meanings?.general?.upright}
                  </p>
                </div>

                <Link
                  href={`/cards/${result.primaryCard.id}`}
                  className="text-xs font-serif-th font-bold text-gold-ink hover:underline mt-auto pt-2"
                >
                  {isEnglish ? "Read Full Card Guide →" : "อ่านคัมภีร์เจาะลึกไพ่ใบนี้ →"}
                </Link>
              </div>

              {/* Secondary Card (Soul Card) */}
              {result.secondaryCard && (
                <div className="altar-card-porcelain rounded-xl p-5 sm:p-6 space-y-4 flex flex-col items-center text-center shadow-xs">
                  <span className="px-3 py-1 rounded-full bg-surface-warm border border-line-warm text-xs font-serif-th font-semibold text-gold-ink">
                    {isEnglish ? "Soul Card" : "ไพ่จิตวิญญาณ & เจตนารมณ์ลึก"}
                  </span>

                  <div className="py-2 flex justify-center">
                    <TarotCard
                      card={result.secondaryCard}
                      isRevealed={true}
                      size="lg"
                      className="shadow-overlay"
                    />
                  </div>

                  <div className="space-y-1 w-full text-center">
                    <div className="text-lg sm:text-xl font-bold font-serif-th text-ink">
                      {result.secondaryCard.nameTh} ({result.secondaryCard.nameEn})
                    </div>
                    <div className="text-xs font-sans text-[#7A6F5D]">
                      {isEnglish
                        ? `Element: ${result.secondaryCard.element} · Astrology: ${result.secondaryCard.astrologyEn || result.secondaryCard.astrology}`
                        : `ธาตุ: ${result.secondaryCard.element || "มิติแห่งดวงดาว"} · โหราศาสตร์: ${result.secondaryCard.astrology}`}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-sans text-ink leading-relaxed text-left pt-3 border-t border-line-warm/40 w-full space-y-2">
                    <p>
                      {isEnglish && result.secondaryCard.numerologyEn
                        ? result.secondaryCard.numerologyEn
                        : result.secondaryCard.numerology ||
                          result.secondaryCard.meanings?.self?.upright ||
                          result.secondaryCard.meanings?.general?.upright}
                    </p>
                  </div>

                  <Link
                    href={`/cards/${result.secondaryCard.id}`}
                    className="text-xs font-serif-th font-bold text-gold-ink hover:underline mt-auto pt-2"
                  >
                    {isEnglish ? "Read Full Card Guide →" : "อ่านคัมภีร์เจาะลึกไพ่ใบนี้ →"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Action & Next Steps Bar */}
          <div className="space-y-6 pt-2 border-t border-line-warm/40">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="tap-overlay-y w-full sm:w-auto px-6 py-2.5 rounded-full border border-line-warm bg-white hover:border-gold-ink text-xs font-serif-th font-bold text-ink transition cursor-pointer shadow-xs"
              >
                <span>
                  {copied
                    ? isEnglish
                      ? "Link Copied!"
                      : "คัดลอกลิงก์ผลลัพธ์แล้ว"
                    : isEnglish
                    ? "Share Birth Card"
                    : "แชร์ผลลัพธ์ไพ่ประจำตัว"}
                </span>
              </button>

              <Link
                href="/spreads/celtic-cross"
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-ink text-surface-warm text-xs font-serif-th font-bold text-center hover:bg-gold transition shadow-xs"
              >
                {isEnglish ? "10-Card Celtic Cross Life Reading" : "เปิดผังเซลติกครอส 10 ใบ พยากรณ์ชะตาชีวิต"}
              </Link>
            </div>

            {/* Recommended Next Readings */}
            <div className="pt-4 border-t border-line-warm/40 space-y-3">
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-sm sm:text-base font-serif-th font-bold text-ink">
                  {isEnglish ? "Recommended Next Readings" : "ขั้นตอนพยากรณ์ชะตาถัดไปที่แนะนำ"}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/daily"
                  className="p-4 rounded-xl border border-line-warm bg-surface hover:border-gold-ink text-center transition duration-300 group block shadow-xs"
                >
                  <div className="text-xs font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
                    {isEnglish ? "Daily Tarot Oracle" : "ดูดวงไพ่ยิปซีรายวัน"}
                  </div>
                  <p className="text-[11px] font-sans text-[#7A6F5D] mt-1">
                    {isEnglish ? "Check daily energy across 5 chambers" : "เช็กพลังงานประจำวัน 5 มิติ"}
                  </p>
                </Link>

                <Link
                  href="/love/1-card"
                  className="p-4 rounded-xl border border-line-warm bg-surface hover:border-gold-ink text-center transition duration-300 group block shadow-xs"
                >
                  <div className="text-xs font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
                    {isEnglish ? "Love Tarot 1 Card" : "ดูดวงความรัก 1 ใบ"}
                  </div>
                  <p className="text-[11px] font-sans text-[#7A6F5D] mt-1">
                    {isEnglish ? "Guidance tailored to 4 relationship states" : "ไขคำตอบสถานะหัวใจ 4 มิติ"}
                  </p>
                </Link>

                <Link
                  href="/readers"
                  className="p-4 rounded-xl border border-line-warm bg-surface hover:border-gold-ink text-center transition duration-300 group block shadow-xs"
                >
                  <div className="text-xs font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
                    {isEnglish ? "Personal Readers" : "ปรึกษาแม่หมอตัวจริง"}
                  </div>
                  <p className="text-[11px] font-sans text-[#7A6F5D] mt-1">
                    {isEnglish ? "Connect with seasoned practitioners" : "พูดคุยกับนักพยากรณ์มืออาชีพ"}
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
