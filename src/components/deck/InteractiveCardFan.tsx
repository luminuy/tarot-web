"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundManager } from "@/lib/utils/audio";

interface InteractiveCardFanProps {
  totalCards?: number;
  pickedIndices: number[];
  targetCount: number;
  currentPositionName?: string;
  onPickCard: (fanIndex: number) => void;
  disabled?: boolean;
}

const TOTAL_CARDS = 78;

export const InteractiveCardFan: React.FC<InteractiveCardFanProps> = ({
  totalCards = TOTAL_CARDS,
  pickedIndices,
  targetCount,
  currentPositionName = "ตำแหน่งถัดไป",
  onPickCard,
  disabled = false,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const isComplete = pickedIndices.length >= targetCount;

  // Split 78 cards into 3 organic overlapping rows across the entire altar
  // Row 1: 26 cards, Row 2: 26 cards (offset), Row 3: 26 cards
  const rows = useMemo(() => {
    const r1: number[] = [];
    const r2: number[] = [];
    const r3: number[] = [];
    for (let i = 0; i < totalCards; i++) {
      if (i < 26) r1.push(i);
      else if (i < 52) r2.push(i);
      else r3.push(i);
    }
    return [r1, r2, r3];
  }, [totalCards]);

  const handleCardClick = (idx: number) => {
    if (disabled || isComplete || pickedIndices.includes(idx)) return;
    soundManager.playCardSelectSound();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    onPickCard(idx);
  };

  return (
    <div className="w-full flex flex-col items-center select-none space-y-6">
      {/* Top Sacred Guidance & Target Slot Focus */}
      <div className="text-center space-y-2 relative z-10 px-4">
        {!isComplete ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-2 bg-[#140d28]/95 border border-[#e5c07b]/40 px-5 py-2 rounded-full shadow-[0_0_30px_rgba(229,192,123,0.35)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e5c07b] animate-ping" />
              <span className="text-xs sm:text-sm font-serif-th font-bold text-[#f5deaa]">
                จับไพ่ใบที่ {pickedIndices.length + 1} จาก {targetCount} ใบ
              </span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-serif-th font-bold font-mystic-gold tracking-wide filter drop-shadow leading-relaxed py-1 px-2">
              สัมผัสพลังงานจิต เลือกไพ่สำหรับ <span className="text-[#f5deaa]">"{currentPositionName}"</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto leading-relaxed">
              ไพ่ 78 ใบถูกกระจายแผ่เต็มวิหารศักดิ์สิทธิ์ หลับตา... ตั้งสมาธิ แล้วแตะเลือกไพ่ใบที่ดึงดูดใจคุณที่สุด
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-1"
          >
            <h3 className="text-xl sm:text-3xl font-serif-th font-bold font-mystic-gold flex items-center justify-center gap-2">
              <span>✨</span> เลือกไพ่ครบ {targetCount} ใบเรียบร้อยแล้ว <span>✨</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#9c93b8]">กำลังเปิดม่านเชื่อมต่อคลื่นพลังงานเข้าสู่วิหารคำทำนาย...</p>
          </motion.div>
        )}
      </div>

      {/* Full-Screen Organic Altar Cloth Spread (โต๊ะแผ่กระจายไพ่ 78 ใบเต็มหน้า) */}
      <div className="w-full relative rounded-3xl border border-[#e5c07b]/35 bg-gradient-to-b from-[#140d28]/95 via-[#0a0714]/95 to-[#05040a]/95 backdrop-blur-2xl p-4 sm:p-8 shadow-[0_0_70px_rgba(0,0,0,0.95)] overflow-hidden space-y-6">
        {/* Background Sacred Geometric Mandala */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
          <div className="w-[700px] h-[700px] rounded-full border border-dashed border-[#e5c07b] animate-[spin_160s_linear_infinite]" />
          <div className="absolute w-[500px] h-[500px] rounded-full border border-[#8b5cf6]/40 animate-[spin_100s_linear_infinite_reverse]" />
          <div className="absolute w-full h-full bg-radial from-[#e5c07b]/15 via-transparent to-transparent blur-3xl" />
        </div>

        {/*
          3 Organic Overlapping Spread Tiers Covering Full Screen

          **สาเหตุของ "ไพ่แถวบนโดนตัดหัว" (วัดค่าจริงแล้ว ไม่ใช่เดา)**:
          ไม่ได้เกิดจาก overflow แนวนอนอย่างที่เดากันตอนแรก — วัดจริงได้ว่าแถวกว้าง
          804px อยู่ในกรอบ 1031px คือไม่ล้นด้วยซ้ำ ตัวการจริงคือกรอบ altar ชั้นนอกสุด
          ที่มี overflow-hidden (จำเป็นสำหรับมุมโค้งและ mandala พื้นหลัง) พอ hover
          การ์ดจะยกขึ้น -40px และขยาย 1.28 เท่า ขอบบนจึงพ้นตำแหน่งเดิมขึ้นไปราว 58px
          ถ้าที่ว่างด้านบนไม่พอ การ์ด "แถวบนสุด" จะทะลุกรอบแล้วโดนเฉือนหัวทันที

          จึงแก้ด้วยการเผื่อที่ว่างด้านบนให้พอ (pt-20) แทนการลดขนาด hover ลง —
          เพราะเอฟเฟกต์ยกไพ่ใหญ่ ๆ คือหัวใจของความรู้สึกตอนจับไพ่ ไม่ควรลดทอน

          เคยลองแล้วไม่เวิร์ก อย่าวนกลับไปทำซ้ำ:
          - mask-image ไล่จางที่ขอบ: ในเมื่อไม่มี overflow จริง มันมีแต่ทำให้การ์ด
            ริมซ้ายจางหายโดยไม่จำเป็น
          - ย่อ hover ลงแล้วโชว์พรีวิวใบใหญ่ตรงกลางแทน: ผู้ใช้ไม่ชอบ อยากได้
            เอฟเฟกต์ยกไพ่ในตำแหน่งเดิมแบบเดิม

          หมายเหตุ overflow-x-auto: วางไว้ที่ wrapper ของ "แต่ละแถว" แยกกัน ไม่ใช่
          คอนเทนเนอร์รวม เพื่อให้แต่ละแถวเลื่อนอิสระเมื่อจอแคบจนไพ่ล้นจริง และห้าม
          ใส่ overflow-x-auto กับ w-max/min-w-max ไว้ใน element เดียวกันเด็ดขาด —
          กล่องจะขยายพอดีเนื้อหาเสมอจน scrollWidth เท่ากับ clientWidth (สกรอลไม่ได้จริง)
          ต้องแยกสองชั้น: ชั้นนอกความกว้างจำกัด + ชั้นในกว้างได้ไม่จำกัด (w-max)
        */}
        {/*
          pt เยอะกว่า pb เจตนา ไม่ใช่พลาด: การ์ดตอน hover ยกขึ้น -40px และขยาย 1.28 เท่า
          (ขอบบนจึงพ้นตำแหน่งเดิมขึ้นไปราว 58px) ถ้าเผื่อที่ด้านบนไม่พอ การ์ดของ
          "แถวบนสุด" จะพองทะลุ overflow-hidden ของกรอบ altar แล้วโดนเฉือนหัวทันที
          — แถว 2-3 ไม่มีปัญหานี้เพราะมีแถวข้างบนเป็นที่ว่างรองรับอยู่แล้ว
        */}
        <div className="w-full flex flex-col gap-2 sm:gap-3 pt-20 pb-6 relative z-10">
          {rows.map((rowCards, rowIdx) => {
            const rowOffset = rowIdx === 1 ? "sm:pl-6" : rowIdx === 2 ? "sm:pl-12" : "";

            return (
              <div key={rowIdx} className="w-full overflow-x-auto no-scrollbar">
              <div
                className={`flex items-center justify-start -space-x-4 sm:-space-x-6 md:-space-x-7 w-max py-3 px-6 ${rowOffset}`}
              >
                {rowCards.map((cardIdx) => {
                  const isPicked = pickedIndices.includes(cardIdx);
                  const isHovered = hoveredIdx === cardIdx;
                  const naturalRotation = ((cardIdx % 7) - 3) * 1.5;

                  return (
                    <AnimatePresence key={cardIdx}>
                      {!isPicked ? (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{
                            opacity: 1,
                            y: isHovered ? -35 : 0,
                            scale: isHovered ? 1.25 : 1,
                            rotate: isHovered ? 0 : naturalRotation,
                          }}
                          exit={{
                            opacity: 0,
                            y: -200,
                            scale: 0.3,
                            rotate: 360,
                            transition: { duration: 0.5, ease: "easeInOut" },
                          }}
                          whileHover={{ y: -40, scale: 1.28 }}
                          whileTap={{ scale: 0.92 }}
                          onPointerEnter={() => !disabled && setHoveredIdx(cardIdx)}
                          onPointerLeave={() => setHoveredIdx(null)}
                          onClick={() => handleCardClick(cardIdx)}
                          className="cursor-pointer relative flex-shrink-0 select-none transition-shadow duration-300"
                          style={{
                            width: "56px",
                            zIndex: isHovered ? 100 : rowIdx * 30 + (cardIdx % 26),
                          }}
                        >
                          {/* Authentic Gold Tarot Back Tablet */}
                          <div
                            className={`w-[56px] h-[96px] sm:w-[68px] sm:h-[116px] md:w-[74px] md:h-[126px] rounded-2xl border-2 card-back-pattern shadow-2xl flex flex-col items-center justify-between p-1.5 sm:p-2 relative overflow-hidden transition-all duration-300 ${
                              isHovered
                                ? "border-[#ffd700] ring-4 ring-[#e5c07b]/90 shadow-[0_0_40px_rgba(229,192,123,0.95),0_0_70px_rgba(139,92,246,0.6)] bg-[#251842]"
                                : "border-[#e5c07b]/40 shadow-[0_10px_25px_rgba(0,0,0,0.85)] bg-[#0d0918]"
                            }`}
                          >
                            <div className="w-full flex items-center justify-end text-[7px] sm:text-[8px] text-[#e5c07b]/80">
                              <span className="font-mono opacity-50">#{cardIdx + 1}</span>
                            </div>

                            {/* Gold Foil Reflection */}
                            <div className="gold-foil-sheen absolute inset-0 opacity-30 hover:opacity-70 transition-opacity" />
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  );
                })}
              </div>
              </div>
            );
          })}
        </div>

        {/* Selected Cards Progress Dock */}
        <div className="pt-4 border-t border-[#e5c07b]/15 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-serif-th font-semibold text-[#f5deaa]">
            <div className="w-8 h-12 rounded-md border border-[#e5c07b] overflow-hidden shadow-[0_0_12px_rgba(229,192,123,0.35)] bg-[#07050d] relative flex-shrink-0">
              <img
                src="/cards/major-01.jpg"
                alt="Tarot Picking Emblem"
                className="w-full h-full object-cover object-top filter contrast-[1.04]"
              />
              <div className="gold-foil-sheen absolute inset-0 opacity-30" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#e5c07b] font-mono block">
                ความคืบหน้าการจับไพ่
              </span>
              <span className="font-bold text-[#f5deaa]">
                เลือกแล้ว {pickedIndices.length} จากทั้งหมด {targetCount} ใบ
              </span>
            </div>
          </div>

          {/* Target Position Badges */}
          <div className="flex items-center gap-1.5 max-w-full overflow-x-auto pb-1 no-scrollbar">
            {Array.from({ length: targetCount }).map((_, idx) => {
              const isFilled = idx < pickedIndices.length;
              const isCurrent = idx === pickedIndices.length;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all duration-300 font-serif-th whitespace-nowrap ${
                    isFilled
                      ? "bg-[#e5c07b] text-[#05040a] font-bold shadow-[0_0_12px_rgba(229,192,123,0.5)]"
                      : isCurrent
                      ? "bg-[#251842] border-2 border-[#e5c07b] text-[#f5deaa] animate-pulse ring-2 ring-[#e5c07b]/50 font-bold"
                      : "bg-[#090614] border border-[#e5c07b]/20 text-[#9c93b8]/40"
                  }`}
                >
                  <span className="font-mono text-[11px]">{isFilled ? "✓" : idx + 1}</span>
                  <span className="text-[11px]">ใบที่ {idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
