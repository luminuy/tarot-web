"use client";

import React from "react";

// ============================================================================
// 1. REUSABLE 1909 RIDER-WAITE MINI CARD PRIMITIVE (GOLDEN RATIO 1 : 1.7)
// ============================================================================

interface MiniCardProps {
  src: string;
  name?: string;
  badge?: string;
  label?: string;
  className?: string;
  borderColor?: string;
  glowColor?: string;
  highlight?: boolean;
  rotate?: number;
}

export const MiniRwsCard: React.FC<MiniCardProps> = ({
  src,
  badge,
  label,
  className = "w-14 h-[95px]",
  borderColor = "rgba(229, 192, 123, 0.6)",
  glowColor = "rgba(229, 192, 123, 0.25)",
  highlight = false,
  rotate = 0,
}) => (
  <div className="flex flex-col items-center gap-1 select-none">
    <div
      className={`relative rounded-lg overflow-hidden border transition-all duration-300 flex-shrink-0 ${className} ${
        highlight
          ? "ring-2 ring-[#ffd700] ring-offset-1 ring-offset-[#07040f] z-10 scale-[1.04]"
          : "hover:border-[#ffd700]/80"
      }`}
      style={{
        borderColor: highlight ? "#ffd700" : borderColor,
        boxShadow: highlight
          ? `0 0 20px ${glowColor}, 0 8px 16px rgba(0,0,0,0.85)`
          : `0 4px 12px rgba(0,0,0,0.8), 0 0 10px ${glowColor}`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      <img
        src={src}
        alt="Tarot Card"
        className="w-full h-full object-cover object-center filter contrast-[1.03] brightness-[1.02]"
        loading="lazy"
      />

      {/* Subtle Depth Shadow Vignette (Keep art clearly visible) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

      {/* Minimalist Floating Badge (Top-Right or Center) */}
      {badge && (
        <span className="absolute top-1 right-1 text-[7px] font-bold text-[#f5deaa] px-1 py-0.2 rounded bg-black/80 border border-[#e5c07b]/40 backdrop-blur-sm z-10">
          {badge}
        </span>
      )}
    </div>

    {/* Sleek Sub-Label Beneath Card */}
    {label && (
      <span
        className={`text-[8.5px] font-serif-th font-semibold truncate max-w-[80px] text-center leading-tight ${
          highlight ? "text-[#ffd700] drop-shadow" : "text-[#cfc8e2]"
        }`}
      >
        {label}
      </span>
    )}
  </div>
);

// ============================================================================
// 2. ORACLE GUIDES (3 PERSONAS - 1909 RIDER-WAITE)
// ============================================================================

export const HighPriestessIllustration: React.FC<{ className?: string }> = ({
  className = "w-22 h-36 mx-auto",
}) => (
  <div className={`relative rounded-xl overflow-hidden border-2 border-[#e5c07b] shadow-[0_0_30px_rgba(229,192,123,0.4)] ${className}`}>
    <img src="/cards/major-02.jpg" alt="The High Priestess" className="w-full h-full object-cover object-center" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
    <div className="absolute bottom-1.5 inset-x-0 text-center">
      <span className="text-[10px] font-serif-th font-bold text-[#f5deaa] drop-shadow">
        จิตสัมผัสอันอ่อนโยน
      </span>
    </div>
  </div>
);

export const JusticeIllustration: React.FC<{ className?: string }> = ({
  className = "w-22 h-36 mx-auto",
}) => (
  <div className={`relative rounded-xl overflow-hidden border-2 border-[#a855f7] shadow-[0_0_30px_rgba(168,85,247,0.4)] ${className}`}>
    <img src="/cards/major-11.jpg" alt="Justice" className="w-full h-full object-cover object-center" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
    <div className="absolute bottom-1.5 inset-x-0 text-center">
      <span className="text-[10px] font-serif-th font-bold text-[#f5deaa] drop-shadow">
        ดาบแห่งสัจจะความจริง
      </span>
    </div>
  </div>
);

export const TheStarIllustration: React.FC<{ className?: string }> = ({
  className = "w-22 h-36 mx-auto",
}) => (
  <div className={`relative rounded-xl overflow-hidden border-2 border-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.4)] ${className}`}>
    <img src="/cards/major-17.jpg" alt="The Star" className="w-full h-full object-cover object-center" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
    <div className="absolute bottom-1.5 inset-x-0 text-center">
      <span className="text-[10px] font-serif-th font-bold text-[#f5deaa] drop-shadow">
        คลื่นพลังงานดวงดาว
      </span>
    </div>
  </div>
);

// ============================================================================
// 3. MYSTIC SEALS / CATEGORY CARDS (INTENTION ALTAR - 1909 RIDER-WAITE)
// ============================================================================

export const FullLoversCardArt: React.FC<{ className?: string }> = ({ className = "w-18 h-[122px]" }) => (
  <div className={`relative rounded-lg overflow-hidden border border-[#ec4899]/70 shadow-[0_0_20px_rgba(236,72,153,0.35)] ${className}`}>
    <img src="/cards/major-06.jpg" alt="The Lovers" className="w-full h-full object-cover" loading="lazy" />
  </div>
);

export const FullChariotCardArt: React.FC<{ className?: string }> = ({ className = "w-18 h-[122px]" }) => (
  <div className={`relative rounded-lg overflow-hidden border border-[#f59e0b]/70 shadow-[0_0_20px_rgba(245,158,11,0.35)] ${className}`}>
    <img src="/cards/major-07.jpg" alt="The Chariot" className="w-full h-full object-cover" loading="lazy" />
  </div>
);

export const FullWheelCardArt: React.FC<{ className?: string }> = ({ className = "w-18 h-[122px]" }) => (
  <div className={`relative rounded-lg overflow-hidden border border-[#10b981]/70 shadow-[0_0_20px_rgba(16,185,129,0.35)] ${className}`}>
    <img src="/cards/major-10.jpg" alt="Wheel of Fortune" className="w-full h-full object-cover" loading="lazy" />
  </div>
);

export const FullStarCardArt: React.FC<{ className?: string }> = ({ className = "w-18 h-[122px]" }) => (
  <div className={`relative rounded-lg overflow-hidden border border-[#a855f7]/70 shadow-[0_0_20px_rgba(168,85,247,0.35)] ${className}`}>
    <img src="/cards/major-17.jpg" alt="The Star" className="w-full h-full object-cover" loading="lazy" />
  </div>
);

// ============================================================================
// 4. SPREAD ILLUSTRATIONS (10 SPREADS - GOLDEN PROPORTIONS)
// ============================================================================

// 1. ไพ่ประจำวัน (1 ใบ) — The Sun (major-19.jpg)
export const DailySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`flex items-center justify-center relative ${className}`}>
    {/* Majestic Solar Halo Aura */}
    <div className="absolute w-28 h-28 rounded-full bg-radial from-[#ffd700]/25 via-[#ff9f43]/10 to-transparent blur-xl pointer-events-none" />
    <MiniRwsCard
      src="/cards/major-19.jpg"
      label="พลังงานประจำวัน"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.5)"
      className="w-18 h-[122px] sm:w-20 sm:h-[136px]"
      highlight
    />
  </div>
);

// 2. ถามด่วนหนึ่งใบ (1 ใบ) — The Magician (major-01.jpg)
export const QuickSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`flex items-center justify-center relative ${className}`}>
    <div className="absolute w-28 h-28 rounded-full bg-radial from-[#a855f7]/25 via-[#e5c07b]/10 to-transparent blur-xl pointer-events-none" />
    <MiniRwsCard
      src="/cards/major-01.jpg"
      label="คำตอบตรงประเด็น"
      borderColor="#e5c07b"
      glowColor="rgba(229,192,123,0.5)"
      className="w-18 h-[122px] sm:w-20 sm:h-[136px]"
      highlight
    />
  </div>
);

// 3. ใช่หรือไม่ (3 ใบ) — Verdict Balance (swords-03, major-10, cups-02)
export const YesNoSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`flex items-center justify-center gap-2.5 sm:gap-3.5 relative ${className}`}>
    {/* Left: No / Warning */}
    <MiniRwsCard
      src="/cards/swords-03.jpg"
      label="1. ไม่ใช่ (เหตุผล)"
      borderColor="rgba(244,63,94,0.7)"
      glowColor="rgba(244,63,94,0.3)"
      className="w-13 h-[88px] sm:w-14 sm:h-[95px] opacity-90"
    />
    {/* Center: Verdict (Prominent) */}
    <MiniRwsCard
      src="/cards/major-10.jpg"
      label="2. คำตอบสรุป"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.6)"
      className="w-16 h-[108px] sm:w-17 sm:h-[115px]"
      highlight
    />
    {/* Right: Yes */}
    <MiniRwsCard
      src="/cards/cups-02.jpg"
      label="3. ใช่ (จุดระวัง)"
      borderColor="rgba(16,185,129,0.7)"
      glowColor="rgba(16,185,129,0.3)"
      className="w-13 h-[88px] sm:w-14 sm:h-[95px] opacity-90"
    />
  </div>
);

// 4. อดีต ปัจจุบัน อนาคต (3 ใบ) — Timeline (major-09, major-17, major-21)
export const ThreeCardSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`flex items-center justify-center gap-2.5 sm:gap-3.5 relative ${className}`}>
    {/* Golden Connecting Timeline */}
    <div className="absolute w-44 h-0.5 border-b border-dashed border-[#e5c07b]/40 top-[45%] -translate-y-1/2 z-0" />

    {/* 1. Past (Hermit) */}
    <MiniRwsCard
      src="/cards/major-09.jpg"
      label="1. อดีต"
      borderColor="rgba(156,147,184,0.6)"
      glowColor="rgba(156,147,184,0.3)"
      className="w-13 h-[88px] sm:w-14 sm:h-[95px] z-10 opacity-90"
    />
    {/* 2. Present (The Star - Highlighted) */}
    <MiniRwsCard
      src="/cards/major-17.jpg"
      label="2. ปัจจุบัน"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.6)"
      className="w-16 h-[108px] sm:w-17 sm:h-[115px] z-10"
      highlight
    />
    {/* 3. Future (The World) */}
    <MiniRwsCard
      src="/cards/major-21.jpg"
      label="3. อนาคต"
      borderColor="rgba(56,189,248,0.6)"
      glowColor="rgba(56,189,248,0.3)"
      className="w-13 h-[88px] sm:w-14 sm:h-[95px] z-10 opacity-90"
    />
  </div>
);

// 5. ความรักสองหัวใจ (5 ใบ) — Relationship Layout
export const LoveSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-1.5 sm:gap-2 relative ${className}`}>
    <MiniRwsCard src="/cards/cups-02.jpg" label="1. คุณ" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    <div className="flex flex-col items-center gap-1">
      <MiniRwsCard src="/cards/major-06.jpg" label="3. จุดเชื่อมใจ" borderColor="#ec4899" glowColor="rgba(236,72,153,0.5)" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" highlight />
      <MiniRwsCard src="/cards/swords-04.jpg" label="4. อุปสรรค" className="w-9 h-[62px] sm:w-10 sm:h-[68px] opacity-80" />
    </div>
    <MiniRwsCard src="/cards/cups-03.jpg" label="2. เขา" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    <MiniRwsCard src="/cards/cups-10.jpg" label="5. ทิศทาง" borderColor="#38bdf8" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
  </div>
);

// 6. เส้นทางการงาน (5 ใบ) — Career Pyramid
export const CareerSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1 relative ${className}`}>
    {/* Apex */}
    <MiniRwsCard src="/cards/major-04.jpg" label="1. ศักยภาพหลัก" borderColor="#ffd700" glowColor="rgba(255,215,0,0.5)" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" highlight />
    {/* Base Row */}
    <div className="flex items-center justify-center gap-1.5">
      <MiniRwsCard src="/cards/wands-03.jpg" label="2. อุปสรรค" className="w-9 h-[62px] opacity-85" />
      <MiniRwsCard src="/cards/pentacles-08.jpg" label="3. ตัวช่วย" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/wands-06.jpg" label="4. โอกาส" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/pentacles-01.jpg" label="5. ผลลัพธ์" borderColor="#10b981" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 7. การเงินและความมั่นคง (4 ใบ) — Apex + Base Row
export const MoneySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    {/* Apex */}
    <MiniRwsCard
      src="/cards/pentacles-10.jpg"
      label="4. ความมั่งคั่ง"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.5)"
      className="w-11 h-[75px] sm:w-12 sm:h-[82px]"
      highlight
    />
    {/* Base Row */}
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/pentacles-04.jpg" label="1. สภาพคล่อง" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/pentacles-05.jpg" label="2. จุดรั่วไหล" borderColor="#f43f5e" className="w-9 h-[62px] opacity-85" />
      <MiniRwsCard src="/cards/pentacles-09.jpg" label="3. แหล่งเงิน" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 8. ทางแยกสองทาง (5 ใบ) — Decision Tree
export const DecisionSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1 relative ${className}`}>
    <MiniRwsCard src="/cards/major-07.jpg" label="1. ทางแยก" borderColor="#ffd700" glowColor="rgba(255,215,0,0.5)" className="w-10 h-[68px]" highlight />
    <div className="flex items-center justify-center gap-2">
      <div className="flex gap-1 p-0.5 rounded border border-[#38bdf8]/30 bg-[#38bdf8]/5">
        <MiniRwsCard src="/cards/swords-02.jpg" label="ทางเลือก A" className="w-8 h-[55px]" />
        <MiniRwsCard src="/cards/wands-07.jpg" label="ผลลัพธ์ A" className="w-8 h-[55px]" />
      </div>
      <div className="flex gap-1 p-0.5 rounded border border-[#a855f7]/30 bg-[#a855f7]/5">
        <MiniRwsCard src="/cards/pentacles-02.jpg" label="ทางเลือก B" className="w-8 h-[55px]" />
        <MiniRwsCard src="/cards/cups-09.jpg" label="ผลลัพธ์ B" className="w-8 h-[55px]" />
      </div>
    </div>
  </div>
);

// 9. Celtic Cross (10 ใบ) — Authentic 10-Card Formation
export const CelticCrossSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-3 relative ${className}`}>
    {/* Left: Cross Formation */}
    <div className="relative w-22 h-22 sm:w-24 sm:h-24 flex items-center justify-center">
      <div className="absolute top-0 w-6 h-[40px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-75 shadow">
        <img src="/cards/major-04.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-0 w-6 h-[40px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-75 shadow">
        <img src="/cards/major-18.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute left-0 w-6 h-[40px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-75 shadow">
        <img src="/cards/major-19.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute right-0 w-6 h-[40px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-75 shadow">
        <img src="/cards/major-17.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="relative z-10 w-7 h-[48px] rounded border-2 border-[#ffd700] overflow-hidden shadow-xl">
        <img src="/cards/major-00.jpg" alt="Center" className="w-full h-full object-cover" />
      </div>
      <div className="absolute z-20 w-7 h-[48px] rounded border border-[#e5c07b] overflow-hidden rotate-90 shadow-lg opacity-90">
        <img src="/cards/major-10.jpg" alt="Cross" className="w-full h-full object-cover" />
      </div>
    </div>

    {/* Right: Vertical Staff of 4 Cards */}
    <div className="flex flex-col gap-0.5">
      <div className="w-6 h-[40px] rounded border border-[#ffd700]/70 overflow-hidden shadow">
        <img src="/cards/major-21.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="w-6 h-[40px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-85 shadow">
        <img src="/cards/major-14.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="w-6 h-[40px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-85 shadow">
        <img src="/cards/major-11.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="w-6 h-[40px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-85 shadow">
        <img src="/cards/major-09.jpg" alt="" className="w-full h-full object-cover" />
      </div>
    </div>
  </div>
);

// 10. ผัง 12 เดือน / วงล้อจักรราศี (12 ใบ) — Zodiac Wheel
export const TwelveMonthsSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`relative w-28 h-28 sm:w-30 sm:h-30 mx-auto flex items-center justify-center ${className}`}>
    <div className="w-6 h-6 rounded-full border border-[#ffd700] bg-black/90 flex items-center justify-center text-[9px] text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.6)] z-10 font-bold">
      ✦
    </div>
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 360) / 12 - 90;
      const rad = (angle * Math.PI) / 180;
      const radius = 42;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      const cardNum = String(i + 1).padStart(2, "0");

      return (
        <div
          key={i}
          className="absolute w-4.5 h-[30px] sm:w-5 sm:h-[34px] rounded border border-[#e5c07b]/60 overflow-hidden shadow-sm hover:scale-125 transition-transform"
          style={{
            transform: `translate(${x}px, ${y}px) rotate(${angle + 90}deg)`,
          }}
        >
          <img
            src={`/cards/major-${cardNum}.jpg`}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    })}
  </div>
);

// 11. สถานการณ์ อุปสรรค ทางออก (3 ใบ)
export const SituationSolutionSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-2.5 sm:gap-3.5 relative ${className}`}>
    <MiniRwsCard src="/cards/swords-08.jpg" label="1. ปัญหา" className="w-13 h-[88px] sm:w-14 sm:h-[95px] opacity-90" />
    <MiniRwsCard src="/cards/swords-10.jpg" label="2. อุปสรรค" borderColor="#f43f5e" glowColor="rgba(244,63,94,0.4)" className="w-14 h-[95px] sm:w-15 sm:h-[102px]" highlight />
    <MiniRwsCard src="/cards/major-01.jpg" label="3. ทางออก" borderColor="#10b981" glowColor="rgba(16,185,129,0.5)" className="w-16 h-[108px] sm:w-17 sm:h-[115px]" highlight />
  </div>
);

// 12. กาย จิต วิญญาณ (3 ใบ)
export const MindBodySpiritSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-2.5 sm:gap-3.5 relative ${className}`}>
    <MiniRwsCard src="/cards/pentacles-04.jpg" label="1. ร่างกาย" borderColor="#10b981" className="w-13 h-[88px] sm:w-14 sm:h-[95px]" />
    <MiniRwsCard src="/cards/cups-14.jpg" label="2. จิตใจ" borderColor="#38bdf8" glowColor="rgba(56,189,248,0.5)" className="w-15 h-[102px] sm:w-16 sm:h-[108px]" highlight />
    <MiniRwsCard src="/cards/major-17.jpg" label="3. จิตวิญญาณ" borderColor="#a855f7" glowColor="rgba(168,85,247,0.5)" className="w-15 h-[102px] sm:w-16 sm:h-[108px]" highlight />
  </div>
);

// 13. ความในใจของเขา (4 ใบ)
export const HowTheyFeelSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard src="/cards/swords-02.jpg" label="2. ความรู้สึกจริง" borderColor="#ec4899" glowColor="rgba(236,72,153,0.5)" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" highlight />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/cups-02.jpg" label="1. ท่าทีภายนอก" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/cups-04.jpg" label="3. สิ่งที่หวัง" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/wands-01.jpg" label="4. ก้าวต่อไป" borderColor="#ffd700" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 14. คนรักเก่าจะกลับมาไหม (4 ใบ)
export const ExReconciliationSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard src="/cards/major-20.jpg" label="3. โอกาสรีเทิร์น" borderColor="#ffd700" glowColor="rgba(255,215,0,0.5)" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" highlight />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/cups-05.jpg" label="1. ความรู้สึก" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/swords-03.jpg" label="2. สาเหตุ" borderColor="#f43f5e" className="w-9 h-[62px] opacity-85" />
      <MiniRwsCard src="/cards/cups-06.jpg" label="4. คำแนะนำ" borderColor="#10b981" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 15. ตามหาเนื้อคู่ & ความรักแท้ (5 ใบ)
export const SoulmateSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1 relative ${className}`}>
    <MiniRwsCard src="/cards/major-06.jpg" label="1. ลักษณะเนื้อคู่" borderColor="#ec4899" glowColor="rgba(236,72,153,0.5)" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" highlight />
    <div className="flex items-center justify-center gap-1.5">
      <MiniRwsCard src="/cards/cups-02.jpg" label="2. ที่จะพบ" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/wands-04.jpg" label="3. บททดสอบ" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/major-17.jpg" label="4. สิ่งที่ต้องปรับ" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/major-21.jpg" label="5. บทสรุป" borderColor="#ffd700" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 16. ย้ายงานหรืออยู่ที่เดิม (5 ใบ)
export const CareerSwitchSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1 relative ${className}`}>
    <MiniRwsCard src="/cards/major-07.jpg" label="5. ทางเลือกดีสุด" borderColor="#10b981" glowColor="rgba(16,185,129,0.5)" className="w-11 h-[75px]" highlight />
    <div className="flex items-center justify-center gap-1.5">
      <MiniRwsCard src="/cards/wands-02.jpg" label="1. ที่เดิม" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/pentacles-03.jpg" label="2. ถ้าอยู่ที่เดิม" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/wands-08.jpg" label="3. ถ้าไปที่ใหม่" borderColor="#ffd700" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/major-00.jpg" label="4. ปัจจัยซ่อน" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 17. ปลดล็อกศักยภาพในตัวคุณ (4 ใบ)
export const InnerPotentialSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard src="/cards/major-08.jpg" label="2. พรสวรรค์ซ่อน" borderColor="#ffd700" glowColor="rgba(255,215,0,0.5)" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" highlight />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/major-01.jpg" label="1. ตัวตนปัจจุบัน" className="w-9 h-[62px]" />
      <MiniRwsCard src="/cards/swords-09.jpg" label="3. ความกลัว" borderColor="#f43f5e" className="w-9 h-[62px] opacity-80" />
      <MiniRwsCard src="/cards/major-19.jpg" label="4. กุญแจสู่พลัง" borderColor="#10b981" className="w-9 h-[62px]" />
    </div>
  </div>
);

// 18. ดวงประจำสัปดาห์ 7 วัน (7 ใบ) — 2-Tier Balanced Formation (No Overflow)
export const WeeklySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex flex-col items-center justify-center gap-1 relative ${className}`}>
    {/* Tier 1: Mon - Thu */}
    <div className="flex items-center justify-center gap-1">
      {[
        { day: "จันทร์", card: "01" },
        { day: "อังคาร", card: "04" },
        { day: "พุธ", card: "07" },
        { day: "พฤหัส", card: "10" },
      ].map((item, idx) => (
        <MiniRwsCard
          key={idx}
          src={`/cards/major-${item.card}.jpg`}
          label={item.day}
          className="w-8 h-[55px] sm:w-9 sm:h-[62px]"
        />
      ))}
    </div>
    {/* Tier 2: Fri - Sun */}
    <div className="flex items-center justify-center gap-1">
      {[
        { day: "ศุกร์", card: "14", highlight: true },
        { day: "เสาร์", card: "17", highlight: false },
        { day: "อาทิตย์", card: "19", highlight: false },
      ].map((item, idx) => (
        <MiniRwsCard
          key={idx}
          src={`/cards/major-${item.card}.jpg`}
          label={item.day}
          borderColor={item.highlight ? "#ffd700" : undefined}
          className={`w-8 h-[55px] sm:w-9 sm:h-[62px] ${item.highlight ? "scale-105 z-10" : ""}`}
          highlight={item.highlight}
        />
      ))}
    </div>
  </div>
);

// 19. ดวงประจำเดือน 4 สัปดาห์ (4 ใบ)
export const MonthlySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => (
  <div className={`flex items-center justify-center gap-1.5 sm:gap-2 relative ${className}`}>
    {["สัปดาห์ 1", "สัปดาห์ 2", "สัปดาห์ 3", "สัปดาห์ 4"].map((wk, idx) => (
      <MiniRwsCard
        key={idx}
        src={`/cards/major-${String((idx * 5 + 3) % 22).padStart(2, "0")}.jpg`}
        label={wk}
        className="w-10 h-[68px] sm:w-11 sm:h-[75px]"
        highlight={idx === 2}
      />
    ))}
  </div>
);

// 20. ผังจักระทั้ง 7 (7 ใบ) — Luminous 7-Chakra Rainbow Arc (Zero Text Collision)
export const ChakraSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-36" }) => {
  const chakras = [
    { num: 1, card: "00", color: "#ef4444" },
    { num: 2, card: "03", color: "#f97316" },
    { num: 3, card: "06", color: "#eab308" },
    { num: 4, card: "09", color: "#10b981", highlight: true },
    { num: 5, card: "15", color: "#06b6d4" },
    { num: 6, card: "18", color: "#6366f1" },
    { num: 7, card: "21", color: "#a855f7" },
  ];

  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
      {/* 7 Glowing Chakra Cards Arc */}
      <div className="flex items-center justify-center -space-x-1 sm:space-x-0.5 relative z-10">
        {chakras.map((chk) => (
          <div
            key={chk.num}
            className={`relative rounded-md overflow-hidden border transition-all duration-200 flex-shrink-0 ${
              chk.highlight
                ? "w-8.5 h-[58px] sm:w-9.5 sm:h-[64px] z-20 scale-110 -translate-y-1"
                : "w-7.5 h-[50px] sm:w-8 sm:h-[55px] opacity-90 hover:opacity-100"
            }`}
            style={{
              borderColor: chk.color,
              boxShadow: `0 0 10px ${chk.color}40`,
            }}
          >
            <img
              src={`/cards/major-${chk.card}.jpg`}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Minimalist Top Chakra Number Badge */}
            <span
              className="absolute top-0.5 right-0.5 text-[6.5px] font-bold px-0.8 rounded font-mono"
              style={{
                backgroundColor: `${chk.color}ee`,
                color: "#05040a",
              }}
            >
              {chk.num}
            </span>
          </div>
        ))}
      </div>
      {/* Sleek Sub-Label Underneath */}
      <span className="text-[9px] font-serif-th font-semibold text-[#e5c07b] flex items-center gap-1">
        <span>✦</span> สมดุล 7 ศูนย์พลังชีวิต <span>✦</span>
      </span>
    </div>
  );
};

// ============================================================================
// 11. CATEGORY TAB ICONS (Minimal Line-Art, ออกแบบเฉพาะสำหรับแท็บกรองผัง)
// ============================================================================
// ต่างจากไอคอนด้านบนที่ใช้ภาพไพ่จริง — ชุดนี้เป็นเส้นบางล้วน (stroke="currentColor")
// เพื่อให้สืบสีจาก class ของปุ่มพ่อแม่โดยอัตโนมัติ (active/inactive/hover ไม่ต้อง
// เขียน logic สีซ้ำที่ไอคอน) ทุกไอคอน viewBox 24x24, strokeWidth 1.6,
// linecap/linejoin round สม่ำเสมอกันทั้งชุด ให้ความรู้สึกเป็นครอบครัวเดียวกัน
// แรงบันดาลใจจากสัญลักษณ์จริงในไพ่ทาโรต์ (เพนตาเคิล, ลูกแก้ว) แทน emoji ทั่วไป

interface IconProps {
  className?: string;
}

/** ยอดนิยมแนะนำ — ประกายดาวสี่แฉก (ใช้โมทีฟ ✦ เดียวกับที่ใช้แต้มมุมการ์ดทั่วเว็บ) */
export const SparkleTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 3L13.5 9.5L20 11L13.5 12.5L12 19L10.5 12.5L4 11L10.5 9.5L12 3Z" />
  </svg>
);

/** ความรัก & คนในใจ — หัวใจเส้นเรียบ ไม่ใช้ emoji สีชมพูตรง ๆ เพื่อให้เข้าธีมทอง */
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

/** การงาน & การเงิน — เพนตาเคิล (ดาวห้าแฉกในวงกลม) สัญลักษณ์จริงของไพ่ชุดเงิน/งาน */
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

/** ผังใหญ่เจาะลึก — ลูกแก้วทำนายพร้อมฐาน สื่อถึงการมองลึกและผังขนาดใหญ่ */
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

/** ผังทั้งหมด — ไพ่สามใบคลี่พัด สื่อถึงการเห็นทุกผังในสำรับเดียวกัน */
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

// ============================================================================
// 12. FOOTER / SAFETY DISCLOSURE ICONS (Minimal Line-Art, สานต่อจากชุดแท็บ)
// ============================================================================
// หลักการเดียวกับชุด CATEGORY TAB ICONS ด้านบน — เส้นบาง currentColor สม่ำเสมอ
// ต่างจากไอคอนแท็บตรงที่บางตัว (สายด่วน/ฉุกเฉิน) ยังต้องคงสี emerald/rose ไว้
// เพราะเป็นตัวช่วยแยกระดับความเร่งด่วนที่มีความหมายจริงในหน้าความปลอดภัย
// ไม่ใช่แค่ความสวยงาม — ปรับเฉพาะให้เป็นเส้นแทน emoji เท่านั้น สีเดิมคงไว้

/** AI-Generated Reading — ดวงตาแห่งการหยั่งรู้ พร้อมประกายกลางตา สื่อถึง AI ที่มองเห็น/ตีความไพ่ */
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

/** Privacy & PDPA — กุญแจล็อกทรงเรียบ */
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

/** สายด่วนสุขภาพจิต — หัวใจพร้อมเส้นชีพจร สื่อถึง "สายด่วนดูแลใจ" ชัดกว่าหัวใจเฉย ๆ */
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

/** เหตุฉุกเฉิน — วงกลม + กากบาทการแพทย์ สัญลักษณ์สากลของบริการฉุกเฉิน */
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
