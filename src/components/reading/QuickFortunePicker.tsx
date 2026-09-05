"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/data/cards/types";
import { CardImage } from "@/components/card/CardImage";

export interface QuickTopic {
  id: "love" | "work" | "money" | "general";
  category: Category;
  title: string;
  tagline: string;
  defaultQuestion: string;
  badge: string;
  highlightText: string;
  cardImage: string;
  cardAlt: string;
  elementalGlyph: string;
  themeColors: {
    border: string;
    borderHover: string;
    bgGradient: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    accentText: string;
    cardBorder: string;
    glow: string;
  };
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
    cardImage: "major-06.jpg",
    cardAlt: "ไพ่ The Lovers - ความรักและการผูกพันทางจิตวิญญาณ",
    elementalGlyph: "✦ ธาตุน้ำ · สายใยหัวใจ ✦",
    themeColors: {
      border: "border-[#EADFD5]",
      borderHover: "hover:border-[#C48464]",
      bgGradient: "bg-gradient-to-br from-[#FFFFFF] via-[#FDFBF9] to-[#F7EFE9]",
      badgeBg: "bg-[#FBF2EC]",
      badgeText: "text-[#9E4E28]",
      badgeBorder: "border-[#E8D0C3]",
      accentText: "text-[#9E4E28]",
      cardBorder: "#E0C9BB",
      glow: "shadow-[0_4px_20px_-4px_rgba(158,78,40,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(158,78,40,0.18)]",
    },
  },
  {
    id: "work",
    category: "work",
    title: "การงาน & โอกาสใหม่",
    tagline: "เจาะลึกทิศทางงาน การสอบ เลื่อนตำแหน่ง และอุปสรรค",
    defaultQuestion: "ทิศทางการงานและโปรเจกต์ช่วงนี้จะราบรื่นไหม มีสิ่งใดที่ควรระวังเป็นพิเศษ",
    badge: "✦ ยอดนิยม",
    highlightText: "เปิดไพ่ดูดวงการงาน",
    cardImage: "major-01.jpg",
    cardAlt: "ไพ่ The Magician - การริเริ่ม ทักษะ และการสร้างสรรค์โอกาส",
    elementalGlyph: "✦ ธาตุไฟ · ศักยภาพ & ลงมือทำ ✦",
    themeColors: {
      border: "border-[#E6DEC9]",
      borderHover: "hover:border-[#8F5C1A]",
      bgGradient: "bg-gradient-to-br from-[#FFFFFF] via-[#FCFAF5] to-[#F5EEE0]",
      badgeBg: "bg-[#F6EFE0]",
      badgeText: "text-[#8F5C1A]",
      badgeBorder: "border-[#E2D4BE]",
      accentText: "text-[#8F5C1A]",
      cardBorder: "#D9C8AC",
      glow: "shadow-[0_4px_20px_-4px_rgba(143,92,26,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(143,92,26,0.18)]",
    },
  },
  {
    id: "money",
    category: "money",
    title: "การเงิน & โชคลาภ",
    tagline: "ประเมินกระแสเงินสด ความคล่องตัว และจังหวะลงทุน",
    defaultQuestion: "สภาพคล่องทางการเงินและโชคลาภช่วงนี้เป็นอย่างไร ควรบริหารจัดการอย่างไร",
    badge: "✦ เด่นชัด",
    highlightText: "เปิดไพ่ดูดวงการเงิน",
    cardImage: "pentacles-01.jpg",
    cardAlt: "ไพ่ Ace of Pentacles - ความอุดมสมบูรณ์และโอกาสทางการเงิน",
    elementalGlyph: "✦ ธาตุดิน · ความมั่นคง & โชคลาภ ✦",
    themeColors: {
      border: "border-[#E6E0CB]",
      borderHover: "hover:border-[#B38728]",
      bgGradient: "bg-gradient-to-br from-[#FFFFFF] via-[#FCFAF2] to-[#F3ECCE]",
      badgeBg: "bg-[#F7F3DC]",
      badgeText: "text-[#8C6615]",
      badgeBorder: "border-[#E0D8B4]",
      accentText: "text-[#8C6615]",
      cardBorder: "#D8CEAA",
      glow: "shadow-[0_4px_20px_-4px_rgba(179,135,40,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(179,135,40,0.18)]",
    },
  },
  {
    id: "general",
    category: "general",
    title: "ภาพรวมดวงชะตา & พลังงานวันนี้",
    tagline: "สิ่งที่จักรวาลอยากบอก ข้อคิดนำทางชีวิตประจำวัน",
    defaultQuestion: "ภาพรวมพลังงานดวงชะตาตอนนี้เป็นอย่างไร มีข้อคิดหรือคำเตือนใดที่ควรใส่ใจ",
    badge: "✦ สมดุล",
    highlightText: "เปิดไพ่รับพลังงานวันนี้",
    cardImage: "major-19.jpg",
    cardAlt: "ไพ่ The Sun - ความสว่างไสว พลังบวก และความจริงแห่งชีวิต",
    elementalGlyph: "✦ นภากาศ · สัจธรรม & พลังบวก ✦",
    themeColors: {
      border: "border-[#E2DED5]",
      borderHover: "hover:border-[#6B6152]",
      bgGradient: "bg-gradient-to-br from-[#FFFFFF] via-[#F9F8F5] to-[#EFECE3]",
      badgeBg: "bg-[#F0EEE6]",
      badgeText: "text-[#595042]",
      badgeBorder: "border-[#DAD4C7]",
      accentText: "text-[#595042]",
      cardBorder: "#D2CCC0",
      glow: "shadow-[0_4px_20px_-4px_rgba(107,97,82,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(107,97,82,0.18)]",
    },
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
      {/* ส่วนหัวแนะนำการทำนายด่วน สไตล์วิหารพยากรณ์ */}
      <div className="text-center space-y-3.5">
        {/* สัญลักษณ์ดวงดาวประดับ */}
        <div className="flex items-center justify-center gap-2 text-[#A58A5C]/60 text-xs select-none">
          <span>✦</span>
          <span className="w-10 h-px bg-gradient-to-r from-transparent via-[#A58A5C]/40 to-transparent" />
          <span>✧</span>
          <span className="w-10 h-px bg-gradient-to-r from-transparent via-[#A58A5C]/40 to-transparent" />
          <span>✦</span>
        </div>

        {/* ป้ายกล่องทองคำเปลว */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-serif-th font-semibold tracking-wide bg-[#FBF8F3] border border-[#D5CEC2] text-[#8F5C1A] shadow-xs">
          <span>✨</span>
          <span>เปิดไพ่ด่วน 1 ใบ · สรุปความหมายตรงประเด็น</span>
          <span>✨</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-[#29261F] tracking-wide leading-snug [text-wrap:balance]">
          เลือกเรื่องที่คุณอยากรู้มากที่สุดในตอนนี้
        </h1>
        <p className="text-xs sm:text-sm text-[#635B4E] max-w-xl mx-auto font-serif-th leading-relaxed [text-wrap:balance]">
          แตะเลือก 1 หัวข้อเพื่อเปิดไพ่ทาโรต์ 1909 ทันที พร้อมระบบสลับไพ่โปร่งใสตรวจสอบได้ Provably-Fair SHA-256
        </p>
      </div>

      {/* กริด 4 หัวข้อยอดนิยม (2x2 บน desktop, 1 คอลัมน์บน mobile) พร้อมภาพไพ่ 1909 Rider-Waite ประจำหมวด */}
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
            className={`group relative flex flex-col justify-between p-4.5 sm:p-5.5 rounded-2xl border ${topic.themeColors.border} ${topic.themeColors.borderHover} ${topic.themeColors.bgGradient} ${topic.themeColors.glow} transition-all duration-300 transform-gpu hover:-translate-y-1 cursor-pointer select-none text-left overflow-hidden`}
          >
            {/* สัญลักษณ์มุมการ์ดทองคำเปลว (Sacred Corner Accents) */}
            <div className="absolute top-2.5 right-2.5 text-[9px] text-[#A58A5C]/40 group-hover:text-[#A58A5C]/90 transition-colors pointer-events-none select-none">
              ✦
            </div>
            <div className="absolute bottom-2.5 left-2.5 text-[9px] text-[#A58A5C]/30 group-hover:text-[#A58A5C]/70 transition-colors pointer-events-none select-none">
              ✦
            </div>

            {/* ป้ายกำกับด้านบน */}
            <div className="flex items-center justify-between gap-2 mb-3.5 relative z-10">
              <span
                className={`text-[11px] font-serif-th font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${topic.themeColors.badgeBg} ${topic.themeColors.badgeText} ${topic.themeColors.badgeBorder}`}
              >
                {topic.badge}
              </span>
              <span className="text-xs font-serif-th text-[#A58A5C] flex items-center gap-1 group-hover:text-[#8F5C1A] transition-colors">
                <span>ไพ่ 1 ใบ</span>
                <span>✦</span>
              </span>
            </div>

            {/* ส่วนกลาง: ภาพไพ่ 1909 Rider-Waite ในกรอบวิหาร + รายละเอียดหัวข้อ */}
            <div className="flex items-center gap-3.5 sm:gap-4 mb-4 relative z-10">
              {/* ภาพหน้าไพ่ 1909 Rider-Waite ประจำหัวข้อ */}
              <div className="relative flex-shrink-0">
                {/* รัศมีแสงทองนุ่มนวลเบื้องหลัง */}
                <div className="absolute -inset-1 rounded-xl bg-radial from-[#A58A5C]/20 to-transparent blur-2xs -z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                <div
                  className="relative w-[54px] h-[86px] sm:w-[62px] sm:h-[98px] rounded-lg overflow-hidden border shadow-xs group-hover:shadow-md group-hover:scale-105 transition-all duration-300 transform-gpu bg-[#FFFFFF]"
                  style={{ borderColor: topic.themeColors.cardBorder }}
                >
                  <CardImage
                    image={topic.cardImage}
                    alt={topic.cardAlt}
                    sizes="(min-width: 640px) 62px, 54px"
                    className="w-full h-full object-cover object-center"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* ข้อความและคำอธิบาย */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="text-[10px] sm:text-[11px] font-serif-th text-[#8F5C1A] tracking-wider font-semibold">
                  {topic.elementalGlyph}
                </div>
                <h2 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors duration-200 leading-snug">
                  {topic.title}
                </h2>
                <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed line-clamp-2">
                  {topic.tagline}
                </p>
              </div>
            </div>

            {/* แถบการกระทำด้านล่าง: เชิญชวนเปิดไพ่พร้อมประกายทอง */}
            <div className="pt-2 border-t border-[#D5CEC2]/40 relative z-10">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F6F2EA]/70 group-hover:bg-[#29261F] text-[#4A3E31] group-hover:text-[#FAF7F2] transition-colors duration-300 shadow-2xs">
                <span className="text-xs font-serif-th font-medium">
                  {topic.highlightText}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-serif-th font-semibold text-[#8F5C1A] group-hover:text-[#E8D5B5] transition-colors">
                  <span>เริ่มทำนาย</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">➔</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ทางเลือกรอง: สลับไปยังผังเต็ม 20 แบบ */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onSwitchToFullSpreads}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D5CEC2] bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] hover:bg-[#F3EDE2] text-[#4A3828] text-xs sm:text-sm font-serif-th font-medium transition-all duration-300 shadow-xs hover:border-[#A58A5C] hover:shadow-sm group"
        >
          <span className="text-[#8F5C1A]">✦</span>
          <span>หรือต้องการพิมพ์คำถามเอง &amp; เลือกผังพยากรณ์แบบเต็ม (20 ผัง)</span>
          <span className="text-[#A58A5C] group-hover:translate-x-0.5 transition-transform duration-200">➔</span>
        </button>
      </div>

      {/* โมดัลถามชื่อเล่นครั้งแรก (Fast & Sacred Popover) */}
      {showNicknameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171512]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-[#D5CEC2] bg-gradient-to-b from-[#FFFFFF] via-[#FDFBF9] to-[#F7F4EE] p-6 shadow-[var(--shadow-overlay)] space-y-4 text-left">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F] flex items-center gap-1.5">
                  <span className="text-[#8F5C1A]">✦</span>
                  <span>นามสมมุติของคุณ</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowNicknameModal(false);
                    setSelectedPendingTopic(null);
                  }}
                  className="text-xs text-[#635B4E] hover:text-[#29261F] p-1 rounded-md hover:bg-[#F0ECE1] transition-colors"
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
                  className="px-4 py-2 text-xs font-serif-th font-semibold rounded-xl bg-[#29261F] text-[#FAF7F2] hover:bg-[#3D372E] border border-[#8F5C1A]/40 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
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
