"use client";

import React, { useState, useMemo } from "react";
import type { TarotCard } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/tarot/shuffle";
import { generateSacredMantra } from "@/lib/tarot/mantra";

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
    const textToCopy = `🔮 คำคมพลังใจศักดิ์สิทธิ์จาก ${personaNameTh}\n${mantra.quoteTh}\n✦ ข้อคิดนำทาง: "${mantra.affirmationTh}"\n(ไพ่สะท้อนพลัง: ${mantra.sourceCard.nameTh} - ${mantra.powerWord})\nดูดวงออนไลน์พรีเมียม: https://tarot-web.bankjack10452.workers.dev`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative my-6 overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-b from-[#1c162e]/95 via-[#120e1e]/98 to-[#090710]/95 p-6 text-center shadow-[0_0_35px_rgba(245,158,11,0.15)] backdrop-blur-md">
      {/* Decorative Ornaments */}
      <div className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />

      {/* Card Header Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
        <span>✨</span>
        <span>คำคมพลังใจศักดิ์สิทธิ์ (Sacred Oracle Mantra)</span>
        <span>✦</span>
      </div>

      {/* Main Quote */}
      <blockquote className="my-4 font-serif text-lg font-medium leading-relaxed text-amber-100 sm:text-xl md:text-2xl">
        {mantra.quoteTh}
      </blockquote>

      {/* Affirmation Box */}
      <div className="my-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-200/90 sm:text-sm">
        <p className="font-serif italic text-amber-300">✦ คำประกาศเจตจำนง (Affirmation):</p>
        <p className="mt-1 font-medium text-amber-100">{mantra.affirmationTh}</p>
      </div>

      {/* Source Meta & Action */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-amber-500/15 pt-4 text-xs text-amber-200/60">
        <div className="flex items-center gap-2 text-left">
          <span>🃏</span>
          <div>
            <span className="font-medium text-amber-300">{mantra.sourceCard.nameTh}</span>
            <span className="ml-1.5 text-amber-200/40">({mantra.elementSymbol})</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-3.5 py-1.5 text-xs font-medium text-amber-200 transition-all hover:border-amber-400/60 hover:bg-amber-500/30 hover:text-white"
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>คัดลอกคำคมแล้ว!</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>คัดลอกคำคมแชร์ลงสตอรี่</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
