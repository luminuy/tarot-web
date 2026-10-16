"use client";

import React, { useEffect, useRef } from "react";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";

interface ShuffleRitualProps {
  /** คงไว้ให้ผู้เรียกเดิม — รหัสล็อกลำดับไพ่ย้ายไปแสดงที่ `SealChip` ของหน้าขั้นตอน */
  commitment?: string;
  spreadName: string;
  onShuffleComplete: (clientSeed: string) => void;
}

/** เวลาสับทั้งหมด — สั้นพอไม่ให้รอ ยาวพอให้เห็นว่าไพ่ถูกสับจริง */
const SHUFFLE_MS = 1700;
const SHUFFLE_MS_REDUCED = 500;

/**
 * 🃏 สับไพ่อัตโนมัติ (v2 · เจ้าของ 2026-10-16 "ลดขั้นตอน ทำให้ใช้ง่ายกว่านี้")
 * ---------------------------------------------------------------------------
 * v1 ให้ผู้ใช้ "แตะเพื่อสับ" เป็นอีกหน้าหนึ่ง แล้วรอ 2.2 วินาที — เป็นขั้นที่ไม่ได้ตัดสินใจอะไรเลย
 * v2 สับเองทันทีที่เข้าขั้นเลือกไพ่ (บนโต๊ะเดียวกับพัดไพ่) แล้วกางพัดให้เลือกต่อ
 *
 * ℹ️ ความโปร่งใสไม่ลดลง — ผลไพ่มาจาก serverSeed (ผูกมัดด้วย commitment ก่อน) + เมล็ดของผู้ใช้
 *    ที่สร้างด้วย crypto ตั้งแต่ /start (`createClientSeed` ใน TarotFlow) เซิร์ฟเวอร์ใช้เมล็ดตัวนั้นเป็นหลัก
 *    ค่าที่ส่งจากตรงนี้เป็นแค่ทางสำรอง จึงผสม crypto + การขยับเมาส์/นิ้วไว้ด้วยกันเสมอ
 */
export const ShuffleRitual: React.FC<ShuffleRitualProps> = ({ spreadName, onShuffleComplete }) => {
  const { isEnglish } = useLocale();
  const entropyRef = useRef<number[]>([]);
  const doneRef = useRef(onShuffleComplete);
  doneRef.current = onShuffleComplete;

  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    try {
      soundManager.playShuffleSound();
    } catch {
      /* เสียงไม่สำคัญต่อพิธี */
    }
    const timer = window.setTimeout(() => {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const rand = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      doneRef.current(`${rand}:${entropyRef.current.join(":")}:${Date.now()}`);
    }, reduced ? SHUFFLE_MS_REDUCED : SHUFFLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="v2-sh"
      onPointerMove={(e) => {
        if (entropyRef.current.length < 50) entropyRef.current.push(e.clientX + e.clientY + Date.now());
      }}
    >
      <div className="v2-sh-deck" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="v2-sh-card card-back-pattern" style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <p className="v2-sh-t" role="status">
        {isEnglish ? `Shuffling all 78 cards for "${spreadName}"` : `กำลังสับไพ่ทั้ง 78 ใบ สำหรับผัง "${spreadName}"`}
      </p>
      <p className="v2-sh-s">{isEnglish ? "Hold your question in mind" : "นึกถึงคำถามของคุณไว้ในใจ"}</p>
      <span className="v2-sh-bar" aria-hidden="true">
        <span />
      </span>
    </div>
  );
};
