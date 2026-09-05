"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { TarotCard } from "@/components/card/TarotCard";
import { calculateBirthCard, type BirthCardResult } from "@/lib/tarot/birth-card";
import { soundManager } from "@/lib/utils/audio";

const THAI_MONTHS = [
  { value: 1, name: "มกราคม" },
  { value: 2, name: "กุมภาพันธ์" },
  { value: 3, name: "มีนาคม" },
  { value: 4, name: "เมษายน" },
  { value: 5, name: "พฤษภาคม" },
  { value: 6, name: "มิถุนายน" },
  { value: 7, name: "กรกฎาคม" },
  { value: 8, name: "สิงหาคม" },
  { value: 9, name: "กันยายน" },
  { value: 10, name: "ตุลาคม" },
  { value: 11, name: "พฤศจิกายน" },
  { value: 12, name: "ธันวาคม" },
];

export function BirthCardCalculator() {
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
        const res = calculateBirthCard(qd, qm, qy, qera === "be");
        if (res) {
          setResult(res);
        }
      }
    }
  }, []);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundManager.playCardSelectSound();
    setErrorMsg(null);

    const parsedYear = Number.parseInt(yearInput.trim(), 10);
    if (!parsedYear || Number.isNaN(parsedYear)) {
      setErrorMsg("กรุณากรอกปีเกิดเป็นตัวเลขที่ถูกต้อง");
      return;
    }

    const isBe = era === "be";
    const minYear = isBe ? 2343 : 1800;
    const maxYear = isBe ? 2743 : 2200;

    if (parsedYear < minYear || parsedYear > maxYear) {
      setErrorMsg(`กรุณากรอกปีเกิดระหว่าง ${minYear} ถึง ${maxYear}`);
      return;
    }

    const calcResult = calculateBirthCard(day, month, parsedYear, isBe);

    if (!calcResult) {
      setErrorMsg("ไม่สามารถคำนวณไพ่ประจำตัวได้ กรุณาตรวจสอบวันเดือนปีเกิดแล้วลองใหม่อีกครั้ง");
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
    const shareTitle = `ไพ่ทาโรต์ประจำตัวของฉันคือ ${result.primaryCard.nameTh} (${result.primaryCard.nameEn})`;
    const shareText = `ฉันได้ไพ่ทาโรต์ประจำตัวคือ ${result.primaryCard.nameTh} (${result.primaryCard.nameEn}) มาคำนวณไพ่ประจำวันเกิดของคุณกันที่ SeerTarot`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-10">
      {/* Interactive Form Card (Astronomical Chronometer) */}
      <form
        onSubmit={handleCalculate}
        className="rounded-3xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-10 shadow-[var(--shadow-overlay)] max-w-2xl mx-auto space-y-8"
      >
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#8F5C1A] font-semibold">
            NATAL CHRONOMETER & NUMEROLOGY CODEX
          </span>
          <h2 className="font-serif-th text-2xl sm:text-3xl font-bold text-[#29261F] tracking-tight">
            ใส่วันเดือนปีเกิดของคุณ
          </h2>
          <p className="font-serif-th text-xs sm:text-sm text-[#7A6F5D]">
            ระบบคำนวณตามหลักเลขศาสตร์ไพ่ทาโรต์สากล 1909 Rider-Waite Major Arcana
          </p>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Day Dial */}
          <div className="space-y-1.5">
            <label htmlFor="birth-day" className="block text-xs font-serif-th font-semibold text-[#4A4338]">
              วันที่เกิด (Day)
            </label>
            <select
              id="birth-day"
              value={day}
              onChange={(e) => setDay(Number.parseInt(e.target.value, 10))}
              className="w-full rounded-2xl border border-[#D5CEC2] bg-[#FAF8F5] px-4 py-3 text-sm font-mono text-[#29261F] focus:border-[#8F5C1A] focus:outline-hidden focus:ring-1 focus:ring-[#8F5C1A] transition-colors shadow-inner"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  วันที่ {d}
                </option>
              ))}
            </select>
          </div>

          {/* Month Dial */}
          <div className="space-y-1.5">
            <label htmlFor="birth-month" className="block text-xs font-serif-th font-semibold text-[#4A4338]">
              เดือนเกิด (Month)
            </label>
            <select
              id="birth-month"
              value={month}
              onChange={(e) => setMonth(Number.parseInt(e.target.value, 10))}
              className="w-full rounded-2xl border border-[#D5CEC2] bg-[#FAF8F5] px-4 py-3 text-sm font-serif-th text-[#29261F] focus:border-[#8F5C1A] focus:outline-hidden focus:ring-1 focus:ring-[#8F5C1A] transition-colors shadow-inner"
            >
              {THAI_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="birth-year" className="block text-xs font-serif-th font-semibold text-[#4A4338]">
                ปีเกิด (Year)
              </label>
              <div className="flex items-center gap-1 text-[11px] font-serif-th">
                <button
                  type="button"
                  onClick={() => setEra("be")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    era === "be"
                      ? "bg-[#29261F] text-[#FAF8F5] font-bold"
                      : "text-[#7A6F5D] hover:text-[#29261F]"
                  }`}
                >
                  พ.ศ.
                </button>
                <span className="text-[#D5CEC2]">/</span>
                <button
                  type="button"
                  onClick={() => setEra("ce")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    era === "ce"
                      ? "bg-[#29261F] text-[#FAF8F5] font-bold"
                      : "text-[#7A6F5D] hover:text-[#29261F]"
                  }`}
                >
                  ค.ศ.
                </button>
              </div>
            </div>
            <input
              id="birth-year"
              type="number"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              placeholder={era === "be" ? "2540" : "1997"}
              className="w-full rounded-2xl border border-[#D5CEC2] bg-[#FAF8F5] px-4 py-3 text-sm font-mono text-[#29261F] focus:border-[#8F5C1A] focus:outline-hidden focus:ring-1 focus:ring-[#8F5C1A] transition-colors shadow-inner"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-[#FAF0ED] border border-[#E8C5BE] text-xs font-serif-th text-[#8F2E1A] text-center">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 px-6 rounded-2xl bg-[#29261F] text-[#FAF8F5] text-sm font-serif-th font-bold hover:bg-[#8F5C1A] transition-all duration-200 cursor-pointer shadow-[var(--shadow-raised)] active:scale-[0.98] tracking-wide"
        >
          คำนวณไพ่ประจำตัวของคุณ
        </button>
      </form>

      {/* Result Presentation (Museum Vitrines on Altar Cloth) */}
      {result && (
        <div className="rounded-3xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-12 shadow-[var(--shadow-overlay)] max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Header & Chronological Reduction Trace */}
          <div className="text-center space-y-3 border-b border-[#E8E2D8] pb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FAF8F5] text-xs font-mono font-semibold text-[#8F5C1A]">
              <span>วันเกิด:</span>
              <span>
                {result.day} {THAI_MONTHS[result.month - 1].name} {result.yearBe} (ค.ศ. {result.yearCe})
              </span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-bold font-serif-th text-[#29261F] tracking-tight">
              ไพ่ประจำตัวของคุณคือ {result.primaryCard.nameTh}
            </h3>

            <p className="text-xs sm:text-sm font-serif-th text-[#7A6F5D]">
              {result.primaryCard.nameEn} · หมายเลข {result.primaryNumber} แห่งสำรับไพ่ชุดใหญ่ (Major Arcana)
            </p>

            {/* Arithmetic Transparency Tag */}
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-md bg-[#FAF8F5] border border-[#D5CEC2]/60 text-[11px] font-mono text-[#7A6F5D]">
                ผลรวมเลขศาสตร์: {result.day} + {result.month} + {result.yearCe} = {result.calculatedSum} → ไพ่หมายเลข{" "}
                {result.primaryNumber}
              </span>
            </div>
          </div>

          {/* Altar Cloth Stage for Twin Vitrines */}
          <div className="altar-cloth bg-[#EAE7E0] border border-[#D5CEC2] rounded-3xl p-6 sm:p-10 shadow-inner">
            <div
              className={`grid gap-8 items-start ${
                result.secondaryCard ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-xl mx-auto"
              }`}
            >
              {/* Primary Card (Personality Card) */}
              <div className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-8 space-y-6 flex flex-col items-center text-center shadow-xs">
                <span className="px-3.5 py-1 rounded-full bg-[#FAF8F5] border border-[#D5CEC2] text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  ไพ่บุคลิกภาพ & พลังงานหลัก (Personality Card)
                </span>

                {/* 3D Interactive Card */}
                <div className="py-2 flex justify-center">
                  <TarotCard
                    card={result.primaryCard}
                    isRevealed={true}
                    size="lg"
                    className="shadow-[var(--shadow-overlay)]"
                  />
                </div>

                <div className="space-y-1 w-full text-center">
                  <div className="text-xl font-bold font-serif-th text-[#29261F]">
                    {result.primaryCard.nameTh} ({result.primaryCard.nameEn})
                  </div>
                  <div className="text-xs font-serif-th text-[#7A6F5D]">
                    ธาตุ: {result.primaryCard.element || "มิติแห่งดวงดาว"} · โหราศาสตร์: {result.primaryCard.astrology}
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-serif-th text-[#4A4338] leading-relaxed text-left pt-3 border-t border-[#E8E2D8] w-full space-y-2">
                  <p>
                    {result.primaryCard.numerology ||
                      result.primaryCard.meanings.self?.upright ||
                      result.primaryCard.meanings.general.upright}
                  </p>
                </div>

                <Link
                  href={`/cards/${result.primaryCard.id}`}
                  className="text-xs font-serif-th font-bold text-[#8F5C1A] hover:text-[#5E390A] underline underline-offset-4 mt-auto pt-2"
                >
                  อ่านคัมภีร์เจาะลึกไพ่ใบนี้ →
                </Link>
              </div>

              {/* Secondary Card (Soul Card) */}
              {result.secondaryCard && (
                <div className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-8 space-y-6 flex flex-col items-center text-center shadow-xs">
                  <span className="px-3.5 py-1 rounded-full bg-[#FAF8F5] border border-[#D5CEC2] text-xs font-serif-th font-semibold text-[#8F5C1A]">
                    ไพ่จิตวิญญาณ & เจตนารมณ์ลึก (Soul Card)
                  </span>

                  {/* 3D Interactive Card */}
                  <div className="py-2 flex justify-center">
                    <TarotCard
                      card={result.secondaryCard}
                      isRevealed={true}
                      size="lg"
                      className="shadow-[var(--shadow-overlay)]"
                    />
                  </div>

                  <div className="space-y-1 w-full text-center">
                    <div className="text-xl font-bold font-serif-th text-[#29261F]">
                      {result.secondaryCard.nameTh} ({result.secondaryCard.nameEn})
                    </div>
                    <div className="text-xs font-serif-th text-[#7A6F5D]">
                      ธาตุ: {result.secondaryCard.element || "มิติแห่งดวงดาว"} · โหราศาสตร์: {result.secondaryCard.astrology}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-serif-th text-[#4A4338] leading-relaxed text-left pt-3 border-t border-[#E8E2D8] w-full space-y-2">
                    <p>
                      {result.secondaryCard.numerology ||
                        result.secondaryCard.meanings.self?.upright ||
                        result.secondaryCard.meanings.general.upright}
                    </p>
                  </div>

                  <Link
                    href={`/cards/${result.secondaryCard.id}`}
                    className="text-xs font-serif-th font-bold text-[#8F5C1A] hover:text-[#5E390A] underline underline-offset-4 mt-auto pt-2"
                  >
                    อ่านคัมภีร์เจาะลึกไพ่ใบนี้ →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Action & Next Steps Bar */}
          <div className="space-y-8 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleShare}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] hover:border-[#8F5C1A] text-xs font-serif-th font-bold text-[#29261F] transition-all cursor-pointer shadow-xs"
              >
                <span>{copied ? "คัดลอกลิงก์ผลลัพธ์แล้ว" : "แชร์ผลลัพธ์ไพ่ประจำตัว"}</span>
              </button>

              <Link
                href="/spreads/celtic-cross"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#29261F] text-[#FAF8F5] text-xs font-serif-th font-bold text-center hover:bg-[#8F5C1A] transition-all shadow-xs"
              >
                เปิดผังเซลติกครอส 10 ใบ พยากรณ์ชะตาชีวิต
              </Link>
            </div>

            {/* Quick Ritual Recommended Next Links */}
            <div className="pt-4 border-t border-[#E8E2D8] space-y-4">
              <div className="text-center sm:text-left space-y-1">
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#8F5C1A] font-semibold">
                  RECOMMENDED TAROT EXPEDITIONS
                </span>
                <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                  ขั้นตอนพยากรณ์ชะตาถัดไปที่แนะนำ
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  href="/daily"
                  className="p-4 rounded-2xl border border-[#EADFD5] bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF9] to-[#F7EFE9] hover:border-[#C48464] text-center transition-all duration-300 group block shadow-xs"
                >
                  <div className="text-[10px] font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
                    DAILY ORACLE
                  </div>
                  <div className="text-xs font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors mt-0.5">
                    ดูดวงไพ่ยิปซีรายวัน
                  </div>
                  <p className="text-[11px] font-serif-th text-[#7A6F5D] mt-1">
                    เช็กพลังงานประจำวัน 5 มิติ
                  </p>
                </Link>

                <Link
                  href="/love/1-card"
                  className="p-4 rounded-2xl border border-[#EADFD5] bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF9] to-[#F7EFE9] hover:border-[#C48464] text-center transition-all duration-300 group block shadow-xs"
                >
                  <div className="text-[10px] font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
                    LOVE ORACLE
                  </div>
                  <div className="text-xs font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors mt-0.5">
                    ดูดวงความรัก 1 ใบ
                  </div>
                  <p className="text-[11px] font-serif-th text-[#7A6F5D] mt-1">
                    ไขคำตอบสถานะหัวใจ 4 มิติ
                  </p>
                </Link>

                <Link
                  href="/readers"
                  className="p-4 rounded-2xl border border-[#EADFD5] bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF9] to-[#F7EFE9] hover:border-[#C48464] text-center transition-all duration-300 group block shadow-xs"
                >
                  <div className="text-[10px] font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
                    PERSONAL READERS
                  </div>
                  <div className="text-xs font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors mt-0.5">
                    ปรึกษาแม่หมอตัวจริง
                  </div>
                  <p className="text-[11px] font-serif-th text-[#7A6F5D] mt-1">
                    พูดคุยกับนักพยากรณ์มืออาชีพ
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
