"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/data/cards/types";

export interface QuickTopic {
  id: "love" | "work" | "money" | "general";
  category: Category;
  title: string;
  tagline: string;
  defaultQuestion: string;
  badge: string;
  highlightText: string;
}

export const QUICK_TOPICS: QuickTopic[] = [
  {
    id: "love",
    category: "love",
    title: "ความรัก & ความสัมพันธ์",
    tagline: "เช็กความรู้สึก แนวโน้มหัวใจ คนคุย แฟน หรือคนโสด",
    defaultQuestion: "ภาพรวมความรักและความสัมพันธ์ตอนนี้เป็นอย่างไร และควรเปิดใจรับมืออย่างไร",
    badge: "✦ ยอดนิยมอันดับ 1",
    highlightText: "เปิดไพ่ดูดวงความรัก",
  },
  {
    id: "work",
    category: "work",
    title: "การงาน & โอกาสใหม่",
    tagline: "เจาะลึกทิศทางงาน การสอบ เลื่อนตำแหน่ง และอุปสรรค",
    defaultQuestion: "ทิศทางการงานและโปรเจกต์ช่วงนี้จะราบรื่นไหม มีสิ่งใดที่ควรระวังเป็นพิเศษ",
    badge: "✦ ยอดนิยม",
    highlightText: "เปิดไพ่ดูดวงการงาน",
  },
  {
    id: "money",
    category: "money",
    title: "การเงิน & โชคลาภ",
    tagline: "ประเมินกระแสเงินสด ความคล่องตัว และจังหวะลงทุน",
    defaultQuestion: "สภาพคล่องทางการเงินและโชคลาภช่วงนี้เป็นอย่างไร ควรบริหารจัดการอย่างไร",
    badge: "✦ เด่นชัด",
    highlightText: "เปิดไพ่ดูดวงการเงิน",
  },
  {
    id: "general",
    category: "general",
    title: "ภาพรวมดวงชะตา & พลังงานวันนี้",
    tagline: "สิ่งที่จักรวาลอยากบอก ข้อคิดนำทางชีวิตประจำวัน",
    defaultQuestion: "ภาพรวมพลังงานดวงชะตาตอนนี้เป็นอย่างไร มีข้อคิดหรือคำเตือนใดที่ควรใส่ใจ",
    badge: "✦ สมดุล",
    highlightText: "เปิดไพ่รับพลังงานวันนี้",
  },
];

const NICKNAME_STORAGE_KEY = "seertarot_nickname";

export interface QuickFortunePickerProps {
  currentNickname: string;
  onSelectTopic: (topic: QuickTopic, nickname: string) => void;
  onSwitchToFullSpreads: () => void;
  isLoading?: boolean;
}

export function QuickFortunePicker({
  currentNickname,
  onSelectTopic,
  onSwitchToFullSpreads,
  isLoading = false,
}: QuickFortunePickerProps) {
  const [selectedPendingTopic, setSelectedPendingTopic] = useState<QuickTopic | null>(null);
  const [inputNickname, setInputNickname] = useState("");
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // ดึงชื่อเล่นจาก localStorage หรือ prop เมื่อโหลดครั้งแรก
  useEffect(() => {
    if (currentNickname) {
      setInputNickname(currentNickname);
      return;
    }
    try {
      const saved = localStorage.getItem(NICKNAME_STORAGE_KEY);
      if (saved && saved.trim()) {
        setInputNickname(saved.trim());
      }
    } catch {
      // ignore storage errors
    }
  }, [currentNickname]);

  const handleCardClick = (topic: QuickTopic) => {
    if (isLoading) return;

    // ตรวจสอบชื่อเล่นที่เคยจำไว้
    let effectiveNickname = inputNickname.trim();
    if (!effectiveNickname) {
      try {
        const saved = localStorage.getItem(NICKNAME_STORAGE_KEY);
        if (saved && saved.trim()) {
          effectiveNickname = saved.trim();
          setInputNickname(effectiveNickname);
        }
      } catch {
        // ignore
      }
    }

    // ถ้ามีชื่อเล่นอยู่แล้ว เข้าสู่การทำนายทันทีในคลิกเดียว
    if (effectiveNickname) {
      onSelectTopic(topic, effectiveNickname);
      return;
    }

    // ถ้ายังไม่มีชื่อเล่น แสดงกล่องถามชื่อเล่นแบบรวดเร็ว
    setSelectedPendingTopic(topic);
    setShowNicknameModal(true);
    setNicknameError(null);
  };

  const handleConfirmNickname = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputNickname.trim();
    if (!trimmed) {
      setNicknameError("กรุณาระบุชื่อเล่นเพื่อเริ่มทำนาย");
      return;
    }

    try {
      localStorage.setItem(NICKNAME_STORAGE_KEY, trimmed);
    } catch {
      // ignore
    }

    setShowNicknameModal(false);
    if (selectedPendingTopic) {
      onSelectTopic(selectedPendingTopic, trimmed);
      setSelectedPendingTopic(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ส่วนหัวแนะนำการทำนายด่วน */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-[#F7F4EE] border border-[#D5CEC2] text-[#8F5C1A]">
          <span>✨</span>
          <span>ทำนายด่วน ไพ่ 1 ใบ สรุปตรงประเด็น</span>
          <span>✨</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-[#29261F] tracking-wide leading-snug [text-wrap:balance]">
          เลือกเรื่องที่คุณอยากรู้มากที่สุดในตอนนี้
        </h1>
        <p className="text-xs sm:text-sm text-[#635B4E] max-w-xl mx-auto font-serif-th leading-relaxed [text-wrap:balance]">
          แตะเลือก 1 หัวข้อเพื่อเปิดไพ่ทาโรต์ 1909 ทันที พร้อมระบบสลับไพ่โปร่งใสตรวจสอบได้ Provably-Fair SHA-256
        </p>
      </div>

      {/* กริด 4 หัวข้อยอดนิยม (2x2 บน desktop, 1 คอลัมน์บน mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {QUICK_TOPICS.map((topic) => (
          <div
            key={topic.id}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(topic)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick(topic);
              }
            }}
            className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] hover:border-[#A58A5C] hover:bg-[#FAF7F2] shadow-[var(--shadow-raised)] hover:shadow-[var(--shadow-overlay)] transition-all duration-300 cursor-pointer select-none text-left overflow-hidden"
          >
            {/* ป้ายกำกับด้านบน */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-serif-th font-medium px-2.5 py-0.5 rounded-md bg-[#F3EFE6] text-[#8F5C1A] border border-[#D5CEC2]/60">
                {topic.badge}
              </span>
              <span className="text-xs text-[#A58A5C] opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 font-serif-th">
                ไพ่ 1 ใบ ✦
              </span>
            </div>

            {/* ชื่อหัวข้อและคำอธิบาย */}
            <div className="space-y-1.5 mb-5">
              <h2 className="text-lg sm:text-xl font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors duration-200">
                {topic.title}
              </h2>
              <p className="text-xs sm:text-sm font-serif-th text-[#635B4E] leading-relaxed">
                {topic.tagline}
              </p>
            </div>

            {/* แถบการกระทำด้านล่าง */}
            <div className="pt-3 border-t border-[#D5CEC2]/40 flex items-center justify-between text-xs font-serif-th font-medium text-[#29261F] group-hover:text-[#8F5C1A]">
              <span>{topic.highlightText}</span>
              <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200 text-[#A58A5C]">
                เริ่มทำนาย ➔
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ทางเลือกรอง: สลับไปยังผังเต็ม 20 แบบ */}
      <div className="pt-4 text-center">
        <button
          type="button"
          onClick={onSwitchToFullSpreads}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D5CEC2] bg-[#F7F4EE] hover:bg-[#EFE9DF] text-[#4A3828] text-xs sm:text-sm font-serif-th font-medium transition-all duration-200 shadow-xs hover:border-[#A58A5C]"
        >
          <span>✦ หรือต้องการพิมพ์คำถามเอง &amp; เลือกผังพยากรณ์แบบเต็ม (20 ผัง)</span>
          <span className="text-[#A58A5C]">➔</span>
        </button>
      </div>

      {/* โมดัลถามชื่อเล่นครั้งแรก (Fast & Compact Popover) */}
      {showNicknameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171512]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 shadow-[var(--shadow-overlay)] space-y-4 text-left">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F]">
                  ✦ นามสมมุติของคุณ
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowNicknameModal(false);
                    setSelectedPendingTopic(null);
                  }}
                  className="text-xs text-[#635B4E] hover:text-[#29261F] p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed">
                ขอทราบชื่อเล่นเพื่อเชื่อมจิตกับไพ่ (ระบบจะจำไว้ ไม่ต้องกรอกซ้ำในครั้งถัดไป)
              </p>
            </div>

            <form onSubmit={handleConfirmNickname} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  value={inputNickname}
                  onChange={(e) => {
                    setInputNickname(e.target.value);
                    if (nicknameError) setNicknameError(null);
                  }}
                  placeholder="เช่น บี, น้ำ, เจมส์, วิน..."
                  maxLength={40}
                  className="w-full px-3.5 py-2.5 text-sm font-serif-th rounded-xl border border-[#D5CEC2] focus:border-[#A58A5C] focus:outline-none focus:ring-1 focus:ring-[#A58A5C] bg-[#FAF7F2] text-[#29261F]"
                />
                {nicknameError && (
                  <p className="text-[11px] font-serif-th text-[#A6392C] mt-1.5">
                    {nicknameError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowNicknameModal(false);
                    setSelectedPendingTopic(null);
                  }}
                  className="px-3.5 py-2 text-xs font-serif-th text-[#635B4E] hover:text-[#29261F] transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !inputNickname.trim()}
                  className="px-4 py-2 text-xs font-serif-th font-semibold rounded-xl bg-[#29261F] text-[#FAF7F2] hover:bg-[#3D372E] disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>เริ่มทำนายทันที</span>
                  <span>✨</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
