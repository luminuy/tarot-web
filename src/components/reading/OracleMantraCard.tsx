"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { TarotCard } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/tarot/shuffle";
import { generateSacredMantra } from "@/lib/tarot/mantra";
import { SITE_ORIGIN } from "@/lib/config/site";

interface OracleMantraCardProps {
  cards: TarotCard[];
  drawn?: DrawnCard[];
  personaNameTh?: string;
}

export const OracleMantraCard: React.FC<OracleMantraCardProps> = ({
  cards,
  drawn,
  personaNameTh = "แม่หมอทาโรต์",
}) => {
  const [copied, setCopied] = useState(false);
  const mantra = useMemo(() => {
    try {
      return generateSacredMantra(cards, drawn);
    } catch {
      return null;
    }
  }, [cards, drawn]);

  if (!mantra) return null;

  const handleCopy = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN;
    const textToCopy = `✨ คำคมพลังใจศักดิ์สิทธิ์จาก ${personaNameTh}\n${mantra.quoteTh}\n✦ ข้อคิดนำทาง: "${mantra.affirmationTh}"\n(ไพ่สะท้อนพลัง: ${mantra.sourceCard.nameTh} - ${mantra.powerWord})\nดูดวงออนไลน์พรีเมียม: ${origin}`;
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
      className="relative my-6 overflow-hidden rounded-2xl border border-[#D6B48D] bg-[#FCF0E6] p-6 text-center shadow-xs"
    >
      {/* Decorative Ornaments */}
      <div className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-[#CD9F5B]/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-[#CD9F5B]/10 blur-2xl" />

      {/* Card Header Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#D6B48D] bg-[#FDF7F0] px-3 py-1 text-xs font-medium text-[#5A432F] shadow-xs">
        <span className="text-[#CD9F5B]">✨</span>
        <span className="font-serif-th font-semibold">คำคมพลังใจศักดิ์สิทธิ์ (Sacred Oracle Mantra)</span>
        <span className="text-[#CD9F5B]">✦</span>
      </div>

      {/* Main Quote */}
      <blockquote className="my-4 font-serif-th text-lg font-bold leading-relaxed text-[#5A432F] sm:text-xl md:text-2xl">
        &ldquo;{mantra.quoteTh}&rdquo;
      </blockquote>

      {/* Affirmation Box */}
      <div className="my-4 rounded-xl border border-[#D6B48D] bg-[#FDF7F0] p-3.5 text-xs text-[#5A432F] sm:text-sm shadow-xs">
        <p className="font-serif-th font-bold text-[#CD9F5B]">✦ คำประกาศเจตจำนง (Affirmation):</p>
        <p className="mt-1 font-serif-th font-medium text-[#5A432F]">{mantra.affirmationTh}</p>
      </div>

      {/* Source Meta & Action */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#D6B48D]/30 pt-4 text-xs text-[#8C735D]">
        <div className="flex items-center gap-2 text-left">
          <span className="text-[#CD9F5B] text-xs">✦</span>
          <div>
            <span className="font-serif-th font-semibold text-[#5A432F]">{mantra.sourceCard.nameTh}</span>
            <span className="ml-1.5 text-[#8C735D] font-mono text-[11px]">({mantra.elementSymbol})</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="คัดลอกคำคมแชร์ลงสตอรี่"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#D6B48D] bg-[#FDF7F0] px-3.5 py-1.5 text-xs font-semibold text-[#5A432F] hover:border-[#CD9F5B] hover:bg-[#FFFFFF] hover:text-[#CD9F5B] transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B]"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 text-emerald-700 font-bold"
              >
                <span>✓</span>
                <span>คัดลอกคำคมแล้ว!</span>
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 font-serif-th"
              >
                <span className="text-[#CD9F5B]">✦</span>
                <span>คัดลอกคำคมแชร์ลงสตอรี่</span>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
};
