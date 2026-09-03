"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundManager } from "@/lib/utils/audio";
import { SPRING, DUR } from "@/lib/motion";

interface ShuffleRitualProps {
  commitment: string;
  spreadName: string;
  onShuffleComplete: (clientSeed: string) => void;
}

export const ShuffleRitual: React.FC<ShuffleRitualProps> = ({ commitment, spreadName, onShuffleComplete }) => {
  const [shuffling, setShuffling] = useState(false);
  const [shufflePhase, setShufflePhase] = useState<"idle" | "split" | "riffle" | "bridge" | "gather">("idle");
  const [progress, setProgress] = useState(0);
  const entropyRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Collect entropy from user's micro-gestures
  const handlePointerMove = (e: React.PointerEvent) => {
    if (shuffling && entropyRef.current.length < 50) {
      entropyRef.current.push(e.clientX + e.clientY + Date.now());
    }
  };

  // P1-M5: rAF-based shuffle progress (frame-accurate, GPU-synchronized)
  const SHUFFLE_DURATION_MS = 2200; // total shuffle duration

  const shuffleTick = (timestamp: number) => {
    if (startTimeRef.current === 0) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;
    const cur = Math.min(100, (elapsed / SHUFFLE_DURATION_MS) * 100);
    setProgress(Math.round(cur));

    // Phase transitions
    if (cur >= 10 && cur < 20) setShufflePhase("split");
    else if (cur >= 20 && cur < 65) setShufflePhase("riffle");
    else if (cur >= 65 && cur < 85) setShufflePhase("bridge");
    else if (cur >= 85) setShufflePhase("gather");

    if (cur < 100) {
      rafRef.current = requestAnimationFrame(shuffleTick);
    } else {
      rafRef.current = null;
      setTimeout(() => {
        const rawSeed = entropyRef.current.join(":") + ":" + Date.now();
        onShuffleComplete(rawSeed);
      }, 420);
    }
  };

  const startShuffle = () => {
    soundManager.playShuffleSound();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([30, 40, 30, 50, 40]);
    }
    setShuffling(true);
    setShufflePhase("split");
    startTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(shuffleTick);
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-6 text-center select-none relative z-10"
    >
      {/* 3D Physical Riffle & Cascade Deck Stage */}
      <div className="h-64 sm:h-72 w-full flex items-center justify-center relative my-4" style={{ perspective: 1400 }}>
        {!shuffling ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={startShuffle}
            aria-label="แตะเพื่อเริ่มสับไพ่"
            className="anim-tarot-idle w-36 h-54 sm:w-44 sm:h-64 rounded-lg border-2 border-[#E4D8C4] card-back-pattern shadow-[var(--shadow-overlay)] flex flex-col items-center justify-between p-4 cursor-pointer overflow-hidden group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0E8DB]"
          >
            <div className="w-full flex justify-center items-center opacity-85">
              <span className="text-[9px] font-serif-th text-[#FFFFFF] tracking-[0.2em] uppercase font-bold">
                SACRED ORACLE
              </span>
            </div>

            {/* Clean Center */}
            <div className="my-auto" />

            <span className="text-xs font-serif-th font-bold text-[#FFFFFF] tracking-wide">สัมผัสเพื่อสับไพ่</span>

            {/* Dynamic Gold Sheen */}
            <div className="gold-foil-sheen absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity" />
          </motion.button>
        ) : (
          /* Multi-Layer Physical 3D Riffle Shuffle Animation */
          <div
            className="relative w-72 h-64 flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Left Deck Stack */}
            <motion.div
              animate={{
                x:
                  shufflePhase === "split"
                    ? -60
                    : shufflePhase === "riffle"
                      ? [-60, -10, -60]
                      : shufflePhase === "bridge"
                        ? -15
                        : 0,
                y: shufflePhase === "bridge" ? -25 : 0,
                rotateZ:
                  shufflePhase === "split"
                    ? -16
                    : shufflePhase === "riffle"
                      ? [-16, -4, -16]
                      : shufflePhase === "bridge"
                        ? -8
                        : 0,
                rotateY: shufflePhase === "split" ? 25 : 0,
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-32 h-48 sm:w-36 sm:h-54 rounded-lg border-2 border-[#E4D8C4] card-back-pattern absolute shadow-[var(--shadow-overlay)] flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-full border border-[#E4D8C4] flex items-center justify-center text-xs text-[#8F5C1A]">
                ✨
              </div>
            </motion.div>

            {/* Right Deck Stack */}
            <motion.div
              animate={{
                x:
                  shufflePhase === "split"
                    ? 60
                    : shufflePhase === "riffle"
                      ? [60, 10, 60]
                      : shufflePhase === "bridge"
                        ? 15
                        : 0,
                y: shufflePhase === "bridge" ? -25 : 0,
                rotateZ:
                  shufflePhase === "split"
                    ? 16
                    : shufflePhase === "riffle"
                      ? [16, 4, 16]
                      : shufflePhase === "bridge"
                        ? 8
                        : 0,
                rotateY: shufflePhase === "split" ? -25 : 0,
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-32 h-48 sm:w-36 sm:h-54 rounded-lg border-2 border-[#E4D8C4] card-back-pattern absolute shadow-[var(--shadow-overlay)] flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-full border border-[#E4D8C4] flex items-center justify-center text-xs text-[#8F5C1A]">
                ✨
              </div>
            </motion.div>

            {/* Center Weaving Cascade Cards */}
            {shufflePhase === "riffle" && (
              <>
                <motion.div
                  initial={{ y: 0, rotateZ: 0, scale: 1, opacity: 0 }}
                  animate={{
                    y: [-14, 10, -8, 6, -4, 2, 0],
                    rotateZ: [-5, 5, -3, 3, -1, 1, 0],
                    scale: [0.95, 1.04, 0.97, 1.02, 0.99, 1.01, 1],
                    opacity: 1,
                  }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                  className="w-30 h-44 rounded-lg border border-[#E4D8C4] card-back-pattern absolute z-20 shadow-[var(--shadow-overlay)] opacity-95"
                />
                <motion.div
                  initial={{ y: 0, rotateZ: 0, scale: 1, opacity: 0 }}
                  animate={{
                    y: [10, -14, 6, -8, 2, -4, 0],
                    rotateZ: [5, -5, 3, -3, 1, -1, 0],
                    scale: [1.02, 0.96, 1.01, 0.98, 1, 0.99, 1],
                    opacity: 1,
                  }}
                  transition={{ duration: 1.4, ease: "easeInOut", delay: 0.05 }}
                  className="w-30 h-44 rounded-lg border border-[#E4D8C4] card-back-pattern absolute z-20 shadow-[var(--shadow-overlay)] opacity-90"
                />
              </>
            )}

            {/* Bridge Arch Glow Effect */}
            {shufflePhase === "bridge" && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1.15 }} />
            )}
          </div>
        )}
      </div>

      {/* Sacred Ritual Subtitle & Title */}
      <span className="text-[11px] font-serif-th text-[#2E211A] font-bold bg-[#F0E8DB]/30 px-4 py-1 rounded-full border border-[#E4D8C4] mb-2 inline-block ">
        ✦ ขั้นตอนสับไพ่ ✦
      </span>
      <h2 className="text-2xl sm:text-3xl font-serif-th font-bold font-mystic-gold filter py-0.5 leading-normal">
        ตั้งสมาธิและนึกถึงคำถามของคุณ
      </h2>
      <p className="text-xs sm:text-sm text-[#6F5B4A] mt-1 max-w-md leading-relaxed">
        ทำใจให้สบาย แล้วนึกถึงเรื่องที่อยากรู้สำหรับผัง{" "}
        <span className="text-[#2E211A] font-semibold">"{spreadName}"</span>
      </p>

      {/* Commitment Preview for Commit-Reveal Transparency */}
      {commitment && (
        <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0E8DB] border border-[#E4D8C4] text-[10px] font-mono text-[#6F5B4A]">
          <span>
            คำมั่นความสุ่ม (SHA-256): {commitment.slice(0, 16)}…{commitment.slice(-8)}
          </span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(commitment)}
            title="คัดลอกคำมั่นความสุ่มเต็ม"
            aria-label="คัดลอกคำมั่นความสุ่ม"
            className="text-[#8F5C1A] hover:text-[#2E211A] cursor-pointer px-1 py-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8F5C1A]"
          >
            ⧉
          </button>
        </div>
      )}

      {/* Progress or Start Button */}
      <div className="w-full max-w-xs mt-6">
        {!shuffling ? (
          <button
            type="button"
            onClick={startShuffle}
            className="w-full py-4 px-6 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-bold font-serif-th shadow-[var(--shadow-overlay)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>✨</span>
            <span>แตะเพื่อเริ่มสับไพ่</span>
            <span>✨</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="w-full h-2.5 bg-[#F0E8DB] rounded-full overflow-hidden border border-[#E4D8C4]">
              <motion.div
                className="h-full bg-gradient-to-r from-[#8F5C1A] via-[#6F5B4A] to-[#8F5C1A]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-[#2E211A] font-medium flex items-center justify-center gap-1.5 animate-pulse font-serif-th">
              <span className="w-2 h-2 rounded-full bg-[#8F5C1A]" />
              {shufflePhase === "split" && "กำลังแบ่งสำรับไพ่..."}
              {shufflePhase === "riffle" && `กำลังสับไพ่ทั้ง 78 ใบ (${progress}%)`}
              {shufflePhase === "bridge" && "กำลังรวมสำรับไพ่เข้าด้วยกัน..."}
              {shufflePhase === "gather" && "สับไพ่เรียบร้อย กำลังคลี่ไพ่ให้คุณเลือก..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
