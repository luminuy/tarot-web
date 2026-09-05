"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { CardImage } from "@/components/card/CardImage";
import { calculateBirthCard, type BirthCardResult } from "@/lib/tarot/birth-card";

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
      // อัปเดต URL เพื่อให้ผู้ใช้คัดลอกไปแชร์ได้สะดวก
      if (typeof window !== "undefined") {
        const newUrl = `${window.location.pathname}?d=${day}&m=${month}&y=${parsedYear}&era=${era}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }
    });
  };

  const handleShare = async () => {
    if (!result) return;
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
    <div className="space-y-8">
      {/* Interactive Form Card */}
      <form
        onSubmit={handleCalculate}
        className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="font-serif-th text-xl sm:text-2xl font-bold text-[#29261F]">
            ใส่วันเดือนปีเกิดของคุณ
          </h2>
          <p className="font-serif-th text-xs sm:text-sm text-[#7A6F5D]">
            ระบบคำนวณตามหลักเลขศาสตร์ไพ่ทาโรต์สากล 1909 Rider-Waite
          </p>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Day */}
          <div className="space-y-1.5">
            <label htmlFor="birth-day" className="block text-xs font-serif-th font-semibold text-[#4A4338]">
              วันที่เกิด
            </label>
            <select
              id="birth-day"
              value={day}
              onChange={(e) => setDay(Number.parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] px-3 py-2.5 text-sm font-mono text-[#29261F] focus:border-[#8F5C1A] focus:outline-hidden"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  วันที่ {d}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div className="space-y-1.5">
            <label htmlFor="birth-month" className="block text-xs font-serif-th font-semibold text-[#4A4338]">
              เดือนเกิด
            </label>
            <select
              id="birth-month"
              value={month}
              onChange={(e) => setMonth(Number.parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] px-3 py-2.5 text-sm font-serif-th text-[#29261F] focus:border-[#8F5C1A] focus:outline-hidden"
            >
              {THAI_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="birth-year" className="block text-xs font-serif-th font-semibold text-[#4A4338]">
                ปีเกิด
              </label>
              <div className="flex items-center gap-1 text-[11px] font-serif-th">
                <button
                  type="button"
                  onClick={() => setEra("be")}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    era === "be"
                      ? "bg-[#29261F] text-white font-bold"
                      : "text-[#7A6F5D] hover:text-[#29261F]"
                  }`}
                >
                  พ.ศ.
                </button>
                <span className="text-[#D5CEC2]">/</span>
                <button
                  type="button"
                  onClick={() => setEra("ce")}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    era === "ce"
                      ? "bg-[#29261F] text-white font-bold"
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
              placeholder={era === "be" ? "2538" : "1995"}
              className="w-full rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] px-3 py-2.5 text-sm font-mono text-[#29261F] focus:border-[#8F5C1A] focus:outline-hidden"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-serif-th text-red-700 text-center">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 px-6 rounded-xl bg-[#29261F] text-[#FAF8F5] text-sm font-serif-th font-bold hover:bg-[#3E382E] transition-all duration-200 cursor-pointer shadow-xs"
        >
          คำนวณไพ่ประจำตัวของคุณ
        </button>
      </form>

      {/* Result Card */}
      {result && (
        <div className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-10 shadow-md max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2 border-b border-[#E8E2D8] pb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D5CEC2] bg-[#FAF8F5] text-xs font-mono font-bold text-[#8F5C1A]">
              เกิด {result.day} {THAI_MONTHS[result.month - 1].name} {result.yearBe} (ค.ศ. {result.yearCe})
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif-th text-[#29261F]">
              ไพ่ประจำตัวของคุณคือ {result.primaryCard.nameTh}
            </h3>
            <p className="text-xs sm:text-sm font-serif-th text-[#7A6F5D]">
              {result.primaryCard.nameEn} · หมายเลข {result.primaryNumber} แห่งสำรับไพ่ชุดใหญ่ (Major Arcana)
            </p>
          </div>

          {/* Cards Display Grid */}
          <div className={`grid gap-6 ${result.secondaryCard ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"}`}>
            {/* Primary Card */}
            <div className="rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] p-5 space-y-4 flex flex-col items-center text-center">
              <span className="px-3 py-0.5 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] text-xs font-serif-th font-bold text-[#5E5240]">
                ไพ่บุคลิกภาพ & พลังงานหลัก (Personality Card)
              </span>

              <div className="w-44 h-72 rounded-lg overflow-hidden shadow-md border border-[#D5CEC2] relative">
                <CardImage
                  image={result.primaryCard.image}
                  cardId={result.primaryCard.id}
                  alt={result.primaryCard.nameEn || result.primaryCard.nameTh}
                  sizes="220px"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <div className="text-lg font-bold font-serif-th text-[#29261F]">
                  {result.primaryCard.nameTh} ({result.primaryCard.nameEn})
                </div>
                <div className="text-xs font-serif-th text-[#7A6F5D]">
                  ธาตุ: {result.primaryCard.element || "มิติแห่งดวงดาว"} · โหราศาสตร์: {result.primaryCard.astrology}
                </div>
              </div>

              <p className="text-xs font-serif-th text-[#4A4338] leading-relaxed text-left pt-2 border-t border-[#E8E2D8]">
                {result.primaryCard.numerology || result.primaryCard.meanings.self?.upright || result.primaryCard.meanings.general.upright}
              </p>

              <Link
                href={`/cards/${result.primaryCard.id}`}
                className="text-xs font-serif-th font-bold text-[#8F5C1A] hover:text-[#5E390A] underline underline-offset-4 mt-auto"
              >
                อ่านคัมภีร์เจาะลึกไพ่ใบนี้ ➔
              </Link>
            </div>

            {/* Secondary Soul Card */}
            {result.secondaryCard && (
              <div className="rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] p-5 space-y-4 flex flex-col items-center text-center">
                <span className="px-3 py-0.5 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] text-xs font-serif-th font-bold text-[#5E5240]">
                  ไพ่จิตวิญญาณ & เจตนารมณ์ลึก (Soul Card)
                </span>

                <div className="w-44 h-72 rounded-lg overflow-hidden shadow-md border border-[#D5CEC2] relative">
                  <CardImage
                    image={result.secondaryCard.image}
                    cardId={result.secondaryCard.id}
                    alt={result.secondaryCard.nameEn || result.secondaryCard.nameTh}
                    sizes="220px"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-bold font-serif-th text-[#29261F]">
                    {result.secondaryCard.nameTh} ({result.secondaryCard.nameEn})
                  </div>
                  <div className="text-xs font-serif-th text-[#7A6F5D]">
                    ธาตุ: {result.secondaryCard.element || "มิติแห่งดวงดาว"} · โหราศาสตร์: {result.secondaryCard.astrology}
                  </div>
                </div>

                <p className="text-xs font-serif-th text-[#4A4338] leading-relaxed text-left pt-2 border-t border-[#E8E2D8]">
                  {result.secondaryCard.numerology || result.secondaryCard.meanings.self?.upright || result.secondaryCard.meanings.general.upright}
                </p>

                <Link
                  href={`/cards/${result.secondaryCard.id}`}
                  className="text-xs font-serif-th font-bold text-[#8F5C1A] hover:text-[#5E390A] underline underline-offset-4 mt-auto"
                >
                  อ่านคัมภีร์เจาะลึกไพ่ใบนี้ ➔
                </Link>
              </div>
            )}
          </div>

          {/* Action & Share Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E8E2D8]">
            <button
              type="button"
              onClick={handleShare}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] hover:border-[#8F5C1A] text-xs font-serif-th font-bold text-[#29261F] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{copied ? "คัดลอกลิงก์ผลลัพธ์แล้ว" : "แชร์ผลลัพธ์ไพ่ประจำตัว"}</span>
            </button>

            <Link
              href="/spreads"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#29261F] text-[#FAF8F5] text-xs font-serif-th font-bold text-center hover:bg-[#3E382E] transition-all"
            >
              เลือกผังเพื่อเริ่มดูดวง
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
