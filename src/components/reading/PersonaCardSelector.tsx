"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { PERSONAS, type Persona } from "@/data/personas";
import { soundManager } from "@/lib/utils/audio";
import {
  HighPriestessIllustration,
  JusticeIllustration,
  TheStarIllustration,
  MagicianIllustration,
  HermitIllustration,
  SpeakerTabIcon,
} from "@/components/ui/TarotArtIcons";
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { isMasterPersona } from "@/lib/entitlement/limits";

import { useLocale } from "@/lib/i18n";

interface PersonaCardSelectorProps {
  selectedPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  isPassHolder?: boolean;
  onRequireUpgrade?: (reason: "master_persona", persona: Persona) => void;
}

const PERSONA_GREETINGS: Record<string, string> = {
  warm: "ยินดีต้อนรับนะคะ มีเรื่องอะไรในใจ เล่าให้แม่หมอฟังได้เลยนะ",
  playful: "ว่าไงจ๊ะคนเก่ง! วันนี้มีเรื่องอะไรมาอัปเดต มาดูกันให้ไวเลย!",
  direct: "สวัสดีค่ะ ไพ่พร้อมเปิดเผยความจริง คุณพร้อมรับฟังทางออกหรือยังคะ",
  master: "สวัสดีครับ ทุกปัญหามีทางออก มาดูภาพรวมและวางกลยุทธ์ก้าวต่อไปกันครับ",
  mystic: "ยินดีต้อนรับสู่วิหารศักดิ์สิทธิ์ ดวงดาวและจักรวาลกำลังส่งสัญญาณถึงคุณ",
};

const PERSONA_GREETINGS_EN: Record<string, string> = {
  warm: "Welcome, seeker. Whatever weighs on your heart today, know you are held in sacred space.",
  playful: "Hey there! Ready to see what magic the cards have in store for you today? Let's dive in! ✨",
  direct: "Greetings. The cards cut straight to the core. Are you ready for clear, honest truth?",
  master: "Greetings. Every crossroad carries strategic opportunity. Let us examine the patterns and forge your path.",
  mystic: "Welcome to the sacred sanctuary. The celestial currents and ancient archetypes are whispering your name.",
};

const PERSONA_DETAILS: Record<string, { roleTitle: string; archetypeTh: string; archetypeEn: string; renderArt: () => React.ReactNode }> = {
  warm: {
    roleTitle: "THE HIGH PRIESTESS",
    archetypeTh: "สไตล์: อบอุ่น ให้กำลังใจ เหมือนพี่สาว",
    archetypeEn: "Style: Warm, nurturing, compassionate sister",
    renderArt: () => <HighPriestessIllustration className="w-20 h-[136px] mx-auto" />,
  },
  playful: {
    roleTitle: "THE MAGICIAN & BESTIE",
    archetypeTh: "สไตล์: คุยสนุก เป็นกันเอง เม้าท์มันส์",
    archetypeEn: "Style: Playful, spirited, best-friend energy",
    renderArt: () => <MagicianIllustration className="w-20 h-[136px] mx-auto" />,
  },
  direct: {
    roleTitle: "JUSTICE & TRUTH",
    archetypeTh: "สไตล์: ตรงไปตรงมา ชัดเจน ไม่อ้อมค้อม",
    archetypeEn: "Style: Direct, sharp, unfiltered clarity",
    renderArt: () => <JusticeIllustration className="w-20 h-[136px] mx-auto" />,
  },
  master: {
    roleTitle: "THE MASTER STRATEGIST",
    archetypeTh: "สไตล์: จริงจัง สุขุม ให้กลยุทธ์ฟันธง",
    archetypeEn: "Style: Strategic, grounded, executive clarity",
    renderArt: () => <HermitIllustration className="w-20 h-[136px] mx-auto" />,
  },
  mystic: {
    roleTitle: "THE ASTRAL STAR",
    archetypeTh: "สไตล์: ลึกซึ้ง มองภาพรวมและพลังงาน",
    archetypeEn: "Style: Esoteric, cosmic, deep intuitive symbolism",
    renderArt: () => <TheStarIllustration className="w-20 h-[136px] mx-auto" />,
  },
};

export const PersonaCardSelector: React.FC<PersonaCardSelectorProps> = ({
  selectedPersona,
  onSelectPersona,
  isPassHolder = false,
  onRequireUpgrade,
}) => {
  const { isEnglish } = useLocale();
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [activeScrollIndex, setActiveScrollIndex] = useState(0);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    const cardWidth = Math.min(clientWidth * 0.82, 310) + 16;
    const newIdx = Math.round(scrollLeft / cardWidth);
    if (newIdx >= 0 && newIdx < PERSONAS.length && newIdx !== activeScrollIndex) {
      setActiveScrollIndex(newIdx);
    }
  };

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    const children = carouselRef.current.children;
    if (children && children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setActiveScrollIndex(index);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <label className="text-xs sm:text-sm font-serif-th font-bold text-[#8F5C1A] tracking-wide flex items-center gap-2 [text-wrap:balance]">
        <span className="text-[#8F5C1A]">✦</span>{" "}
        {isEnglish
          ? `Select Reader Persona (${PERSONAS.length} Archetypes)`
          : `เลือกสไตล์การทำนายของแม่หมอ (${PERSONAS.length} สไตล์)`}
      </label>

      {/* Responsive Persona Carousel (Mobile Swipe / Desktop Grid) */}
      <div
        ref={carouselRef}
        role="radiogroup"
        aria-label={isEnglish ? "Select reader persona" : "เลือกสไตล์การทำนายของแม่หมอ"}
        onScroll={handleCarouselScroll}
        className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 pb-3 pt-1 px-4 -mx-4 no-scrollbar scroll-smooth sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-4 sm:mx-0 sm:px-0 sm:pb-0 sm:pt-0 sm:overflow-visible"
      >
        {PERSONAS.map((p, idx) => {
          const isSelected = selectedPersona.id === p.id;
          const meta = PERSONA_DETAILS[p.id] || PERSONA_DETAILS.warm;
          const isMaster = isMasterPersona(p.id);
          const isLocked = isMaster && !isPassHolder;

          const handlePersonaClick = () => {
            if (isLocked) {
              soundManager.playMenuTapSound();
              onRequireUpgrade?.("master_persona", p);
              return;
            }
            onSelectPersona(p);
            scrollToCard(idx);
          };

          return (
            <motion.div
              key={p.id}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected}
              aria-label={
                isEnglish
                  ? `Reader ${p.nameEn || p.nameTh} (${meta.roleTitle})${isLocked ? " - Unlock with Grand Tier" : ""} - ${p.taglineEn || p.tagline}`
                  : `แม่หมอ ${p.nameTh} (${meta.roleTitle})${isLocked ? " - ปลดล็อกด้วยญาณพยากรณ์พิเศษ" : ""} - ${p.tagline}`
              }
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePersonaClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePersonaClick();
                }
              }}
              className={`w-[82vw] max-w-[310px] flex-shrink-0 snap-center sm:w-auto sm:max-w-none sm:flex-shrink rounded-lg border transition-all duration-300 cursor-pointer flex flex-col justify-between p-4 sm:p-5 relative overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] group/persona ${
                isSelected
                  ? "bg-[#FFFFFF] border-[#D9C8AC] ring-2 ring-[#8F5C1A]/50 shadow-[var(--shadow-overlay)]"
                  : isLocked
                    ? "bg-[#FFFFFF]/80 border-[#D9C8AC]/70 hover:border-[#8F5C1A] hover:bg-[#FAF7F2] opacity-90 hover:opacity-100"
                    : "bg-[#FFFFFF] border-[#D9C8AC] hover:border-[#8F5C1A] hover:bg-[#FAF7F2]"
              }`}
              style={{ minHeight: "315px" }}
            >
              {/* Top Card Archetype Tag */}
              <div className="text-center pb-1.5 border-b border-[#D9C8AC]/30">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[12px] uppercase tracking-widest text-[#8F5C1A] font-mono font-semibold block">
                    {meta.roleTitle}
                  </span>
                  {isLocked && (
                    <span className="text-[12px] text-[#8F5C1A] bg-[#F3EDE2] border border-[#D9C8AC] px-2 py-0.5 rounded-full font-serif-th font-bold flex items-center gap-1">
                      <span>{isEnglish ? "✦ Master Tier" : "✦ ผู้เชี่ยวชาญพิเศษ"}</span>
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-[#635B4E] font-serif-th block mt-0.5">
                  {isEnglish ? meta.archetypeEn : meta.archetypeTh}
                </span>
              </div>

              {/* Authentic Tarot Persona Character Artwork with Altar Aura */}
              <div className="my-auto py-2 flex flex-col items-center justify-center gap-2 relative">
                <div
                  className={`relative z-10 filter drop-shadow-[0_2px_8px_rgba(90,67,47,0.15)] ${isLocked ? "opacity-90" : ""}`}
                >
                  {meta.renderArt()}
                </div>

                {/* ตราผนึกปรมาจารย์ลับ — ป้ายแคปซูลหรูหราใต้ภาพไพ่ (ไม่ปิดทับหน้าไพ่เด็ดขาด) */}
                {isLocked && (
                  <div className="z-20 flex items-center gap-1.5 rounded-full border border-[#D9C8AC] bg-[#FFFFFF] px-3 py-1 group-hover/persona:border-[#8F5C1A] transition-all duration-300 shadow-xs">
                    <SealedLockIcon className="w-3.5 h-3.5 text-[#8F5C1A] flex-shrink-0" />
                    <span className="text-[13px] font-serif-th font-bold text-[#2E211A] whitespace-nowrap">
                      {isEnglish ? "Tap to unlock" : "แตะเพื่อปลดล็อก"}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Titles */}
              <div className="pt-2 border-t border-[#D9C8AC]/30 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="font-serif-th text-xs sm:text-sm font-bold font-mystic-gold leading-tight [text-wrap:balance]">
                    {isEnglish ? (p.nameEn || p.nameTh) : p.nameTh}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLocked) {
                        soundManager.playMenuTapSound();
                        onRequireUpgrade?.("master_persona", p);
                        return;
                      }
                      onSelectPersona(p);
                      const greeting = isEnglish
                        ? (PERSONA_GREETINGS_EN[p.id] || "Greetings, seeker.")
                        : (PERSONA_GREETINGS[p.id] || "สวัสดีค่ะ");
                      soundManager.speakProphecy(greeting, p.id);
                    }}
                    className="p-1.5 rounded-full text-xs text-[#8F5C1A] hover:text-[#2E211A] hover:bg-[#F3EDE2]/40 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
                    title={
                      isLocked
                        ? (isEnglish ? `Unlock voice greeting of ${p.nameEn || p.nameTh}` : `ปลดล็อกเสียงทักทายของ ${p.nameTh}`)
                        : (isEnglish ? `Listen to voice of ${p.nameEn || p.nameTh}` : `ฟังเสียงทักทายของ ${p.nameTh}`)
                    }
                    aria-label={
                      isLocked
                        ? (isEnglish ? `Unlock voice greeting of ${p.nameEn || p.nameTh}` : `ปลดล็อกเสียงทักทายของ ${p.nameTh}`)
                        : (isEnglish ? `Listen to voice of ${p.nameEn || p.nameTh}` : `ฟังเสียงทักทายของ ${p.nameTh}`)
                    }
                  >
                    <SpeakerTabIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[13px] text-[#635B4E] mt-1 leading-relaxed font-serif-th [text-wrap:pretty]">
                  {isEnglish ? (p.taglineEn || p.tagline) : p.tagline}
                </p>
              </div>

              {/* Selected Golden Corner Seals */}
              {isSelected && (
                <>
                  <div className="absolute top-1.5 left-1.5 text-[12px] text-[#8F5C1A]">✦</div>
                  <div className="absolute top-1.5 right-1.5 text-[12px] text-[#8F5C1A]">✦</div>
                  <div className="absolute bottom-1.5 left-1.5 text-[12px] text-[#8F5C1A]">✦</div>
                  <div className="absolute bottom-1.5 right-1.5 text-[12px] text-[#8F5C1A]">✦</div>
                </>
              )}

              {/* Holographic Sheen Layer */}
              <div className="gold-foil-sheen absolute inset-0 opacity-20 hover:opacity-40 transition-opacity pointer-events-none" />
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Mobile Persona Indicator Dots */}
      <div className="flex sm:hidden items-center justify-center gap-1.5 pt-0.5 pb-1">
        {PERSONAS.map((p, idx) => {
          const isCurrentActive = activeScrollIndex === idx;
          const isSelected = selectedPersona.id === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelectPersona(p);
                scrollToCard(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                isCurrentActive
                  ? "w-7 bg-[#8F5C1A]"
                  : isSelected
                    ? "w-3 bg-[#8F5C1A]/60"
                    : "w-1.5 bg-[#8F5C1A]/20 hover:bg-[#74490F]/45"
              }`}
              aria-label={isEnglish ? `Select ${p.nameEn || p.nameTh}` : `เลือก ${p.nameTh}`}
            />
          );
        })}
      </div>
    </div>
  );
};
