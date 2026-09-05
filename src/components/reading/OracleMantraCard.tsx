"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { TarotCard } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/tarot/shuffle";
import { generateSacredMantra } from "@/lib/tarot/mantra";
import { SITE_ORIGIN } from "@/lib/config/site";
import { useLocale } from "@/lib/i18n";

interface OracleMantraCardProps {
  cards: TarotCard[];
  drawn?: DrawnCard[];
  personaNameTh?: string;
}

export const OracleMantraCard: React.FC<OracleMantraCardProps> = ({ cards, drawn, personaNameTh = "แม่หมอทาโรต์" }) => {
  const { isEnglish } = useLocale();
  const [copied, setCopied] = useState(false);
  const mantra = useMemo(() => {
    try {
      return generateSacredMantra(cards, drawn);
    } catch {
      return null;
    }
  }, [cards, drawn]);

  if (!mantra) return null;

  const quote = isEnglish && mantra.quoteEn ? mantra.quoteEn : mantra.quoteTh;
  const affirmation = isEnglish && mantra.affirmationEn ? mantra.affirmationEn : mantra.affirmationTh;
  const elementSymbol = isEnglish && mantra.elementSymbolEn ? mantra.elementSymbolEn : mantra.elementSymbol;
  const cardName = isEnglish ? (mantra.sourceCard.nameEn || mantra.sourceCard.nameTh) : mantra.sourceCard.nameTh;
  const powerWord = isEnglish && mantra.powerWordEn ? mantra.powerWordEn : mantra.powerWord;

  const handleCopy = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN;
    const textToCopy = isEnglish
      ? `✨ Sacred Oracle Wisdom from ${personaNameTh}\n${quote}\n✦ Guiding Affirmation: "${affirmation}"\n(Resonant Card: ${cardName} - ${powerWord})\nTarot Sanctuary: ${origin}`
      : `✨ คำคมพลังใจศักดิ์สิทธิ์จาก ${personaNameTh}\n${quote}\n✦ ข้อคิดนำทาง: "${affirmation}"\n(ไพ่สะท้อนพลัง: ${cardName} - ${powerWord})\nดูดวงออนไลน์พรีเมียม: ${origin}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.32 }}
      className="relative my-6 overflow-hidden rounded-lg border border-[#D9C8AC] bg-[#F3EDE2] p-6 text-center "
    >
      {/* Decorative Ornaments */}

      {/* Card Header Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#D9C8AC] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-[#2E211A] ">
        <span className="text-[#8F5C1A]">✨</span>
        <span className="font-serif-th font-semibold">
          {isEnglish ? "Sacred Oracle Wisdom (Oracle Mantra)" : "คำคมพลังใจศักดิ์สิทธิ์ (Sacred Oracle Mantra)"}
        </span>
        <span className="text-[#8F5C1A]">✦</span>
      </div>

      {/* Main Quote */}
      <blockquote className="my-4 font-serif-th text-lg font-bold leading-relaxed text-[#2E211A] sm:text-xl md:text-2xl">
        &ldquo;{quote.replace(/^["“”]|["“”]$/g, "")}&rdquo;
      </blockquote>

      {/* Affirmation Box */}
      <div className="my-4 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-3.5 text-xs text-[#2E211A] sm:text-sm ">
        <p className="font-serif-th font-bold text-[#8F5C1A]">
          ✦ {isEnglish ? "Guiding Affirmation:" : "คำประกาศเจตจำนง (Affirmation):"}
        </p>
        <p className="mt-1 font-serif-th font-medium text-[#2E211A]">
          {affirmation.replace(/^["“”]|["“”]$/g, "")}
        </p>
      </div>

      {/* Source Meta & Action */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#D9C8AC]/30 pt-4 text-xs text-[#635B4E]">
        <div className="flex items-center gap-2 text-left">
          <span className="text-[#8F5C1A] text-xs">✦</span>
          <div>
            <span className="font-serif-th font-semibold text-[#2E211A]">{cardName}</span>
            <span className="ml-1.5 text-[#635B4E] font-mono text-[13px]">({elementSymbol})</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={isEnglish ? "Copy wisdom to clipboard" : "คัดลอกคำคมแชร์ลงสตอรี่"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-semibold text-[#2E211A] hover:border-[#8F5C1A] hover:bg-[#FAF7F2] hover:text-[#8F5C1A] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 text-[#3A7044] font-bold"
              >
                <span>✓</span>
                <span>{isEnglish ? "Wisdom Copied!" : "คัดลอกคำคมแล้ว!"}</span>
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 font-serif-th"
              >
                <span className="text-[#8F5C1A]">✦</span>
                <span>{isEnglish ? "Copy Wisdom" : "คัดลอกคำคมแชร์ลงสตอรี่"}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
};
