"use client";

import React, { useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { calculateBirthCard, getMaxDaysInMonth, type BirthCardResult, type BirthCardItem } from "@/lib/tarot/birth-card";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/utils/clipboard";
/*
 * 🔮 ไพ่ประจำตัวเปิดผ่านท่อ AI ท่อเดียวกับทั้งเว็บ (คำสั่งเจ้าของโปรเจกต์ 2026-09-18)
 *
 * ไพ่สองใบนี้ไม่ได้มาจากการจั่ว แต่คำนวณจากวันเกิด — **เซิร์ฟเวอร์เป็นผู้คำนวณ** แล้วเปิดให้
 * (`derive: { kind: "birth-card" }`) หน้าเว็บคำนวณเองด้วยเพื่อโชว์รอยทางเลขศาสตร์เท่านั้น
 * และต้องตรงกันทั้งสองฝั่งก่อนแสดงผล ไม่ตรงเมื่อไหร่ = ขอให้ผู้ใช้ลองใหม่ (กฎเหล็กข้อ 14)
 */
import { useAiReading } from "@/lib/reading/use-ai-reading";
import { AiReadingPanel } from "@/components/reading/ai/AiReadingPanel";
/* 💤 กล่องสิทธิ์/กล่องสมัครสมาชิกโหลดตอนถูกเรียกใช้จริงเท่านั้น (บทเรียนงบบันเดิลของ `/daily`) */
const AccessDialog = React.lazy(() =>
  import("@/components/entitlement/AccessDialog").then((m) => ({ default: m.AccessDialog }))
);
const AuthModal = React.lazy(() =>
  import("@/components/auth/AuthModal").then((m) => ({ default: m.AuthModal }))
);

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
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);
  /** ผลที่คำนวณในเครื่องแล้ว แต่ยังรอให้เซิร์ฟเวอร์ยืนยันก่อนขึ้นจอ */
  const [pendingResult, setPendingResult] = useState<BirthCardResult | null>(null);

  const oracle = useAiReading();

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
        /*
         * ⚠️ เติมช่องให้เฉย ๆ **ห้ามเปิดไพ่ให้เอง** — การเปิดไพ่หนึ่งครั้งกินโควตาของวันไปหนึ่งครั้ง
         * ลิงก์ที่เพื่อนแชร์มาจึงต้องรอให้เจ้าของเครื่องกดปุ่มเอง ไม่ใช่เสียสิทธิ์ตั้งแต่เปิดหน้า
         */
      }
    }
  }, [majorCards]);

  /*
   * เซิร์ฟเวอร์ยืนยันไพ่กลับมาแล้ว ➔ เทียบกับผลที่คำนวณในเครื่องก่อนแสดงผล
   *
   * 🃏 กฎเหล็กข้อ 14 — ไม่ตรงกันเมื่อไหร่ **ห้ามแสดงไพ่ใบไหนทั้งสิ้น** ให้ผู้ใช้ลองใหม่แทน
   * (ต่างกันได้ทางเดียวคือสูตรสองฝั่งเลื่อนออกจากกัน ซึ่งเป็นบั๊กที่ต้องเห็น ไม่ใช่กลบ)
   */
  useEffect(() => {
    if (!pendingResult || oracle.serverCards.length === 0) return;

    const expected = [
      pendingResult.primaryCard.id,
      ...(pendingResult.secondaryCard ? [pendingResult.secondaryCard.id] : []),
    ];
    const matches =
      oracle.serverCards.length === expected.length &&
      expected.every((id, i) => oracle.serverCards[i]?.id === id);

    if (!matches) {
      setResult(null);
      setErrorMsg(
        isEnglish
          ? "Unable to confirm your birth cards. Please reload and try again."
          : "ยืนยันไพ่ประจำตัวไม่สำเร็จ กรุณาโหลดใหม่อีกครั้ง"
      );
      return;
    }

    setResult(pendingResult);
    soundManager.playCardFlipSound();
    if (typeof window !== "undefined") {
      const year = era === "be" ? pendingResult.yearBe : pendingResult.yearCe;
      const newUrl = `${window.location.pathname}?d=${pendingResult.day}&m=${pendingResult.month}&y=${year}&era=${era}`;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }, [oracle.serverCards, pendingResult, isEnglish, era]);

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

    const yearCe = isBe ? parsedYear - 543 : parsedYear;
    const maxDays = getMaxDaysInMonth(yearCe, month);
    if (day > maxDays) {
      setErrorMsg(
        isEnglish
          ? `Selected month only has ${maxDays} days. Please select a valid day.`
          : `เดือนที่คุณเลือกมีเพียง ${maxDays} วัน กรุณาเลือกวันที่ให้ถูกต้อง`
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

    /*
     * ผลที่คำนวณในเครื่องยังไม่ขึ้นจอทันที — ต้องให้เซิร์ฟเวอร์เปิดไพ่ให้ก่อน
     * (กำแพงสมาชิกและโควตาอยู่ที่นั่น และแม่หมอต้องเป็นคนอ่านไพ่สองใบนี้ให้ฟัง)
     */
    startTransition(() => {
      setResult(null);
      setPendingResult(calcResult);
    });

    void oracle.run({
      spreadId: "birth-card",
      category: "self",
      question: isEnglish
        ? `My tarot birth cards from ${day}/${month}/${parsedYear} (${era === "be" ? "BE" : "CE"})`
        : `ไพ่ประจำตัวจากวันเกิด ${day}/${month}/${parsedYear} (${era === "be" ? "พ.ศ." : "ค.ศ."})`,
      /*
       * ⚠️ `resolveCards: false` — หน้านี้ใช้ข้อมูลไพ่ชุดที่ส่งมากับหน้า (`majorCards`) อยู่แล้ว
       * ไม่ต้องให้ท่อเปิดสำรับเต็มมาแปลงให้อีก (จะลาก `@/data/cards` เข้าบันเดิลเปล่า ๆ)
       */
      resolveCards: false,
      derive: { kind: "birth-card", day, month, year: parsedYear, era },
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

    const ok = await copyToClipboard(shareUrl);
    if (ok) {
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
              aria-invalid={errorMsg ? true : undefined}
              aria-describedby={errorMsg ? "birth-card-error" : undefined}
              value={day}
              onChange={(e) => setDay(Number.parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-line-interactive-warm bg-surface-warm px-3.5 py-2.5 text-xs sm:text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors"
            >
              {Array.from(
                {
                  length: getMaxDaysInMonth(
                    era === "be"
                      ? (Number.parseInt(yearInput.trim(), 10) || 2540) - 543
                      : Number.parseInt(yearInput.trim(), 10) || 1997,
                    month
                  ),
                },
                (_, i) => i + 1
              ).map((d) => (
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
              aria-invalid={errorMsg ? true : undefined}
              aria-describedby={errorMsg ? "birth-card-error" : undefined}
              value={month}
              onChange={(e) => {
                const newMonth = Number.parseInt(e.target.value, 10);
                setMonth(newMonth);
                const currentY =
                  era === "be"
                    ? (Number.parseInt(yearInput.trim(), 10) || 2540) - 543
                    : Number.parseInt(yearInput.trim(), 10) || 1997;
                const maxD = getMaxDaysInMonth(currentY, newMonth);
                if (day > maxD) setDay(maxD);
              }}
              className="w-full rounded-xl border border-line-interactive-warm bg-surface-warm px-3.5 py-2.5 text-xs sm:text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors"
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
              aria-invalid={errorMsg ? true : undefined}
              aria-describedby={errorMsg ? "birth-card-error" : undefined}
              type="number"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              placeholder={era === "be" ? "2540" : "1997"}
              className="w-full rounded-xl border border-line-interactive-warm bg-surface-warm px-3.5 py-2.5 text-xs sm:text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors"
            />
          </div>
        </div>

        {/* ♿ R-21: วันเกิดที่กรอกผิดต้องถูกประกาศทันที ไม่ใช่โผล่เป็นกล่องสีแดงเฉย ๆ
            ทุกช่องกรอกผูกกับกล่องนี้ด้วย aria-describedby เพื่อบอกว่าผิดตรงไหน */}
        {errorMsg && (
          <div
            id="birth-card-error"
            role="alert"
            className="p-3.5 rounded-xl bg-[#FAF0ED] border border-[#E8C5BE] text-xs font-sans text-[#8F2E1A] text-center"
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={oracle.isPreparing}
          className="w-full py-3 px-6 rounded-full bg-ink text-surface-warm text-xs sm:text-sm font-serif-th font-bold hover:bg-gold transition duration-200 cursor-pointer shadow-raised active:scale-95 tracking-wide disabled:opacity-60 disabled:cursor-wait"
        >
          {oracle.isPreparing
            ? isEnglish
              ? "Connecting to the Oracle…"
              : "กำลังเชื่อมสัญญาณกับแม่หมอ…"
            : isEnglish
              ? "Calculate Your Birth Card"
              : "คำนวณไพ่ประจำตัวของคุณ"}
        </button>

        {/* สตรีมสะดุด/เซิร์ฟเวอร์ไม่ตอบ — บอกตรง ๆ ตรงนี้ ไม่ต้องรอให้ผู้ใช้เดาว่าปุ่มเสีย */}
        {!result && oracle.state.error && (
          <p role="alert" className="text-xs font-sans text-[#8F2E1A] text-center">
            {oracle.state.error}
          </p>
        )}
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

          {/* คำอ่านของแม่หมอ — สตรีมสดทุกครั้ง ไม่ใช่ข้อความสำเร็จรูป */}
          <div className="pt-2">
            <AiReadingPanel
              state={oracle.state}
              isEn={isEnglish}
              onRetry={() => handleCalculate()}
              cardLabels={
                isEnglish
                  ? ["Personality Card", "Soul Card"]
                  : ["ไพ่บุคลิกภาพ", "ไพ่จิตวิญญาณ"]
              }
              title={
                isEnglish ? "The Oracle Reads Your Birth Cards" : "คำอ่านไพ่ประจำตัวจากแม่หมอ"
              }
            />
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

      {/* ด่านความปลอดภัย: สัญญาณวิกฤต ➔ สายด่วน (กฎเหล็กข้อ 6) */}
      {oracle.crisisMessage && (
        <div className="rounded-xl border border-line-warm bg-surface-warm p-5 text-sm leading-relaxed text-ink whitespace-pre-line max-w-2xl mx-auto">
          {oracle.crisisMessage}
        </div>
      )}

      {/* กำแพงสิทธิ์ — เซิร์ฟเวอร์เป็นผู้ตัดสิน หน้าเว็บแค่เล่าให้ฟัง */}
      {(oracle.gate !== null || authMode !== null) && (
        <React.Suspense fallback={null}>
          <AccessDialog
            reason={oracle.gate}
            onClose={oracle.clearGate}
            onSignup={() => {
              oracle.clearGate();
              setAuthMode("signup");
            }}
            onSignin={() => {
              oracle.clearGate();
              setAuthMode("signin");
            }}
            onBuyCredits={() => {
              oracle.clearGate();
              window.location.href = "/account";
            }}
          />
          <AuthModal
            isOpen={authMode !== null}
            onClose={() => setAuthMode(null)}
            initialMode={authMode ?? "signin"}
            fromEntitlementWall
          />
        </React.Suspense>
      )}
    </div>
  );
}
