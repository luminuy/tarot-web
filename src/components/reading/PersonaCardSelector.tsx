"use client";

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { PERSONAS, type Persona } from "@/data/personas";
import { soundManager } from "@/lib/utils/audio";
import {
  HighPriestessIllustration,
  JusticeIllustration,
  TheStarIllustration,
  MagicianIllustration,
  HermitIllustration,
} from "@/components/ui/TarotArtIcons";
import { isMasterPersona } from "@/lib/entitlement/limits";

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

const PERSONA_DETAILS: Record<string, { roleTitle: string; archetype: string; renderArt: () => React.ReactNode }> = {
  warm: {
    roleTitle: "THE HIGH PRIESTESS",
    archetype: "สไตล์: อบอุ่น ให้กำลังใจ เหมือนพี่สาว",
    renderArt: () => <HighPriestessIllustration className="w-20 h-[136px] mx-auto" />,
  },
  playful: {
    roleTitle: "THE MAGICIAN & BESTIE",
    archetype: "สไตล์: คุยสนุก เป็นกันเอง เม้าท์มันส์",
    renderArt: () => <MagicianIllustration className="w-20 h-[136px] mx-auto" />,
  },
  direct: {
    roleTitle: "JUSTICE & TRUTH",
    archetype: "สไตล์: ตรงไปตรงมา ชัดเจน ไม่อ้อมค้อม",
    renderArt: () => <JusticeIllustration className="w-20 h-[136px] mx-auto" />,
  },
  master: {
    roleTitle: "THE MASTER STRATEGIST",
    archetype: "สไตล์: จริงจัง สุขุม ให้กลยุทธ์ฟันธง",
    renderArt: () => <HermitIllustration className="w-20 h-[136px] mx-auto" />,
  },
  mystic: {
    roleTitle: "THE ASTRAL STAR",
    archetype: "สไตล์: ลึกซึ้ง มองภาพรวมและพลังงาน",
    renderArt: () => <TheStarIllustration className="w-20 h-[136px] mx-auto" />,
  },
};

export const PersonaCardSelector: React.FC<PersonaCardSelectorProps> = ({
  selectedPersona,
  onSelectPersona,
  isPassHolder = false,
  onRequireUpgrade,
}) => {
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
      <label className="text-xs sm:text-sm font-serif-th font-bold text-[#8F5C1A] tracking-wide flex items-center gap-2">
        <span className="text-[#8F5C1A]">✦</span> เลือกสไตล์การทำนายของแม่หมอ ({PERSONAS.length} สไตล์)
      </label>

      {/* Responsive Persona Carousel (Mobile Swipe / Desktop Grid) */}
      <div
        ref={carouselRef}
        role="radiogroup"
        aria-label="เลือกสไตล์การทำนายของแม่หมอ"
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
              aria-label={`แม่หมอ ${p.nameTh} (${meta.roleTitle})${isLocked ? " - ปลดล็อกด้วยญาณพยากรณ์พิเศษ" : ""} - ${p.tagline}`}
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
                  <span className="text-[9px] uppercase tracking-widest text-[#8F5C1A] font-mono font-semibold block">
                    {meta.roleTitle}
                  </span>
                  {isLocked && (
                    <span className="text-[8px] text-[#2E211A] bg-[#F3EDE2]/30 border border-[#D9C8AC] px-1.5 py-0.2 rounded-full font-serif-th font-bold flex items-center gap-0.5 ">
                      <span>✦</span>
                      <span>✦ ปรมาจารย์ลับ</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#6F5B4A] font-serif-th block mt-0.5">{meta.archetype}</span>
              </div>

              {/* Authentic Tarot Persona Character Artwork with Altar Aura */}
              <div className="my-auto py-2 flex items-center justify-center relative">
                <div
                  className={`relative z-10 filter drop-shadow-[0_2px_8px_rgba(90,67,47,0.15)] ${isLocked ? "opacity-90" : ""}`}
                >
                  {meta.renderArt()}
                </div>
              </div>

              {/* Card Footer Titles */}
              <div className="pt-2 border-t border-[#D9C8AC]/30 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="font-serif-th text-xs sm:text-sm font-bold font-mystic-gold leading-tight">
                    {p.nameTh}
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
                      const greeting = PERSONA_GREETINGS[p.id] || "สวัสดีค่ะ";
                      soundManager.speakProphecy(greeting, p.id);
                    }}
                    className="p-1.5 rounded-full text-xs text-[#8F5C1A] hover:text-[#2E211A] hover:bg-[#F3EDE2]/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
                    title={isLocked ? `ปลดล็อกเสียงทักทายของ ${p.nameTh}` : `ฟังเสียงทักทายของ ${p.nameTh}`}
                    aria-label={isLocked ? `ปลดล็อกเสียงทักทายของ ${p.nameTh}` : `ฟังเสียงทักทายของ ${p.nameTh}`}
                  >
                    ✦
                  </button>
                </div>
                <p className="text-[10px] text-[#6F5B4A] mt-1 leading-snug">{p.tagline}</p>
              </div>

              {/* Selected Golden Corner Seals */}
              {isSelected && (
                <>
                  <div className="absolute top-1.5 left-1.5 text-[8px] text-[#8F5C1A]">✦</div>
                  <div className="absolute top-1.5 right-1.5 text-[8px] text-[#8F5C1A]">✦</div>
                  <div className="absolute bottom-1.5 left-1.5 text-[8px] text-[#8F5C1A]">✦</div>
                  <div className="absolute bottom-1.5 right-1.5 text-[8px] text-[#8F5C1A]">✦</div>
                </>
              )}

              {/* Locked Hover Teaser Overlay */}
              {isLocked && (
                <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-lg flex items-center justify-center opacity-0 group-hover/persona:opacity-100 transition-opacity duration-200">
                  <div className="bg-[#2E211A]/95 border border-[#D9C8AC] px-3 py-1.5 rounded-lg text-[10.5px] font-serif-th font-bold text-[#FFFFFF] flex items-center gap-1.5">
                    <span className="text-[#8F5C1A]">✦</span>
                    <span>แตะเพื่อปลดล็อกปรมาจารย์</span>
                  </div>
                </div>
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
              aria-label={`เลือก ${p.nameTh}`}
            />
          );
        })}
      </div>
    </div>
  );
};
