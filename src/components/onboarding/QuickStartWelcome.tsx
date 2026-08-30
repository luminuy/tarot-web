"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

import type { Category } from "@/data/cards/types";
import { SPREADS, type Spread } from "@/data/spreads";
import { soundManager } from "@/lib/utils/audio";

/**
 * หน้าเริ่มต้นแบบเร็ว (Quick Start Welcome)
 * -------------------------------------------------
 * เพิ่ม "ก่อน" กริดเลือกผังเดิม (SpreadCardSelector) ไม่ได้แทนที่ —
 * คนใหม่ที่ยังไม่รู้จักเว็บเจอตัวเลือก 10 ผังพร้อมกันจะเลือกไม่ถูก
 * หน้านี้ลดให้เหลือ 2 การตัดสินใจง่าย ๆ: อยากรู้เรื่องอะไร → อยากดูลึกแค่ไหน
 * ผู้ใช้ที่อยากเลือกเองแบบละเอียด (Celtic Cross, ดวง 12 เดือน ฯลฯ) กด "ข้าม" ได้ทุกจังหวะ
 *
 * การแมปหมวด × จำนวนใบ → spread จริง ไม่ใช่ทุกช่องมีของจริงรองรับ:
 *   - การเงินกับภาพรวมชีวิตไม่มีผัง 5 ใบที่เข้ากับหมวดโดยตรง จึงโชว์แค่ 1/3 ใบ
 *     ผังการเงิน 4 ใบตัวเต็มยังอยู่ในกริดเดิม เข้าถึงได้ผ่านปุ่ม "ข้าม" เท่านั้น
 *   - "การเงิน + 3 ใบ" ตั้งใจให้ใช้ผัง three-card (อดีต-ปัจจุบัน-อนาคต) สลับ category
 *     เป็น money แทนที่จะสร้างผังใหม่ — decision นี้คุยกับผู้ใช้แล้ว
 */

type QuickCategory = "love" | "work" | "money" | "general";

interface DepthOption {
  cards: number;
  spreadId: string;
}

const CATEGORY_OPTIONS: { id: QuickCategory; icon: string; label: string }[] = [
  { id: "love", icon: "❤️", label: "ความรัก" },
  { id: "work", icon: "💼", label: "การงาน" },
  { id: "money", icon: "💰", label: "การเงิน" },
  { id: "general", icon: "🌙", label: "ภาพรวมชีวิต" },
];

/** ผังจริงที่แต่ละหมวด × ความลึกแมปไปหา — ดูหมายเหตุด้านบนว่าทำไมบางหมวดมีแค่ 2 ตัวเลือก */
const DEPTH_OPTIONS: Record<QuickCategory, DepthOption[]> = {
  love: [
    { cards: 1, spreadId: "quick" },
    { cards: 3, spreadId: "three-card" },
    { cards: 5, spreadId: "love" },
  ],
  work: [
    { cards: 1, spreadId: "quick" },
    { cards: 3, spreadId: "three-card" },
    { cards: 5, spreadId: "career" },
  ],
  money: [
    { cards: 1, spreadId: "quick" },
    { cards: 3, spreadId: "three-card" },
  ],
  general: [
    { cards: 1, spreadId: "quick" },
    { cards: 3, spreadId: "three-card" },
  ],
};

type Phase = "hero" | "category" | "depth";

export interface QuickStartWelcomeProps {
  /** เลือกจบครบทั้งหมวดและความลึกแล้ว — ส่ง spread จริงพร้อม category ที่ควรใช้ */
  onComplete: (spread: Spread, category: Category) => void;
  /** ข้ามไปหน้ากริดเลือกผังแบบเต็ม (สำหรับคนที่รู้อยู่แล้วว่าอยากได้ผังไหน) */
  onSkip: () => void;
}

const fadeSlide = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export function QuickStartWelcome({ onComplete, onSkip }: QuickStartWelcomeProps) {
  const [phase, setPhase] = useState<Phase>("hero");
  const [category, setCategory] = useState<QuickCategory | null>(null);

  const depthOptions = category ? DEPTH_OPTIONS[category] : [];

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-6 sm:py-10">
      <AnimatePresence mode="wait">
        {phase === "hero" && (
          <motion.div key="hero" {...fadeSlide} className="space-y-6">
            <div className="text-5xl sm:text-6xl">🔮</div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-serif-th font-bold font-mystic-gold tracking-wide">
                TAROT READING
              </h2>
              <p className="text-sm sm:text-base text-[#cfc8e2] font-serif-th leading-relaxed max-w-md mx-auto">
                &ldquo;ตั้งคำถามที่อยู่ในใจ
                <br />
                แล้วให้ไพ่พาคุณไปพบคำตอบ&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundManager.playCardSelectSound();
                setPhase("category");
              }}
              className="py-3.5 px-10 rounded-xl text-sm sm:text-base font-bold font-serif-th bg-gradient-to-r from-[#c59b27] via-[#e5c07b] to-[#f5deaa] text-[#05040a] shadow-[0_0_25px_rgba(229,192,123,0.45)] hover:opacity-90 transition-all cursor-pointer"
            >
              ✦ เริ่มเปิดไพ่
            </button>
          </motion.div>
        )}

        {phase === "category" && (
          <motion.div key="category" {...fadeSlide} className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-serif-th font-bold text-[#f5deaa]">
                เลือกประเภทการอ่าน
              </h3>
              <p className="text-xs sm:text-sm text-[#9c93b8]">อยากรู้เรื่องอะไรตอนนี้</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundManager.playCardSelectSound();
                    setCategory(opt.id);
                    setPhase("depth");
                  }}
                  className="flex flex-col items-center gap-2 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#180f30] to-[#0d071a] border-2 border-[#e5c07b]/25 hover:border-[#e5c07b]/70 hover:shadow-[0_0_20px_rgba(229,192,123,0.25)] transition-all cursor-pointer"
                >
                  <span className="text-3xl sm:text-4xl">{opt.icon}</span>
                  <span className="text-sm sm:text-base font-serif-th font-semibold text-[#e2d9f3]">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-[#9c93b8] hover:text-[#e5c07b] underline underline-offset-4 cursor-pointer"
            >
              ข้าม ไปเลือกผังทั้งหมดเอง →
            </button>
          </motion.div>
        )}

        {phase === "depth" && category && (
          <motion.div key="depth" {...fadeSlide} className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-serif-th font-bold text-[#f5deaa]">
                เลือก Spread
              </h3>
              <p className="text-xs sm:text-sm text-[#9c93b8]">อยากดูลึกแค่ไหน</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {depthOptions.map((opt) => {
                const spread = SPREADS.find((s) => s.id === opt.spreadId);
                if (!spread) return null;
                return (
                  <button
                    key={opt.cards}
                    type="button"
                    onClick={() => {
                      soundManager.playCardSelectSound();
                      onComplete(spread, category);
                    }}
                    className="flex flex-col items-center gap-1.5 py-5 px-6 sm:px-8 rounded-2xl bg-gradient-to-b from-[#180f30] to-[#0d071a] border-2 border-[#e5c07b]/25 hover:border-[#e5c07b]/70 hover:shadow-[0_0_20px_rgba(229,192,123,0.25)] transition-all cursor-pointer min-w-[92px]"
                  >
                    <span className="text-2xl sm:text-3xl font-serif-th font-bold text-[#f5deaa]">
                      {opt.cards}
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#cfc8e2]">ใบ</span>
                    <span className="text-[10px] text-[#9c93b8]">
                      {spread.credits === 0 ? "ฟรี" : `${spread.credits} เครดิต`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPhase("category")}
                className="text-xs text-[#9c93b8] hover:text-[#e5c07b] cursor-pointer"
              >
                ← เปลี่ยนหมวด
              </button>
              <span className="text-[#e5c07b]/30">·</span>
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-[#9c93b8] hover:text-[#e5c07b] underline underline-offset-4 cursor-pointer"
              >
                ข้าม ไปเลือกผังทั้งหมดเอง →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
