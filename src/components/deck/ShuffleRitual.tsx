"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundManager } from "@/lib/utils/audio";

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
  const [entropyList, setEntropyList] = useState<number[]>([]);

  // Collect entropy from user's micro-gestures
  const handlePointerMove = (e: React.PointerEvent) => {
    if (shuffling && entropyList.length < 50) {
      setEntropyList((prev) => [...prev, e.clientX + e.clientY + Date.now()]);
    }
  };

  const startShuffle = () => {
    soundManager.playShuffleSound();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([30, 40, 30, 50, 40]);
    }
    setShuffling(true);
    setShufflePhase("split");

    let cur = 0;
    const interval = setInterval(() => {
      cur += 2;
      setProgress(cur);

      if (cur === 20) setShufflePhase("riffle");
      if (cur === 65) setShufflePhase("bridge");
      if (cur === 85) setShufflePhase("gather");

      if (cur >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const rawSeed = entropyList.join(":") + ":" + Date.now();
          onShuffleComplete(rawSeed);
        }, 500);
      }
    }, 45);
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
          /* Idle Floating Deck with Parallax Hover */
          <motion.div
            animate={{
              y: [-6, 6, -6],
              rotateZ: [-1.2, 1.2, -1.2],
            }}
            transition={{
              repeat: Infinity,
              duration: 4.5,
              ease: "easeInOut",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={startShuffle}
            className="w-36 h-54 sm:w-44 sm:h-64 rounded-2xl border-2 border-[#e5c07b] card-back-pattern shadow-[0_0_50px_rgba(229,192,123,0.45)] flex flex-col items-center justify-between p-4 cursor-pointer overflow-hidden group relative"
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
          </motion.div>
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

            {/* Center Weaving Cascade Cards */}
            {shufflePhase === "riffle" && (
              <>
                <motion.div
                  animate={{ y: [-15, 10, -15], rotateZ: [-6, 6, -6], scale: [0.95, 1.05, 0.95] }}
                  transition={{ repeat: Infinity, duration: 0.25 }}
                  className="w-30 h-44 rounded-2xl border border-[#f5deaa] card-back-pattern absolute z-20 shadow-2xl opacity-90"
                />
                <motion.div
                  animate={{ y: [10, -15, 10], rotateZ: [6, -6, 6], scale: [1.02, 0.96, 1.02] }}
                  transition={{ repeat: Infinity, duration: 0.28 }}
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
      <span className="text-[11px] uppercase tracking-widest text-[#e5c07b] font-bold bg-[#e5c07b]/10 px-4 py-1 rounded-full border border-[#e5c07b]/30 mb-2 inline-block shadow">
        SACRED SHUFFLE CEREMONY
      </span>
      <h2 className="text-2xl sm:text-3xl font-serif-th font-bold font-mystic-gold filter drop-shadow py-0.5 leading-normal">
        ตั้งจิตอธิษฐานถึงคำถามของคุณ
      </h2>
      <p className="text-xs sm:text-sm text-[#9c93b8] mt-1 max-w-md leading-relaxed">
        สูดหายใจเข้าลึกๆ นึกถึงเรื่องที่อยากรู้สำหรับผัง <span className="text-[#f5deaa] font-semibold">"{spreadName}"</span>
      </p>

      {/* Progress or Start Button */}
      <div className="w-full max-w-xs mt-6">
        {!shuffling ? (
          <button
            type="button"
            onClick={startShuffle}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] font-bold font-serif-th shadow-[0_0_30px_rgba(229,192,123,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>✨</span>
            <span>เริ่มสับไพ่ด้วยพลังจิตของคุณ</span>
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
              {shufflePhase === "split" && "กำลังแยกสำรับและเปิดรับคลื่นพลังจิต..."}
              {shufflePhase === "riffle" && `กำลังสับสลับไพ่ 78 ใบอย่างโปร่งใส (${progress}%)`}
              {shufflePhase === "bridge" && "กำลังดัดสะพานรวมคลื่นพลังงาน..."}
              {shufflePhase === "gather" && "สำรับพร้อมแล้ว กำลังแผ่ไพ่สู่โต๊ะทำนาย..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
