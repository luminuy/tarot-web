"use client";

import React from "react";
import { motion } from "motion/react";
import { PERSONAS, type Persona } from "@/data/personas";
import {
  HighPriestessIllustration,
  JusticeIllustration,
  TheStarIllustration,
} from "@/components/ui/TarotArtIcons";

interface PersonaCardSelectorProps {
  selectedPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
}

const PERSONA_DETAILS: Record<string, { roleTitle: string; archetype: string; renderArt: () => React.ReactNode }> = {
  warm: {
    roleTitle: "THE HIGH PRIESTESS",
    archetype: "สไตล์: อบอุ่น ให้กำลังใจ เหมือนพี่สาว",
    renderArt: () => <HighPriestessIllustration className="w-20 h-[136px] mx-auto" />,
  },
  direct: {
    roleTitle: "JUSTICE & TRUTH",
    archetype: "สไตล์: ตรงไปตรงมา ชัดเจน ไม่อ้อมค้อม",
    renderArt: () => <JusticeIllustration className="w-20 h-[136px] mx-auto" />,
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
}) => {
  return (
    <div className="space-y-4">
      <label className="text-xs sm:text-sm font-serif-th font-bold text-[#f5deaa] tracking-wide flex items-center gap-2">
        <span className="text-[#e5c07b]">✦</span> เลือกสไตล์การทำนายของแม่หมอ
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {PERSONAS.map((p) => {
          const isSelected = selectedPersona.id === p.id;
          const meta = PERSONA_DETAILS[p.id] || PERSONA_DETAILS.warm;

          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPersona(p)}
              className={`rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between p-4 sm:p-5 relative overflow-hidden select-none ${
                isSelected
                  ? "bg-gradient-to-b from-[#281d4a] via-[#140b28] to-[#07040f] border-[#e5c07b] ring-2 ring-[#e5c07b]/90 shadow-[0_0_40px_rgba(229,192,123,0.5)]"
                  : "bg-gradient-to-b from-[#130d24]/90 to-[#07040f]/90 border-[#e5c07b]/25 hover:border-[#e5c07b]/60 hover:bg-[#181130] shadow-xl"
              }`}
              style={{ minHeight: "315px" }}
            >
              {/* Top Card Archetype Tag */}
              <div className="text-center pb-1.5 border-b border-[#e5c07b]/15">
                <span className="text-[9px] uppercase tracking-widest text-[#e5c07b] font-mono font-semibold block">
                  {meta.roleTitle}
                </span>
                <span className="text-[10px] text-[#9c93b8] font-serif-th block mt-0.5">
                  {meta.archetype}
                </span>
              </div>

              {/* Authentic Tarot Persona Character Artwork */}
              <div className="my-auto py-2 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(229,192,123,0.25)]">
                {meta.renderArt()}
              </div>

              {/* Card Footer Titles */}
              <div className="pt-2 border-t border-[#e5c07b]/15 text-center">
                <h4 className="font-serif-th text-xs sm:text-sm font-bold font-mystic-gold leading-tight">
                  {p.nameTh}
                </h4>
                <p className="text-[10px] text-[#cfc8e2]/80 mt-1 leading-snug">
                  {p.tagline}
                </p>
              </div>

              {/* Selected Golden Corner Seals */}
              {isSelected && (
                <>
                  <div className="absolute top-1.5 left-1.5 text-[8px] text-[#e5c07b]">✦</div>
                  <div className="absolute top-1.5 right-1.5 text-[8px] text-[#e5c07b]">✦</div>
                  <div className="absolute bottom-1.5 left-1.5 text-[8px] text-[#e5c07b]">✦</div>
                  <div className="absolute bottom-1.5 right-1.5 text-[8px] text-[#e5c07b]">✦</div>
                </>
              )}

              {/* Holographic Sheen Layer */}
              <div className="gold-foil-sheen absolute inset-0 opacity-20 hover:opacity-40 transition-opacity" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
