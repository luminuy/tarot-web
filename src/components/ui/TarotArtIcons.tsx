"use client";

import React from "react";

import { CardImage } from "@/components/card/CardImage";

// ============================================================================
// 1. REUSABLE 1909 RIDER-WAITE MINI CARD PRIMITIVE (MATHEMATICALLY CALIBRATED)
// ============================================================================

interface MiniCardProps {
  src: string;
  className?: string;
  borderColor?: string;
  highlight?: boolean;
  rotate?: number;
}

export const MiniRwsCard: React.FC<MiniCardProps> = ({
  src,
  className = "w-12 h-[82px]",
  borderColor = "#D9C8AC",
  highlight = false,
  rotate = 0,
}) => (
  <div
    className={`relative rounded-lg overflow-hidden border transition-all duration-300 flex-shrink-0 select-none ${className} ${
      highlight
        ? "ring-1.5 ring-[#8F5C1A] ring-offset-1 ring-offset-[#FFFFFF] z-10 scale-[1.04]"
        : "hover:border-[#8F5C1A]"
    }`}
    style={{
      borderColor: highlight ? "#8F5C1A" : borderColor,
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
    }}
  >
    {/* 100% Pure 1909 Rider-Waite Card Art */}
    <CardImage
      image={src}
      alt="Tarot Card"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="96px"
    />
  </div>
);

// ============================================================================
// 2. ORACLE GUIDES (3 PERSONAS - 1909 RIDER-WAITE)
// ============================================================================

export const HighPriestessIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-[#D9C8AC] ${className}`}>
    <CardImage
      image="major-02.jpg"
      alt="The High Priestess"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="112px"
    />
  </div>
);

export const JusticeIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-[#D9C8AC] ${className}`}>
    <CardImage
      image="major-11.jpg"
      alt="Justice"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="112px"
    />
  </div>
);

export const HermitIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-[#D9C8AC] ${className}`}>
    <CardImage
      image="major-09.jpg"
      alt="The Hermit"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="112px"
    />
  </div>
);

export const TheStarIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-[#D9C8AC] ${className}`}>
    <CardImage
      image="major-17.jpg"
      alt="The Star"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="112px"
    />
  </div>
);

export const MagicianIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-[#D9C8AC] ${className}`}>
    <CardImage
      image="major-01.jpg"
      alt="The Magician"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="112px"
    />
  </div>
);

// ============================================================================
// 3. SACRED SPREAD PREVIEW FORMATIONS (20 SPREADS — PERFECT FIT & ZERO OVERFLOW)
// ============================================================================

// 1. ไพ่ประจำวัน (1 ใบ)
export const DailySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-19.jpg"
      borderColor="#D9C8AC"
      className="w-16 h-[108px] sm:w-17 sm:h-[115px]"
      highlight
    />
  </div>
);

// 2. สรุปด่วน (2 ใบ)
export const QuickSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-3 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-00.jpg"
      borderColor="#8F5C1A"
      className="w-13 h-[88px] sm:w-14 sm:h-[95px]"
    />
    <MiniRwsCard
      src="/cards/major-01.jpg"
      borderColor="#D9C8AC"
      className="w-14 h-[95px] sm:w-15 sm:h-[102px]"
      highlight
    />
  </div>
);

// 3. ใช่หรือไม่ (3 ใบ)
export const YesNoSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-2 relative ${className}`}>
    <MiniRwsCard
      src="/cards/swords-03.jpg"
      borderColor="#A6392C"
      className="w-11 h-[75px] opacity-85"
    />
    <MiniRwsCard
      src="/cards/major-10.jpg"
      borderColor="#D9C8AC"
      className="w-13 h-[88px] sm:w-14 sm:h-[95px]"
      highlight
    />
    <MiniRwsCard
      src="/cards/cups-02.jpg"
      borderColor="#3A7044"
      className="w-11 h-[75px] opacity-85"
    />
  </div>
);

// 4. อดีต ปัจจุบัน อนาคต (3 ใบ)
export const ThreeCardSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-2 relative ${className}`}>
    <div className="absolute w-36 h-0.5 border-b border-dashed border-[#D9C8AC]/40 top-1/2 -translate-y-1/2 z-0" />
    <MiniRwsCard src="/cards/major-09.jpg" className="w-11 h-[75px] sm:w-12 sm:h-[82px] z-10 opacity-90" />
    <MiniRwsCard
      src="/cards/major-17.jpg"
      borderColor="#D9C8AC"
      className="w-13 h-[88px] sm:w-14 sm:h-[95px] z-10"
      highlight
    />
    <MiniRwsCard src="/cards/major-21.jpg" className="w-11 h-[75px] sm:w-12 sm:h-[82px] z-10 opacity-90" />
  </div>
);

// 5. ดวงความรักสองหัวใจ (5 ใบ) — Perfectly Proportionate
export const LoveSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-06.jpg"
      borderColor="#D9C8AC"
      className="w-10 h-[68px]"
      highlight
    />
    <div className="flex items-center justify-center gap-1.5">
      <MiniRwsCard src="/cards/cups-02.jpg" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/swords-04.jpg" borderColor="#A6392C" className="w-8.5 h-[58px] opacity-85" />
      <MiniRwsCard src="/cards/cups-03.jpg" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/cups-10.jpg" borderColor="#D9C8AC" className="w-8.5 h-[58px]" />
    </div>
  </div>
);

// 6. เส้นทางการงาน (5 ใบ) — Career Pyramid
export const CareerSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-04.jpg"
      borderColor="#D9C8AC"
      className="w-10 h-[68px]"
      highlight
    />
    <div className="flex items-center justify-center gap-1.5">
      <MiniRwsCard src="/cards/wands-03.jpg" className="w-8.5 h-[58px] opacity-85" />
      <MiniRwsCard src="/cards/pentacles-08.jpg" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/wands-06.jpg" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/pentacles-01.jpg" borderColor="#3A7044" className="w-8.5 h-[58px]" />
    </div>
  </div>
);

// 7. การเงินและความมั่นคง (4 ใบ)
export const MoneySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/pentacles-10.jpg"
      borderColor="#D9C8AC"
      className="w-10 h-[68px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/pentacles-04.jpg" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/pentacles-05.jpg" borderColor="#A6392C" className="w-9 h-[62px] opacity-85" />
      <MiniRwsCard src="/cards/pentacles-09.jpg" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 8. ทางแยกสองทาง (5 ใบ)
export const DecisionSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-07.jpg"
      borderColor="#D9C8AC"
      className="w-9.5 h-[65px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2">
      <div className="flex gap-1 p-0.5 rounded-lg border border-[#D9C8AC]/30 bg-[#F3EDE2]/5">
        <MiniRwsCard src="/cards/swords-02.jpg" className="w-8 h-[54px]" />
        <MiniRwsCard src="/cards/wands-07.jpg" className="w-8 h-[54px]" />
      </div>
      <div className="flex gap-1 p-0.5 rounded-lg border border-[#D9C8AC]/30 bg-[#F3EDE2]/5">
        <MiniRwsCard src="/cards/pentacles-02.jpg" className="w-8 h-[54px]" />
        <MiniRwsCard src="/cards/cups-09.jpg" className="w-8 h-[54px]" />
      </div>
    </div>
  </div>
);

// 9. Celtic Cross (10 ใบ) — Sacred Geometry (คำนวณพิกัดจริง ไม่ให้ไพ่ทับกัน)
//
// ⚠️ บทเรียน INC-0058: เวอร์ชันเดิมวางไพ่ด้วย `absolute top-0/bottom-0` ในกล่อง 112px
// ทำให้แขนกางเขนกินพื้นที่ทับไพ่กลาง และเสาไพ่ 4 ใบ (188px) ทะลุกรอบ 160px
// เวอร์ชันนี้จึงคำนวณพิกัดทุกใบจากค่าคงที่ด้านล่าง (หน่วย px) แล้วยืนยันด้วยเลขว่าไม่มีใบไหนซ้อนกัน
const CC = {
  cardW: 26,
  cardH: 45,
  colGap: 14, // เว้นให้ไพ่ใบขวางที่หมุน 90° (กว้าง 45px) ไม่แตะแขนซ้าย/ขวา
  rowGap: 7,
  staffW: 20,
  staffH: 34,
  staffGap: 4,
  armGap: 12, // ระยะจากปลายกางเขนถึงเสาไพ่
} as const;

const CC_COL = [0, CC.cardW + CC.colGap, (CC.cardW + CC.colGap) * 2];
const CC_ROW = [0, CC.cardH + CC.rowGap, (CC.cardH + CC.rowGap) * 2];
const CC_CROSS_W = CC.cardW * 3 + CC.colGap * 2;
const CC_CROSS_H = CC.cardH * 3 + CC.rowGap * 2;
const CC_STAFF_X = CC_CROSS_W + CC.armGap;
const CC_STAFF_TOP = (CC_CROSS_H - (CC.staffH * 4 + CC.staffGap * 3)) / 2;
const CC_BOX_W = CC_STAFF_X + CC.staffW;

export const CelticCrossSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => {
  const arms = [
    { image: "major-04.jpg", x: CC_COL[1], y: CC_ROW[0] }, // 5 สิ่งที่อยู่ในใจ
    { image: "major-19.jpg", x: CC_COL[0], y: CC_ROW[1] }, // 4 อดีต
    { image: "major-17.jpg", x: CC_COL[2], y: CC_ROW[1] }, // 6 อนาคตอันใกล้
    { image: "major-18.jpg", x: CC_COL[1], y: CC_ROW[2] }, // 3 รากฐานจิตใต้สำนึก
  ];
  const staff = ["major-21.jpg", "major-14.jpg", "major-11.jpg", "major-09.jpg"];

  return (
    <div className={`flex items-center justify-center relative ${className}`}>
      <div className="relative" style={{ width: CC_BOX_W, height: CC_CROSS_H }}>
        {/* แสงเรืองใต้ใจกลางกางเขน (อยู่หลังไพ่เสมอ ไม่บังหน้าไพ่) */}
        <div
          className="absolute rounded-full bg-[#8F5C1A]/10 blur-2xl pointer-events-none"
          style={{
            left: CC_COL[1] + CC.cardW / 2 - 45,
            top: CC_ROW[1] + CC.cardH / 2 - 45,
            width: 90,
            height: 90,
          }}
        />

        {/* แขนกางเขน 4 ทิศ */}
        {arms.map((arm) => (
          <div
            key={arm.image}
            className="absolute rounded border border-[#D9C8AC]/55 overflow-hidden opacity-95"
            style={{ left: arm.x, top: arm.y, width: CC.cardW, height: CC.cardH }}
          >
            <CardImage
              image={arm.image}
              alt=""
              className="w-full h-full object-cover tarot-hd-card-image"
              sizes="96px"
            />
          </div>
        ))}

        {/* ใบที่ 1 สถานการณ์ปัจจุบัน (ใจกลาง) */}
        <div
          className="absolute z-10 rounded border-2 border-[#D9C8AC] overflow-hidden "
          style={{ left: CC_COL[1], top: CC_ROW[1], width: CC.cardW, height: CC.cardH }}
        >
          <CardImage
            image="major-00.jpg"
            alt=""
            className="w-full h-full object-cover tarot-hd-card-image"
            sizes="96px"
          />
        </div>

        {/* ใบที่ 2 สิ่งที่ขวางอยู่ (วางขวางทับใบกลางตามธรรมเนียมเซลติกครอส) */}
        <div
          className="absolute z-20 rounded border border-[#D9C8AC]/90 overflow-hidden "
          style={{
            left: CC_COL[1],
            top: CC_ROW[1],
            width: CC.cardW,
            height: CC.cardH,
            transform: "rotate(90deg)",
          }}
        >
          <CardImage
            image="major-10.jpg"
            alt=""
            className="w-full h-full object-cover tarot-hd-card-image"
            sizes="96px"
          />
        </div>

        {/* เสาไพ่ 4 ใบด้านขวา (ใบที่ 7–10) */}
        {staff.map((image, idx) => (
          <div
            key={image}
            className={`absolute rounded overflow-hidden ${
              idx === 0 ? "border border-[#D9C8AC]/80" : "border border-[#D9C8AC]/50 opacity-90"
            }`}
            style={{
              left: CC_STAFF_X,
              top: CC_STAFF_TOP + idx * (CC.staffH + CC.staffGap),
              width: CC.staffW,
              height: CC.staffH,
            }}
          >
            <CardImage image={image} alt="" className="w-full h-full object-cover tarot-hd-card-image" sizes="96px" />
          </div>
        ))}
      </div>
    </div>
  );
};

// 10. ผัง 12 เดือน / วงล้อจักรราศี (12 ใบ)
export const TwelveMonthsSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`relative w-28 h-28 mx-auto flex items-center justify-center ${className}`}>
    <div className="w-6 h-6 rounded-full border-1.5 border-[#D9C8AC] bg-black/90 flex items-center justify-center text-[8.5px] text-[#8F5C1A] z-10 font-bold">
      ✦
    </div>
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 360) / 12 - 90;
      const rad = (angle * Math.PI) / 180;
      const radius = 42;
      const x = Number((Math.cos(rad) * radius).toFixed(2));
      const y = Number((Math.sin(rad) * radius).toFixed(2));
      const cardNum = String(i + 1).padStart(2, "0");

      return (
        <div
          key={i}
          className="absolute w-5 h-[34px] rounded border border-[#D9C8AC]/70 overflow-hidden shadow"
          style={{
            transform: `translate(${x}px, ${y}px) rotate(${angle + 90}deg)`,
          }}
        >
          <CardImage
            image={`major-${cardNum}.jpg`}
            alt=""
            className="w-full h-full object-cover tarot-hd-card-image"
            sizes="96px"
          />
        </div>
      );
    })}
  </div>
);

// 11. สถานการณ์ อุปสรรค ทางออก (3 ใบ)
export const SituationSolutionSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-2.5 relative ${className}`}>
    <MiniRwsCard src="/cards/swords-08.jpg" className="w-11 h-[75px] opacity-90" />
    <MiniRwsCard
      src="/cards/swords-10.jpg"
      borderColor="#A6392C"
      className="w-12 h-[82px]"
      highlight
    />
    <MiniRwsCard
      src="/cards/major-01.jpg"
      borderColor="#3A7044"
      className="w-13 h-[88px] sm:w-14 sm:h-[95px]"
      highlight
    />
  </div>
);

// 12. กาย จิต วิญญาณ (3 ใบ)
export const MindBodySpiritSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-2.5 relative ${className}`}>
    <MiniRwsCard src="/cards/pentacles-04.jpg" borderColor="#3A7044" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" />
    <MiniRwsCard
      src="/cards/cups-14.jpg"
      borderColor="#D9C8AC"
      className="w-13 h-[88px]"
      highlight
    />
    <MiniRwsCard
      src="/cards/major-17.jpg"
      borderColor="#D9C8AC"
      className="w-13 h-[88px]"
      highlight
    />
  </div>
);

// 13. ความในใจของเขา (4 ใบ)
export const HowTheyFeelSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/swords-02.jpg"
      borderColor="#D9C8AC"
      className="w-10 h-[68px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/cups-02.jpg" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/cups-04.jpg" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/wands-01.jpg" borderColor="#D9C8AC" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 14. คนรักเก่าจะกลับมาไหม (4 ใบ)
export const ExReconciliationSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-20.jpg"
      borderColor="#D9C8AC"
      className="w-10 h-[68px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/cups-05.jpg" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/swords-03.jpg" borderColor="#A6392C" className="w-9 h-[62px] opacity-85" />
      <MiniRwsCard src="/cards/cups-06.jpg" borderColor="#3A7044" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 15. ตามหาเนื้อคู่ & ความรักแท้ (5 ใบ)
export const SoulmateSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-06.jpg"
      borderColor="#D9C8AC"
      className="w-10 h-[68px]"
      highlight
    />
    <div className="flex items-center justify-center gap-1.5">
      <MiniRwsCard src="/cards/cups-02.jpg" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/wands-04.jpg" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/major-17.jpg" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/major-21.jpg" borderColor="#D9C8AC" className="w-8.5 h-[58px]" />
    </div>
  </div>
);

// 16. ย้ายงานหรืออยู่ที่เดิม (5 ใบ)
export const CareerSwitchSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-07.jpg"
      borderColor="#3A7044"
      className="w-10 h-[68px]"
      highlight
    />
    <div className="flex items-center justify-center gap-1.5">
      <MiniRwsCard src="/cards/wands-02.jpg" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/pentacles-03.jpg" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/wands-08.jpg" borderColor="#D9C8AC" className="w-8.5 h-[58px]" />
      <MiniRwsCard src="/cards/major-00.jpg" className="w-8.5 h-[58px]" />
    </div>
  </div>
);

// 17. ปลดล็อกศักยภาพในตัวคุณ (4 ใบ)
export const InnerPotentialSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-08.jpg"
      borderColor="#D9C8AC"
      className="w-10 h-[68px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/major-01.jpg" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/swords-09.jpg" borderColor="#A6392C" className="w-9 h-[62px] opacity-80" />
      <MiniRwsCard src="/cards/major-19.jpg" borderColor="#3A7044" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 18. ดวงประจำสัปดาห์ 7 วัน (7 ใบ) — 2-Tier Balanced Formation (No Horizontal Overflow!)
export const WeeklySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    {/* Tier 1: 4 Cards (Mon - Thu) */}
    <div className="flex items-center justify-center gap-1.5">
      {[{ card: "01" }, { card: "04" }, { card: "07" }, { card: "10" }].map((item, idx) => (
        <div
          key={idx}
          className="w-8.5 h-[58px] rounded-lg border border-[#D9C8AC]/40 overflow-hidden shadow opacity-90 hover:opacity-100 flex-shrink-0"
        >
          <CardImage
            image={`major-${item.card}.jpg`}
            alt=""
            className="w-full h-full object-cover tarot-hd-card-image"
            sizes="96px"
          />
        </div>
      ))}
    </div>
    {/* Tier 2: 3 Cards (Fri - Sun, Highlight Friday) */}
    <div className="flex items-center justify-center gap-1.5">
      {[{ card: "14", highlight: true }, { card: "17" }, { card: "19" }].map((item, idx) => (
        <div
          key={idx}
          className={`w-8.5 h-[58px] rounded-lg overflow-hidden flex-shrink-0 transition-all ${
            item.highlight ? "border-2 border-[#D9C8AC] scale-105 z-10" : "border border-[#D9C8AC]/40 shadow opacity-90"
          }`}
        >
          <CardImage
            image={`major-${item.card}.jpg`}
            alt=""
            className="w-full h-full object-cover tarot-hd-card-image"
            sizes="96px"
          />
        </div>
      ))}
    </div>
  </div>
);

// 19. ดวงประจำเดือน 4 สัปดาห์ (4 ใบ)
export const MonthlySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-1.5 sm:gap-2 relative ${className}`}>
    {Array.from({ length: 4 }).map((_, idx) => (
      <MiniRwsCard
        key={idx}
        src={`/cards/major-${String((idx * 5 + 3) % 22).padStart(2, "0")}.jpg`}
        className="w-9.5 h-[65px] sm:w-10 sm:h-[68px]"
        highlight={idx === 2}
      />
    ))}
  </div>
);

// 20. ผังจักระทั้ง 7 (7 ใบ) — 2-Tier Balanced Rainbow Arc (Zero Overflow!)
export const ChakraSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => {
  const chakras = [
    { num: 1, card: "00", color: "#A6392C" },
    { num: 2, card: "03", color: "#8F5C1A" },
    { num: 3, card: "06", color: "#8F5C1A" },
    { num: 4, card: "09", color: "#3A7044", highlight: true },
    { num: 5, card: "15", color: "#6F5B4A" },
    { num: 6, card: "18", color: "#6F5B4A" },
    { num: 7, card: "21", color: "#6F5B4A" },
  ];

  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
      {/* Tier 1: 4 Chakras */}
      <div className="flex items-center justify-center gap-1.5">
        {chakras.slice(0, 4).map((chk) => (
          <div
            key={chk.num}
            className={`w-8.5 h-[58px] rounded-lg overflow-hidden flex-shrink-0 border transition-all ${
              chk.highlight ? "border-2 border-[#3A7044] scale-105 z-10" : ""
            }`}
            style={{ borderColor: chk.highlight ? "#8F5C1A" : chk.color }}
          >
            <CardImage
              image={`major-${chk.card}.jpg`}
              alt=""
              className="w-full h-full object-cover tarot-hd-card-image"
              sizes="96px"
            />
          </div>
        ))}
      </div>
      {/* Tier 2: 3 Chakras */}
      <div className="flex items-center justify-center gap-1.5">
        {chakras.slice(4).map((chk) => (
          <div
            key={chk.num}
            className="w-8.5 h-[58px] rounded-lg overflow-hidden flex-shrink-0 border shadow"
            style={{ borderColor: chk.color }}
          >
            <CardImage
              image={`major-${chk.card}.jpg`}
              alt=""
              className="w-full h-full object-cover tarot-hd-card-image"
              sizes="96px"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. CATEGORY TAB ICONS (Minimal Line-Art)
// ============================================================================

interface IconProps {
  className?: string;
}

export const SparkleTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 3L13.5 9.5L20 11L13.5 12.5L12 19L10.5 12.5L4 11L10.5 9.5L12 3Z" />
  </svg>
);

export const HeartTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 20.3c-.3 0-.6-.1-.8-.3C7.6 17 4 13.6 4 9.7 4 7 6.1 5 8.7 5c1.4 0 2.7.7 3.3 1.9C12.6 5.7 13.9 5 15.3 5 17.9 5 20 7 20 9.7c0 3.9-3.6 7.3-7.2 10.3-.2.2-.5.3-.8.3Z" />
  </svg>
);

export const PentacleTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 7 L13.2 10.4 L16.8 10.5 L13.9 12.6 L14.9 16.1 L12 14 L9.1 16.1 L10.1 12.6 L7.2 10.5 L10.8 10.4 Z" />
  </svg>
);

export const CrystalBallTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="10" r="6.3" />
    <path d="M8.4 7.6a4.3 4.3 0 0 1 3.2-2.4" />
    <path d="M7 19h10M8.5 16.5h7" />
  </svg>
);

export const AllSpreadsTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="4" y="6" width="7.5" height="11.5" rx="1.4" transform="rotate(-13 7.75 11.75)" />
    <rect x="8.3" y="4.5" width="7.5" height="11.5" rx="1.4" />
    <rect x="12.5" y="6" width="7.5" height="11.5" rx="1.4" transform="rotate(13 16.25 11.75)" />
  </svg>
);

export const OracleEyeIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 9.5v-1M12 15.5v-1" strokeWidth={1.2} />
  </svg>
);

export const LockTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    <path d="M12 14.3v2.4" strokeWidth={1.8} />
  </svg>
);

export const CareLineIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 19.5c-.2 0-.5-.1-.7-.2-3.4-2.5-6.3-5.2-6.3-8.4 0-2.2 1.7-3.9 3.9-3.9 1.2 0 2.3.6 3.1 1.6.8-1 1.9-1.6 3.1-1.6 2.2 0 3.9 1.7 3.9 3.9 0 3.2-2.9 5.9-6.3 8.4-.2.1-.5.2-.7.2Z" />
    <path d="M7 11.3h2.1l1.1-2 1.6 3.6 1-1.6h2.2" />
  </svg>
);

export const EmergencyTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 8.3v7.4M8.3 12h7.4" />
  </svg>
);

// ============================================================================
// 5. NAVBAR SACRED TAROT ICONS
// ============================================================================

// ── ไอคอนเส้นชุดเสริม (แทนอิโมจิการ์ตูน — กฎเหล็กข้อ 2) ─────────────────────

const line = (className: string) => ({
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true as const,
});

export const SearchTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.4 15.4 4.1 4.1" />
  </svg>
);

export const SpeakerTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" />
    <path d="M15.4 9.6a3.6 3.6 0 0 1 0 4.8" />
    <path d="M17.8 7.2a7 7 0 0 1 0 9.6" />
  </svg>
);

export const FlipCardIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M19.5 11a7.5 7.5 0 0 0-13-4.6" />
    <path d="M4.5 13a7.5 7.5 0 0 0 13 4.6" />
    <path d="M6.5 3v3.4H10" />
    <path d="M17.5 21v-3.4H14" />
  </svg>
);

export const CalendarTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <rect x="4" y="5.5" width="16" height="14" rx="2" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </svg>
);

export const CrownTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M4 17.5h16" />
    <path d="M4.5 8 8 11.5 12 5.5l4 6L19.5 8l-1.4 8H5.9z" />
  </svg>
);

export const FireElementIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M12 3.5c2.6 3 4 5.2 4 7a4 4 0 0 1-8 0c0-1 .4-2 1.2-3.1.5 1.3 1.3 2 2.1 2 0-2 .2-3.9.7-5.9Z" />
    <path d="M8 14.5a4 4 0 0 0 8 0" />
  </svg>
);

export const WaterElementIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M12 3.6c3.2 4 5 6.6 5 8.9a5 5 0 0 1-10 0c0-2.3 1.8-4.9 5-8.9Z" />
  </svg>
);

export const AirElementIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M3.5 8.5h11a2.6 2.6 0 1 0-2.6-2.6" />
    <path d="M3.5 12.5h14a2.6 2.6 0 1 1-2.6 2.6" />
    <path d="M3.5 16.5h7" />
  </svg>
);

export const EarthElementIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 3.7v16.6M3.7 12h16.6" />
  </svg>
);

export const SwordElementIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M19.5 4.5 10 14l-.5 3.5L13 17l9.5-9.5z" transform="translate(-2 0)" />
    <path d="M7.5 13.5 4 17l3 3 3.5-3.5" />
  </svg>
);

export const NoteTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M6 3.5h8.5L19 8v12.5H6z" />
    <path d="M14 3.5V8h5M9 12.5h6M9 16h4" />
  </svg>
);

export const ChatTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M20 12.4c0 3.6-3.6 6.5-8 6.5-.9 0-1.8-.1-2.6-.35L4.5 20l1.2-3.2A6.1 6.1 0 0 1 4 12.4C4 8.8 7.6 6 12 6s8 2.8 8 6.4Z" />
  </svg>
);

export const AstrologyTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <circle cx="12" cy="12" r="5" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-22 12 12)" />
  </svg>
);

export const BriefcaseTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
    <path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7M3.5 12.5h17" />
  </svg>
);

export const CoinTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 7.5v9M14.4 9.6a2.6 2.6 0 0 0-2.4-1.4c-1.4 0-2.4.8-2.4 1.9 0 2.6 5 1.4 5 4 0 1.2-1.1 2-2.6 2a2.7 2.7 0 0 1-2.5-1.5" />
  </svg>
);

export const SeedTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M12 20.5v-7" />
    <path d="M12 13.5c0-3.4 2.6-6 6-6 0 3.4-2.6 6-6 6Z" />
    <path d="M12 16.5c0-2.6-2-4.6-4.6-4.6 0 2.6 2 4.6 4.6 4.6Z" />
  </svg>
);

export const ExpandTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15" />
  </svg>
);

export const TarotSpreadNavIcon: React.FC<IconProps> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="3" y="6" width="6" height="13" rx="1.2" transform="rotate(-10 6 12.5)" />
    <rect x="15" y="6" width="6" height="13" rx="1.2" transform="rotate(10 18 12.5)" />
    <rect x="8.5" y="3.5" width="7" height="15" rx="1.4" className="fill-[#8F5C1A]/15 stroke-[#8F5C1A]" />
    <circle cx="12" cy="9.5" r="1.5" className="fill-[#8F5C1A]" />
    <path d="M12 13v2.5" className="stroke-[#8F5C1A]" />
  </svg>
);

export const TarotDeckNavIcon: React.FC<IconProps> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5.5" y="2.5" width="13" height="19" rx="2" className="fill-[#8F5C1A]/10 stroke-[#8F5C1A]" />
    <rect
      x="7.5"
      y="4.5"
      width="9"
      height="15"
      rx="1.2"
      strokeWidth={1}
      strokeDasharray="1.5 1.5"
      className="stroke-[#8F5C1A]/60"
    />
    <path d="M12 7.5L13 11L16.5 12L13 13L12 16.5L11 13L7.5 12L11 11Z" className="fill-[#8F5C1A] stroke-none" />
  </svg>
);

export const JournalScrollNavIcon: React.FC<IconProps> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
      className="fill-[#8F5C1A]/10 stroke-[#8F5C1A]"
    />
    <path d="M6 6h10M6 10h10M6 14h6" strokeWidth={1.3} className="stroke-[#8F5C1A]/80" />
    <path d="M16 14l2 2 3-3" strokeWidth={1.5} className="stroke-[#3A7044]" />
  </svg>
);

export const MarketplaceReaderNavIcon: React.FC<IconProps> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="7" r="4" className="fill-[#8F5C1A]/15 stroke-[#8F5C1A]" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" className="stroke-[#8F5C1A]" />
    <path d="M19 8l1.5 1.5L23 7" strokeWidth={1.4} className="stroke-[#8F5C1A]" />
  </svg>
);
