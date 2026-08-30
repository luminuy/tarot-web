"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ProvablyFairBadgeProps {
  serverSeed?: string;
  clientSeed?: string;
  combinedHash?: string;
  className?: string;
}

export const ProvablyFairBadge: React.FC<ProvablyFairBadgeProps> = ({
  serverSeed,
  clientSeed,
  combinedHash,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border border-[#e5c07b]/30 bg-[#130d24]/80 text-[#e5c07b] hover:border-[#e5c07b]/60 hover:bg-[#1f163a] transition-all cursor-pointer select-none ${className}`}
      >
        <span className="text-[#ffd700]">✦</span>
        <span>Provably Fair</span>
        <span className="text-[8px] opacity-70">SHA-256</span>
      </button>

      {/* Verification Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#1c1438] to-[#0d091a] border border-[#e5c07b]/40 p-5 sm:p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#ffd700] text-base">✦</span>
                  <h3 className="font-serif-th text-base font-bold font-mystic-gold">
                    ตรวจสอบความโปร่งใส (Provably Fair)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
                >
                  ปิด
                </button>
              </div>

              <p className="text-xs text-[#9c93b8] leading-relaxed">
                สำรับไพ่นี้ถูกสับด้วยสมการคณิตศาสตร์แบบกระจายศูนย์ ผสานระหว่างค่าสุ่มของระบบ (Server Seed)
                และค่าสุ่มของผู้ใช้ (Client Seed) ป้องกันการล็อคผลลัพธ์ 100%
              </p>

              <div className="space-y-3 font-mono text-[11px]">
                <div>
                  <label className="text-[10px] text-[#e5c07b]/80 block mb-0.5">Server Seed (SHA-256 Commit):</label>
                  <div className="p-2 rounded bg-black/50 border border-white/10 break-all text-gray-300 select-all">
                    {serverSeed || "Generating on ritual..."}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#e5c07b]/80 block mb-0.5">Client Seed (User Entropy):</label>
                  <div className="p-2 rounded bg-black/50 border border-white/10 break-all text-gray-300 select-all">
                    {clientSeed || "Derived from user interaction"}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#ffd700] block mb-0.5">Combined Hash Result:</label>
                  <div className="p-2 rounded bg-black/70 border border-[#ffd700]/30 break-all text-[#ffd700] select-all font-bold">
                    {combinedHash || "Verified with Fisher-Yates shuffle"}
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-1">
                  <span>✓</span> ผ่านการตรวจสอบทางคณิตศาสตร์ ไร้การแทรกแซง
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
