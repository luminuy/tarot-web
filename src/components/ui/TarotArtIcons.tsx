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
export const LoveSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`flex items-center justify-center gap-2 sm:gap-2.5 relative ${className}`}>
    <MiniRwsCard src="/cards/cups-02.jpg" label="1. คุณ" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" />
    <div className="flex flex-col items-center gap-1">
      <MiniRwsCard src="/cards/major-06.jpg" label="3. จุดเชื่อมโยง" borderColor="#ec4899" glowColor="rgba(236,72,153,0.5)" className="w-12 h-[82px] sm:w-13 sm:h-[88px]" highlight />
      <MiniRwsCard src="/cards/swords-04.jpg" label="4. อุปสรรค" className="w-10 h-[68px] sm:w-11 sm:h-[75px] opacity-80" />
    </div>
    <MiniRwsCard src="/cards/cups-03.jpg" label="2. เขา" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" />
    <MiniRwsCard src="/cards/cups-10.jpg" label="5. ทิศทาง" borderColor="#38bdf8" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" />
  </div>
);

// 6. เส้นทางการงาน (5 ใบ) — Career Pyramid
export const CareerSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    {/* Apex */}
    <MiniRwsCard src="/cards/major-04.jpg" label="1. ศักยภาพหลัก" borderColor="#ffd700" glowColor="rgba(255,215,0,0.5)" className="w-12 h-[82px] sm:w-13 sm:h-[88px]" highlight />
    {/* Base Row */}
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/wands-03.jpg" label="2. อุปสรรค" className="w-10 h-[68px] opacity-85" />
      <MiniRwsCard src="/cards/pentacles-08.jpg" label="3. ตัวช่วย" className="w-10 h-[68px]" />
      <MiniRwsCard src="/cards/wands-06.jpg" label="4. โอกาส" className="w-10 h-[68px]" />
      <MiniRwsCard src="/cards/pentacles-01.jpg" label="5. ผลลัพธ์" borderColor="#10b981" className="w-10 h-[68px]" />
    </div>
  </div>
);

// 7. การเงินและความมั่นคง (4 ใบ) — 2x2 Wealth Grid
export const MoneySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`grid grid-cols-2 gap-2 sm:gap-2.5 items-center justify-center max-w-[150px] mx-auto relative ${className}`}>
    <MiniRwsCard src="/cards/pentacles-04.jpg" label="1. สภาพคล่อง" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" />
    <MiniRwsCard src="/cards/pentacles-05.jpg" label="2. จุดรั่วไหล" borderColor="#f43f5e" className="w-11 h-[75px] sm:w-12 sm:h-[82px] opacity-85" />
    <MiniRwsCard src="/cards/pentacles-09.jpg" label="3. แหล่งเงิน" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" />
    <MiniRwsCard src="/cards/pentacles-10.jpg" label="4. ความมั่งคั่ง" borderColor="#ffd700" glowColor="rgba(255,215,0,0.5)" className="w-11 h-[75px] sm:w-12 sm:h-[82px]" highlight />
  </div>
);

// 8. ทางแยกสองทาง (5 ใบ) — Decision Tree
export const DecisionSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    {/* Apex */}
    <MiniRwsCard src="/cards/major-07.jpg" label="1. ทางแยกการตัดสินใจ" borderColor="#ffd700" glowColor="rgba(255,215,0,0.5)" className="w-12 h-[82px] sm:w-13 sm:h-[88px]" highlight />
    {/* 2 Branches */}
    <div className="flex items-center justify-center gap-3">
      <div className="flex gap-1.5 p-1 rounded-lg border border-[#38bdf8]/30 bg-[#38bdf8]/5">
        <MiniRwsCard src="/cards/swords-02.jpg" label="ทางเลือก A" className="w-10 h-[68px]" />
        <MiniRwsCard src="/cards/wands-07.jpg" label="ผลลัพธ์ A" className="w-10 h-[68px]" />
      </div>
      <div className="flex gap-1.5 p-1 rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/5">
        <MiniRwsCard src="/cards/pentacles-02.jpg" label="ทางเลือก B" className="w-10 h-[68px]" />
        <MiniRwsCard src="/cards/cups-09.jpg" label="ผลลัพธ์ B" className="w-10 h-[68px]" />
      </div>
    </div>
  </div>
);

// 9. Celtic Cross (10 ใบ) — Authentic 10-Card Formation
export const CelticCrossSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`flex items-center justify-center gap-4 relative ${className}`}>
    {/* Left: Cross Formation */}
    <div className="relative w-24 h-24 sm:w-26 sm:h-26 flex items-center justify-center">
      {/* 4 Cardinal Cards */}
      <div className="absolute top-0 w-7 h-[46px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-75 shadow">
        <img src="/cards/major-04.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-0 w-7 h-[46px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-75 shadow">
        <img src="/cards/major-18.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute left-0 w-7 h-[46px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-75 shadow">
        <img src="/cards/major-19.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute right-0 w-7 h-[46px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-75 shadow">
        <img src="/cards/major-17.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      {/* Center 2 crossed cards */}
      <div className="relative z-10 w-8 h-[54px] rounded border-2 border-[#ffd700] overflow-hidden shadow-xl">
        <img src="/cards/major-00.jpg" alt="Center" className="w-full h-full object-cover" />
      </div>
      <div className="absolute z-20 w-8 h-[54px] rounded border border-[#e5c07b] overflow-hidden rotate-90 shadow-lg opacity-90">
        <img src="/cards/major-10.jpg" alt="Cross" className="w-full h-full object-cover" />
      </div>
    </div>

    {/* Right: Vertical Staff of 4 Cards */}
    <div className="flex flex-col gap-1">
      <div className="w-7 h-[46px] rounded border border-[#ffd700]/70 overflow-hidden shadow">
        <img src="/cards/major-21.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="w-7 h-[46px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-85 shadow">
        <img src="/cards/major-14.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="w-7 h-[46px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-85 shadow">
        <img src="/cards/major-11.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="w-7 h-[46px] rounded border border-[#e5c07b]/40 overflow-hidden opacity-85 shadow">
        <img src="/cards/major-09.jpg" alt="" className="w-full h-full object-cover" />
      </div>
    </div>
  </div>
);

// 10. ผัง 12 เดือน / วงล้อจักรราศี (12 ใบ) — Zodiac Wheel
export const TwelveMonthsSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-34" }) => (
  <div className={`relative w-30 h-30 sm:w-32 sm:h-32 mx-auto flex items-center justify-center ${className}`}>
    {/* Center Sun Sigil */}
    <div className="w-7 h-7 rounded-full border border-[#ffd700] bg-black/90 flex items-center justify-center text-[10px] text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.6)] z-10">
      ☀️
    </div>
    {/* Outer 12 cards in orbit */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 360) / 12 - 90;
      const rad = (angle * Math.PI) / 180;
      const radius = 46; // px
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      const cardNum = String(i + 1).padStart(2, "0");

      return (
        <div
          key={i}
          className="absolute w-5 h-[34px] sm:w-5.5 sm:h-[37px] rounded border border-[#e5c07b]/60 overflow-hidden shadow-sm hover:scale-125 transition-transform"
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
