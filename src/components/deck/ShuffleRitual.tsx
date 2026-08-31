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

export const ShuffleRitual: React.FC<ShuffleRitualProps> = ({
  commitment,
  spreadName,
  onShuffleComplete,
}) => {
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
      {/* Background Sacred Geometric Aura */}
      <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-35 pointer-events-none">
        <div className="w-80 h-80 sm:w-[450px] sm:h-[450px] rounded-full border border-dashed border-[#e5c07b] animate-[spin_60s_linear_infinite]" />
        <div className="absolute w-56 h-56 sm:w-[320px] sm:h-[320px] rounded-full border border-[#8b5cf6]/60 animate-[spin_40s_linear_infinite_reverse]" />
        <div className="absolute w-full h-full bg-radial from-[#e5c07b]/15 via-transparent to-transparent blur-3xl" />
      </div>

      {/* 3D Physical Riffle & Cascade Deck Stage */}
      <div className="h-64 sm:h-72 w-full flex items-center justify-center relative my-4" style={{ perspective: 1400 }}>
        {!shuffling ? (
          /* Idle Floating Deck — ลอยด้วย CSS (anim-tarot-idle) ไม่ใช่ Framer loop
             เพราะ animate loop แบบ repeat:Infinity ทำให้ AnimatePresence mode="wait"
             ของผังขั้นตอนค้าง เวลาผู้ใช้กด "ย้อนกลับ" ออกจากขั้นสับไพ่ */
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={startShuffle}
            aria-label="แตะเพื่อเริ่มสับไพ่"
            className="anim-tarot-idle w-36 h-54 sm:w-44 sm:h-64 rounded-2xl border-2 border-[#e5c07b] card-back-pattern shadow-[0_0_50px_rgba(229,192,123,0.45)] flex flex-col items-center justify-between p-4 cursor-pointer overflow-hidden group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05040a]"
          >
            <div className="w-full flex justify-center items-center opacity-75">
              <span className="text-[9px] font-serif-th text-[#f5deaa] tracking-[0.2em] uppercase font-bold">
                SACRED ORACLE
              </span>
            </div>

            {/* Clean Center */}
            <div className="my-auto" />

            <span className="text-xs font-serif-th font-bold font-mystic-gold tracking-wide">
              สัมผัสเพื่อสับไพ่
            </span>

            {/* Dynamic Gold Sheen */}
            <div className="gold-foil-sheen absolute inset-0 opacity-40 group-hover:opacity-75 transition-opacity" />
          </motion.button>
        ) : (
          /* Multi-Layer Physical 3D Riffle Shuffle Animation */
          <div className="relative w-72 h-64 flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
            {/* Left Deck Stack */}
            <motion.div
              animate={{
                x: shufflePhase === "split" ? -60 : shufflePhase === "riffle" ? [-60, -10, -60] : shufflePhase === "bridge" ? -15 : 0,
                y: shufflePhase === "bridge" ? -25 : 0,
                rotateZ: shufflePhase === "split" ? -16 : shufflePhase === "riffle" ? [-16, -4, -16] : shufflePhase === "bridge" ? -8 : 0,
                rotateY: shufflePhase === "split" ? 25 : 0,
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-32 h-48 sm:w-36 sm:h-54 rounded-2xl border-2 border-[#e5c07b]/80 card-back-pattern absolute shadow-[0_0_30px_rgba(229,192,123,0.4)] flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-full border border-[#e5c07b] flex items-center justify-center text-xs">✨</div>
            </motion.div>

            {/* Right Deck Stack */}
            <motion.div
              animate={{
                x: shufflePhase === "split" ? 60 : shufflePhase === "riffle" ? [60, 10, 60] : shufflePhase === "bridge" ? 15 : 0,
                y: shufflePhase === "bridge" ? -25 : 0,
                rotateZ: shufflePhase === "split" ? 16 : shufflePhase === "riffle" ? [16, 4, 16] : shufflePhase === "bridge" ? 8 : 0,
                rotateY: shufflePhase === "split" ? -25 : 0,
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-32 h-48 sm:w-36 sm:h-54 rounded-2xl border-2 border-[#e5c07b]/80 card-back-pattern absolute shadow-[0_0_30px_rgba(229,192,123,0.4)] flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-full border border-[#e5c07b] flex items-center justify-center text-xs">✨</div>
            </motion.div>

            {/* Center Weaving Cascade Cards — non-looping finite riffle */}
            {shufflePhase === "riffle" && (
              <>
                <motion.div
                  initial={{ y: 0, rotateZ: 0, scale: 1, opacity: 0 }}
                  animate={{ y: [-14, 10, -8, 6, -4, 2, 0], rotateZ: [-5, 5, -3, 3, -1, 1, 0], scale: [0.95, 1.04, 0.97, 1.02, 0.99, 1.01, 1], opacity: 1 }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                  className="w-30 h-44 rounded-2xl border border-[#f5deaa] card-back-pattern absolute z-20 shadow-2xl opacity-90"
                />
                <motion.div
                  initial={{ y: 0, rotateZ: 0, scale: 1, opacity: 0 }}
                  animate={{ y: [10, -14, 6, -8, 2, -4, 0], rotateZ: [5, -5, 3, -3, 1, -1, 0], scale: [1.02, 0.96, 1.01, 0.98, 1, 0.99, 1], opacity: 1 }}
                  transition={{ duration: 1.4, ease: "easeInOut", delay: 0.05 }}
                  className="w-30 h-44 rounded-2xl border border-[#c59b27] card-back-pattern absolute z-20 shadow-2xl opacity-80"
                />
              </>
            )}

            {/* Bridge Arch Glow Effect */}
            {shufflePhase === "bridge" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.15 }}
                className="absolute w-44 h-44 rounded-full bg-radial from-[#e5c07b]/40 via-[#8b5cf6]/20 to-transparent blur-xl pointer-events-none z-30"
              />
            )}
          </div>
        )}
      </div>

      {/* Sacred Ritual Subtitle & Title */}
      <span className="text-[11px] font-serif-th text-[#e5c07b] font-bold bg-[#e5c07b]/10 px-4 py-1 rounded-full border border-[#e5c07b]/30 mb-2 inline-block shadow">
        ✦ ขั้นตอนสับไพ่ ✦
      </span>
      <h2 className="text-2xl sm:text-3xl font-serif-th font-bold font-mystic-gold filter drop-shadow py-0.5 leading-normal">
        ตั้งสมาธิและนึกถึงคำถามของคุณ
      </h2>
      <p className="text-xs sm:text-sm text-[#9c93b8] mt-1 max-w-md leading-relaxed">
        ทำใจให้สบาย แล้วนึกถึงเรื่องที่อยากรู้สำหรับผัง <span className="text-[#f5deaa] font-semibold">"{spreadName}"</span>
      </p>

      {/* Progress or Start Button */}
      <div className="w-full max-w-xs mt-6">
        {!shuffling ? (
          <button
            type="button"
            onClick={startShuffle}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] font-bold font-serif-th shadow-[0_0_25px_rgba(229,192,123,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>✨</span>
            <span>แตะเพื่อเริ่มสับไพ่</span>
            <span>✨</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="w-full h-2.5 bg-[#07050d] rounded-full overflow-hidden border border-[#e5c07b]/40 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#8b5cf6]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-[#f5deaa] font-medium flex items-center justify-center gap-1.5 animate-pulse font-serif-th">
              <span className="w-2 h-2 rounded-full bg-[#e5c07b]" />
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
