"use client";

import React, { useState, useEffect, useTransition } from "react";
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
import { CardImage } from "@/components/card/CardImage";
/* 💤 กล่องสิทธิ์/กล่องสมัครสมาชิกโหลดตอนถูกเรียกใช้จริงเท่านั้น (บทเรียนงบบันเดิลของ `/daily`) */
const AccessDialog = React.lazy(() =>
  import("@/components/entitlement/AccessDialog").then((m) => ({ default: m.AccessDialog }))
);
const AuthModal = React.lazy(() =>
  import("@/components/auth/AuthModal").then((m) => ({ default: m.AuthModal }))
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
  // ผู้ใช้อังกฤษเริ่มที่ ค.ศ. (v1 ตั้ง พ.ศ. 2540 ให้ทุกภาษา คนต่างชาติต้องสลับเองก่อน)
  const [yearInput, setYearInput] = useState<string>(isEnglish ? "1997" : "2540");
  const [era, setEra] = useState<"be" | "ce">(isEnglish ? "ce" : "be");
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

  const yearForDays =
    era === "be"
      ? (Number.parseInt(yearInput.trim(), 10) || 2540) - 543
      : Number.parseInt(yearInput.trim(), 10) || 1997;
  /** สลับ พ.ศ./ค.ศ. แล้วแปลงปีที่กรอกไว้ให้ด้วย (v1 สลับแค่ป้าย ปี 2540 กลายเป็น ค.ศ. 2540 แล้วฟ้องผิด) */
  const switchEra = (next: "be" | "ce") => {
    if (next === era) return;
    const y = Number.parseInt(yearInput.trim(), 10);
    if (y) setYearInput(String(next === "ce" ? y - 543 : y + 543));
    setEra(next);
  };
  const monthName = (m: number) => (isEnglish ? MONTHS[m - 1].nameEn : MONTHS[m - 1].nameTh);
  const errorProps = {
    "aria-invalid": errorMsg ? true : undefined,
    "aria-describedby": errorMsg ? "birth-card-error" : undefined,
  } as const;

  /** ไพ่ที่ขึ้นจอ = ผลที่เซิร์ฟเวอร์ยืนยันแล้วเท่านั้น (กฎเหล็กข้อ 14) */
  const shownCards = result
    ? [
        {
          card: result.primaryCard,
          n: result.primaryNumber,
          label: result.secondaryCard
            ? isEnglish ? "Personality Card" : "ไพ่บุคลิกภาพ"
            : isEnglish ? "Personality & Soul Card" : "ไพ่บุคลิกภาพและจิตวิญญาณ",
        },
        ...(result.secondaryCard
          ? [{ card: result.secondaryCard, n: result.secondaryNumber ?? 0, label: isEnglish ? "Soul Card" : "ไพ่จิตวิญญาณ" }]
          : []),
      ]
    : [];

  return (
    <div className="v2-bc">
      {/*
        โต๊ะคำนวณ v2 — ฟอร์มกับช่องไพ่อยู่จอเดียวกัน (v1 ต้องเลื่อนลงไปดูผลอีกกล่อง)
        ซ้าย: ใส่วันเกิด 3 ช่อง + อ่านทวน · ขวา: ไพ่คว่ำรอ ➔ ไพ่จริงของคุณเมื่อเซิร์ฟเวอร์ยืนยัน
      */}
      <div className={`v2-bc-desk${result ? " is-done" : ""}`}>
        <form onSubmit={handleCalculate} className="v2-bc-form" noValidate>
          <p className="v2-bc-step">
            <span aria-hidden="true">1</span>
            {isEnglish ? "Your date of birth" : "ใส่วันเกิดของคุณ"}
          </p>

          <div className="v2-bc-fields">
            <div className="v2-bc-f v2-bc-f-day">
              <label htmlFor="birth-day">{isEnglish ? "Day" : "วันที่"}</label>
              <select
                id="birth-day"
                {...errorProps}
                value={day}
                onChange={(e) => setDay(Number.parseInt(e.target.value, 10))}
              >
                {Array.from({ length: getMaxDaysInMonth(yearForDays, month) }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="v2-bc-f v2-bc-f-month">
              <label htmlFor="birth-month">{isEnglish ? "Month" : "เดือน"}</label>
              <select
                id="birth-month"
                {...errorProps}
                value={month}
                onChange={(e) => {
                  const newMonth = Number.parseInt(e.target.value, 10);
                  setMonth(newMonth);
                  const maxD = getMaxDaysInMonth(yearForDays, newMonth);
                  if (day > maxD) setDay(maxD);
                }}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {monthName(m.value)}
                  </option>
                ))}
              </select>
            </div>

            <div className="v2-bc-f v2-bc-f-year">
              <label htmlFor="birth-year">{isEnglish ? "Year" : "ปีเกิด"}</label>
              <div className="v2-bc-year">
                <input
                  id="birth-year"
                  {...errorProps}
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday-year"
                  maxLength={4}
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value.replace(/\D/g, ""))}
                  placeholder={era === "be" ? "2540" : "1997"}
                />
                <div role="group" aria-label={isEnglish ? "Calendar" : "ปฏิทิน"} className="v2-bc-era">
                  <button type="button" onClick={() => switchEra("be")} aria-pressed={era === "be"}>
                    {isEnglish ? "BE" : "พ.ศ."}
                  </button>
                  <button type="button" onClick={() => switchEra("ce")} aria-pressed={era === "ce"}>
                    {isEnglish ? "CE" : "ค.ศ."}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* อ่านทวนวันเกิดเป็นประโยคเดียว — เห็นทันทีว่ากรอกถูก ก่อนกดใช้สิทธิ์ */}
          <p className="v2-bc-preview" aria-live="polite">
            {isEnglish
              ? `Born ${monthName(month)} ${day}, ${yearInput || "—"} ${era === "be" ? "BE" : "CE"}`
              : `เกิดวันที่ ${day} ${monthName(month)} ${era === "be" ? "พ.ศ." : "ค.ศ."} ${yearInput || "—"}`}
          </p>

          {/* ♿ R-21: วันเกิดที่กรอกผิดต้องถูกประกาศทันที — ทุกช่องผูกกับกล่องนี้ด้วย aria-describedby */}
          {errorMsg && (
            <p id="birth-card-error" role="alert" className="v2-bc-alert">
              {errorMsg}
            </p>
          )}

          <button type="submit" disabled={oracle.isPreparing} className="ui2-btn v2-bc-go">
            {oracle.isPreparing
              ? isEnglish
                ? "Connecting to the Oracle…"
                : "กำลังเชื่อมสัญญาณกับแม่หมอ…"
              : result
                ? isEnglish
                  ? "Calculate Again"
                  : "คำนวณใหม่"
                : isEnglish
                  ? "Reveal My Birth Card"
                  : "เปิดไพ่ประจำตัวของฉัน"}
          </button>

          {/* สตรีมสะดุด/เซิร์ฟเวอร์ไม่ตอบ — บอกตรง ๆ ตรงนี้ ไม่ต้องรอให้ผู้ใช้เดาว่าปุ่มเสีย */}
          {!result && oracle.state.error && (
            <p role="alert" className="v2-bc-alert">
              {oracle.state.error}
            </p>
          )}

          <p className="v2-bc-fine">
            {isEnglish
              ? "Standard tarot numerology · 22 Major Arcana of the 1909 Rider-Waite deck"
              : "เลขศาสตร์ไพ่ทาโรต์สากล · ไพ่ชุดใหญ่ 22 ใบของสำรับ 1909 Rider-Waite"}
          </p>
        </form>

        {/* ช่องไพ่ — ก่อนคำนวณเป็นไพ่คว่ำ (ไม่ใช่ไพ่ใบไหน) · หลังยืนยันเป็นไพ่จริงพลิกขึ้น */}
        <div className="v2-bc-slot" aria-live="polite">
          {result ? (
            <ul className={`v2-bc-cards${shownCards.length > 1 ? " is-pair" : ""}`}>
              {shownCards.map(({ card, n, label }) => (
                <li key={card.id} className="v2-bc-card">
                  <span className="v2-bc-card-label">{label}</span>
                  <span className="v2-bc-card-frame">
                    <span className="ui2-cd-rays" aria-hidden="true" />
                    <CardImage
                      cardId={card.id}
                      image={card.image}
                      alt={isEnglish ? card.nameEn : `${card.nameTh} (${card.nameEn})`}
                      sizes="(min-width: 1024px) 200px, 140px"
                      className="v2-bc-card-img"
                    />
                  </span>
                  <span className="v2-bc-card-name">
                    <b>{n}</b>
                    {isEnglish ? card.nameEn : card.nameTh}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={`v2-bc-wait${oracle.isPreparing || pendingResult ? " is-busy" : ""}`}>
              <span className="v2-bc-back card-back-pattern" aria-hidden="true" />
              <span className="v2-bc-back card-back-pattern" aria-hidden="true" />
              <p>
                {isEnglish ? "Your two birth cards appear here" : "ไพ่ประจำตัวของคุณจะปรากฏตรงนี้"}
              </p>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="v2-bc-result">
          {/* รอยทางเลขศาสตร์เป็นแผ่นเลขเรียงกัน — อ่านออกในแวบเดียวว่าเลขไพ่มาจากไหน */}
          <div className="v2-bc-trail">
            <p className="v2-bc-step">
              <span aria-hidden="true">2</span>
              {isEnglish
                ? `How ${result.day} ${monthName(result.month)} ${result.yearCe} became card ${result.primaryNumber}`
                : `วันเกิด ${result.day} ${monthName(result.month)} ${result.yearBe} กลายเป็นไพ่หมายเลข ${result.primaryNumber} ได้อย่างไร`}
            </p>
            <p className="sr-only">
              {isEnglish
                ? `Numerological Sum: ${result.day} + ${result.month} + ${result.yearCe} = ${result.calculatedSum} → Card #${result.primaryNumber}`
                : `ผลรวมเลขศาสตร์: ${result.day} + ${result.month} + ${result.yearCe} = ${result.calculatedSum} → ไพ่หมายเลข ${result.primaryNumber}`}
            </p>
            <ol className="ui2-bc-eq" aria-hidden="true">
              <li><b>{result.day}</b><small>{isEnglish ? "day" : "วัน"}</small></li>
              <li className="ui2-bc-op">+</li>
              <li><b>{result.month}</b><small>{isEnglish ? "month" : "เดือน"}</small></li>
              <li className="ui2-bc-op">+</li>
              <li><b>{result.yearCe}</b><small>{isEnglish ? "year CE" : "ปี ค.ศ."}</small></li>
              <li className="ui2-bc-op">=</li>
              <li><b>{result.calculatedSum}</b><small>{isEnglish ? "sum" : "ผลรวม"}</small></li>
              <li className="ui2-bc-op ui2-bc-arrow" />
              <li className="ui2-bc-final"><b>{result.primaryNumber}</b><small>{isEnglish ? "card no." : "ไพ่หมายเลข"}</small></li>
            </ol>
          </div>

          {/* ความหมายรายใบ — การ์ดข้อความคู่ ไม่ใช่การ์ดซ้อนการ์ดแบบ v1 */}
          <div className={`v2-bc-meanings${shownCards.length > 1 ? " is-pair" : ""}`}>
            {shownCards.map(({ card, label }) => (
              <article key={card.id} className="v2-bc-meaning">
                <p className="v2-bc-meaning-k">{label}</p>
                <h3 className="tp">{isEnglish ? card.nameEn : `${card.nameTh} (${card.nameEn})`}</h3>
                <p className="v2-bc-meaning-meta">
                  {isEnglish
                    ? `Element: ${card.element} · Astrology: ${card.astrologyEn || card.astrology}`
                    : `ธาตุ: ${card.element || "มิติแห่งดวงดาว"} · โหราศาสตร์: ${card.astrology}`}
                </p>
                <p className="v2-bc-meaning-body">
                  {isEnglish && card.numerologyEn
                    ? card.numerologyEn
                    : card.numerology || card.meanings?.self?.upright || card.meanings?.general?.upright}
                </p>
                <Link href={`/cards/${card.id}`} className="v2-bc-more">
                  {isEnglish ? "Read the full card guide" : "อ่านความหมายไพ่ใบนี้แบบเต็ม"}
                </Link>
              </article>
            ))}
          </div>

          {/* คำอ่านของแม่หมอ — สตรีมสดทุกครั้ง ไม่ใช่ข้อความสำเร็จรูป */}
          <AiReadingPanel
            insight={oracle}
            state={oracle.state}
            isEn={isEnglish}
            onRetry={() => {
              // A3-10: อ่านไพ่ชุดเดิมซ้ำ ไม่เปิดเซสชันใหม่ (ไม่หักสิทธิ์ซ้ำ)
              void oracle.retryRead().then((ok) => {
                if (!ok) handleCalculate();
              });
            }}
            cardLabels={isEnglish ? ["Personality Card", "Soul Card"] : ["ไพ่บุคลิกภาพ", "ไพ่จิตวิญญาณ"]}
            title={isEnglish ? "The Oracle Reads Your Birth Cards" : "คำอ่านไพ่ประจำตัวจากแม่หมอ"}
          />

          {/* ไปต่อ — ปุ่มแชร์ + ทางไปต่อ 3 ทางในแถวเดียว */}
          <div className="v2-bc-next">
            <button type="button" onClick={handleShare} className="ui2-btn-ghost v2-bc-share">
              {copied
                ? isEnglish
                  ? "Link Copied!"
                  : "คัดลอกลิงก์ผลลัพธ์แล้ว"
                : isEnglish
                  ? "Share My Birth Card"
                  : "แชร์ไพ่ประจำตัวของฉัน"}
            </button>
            <nav aria-label={isEnglish ? "Next readings" : "ดูดวงต่อ"} className="v2-bc-links">
              <Link href="/daily">{isEnglish ? "Daily Tarot" : "ดูดวงรายวัน"}</Link>
              <Link href="/love/1-card">{isEnglish ? "Love Tarot 1 Card" : "ดูดวงความรัก 1 ใบ"}</Link>
              <Link href="/spreads/celtic-cross">{isEnglish ? "Celtic Cross 10 Cards" : "ผังเซลติกครอส 10 ใบ"}</Link>
              <Link href="/readers">{isEnglish ? "Talk to a Reader" : "ปรึกษาแม่หมอตัวจริง"}</Link>
            </nav>
          </div>
        </div>
      )}

      {/* ด่านความปลอดภัย: สัญญาณวิกฤต ➔ สายด่วน (กฎเหล็กข้อ 6) */}
      {oracle.crisisMessage && (
        <div className="v2-bc-crisis">{oracle.crisisMessage}</div>
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
