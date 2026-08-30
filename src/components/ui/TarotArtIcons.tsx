"use client";

import React from "react";

// ============================================================================
// 1. REUSABLE 1909 RIDER-WAITE MINI CARD PRIMITIVE (CRYSTAL CLEAR HIGH-FIDELITY)
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
  className = "w-16 h-[108px]",
  borderColor = "rgba(229, 192, 123, 0.6)",
  glowColor = "rgba(229, 192, 123, 0.25)",
  highlight = false,
  rotate = 0,
}) => (
  <div className="flex flex-col items-center select-none flex-shrink-0">
    <div
      className={`relative rounded-xl overflow-hidden border transition-all duration-300 flex-shrink-0 ${className} ${
        highlight
          ? "ring-2 ring-[#ffd700] ring-offset-1 ring-offset-[#07040f] z-10 scale-[1.04]"
          : "hover:border-[#ffd700]/80"
      }`}
      style={{
        borderColor: highlight ? "#ffd700" : borderColor,
        boxShadow: highlight
          ? `0 0 24px ${glowColor}, 0 8px 20px rgba(0,0,0,0.85)`
          : `0 4px 14px rgba(0,0,0,0.7), 0 0 10px ${glowColor}`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      <img
        src={src}
        alt="Tarot Card"
        className="w-full h-full object-cover object-center filter contrast-[1.04] brightness-[1.02]"
        loading="lazy"
      />

      {/* Subtle Depth Shadow Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15 pointer-events-none" />

      {/* Sleek Floating Gold Badge Pin */}
      {badge && (
        <span className="absolute top-1 right-1 text-[8.5px] font-bold text-[#ffd700] px-1.5 py-0.5 rounded-md bg-black/85 border border-[#ffd700]/60 backdrop-blur-sm z-10 font-mono shadow-md">
          {badge}
        </span>
      )}
    </div>

    {/* Sub-Label (Only when explicitly passed) */}
    {label && (
      <span
        className={`text-[9px] font-serif-th font-semibold truncate max-w-[80px] text-center leading-tight mt-1.5 ${
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
      <span className="text-[10px] font-serif-th font-bold text-[#e9d5ff] drop-shadow">
        หลักการและสัจจะ
      </span>
    </div>
  </div>
);

export const HermitIllustration: React.FC<{ className?: string }> = ({
  className = "w-22 h-36 mx-auto",
}) => (
  <div className={`relative rounded-xl overflow-hidden border-2 border-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.4)] ${className}`}>
    <img src="/cards/major-09.jpg" alt="The Hermit" className="w-full h-full object-cover object-center" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
    <div className="absolute bottom-1.5 inset-x-0 text-center">
      <span className="text-[10px] font-serif-th font-bold text-[#bae6fd] drop-shadow">
        ปัญญาและสติ
      </span>
    </div>
  </div>
);

export const TheStarIllustration: React.FC<{ className?: string }> = ({
  className = "w-22 h-36 mx-auto",
}) => (
  <div className={`relative rounded-xl overflow-hidden border-2 border-[#ec4899] shadow-[0_0_30px_rgba(236,72,153,0.4)] ${className}`}>
    <img src="/cards/major-17.jpg" alt="The Star" className="w-full h-full object-cover object-center" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
    <div className="absolute bottom-1.5 inset-x-0 text-center">
      <span className="text-[10px] font-serif-th font-bold text-[#fbcfe8] drop-shadow">
        คลื่นพลังงานดวงดาว
      </span>
    </div>
  </div>
);

export const MagicianIllustration: React.FC<{ className?: string }> = ({
  className = "w-22 h-36 mx-auto",
}) => (
  <div className={`relative rounded-xl overflow-hidden border-2 border-[#ffd700] shadow-[0_0_30px_rgba(255,215,0,0.4)] ${className}`}>
    <img src="/cards/major-01.jpg" alt="The Magician" className="w-full h-full object-cover object-center" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
    <div className="absolute bottom-1.5 inset-x-0 text-center">
      <span className="text-[10px] font-serif-th font-bold text-[#f5deaa] drop-shadow">
        ผู้เนรมิตพลัง
      </span>
    </div>
  </div>
);

// ============================================================================
// 3. SACRED SPREAD PREVIEW FORMATIONS (20 MASTER SPREADS — EXPANDED & CRYSTAL CLEAR)
// ============================================================================

// 1. ไพ่ประจำวัน (1 ใบ) — High-Resolution Altar Piece
export const DailySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex items-center justify-center relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-19.jpg"
      badge="#1"
      label="1. สุริยันนำทาง"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.65)"
      className="w-18 h-[122px] sm:w-20 sm:h-[136px]"
      highlight
    />
  </div>
);

// 2. สรุปด่วน (2 ใบ)
export const QuickSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex items-center justify-center gap-4 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-00.jpg"
      badge="#1"
      label="1. แก่นเรื่อง"
      borderColor="rgba(229, 192, 123, 0.7)"
      className="w-16 h-[108px] sm:w-17 sm:h-[115px]"
    />
    <MiniRwsCard
      src="/cards/major-01.jpg"
      badge="#2"
      label="2. คำแนะนำ"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.55)"
      className="w-17 h-[115px] sm:w-18 sm:h-[122px]"
      highlight
    />
  </div>
);

// 3. ใช่หรือไม่ (3 ใบ)
export const YesNoSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex items-center justify-center gap-3 relative ${className}`}>
    <MiniRwsCard
      src="/cards/swords-03.jpg"
      badge="#1"
      label="1. ไม่ใช่"
      borderColor="rgba(244,63,94,0.65)"
      glowColor="rgba(244,63,94,0.3)"
      className="w-14 h-[95px] opacity-85"
    />
    <MiniRwsCard
      src="/cards/major-10.jpg"
      badge="#2"
      label="2. คำตอบสรุป"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.65)"
      className="w-17 h-[115px] sm:w-18 sm:h-[122px]"
      highlight
    />
    <MiniRwsCard
      src="/cards/cups-02.jpg"
      badge="#3"
      label="3. ใช่"
      borderColor="rgba(16,185,129,0.65)"
      glowColor="rgba(16,185,129,0.3)"
      className="w-14 h-[95px] opacity-85"
    />
  </div>
);

// 4. อดีต ปัจจุบัน อนาคต (3 ใบ)
export const ThreeCardSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex items-center justify-center gap-3 relative ${className}`}>
    <div className="absolute w-48 h-0.5 border-b border-dashed border-[#e5c07b]/40 top-[40%] -translate-y-1/2 z-0" />
    <MiniRwsCard
      src="/cards/major-09.jpg"
      badge="#1"
      label="1. อดีต"
      className="w-14 h-[95px] sm:w-15 sm:h-[102px] z-10 opacity-90"
    />
    <MiniRwsCard
      src="/cards/major-17.jpg"
      badge="#2"
      label="2. ปัจจุบัน"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.65)"
      className="w-17 h-[115px] sm:w-18 sm:h-[122px] z-10"
      highlight
    />
    <MiniRwsCard
      src="/cards/major-21.jpg"
      badge="#3"
      label="3. อนาคต"
      className="w-14 h-[95px] sm:w-15 sm:h-[102px] z-10 opacity-90"
    />
  </div>
);

// 5. ดวงความรักสองหัวใจ (5 ใบ) — Heart Formation
export const LoveSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    {/* Apex */}
    <MiniRwsCard
      src="/cards/major-06.jpg"
      badge="#3 จุดเชื่อมใจ"
      borderColor="#ec4899"
      glowColor="rgba(236,72,153,0.55)"
      className="w-11 h-[75px] sm:w-12 sm:h-[82px]"
      highlight
    />
    {/* Base Row */}
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/cups-02.jpg" badge="#1 คุณ" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/swords-04.jpg" badge="#4 อุปสรรค" borderColor="#f43f5e" className="w-10 h-[68px] sm:w-11 sm:h-[75px] opacity-85" />
      <MiniRwsCard src="/cards/cups-03.jpg" badge="#2 เขา" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/cups-10.jpg" badge="#5 ทิศทาง" borderColor="#38bdf8" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    </div>
  </div>
);

// 6. เส้นทางการงาน (5 ใบ) — Career Pyramid
export const CareerSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-04.jpg"
      badge="#1 ศักยภาพ"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.55)"
      className="w-11 h-[75px] sm:w-12 sm:h-[82px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/wands-03.jpg" badge="#2 อุปสรรค" className="w-10 h-[68px] sm:w-11 sm:h-[75px] opacity-85" />
      <MiniRwsCard src="/cards/pentacles-08.jpg" badge="#3 ตัวช่วย" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/wands-06.jpg" badge="#4 โอกาส" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/pentacles-01.jpg" badge="#5 ผลลัพธ์" borderColor="#10b981" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    </div>
  </div>
);

// 7. การเงินและความมั่นคง (4 ใบ)
export const MoneySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/pentacles-10.jpg"
      badge="#4 ความมั่งคั่ง"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.55)"
      className="w-11 h-[75px] sm:w-12 sm:h-[82px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2.5">
      <MiniRwsCard src="/cards/pentacles-04.jpg" badge="#1 สภาพคล่อง" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/pentacles-05.jpg" badge="#2 รั่วไหล" borderColor="#f43f5e" className="w-10 h-[68px] sm:w-11 sm:h-[75px] opacity-85" />
      <MiniRwsCard src="/cards/pentacles-09.jpg" badge="#3 แหล่งเงิน" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    </div>
  </div>
);

// 8. ทางแยกสองทาง (5 ใบ)
export const DecisionSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-07.jpg"
      badge="#1 ทางแยก"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.55)"
      className="w-10 h-[68px] sm:w-11 sm:h-[75px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2.5">
      <div className="flex gap-1.5 p-1 rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/5">
        <MiniRwsCard src="/cards/swords-02.jpg" badge="A1" className="w-9 h-[62px] sm:w-10 sm:h-[68px]" />
        <MiniRwsCard src="/cards/wands-07.jpg" badge="A2" className="w-9 h-[62px] sm:w-10 sm:h-[68px]" />
      </div>
      <div className="flex gap-1.5 p-1 rounded-xl border border-[#a855f7]/30 bg-[#a855f7]/5">
        <MiniRwsCard src="/cards/pentacles-02.jpg" badge="B1" className="w-9 h-[62px] sm:w-10 sm:h-[68px]" />
        <MiniRwsCard src="/cards/cups-09.jpg" badge="B2" className="w-9 h-[62px] sm:w-10 sm:h-[68px]" />
      </div>
    </div>
  </div>
);

// 9. Celtic Cross (10 ใบ) — Crystal-Clear Formation
export const CelticCrossSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex items-center justify-center gap-4 relative ${className}`}>
    {/* Left: Cross Formation */}
    <div className="relative w-28 h-28 flex items-center justify-center">
      <div className="absolute top-0 w-7 h-[48px] rounded-lg border border-[#e5c07b]/40 overflow-hidden opacity-80 shadow">
        <img src="/cards/major-04.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-0 w-7 h-[48px] rounded-lg border border-[#e5c07b]/40 overflow-hidden opacity-80 shadow">
        <img src="/cards/major-18.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute left-0 w-7 h-[48px] rounded-lg border border-[#e5c07b]/40 overflow-hidden opacity-80 shadow">
        <img src="/cards/major-19.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute right-0 w-7 h-[48px] rounded-lg border border-[#e5c07b]/40 overflow-hidden opacity-80 shadow">
        <img src="/cards/major-17.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="relative z-10 w-9 h-[62px] rounded-xl border-2 border-[#ffd700] overflow-hidden shadow-2xl">
        <img src="/cards/major-00.jpg" alt="Center" className="w-full h-full object-cover" />
      </div>
      <div className="absolute z-20 w-9 h-[62px] rounded-xl border border-[#e5c07b] overflow-hidden rotate-90 shadow-xl opacity-90">
        <img src="/cards/major-10.jpg" alt="Cross" className="w-full h-full object-cover" />
      </div>
    </div>

    {/* Right: Vertical Staff of 4 Cards */}
    <div className="flex flex-col gap-1">
      <div className="w-7 h-[46px] rounded-lg border border-[#ffd700]/70 overflow-hidden shadow">
        <img src="/cards/major-21.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="w-7 h-[46px] rounded-lg border border-[#e5c07b]/40 overflow-hidden opacity-85 shadow">
        <img src="/cards/major-14.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="w-7 h-[46px] rounded-lg border border-[#e5c07b]/40 overflow-hidden opacity-85 shadow">
        <img src="/cards/major-11.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="w-7 h-[46px] rounded-lg border border-[#e5c07b]/40 overflow-hidden opacity-85 shadow">
        <img src="/cards/major-09.jpg" alt="" className="w-full h-full object-cover" />
      </div>
    </div>
  </div>
);

// 10. ผัง 12 เดือน / วงล้อจักรราศี (12 ใบ) — High-Definition Zodiac Wheel
export const TwelveMonthsSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`relative w-34 h-34 mx-auto flex items-center justify-center ${className}`}>
    <div className="w-7 h-7 rounded-full border-2 border-[#ffd700] bg-black/90 flex items-center justify-center text-[10px] text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.7)] z-10 font-bold">
      ✦
    </div>
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 360) / 12 - 90;
      const rad = (angle * Math.PI) / 180;
      const radius = 50;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      const cardNum = String(i + 1).padStart(2, "0");

      return (
        <div
          key={i}
          className="absolute w-6 h-[40px] rounded-md border border-[#e5c07b]/70 overflow-hidden shadow hover:scale-125 transition-transform"
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
export const SituationSolutionSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex items-center justify-center gap-3 relative ${className}`}>
    <MiniRwsCard src="/cards/swords-08.jpg" badge="#1" label="1. สถานการณ์" className="w-14 h-[95px] opacity-90" />
    <MiniRwsCard src="/cards/swords-10.jpg" badge="#2" label="2. อุปสรรค" borderColor="#f43f5e" glowColor="rgba(244,63,94,0.4)" className="w-15 h-[102px]" highlight />
    <MiniRwsCard src="/cards/major-01.jpg" badge="#3" label="3. ทางออก" borderColor="#10b981" glowColor="rgba(16,185,129,0.55)" className="w-17 h-[115px] sm:w-18 sm:h-[122px]" highlight />
  </div>
);

// 12. กาย จิต วิญญาณ (3 ใบ)
export const MindBodySpiritSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex items-center justify-center gap-3.5 relative ${className}`}>
    <MiniRwsCard src="/cards/pentacles-04.jpg" badge="#1" label="1. ร่างกาย" borderColor="#10b981" className="w-14 h-[95px] sm:w-15 sm:h-[102px]" />
    <MiniRwsCard src="/cards/cups-14.jpg" badge="#2" label="2. จิตใจ" borderColor="#38bdf8" glowColor="rgba(56,189,248,0.55)" className="w-16 h-[108px] sm:w-17 sm:h-[115px]" highlight />
    <MiniRwsCard src="/cards/major-17.jpg" badge="#3" label="3. จิตวิญญาณ" borderColor="#a855f7" glowColor="rgba(168,85,247,0.55)" className="w-16 h-[108px] sm:w-17 sm:h-[115px]" highlight />
  </div>
);

// 13. ความในใจของเขา (4 ใบ)
export const HowTheyFeelSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/swords-02.jpg"
      badge="#2 ความรู้สึกจริง"
      borderColor="#ec4899"
      glowColor="rgba(236,72,153,0.55)"
      className="w-11 h-[75px] sm:w-12 sm:h-[82px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2.5">
      <MiniRwsCard src="/cards/cups-02.jpg" badge="#1 ท่าที" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/cups-04.jpg" badge="#3 สิ่งที่หวัง" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/wands-01.jpg" badge="#4 ก้าวต่อไป" borderColor="#ffd700" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    </div>
  </div>
);

// 14. คนรักเก่าจะกลับมาไหม (4 ใบ)
export const ExReconciliationSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-20.jpg"
      badge="#3 โอกาสรีเทิร์น"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.55)"
      className="w-11 h-[75px] sm:w-12 sm:h-[82px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2.5">
      <MiniRwsCard src="/cards/cups-05.jpg" badge="#1 ความรู้สึก" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/swords-03.jpg" badge="#2 สาเหตุ" borderColor="#f43f5e" className="w-10 h-[68px] sm:w-11 sm:h-[75px] opacity-85" />
      <MiniRwsCard src="/cards/cups-06.jpg" badge="#4 คำแนะนำ" borderColor="#10b981" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    </div>
  </div>
);

// 15. ตามหาเนื้อคู่ & ความรักแท้ (5 ใบ)
export const SoulmateSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-06.jpg"
      badge="#1 เนื้อคู่"
      borderColor="#ec4899"
      glowColor="rgba(236,72,153,0.55)"
      className="w-11 h-[75px] sm:w-12 sm:h-[82px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/cups-02.jpg" badge="#2 ที่พบ" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/wands-04.jpg" badge="#3 บททดสอบ" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/major-17.jpg" badge="#4 ปรับตัว" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/major-21.jpg" badge="#5 บทสรุป" borderColor="#ffd700" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    </div>
  </div>
);

// 16. ย้ายงานหรืออยู่ที่เดิม (5 ใบ)
export const CareerSwitchSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-07.jpg"
      badge="#5 ทางเลือกดีสุด"
      borderColor="#10b981"
      glowColor="rgba(16,185,129,0.55)"
      className="w-11 h-[75px] sm:w-12 sm:h-[82px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2">
      <MiniRwsCard src="/cards/wands-02.jpg" badge="#1 ที่เดิม" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/pentacles-03.jpg" badge="#2 ผลที่เดิม" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/wands-08.jpg" badge="#3 ผลที่ใหม่" borderColor="#ffd700" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/major-00.jpg" badge="#4 ปัจจัยลับ" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    </div>
  </div>
);

// 17. ปลดล็อกศักยภาพในตัวคุณ (4 ใบ)
export const InnerPotentialSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex flex-col items-center justify-center gap-1.5 relative ${className}`}>
    <MiniRwsCard
      src="/cards/major-08.jpg"
      badge="#2 พรสวรรค์"
      borderColor="#ffd700"
      glowColor="rgba(255,215,0,0.55)"
      className="w-11 h-[75px] sm:w-12 sm:h-[82px]"
      highlight
    />
    <div className="flex items-center justify-center gap-2.5">
      <MiniRwsCard src="/cards/major-01.jpg" badge="#1 ตัวตน" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
      <MiniRwsCard src="/cards/swords-09.jpg" badge="#3 ความกลัว" borderColor="#f43f5e" className="w-10 h-[68px] sm:w-11 sm:h-[75px] opacity-80" />
      <MiniRwsCard src="/cards/major-19.jpg" badge="#4 กุญแจพลัง" borderColor="#10b981" className="w-10 h-[68px] sm:w-11 sm:h-[75px]" />
    </div>
  </div>
);

// 18. ดวงประจำสัปดาห์ 7 วัน (7 ใบ) — High-Res 7-Day Ribbon
export const WeeklySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex items-center justify-center gap-1 sm:gap-1.5 relative ${className}`}>
    {[
      { day: "จันทร์", card: "01" },
      { day: "อังคาร", card: "04" },
      { day: "พุธ", card: "07" },
      { day: "พฤหัส", card: "10" },
      { day: "ศุกร์", card: "14", highlight: true },
      { day: "เสาร์", card: "17" },
      { day: "อาทิตย์", card: "19" },
    ].map((item, idx) => (
      <div
        key={idx}
        className={`relative rounded-lg overflow-hidden border transition-all duration-200 flex-shrink-0 ${
          item.highlight
            ? "w-10 h-[68px] sm:w-11 sm:h-[75px] z-20 scale-110 -translate-y-1.5 border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.6)]"
            : "w-9 h-[62px] sm:w-10 sm:h-[68px] border-[#e5c07b]/40 opacity-90 hover:opacity-100"
        }`}
      >
        <img
          src={`/cards/major-${item.card}.jpg`}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-0.5 inset-x-0 text-[7px] sm:text-[7.5px] font-bold text-center font-serif-th bg-black/85 text-[#ffd700] py-0.2">
          {item.day}
        </span>
      </div>
    ))}
  </div>
);

// 19. ดวงประจำเดือน 4 สัปดาห์ (4 ใบ)
export const MonthlySpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => (
  <div className={`flex items-center justify-center gap-2 sm:gap-3 relative ${className}`}>
    {["สัปดาห์ 1", "สัปดาห์ 2", "สัปดาห์ 3", "สัปดาห์ 4"].map((wk, idx) => (
      <MiniRwsCard
        key={idx}
        src={`/cards/major-${String((idx * 5 + 3) % 22).padStart(2, "0")}.jpg`}
        badge={`W${idx + 1}`}
        label={wk}
        className="w-13 h-[88px] sm:w-14 sm:h-[95px]"
        highlight={idx === 2}
      />
    ))}
  </div>
);

// 20. ผังจักระทั้ง 7 (7 ใบ) — Luminous 7-Chakra Rainbow Arc
export const ChakraSpreadArt: React.FC<{ className?: string }> = ({ className = "w-full h-40" }) => {
  const chakras = [
    { num: 1, name: "ก้นกบ", card: "00", color: "#ef4444" },
    { num: 2, name: "สะดือ", card: "03", color: "#f97316" },
    { num: 3, name: "หน้าท้อง", card: "06", color: "#eab308" },
    { num: 4, name: "หัวใจ", card: "09", color: "#10b981", highlight: true },
    { num: 5, name: "ลำคอ", card: "15", color: "#06b6d4" },
    { num: 6, name: "ตาที่สาม", card: "18", color: "#6366f1" },
    { num: 7, name: "กระหม่อม", card: "21", color: "#a855f7" },
  ];

  return (
    <div className={`flex flex-col items-center justify-center gap-2 relative ${className}`}>
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 relative z-10">
        {chakras.map((chk) => (
          <div
            key={chk.num}
            className={`relative rounded-lg overflow-hidden border transition-all duration-200 flex-shrink-0 ${
              chk.highlight
                ? "w-10 h-[68px] sm:w-11 sm:h-[75px] z-20 scale-110 -translate-y-1.5 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                : "w-9 h-[62px] sm:w-10 sm:h-[68px] opacity-90 hover:opacity-100"
            }`}
            style={{
              borderColor: chk.color,
              boxShadow: `0 0 12px ${chk.color}45`,
            }}
          >
            <img
              src={`/cards/major-${chk.card}.jpg`}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span
              className="absolute top-0.5 right-0.5 text-[7.5px] font-bold px-1 rounded font-mono"
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
      <span className="text-[9.5px] font-serif-th font-semibold text-[#e5c07b] flex items-center gap-1">
        <span>✦</span> สมดุล 7 ศูนย์พลังชีวิต <span>✦</span>
      </span>
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
