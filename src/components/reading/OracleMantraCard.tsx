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

export const OracleMantraCard: React.FC<OracleMantraCardProps> = ({ cards, drawn, personaNameTh = "แม่หมอทาโรต์" }) => {
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
      className="relative my-6 overflow-hidden rounded-lg border border-[#E4D8C4] bg-[#F0E8DB] p-6 text-center "
    >
      {/* Decorative Ornaments */}

      {/* Card Header Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#E4D8C4] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-[#2E211A] ">
        <span className="text-[#8F5C1A]">✨</span>
        <span className="font-serif-th font-semibold">คำคมพลังใจศักดิ์สิทธิ์ (Sacred Oracle Mantra)</span>
        <span className="text-[#8F5C1A]">✦</span>
      </div>

      {/* Main Quote */}
      <blockquote className="my-4 font-serif-th text-lg font-bold leading-relaxed text-[#2E211A] sm:text-xl md:text-2xl">
        &ldquo;{mantra.quoteTh}&rdquo;
      </blockquote>

      {/* Affirmation Box */}
      <div className="my-4 rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-3.5 text-xs text-[#2E211A] sm:text-sm ">
        <p className="font-serif-th font-bold text-[#8F5C1A]">✦ คำประกาศเจตจำนง (Affirmation):</p>
        <p className="mt-1 font-serif-th font-medium text-[#2E211A]">{mantra.affirmationTh}</p>
      </div>

      {/* Source Meta & Action */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E4D8C4]/30 pt-4 text-xs text-[#6F5B4A]">
        <div className="flex items-center gap-2 text-left">
          <span className="text-[#8F5C1A] text-xs">✦</span>
          <div>
            <span className="font-serif-th font-semibold text-[#2E211A]">{mantra.sourceCard.nameTh}</span>
            <span className="ml-1.5 text-[#6F5B4A] font-mono text-[11px]">({mantra.elementSymbol})</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="คัดลอกคำคมแชร์ลงสตอรี่"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-semibold text-[#2E211A] hover:border-[#8F5C1A] hover:bg-[#F6F1E9] hover:text-[#8F5C1A] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
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
                <span className="text-[#8F5C1A]">✦</span>
                <span>คัดลอกคำคมแชร์ลงสตอรี่</span>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
};
