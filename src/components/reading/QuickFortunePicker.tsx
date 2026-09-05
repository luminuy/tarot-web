"use client";

import { useState, useEffect, useRef } from "react";
import type { Category } from "@/data/cards/types";
import { CardImage } from "@/components/card/CardImage";

import { useLocale } from "@/lib/i18n";

export interface QuickTopic {
  id: "love" | "work" | "money" | "general";
  category: Category;
  title: string;
  titleEn?: string;
  tagline: string;
  taglineEn?: string;
  defaultQuestion: string;
  defaultQuestionEn?: string;
  badge: string;
  badgeEn?: string;
  highlightText: string;
  highlightTextEn?: string;
  cardImage: string;
  cardAlt: string;
  cardAltEn?: string;
  elementalGlyph: string;
  elementalGlyphEn?: string;
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
    titleEn: "Love & Relationships",
    tagline: "เช็กความรู้สึก แนวโน้มหัวใจ คนคุย แฟน หรือคนโสด",
    taglineEn: "Heartspace dynamics, soul connection, partners, or dating clarity",
    defaultQuestion: "ภาพรวมความรักและความสัมพันธ์ตอนนี้เป็นอย่างไร และควรเปิดใจรับมืออย่างไร",
    defaultQuestionEn: "What is the present energy surrounding my love life and relationships, and how should I best navigate my heart?",
    badge: "ยอดนิยมอันดับ 1",
    badgeEn: "#1 Most Popular",
    highlightText: "เปิดไพ่ดูดวงความรัก",
    highlightTextEn: "Love Tarot Reading",
    cardImage: "major-06.jpg",
    cardAlt: "ไพ่ The Lovers - ความรักและการผูกพันทางจิตวิญญาณ",
    cardAltEn: "The Lovers - Sacred bond, emotional resonance, and spiritual choice",
    elementalGlyph: "ธาตุน้ำ · สายใยหัวใจ",
    elementalGlyphEn: "Water Element · Heartspace Bonds",
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
    titleEn: "Career & New Horizons",
    tagline: "เจาะลึกทิศทางงาน การสอบ เลื่อนตำแหน่ง และอุปสรรค",
    taglineEn: "Professional trajectory, promotions, ventures, and breakthroughs",
    defaultQuestion: "ทิศทางการงานและโปรเจกต์ช่วงนี้จะราบรื่นไหม มีสิ่งใดที่ควรระวังเป็นพิเศษ",
    defaultQuestionEn: "What energies are guiding my career and creative projects right now, and what should I be mindful of?",
    badge: "ยอดนิยม",
    badgeEn: "High Impact",
    highlightText: "เปิดไพ่ดูดวงการงาน",
    highlightTextEn: "Career Tarot Reading",
    cardImage: "major-01.jpg",
    cardAlt: "ไพ่ The Magician - การริเริ่ม ทักษะ และการสร้างสรรค์โอกาส",
    cardAltEn: "The Magician - Conscious manifestation, creative mastery, and willpower",
    elementalGlyph: "ธาตุไฟ · ศักยภาพ & ลงมือทำ",
    elementalGlyphEn: "Fire Element · Agency & Action",
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
    titleEn: "Finances & Abundance",
    tagline: "ประเมินกระแสเงินสด ความคล่องตัว และจังหวะลงทุน",
    taglineEn: "Financial flow, material grounding, investments, and prosperity",
    defaultQuestion: "สภาพคล่องทางการเงินและโชคลาภช่วงนี้เป็นอย่างไร ควรบริหารจัดการอย่างไร",
    defaultQuestionEn: "What is the financial current around me at this time, and how can I best cultivate grounded stability?",
    badge: "เด่นชัด",
    badgeEn: "Clear Alignment",
    highlightText: "เปิดไพ่ดูดวงการเงิน",
    highlightTextEn: "Financial Tarot Reading",
    cardImage: "pentacles-01.jpg",
    cardAlt: "ไพ่ Ace of Pentacles - ความอุดมสมบูรณ์และโอกาสทางการเงิน",
    cardAltEn: "Ace of Pentacles - Seeds of material opportunity, security, and prosperity",
    elementalGlyph: "ธาตุดิน · ความมั่นคง & โชคลาภ",
    elementalGlyphEn: "Earth Element · Grounding & Wealth",
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
    titleEn: "Daily Energy & Universal Guidance",
    tagline: "สิ่งที่จักรวาลอยากบอก ข้อคิดนำทางชีวิตประจำวัน",
    taglineEn: "Core atmospheric guidance and mindfulness for today's journey",
    defaultQuestion: "ภาพรวมพลังงานดวงชะตาตอนนี้เป็นอย่างไร มีข้อคิดหรือคำเตือนใดที่ควรใส่ใจ",
    defaultQuestionEn: "What universal message or guiding principle does the cosmos offer for my journey today?",
    badge: "สมดุล",
    badgeEn: "Centered",
    highlightText: "เปิดไพ่รับพลังงานวันนี้",
    highlightTextEn: "Daily Guidance Reading",
    cardImage: "major-19.jpg",
    cardAlt: "ไพ่ The Sun - ความสว่างไสว พลังบวก และความจริงแห่งชีวิต",
    cardAltEn: "The Sun - Radiance, vitality, conscious clarity, and authentic joy",
    elementalGlyph: "นภากาศ · สัจธรรม & พลังบวก",
    elementalGlyphEn: "Quintessence · Cosmic Illumination",
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
  isLoading?: boolean;
}

export function QuickFortunePicker({
  currentNickname,
  onSelectTopic,
  isLoading = false,
}: QuickFortunePickerProps) {
  const { isEnglish } = useLocale();
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
      setNicknameError(isEnglish ? "Please provide a name to begin your reading" : "กรุณาระบุชื่อเล่นเพื่อเริ่มทำนาย");
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

  // สถานะการเลื่อนและ Carousel สำหรับหน้าจอมือถือ
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.querySelector<HTMLElement>("[data-card-index]")?.offsetWidth || 280;
    const newIndex = Math.round(scrollLeft / (cardWidth + 12));
    setActiveIndex(Math.max(0, Math.min(newIndex, QUICK_TOPICS.length - 1)));
  };

  const scrollToIndex = (index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-card-index]");
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      setActiveIndex(index);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full">
      {/* ส่วนหัวแนะนำการทำนายด่วน สไตล์วิหารพยากรณ์ */}
      <div className="text-center space-y-2.5 sm:space-y-3 max-w-2xl mx-auto px-4">
        {/* ป้ายกล่องทองคำเปลว */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full text-[11px] font-serif-th font-semibold tracking-wide bg-[#FBF8F3] border border-[#D5CEC2] text-[#8F5C1A] shadow-xs">
          
          <span>
            {isEnglish
              ? "Rapid Single-Card Reading · Direct & Insightful"
              : "เปิดไพ่ด่วน 1 ใบ · สรุปความหมายตรงประเด็น"}
          </span>
          
        </div>

        <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif-th font-bold text-[#29261F] tracking-wide leading-snug [text-wrap:balance]">
          {isEnglish
            ? "Choose the area calling for clarity today"
            : "เลือกเรื่องที่คุณอยากรู้มากที่สุดในตอนนี้"}
        </h2>
      </div>

      {/* การ์ด 4 หัวข้อยอดนิยม (Mobile: Horizontal Swipe / Desktop: 4-Column Grid พอเหมาะกับเว็บ) */}
      <div className="w-full">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-3 pb-3 pt-1 px-4 -mx-4 no-scrollbar scroll-smooth sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:mx-0 sm:px-0 sm:pb-0 sm:pt-0 sm:overflow-visible"
        >
          {QUICK_TOPICS.map((topic, index) => (
            <div
              key={topic.id}
              data-card-index={index}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(topic)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(topic);
                }
              }}
              className={`w-[82vw] max-w-[280px] shrink-0 snap-center sm:w-auto sm:max-w-none sm:flex-shrink group relative flex flex-col justify-between p-4 sm:p-4.5 rounded-2xl border ${topic.themeColors.border} ${topic.themeColors.borderHover} ${topic.themeColors.bgGradient} ${topic.themeColors.glow} transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-md cursor-pointer select-none text-left overflow-hidden min-h-[368px] sm:min-h-[392px]`}
            >
              {/* สัญลักษณ์มุมการ์ดทองคำเปลว */}
              
              

              {/* ป้ายกำกับด้านบน */}
              <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                <span
                  className={`text-[10px] sm:text-[11px] font-serif-th font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${topic.themeColors.badgeBg} ${topic.themeColors.badgeText} ${topic.themeColors.badgeBorder}`}
                >
                  {isEnglish ? (topic.badgeEn || topic.badge) : topic.badge}
                </span>
                <span className="text-[11px] sm:text-xs font-serif-th text-[#A58A5C] flex items-center gap-1 group-hover:text-[#8F5C1A] transition-colors">
                  <span>{isEnglish ? "1 Card" : "ไพ่ 1 ใบ"}</span>
                  
                </span>
              </div>

              {/* ส่วนกลาง: ภาพไพ่ 1909 Rider-Waite ขนาดใหญ่กลางการ์ด (สัดส่วนเท่าการ์ดผังพยากรณ์) + รายละเอียดหัวข้อ */}
              <div className="flex flex-col items-center text-center gap-2.5 mb-3.5 relative z-10">
                {/* ภาพหน้าไพ่ 1909 Rider-Waite ประจำหัวข้อ */}
                <div className="relative flex-shrink-0">
                  {/* รัศมีแสงทองนุ่มนวลเบื้องหลัง */}
                  <div className="absolute -inset-1.5 rounded-xl bg-radial from-[#A58A5C]/20 to-transparent blur-2xs -z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                  <div
                    className="relative w-[92px] h-[152px] sm:w-[104px] sm:h-[172px] rounded-lg overflow-hidden border shadow-xs group-hover:shadow-md group-hover:scale-105 transition-all duration-300 transform-gpu bg-[#FFFFFF]"
                    style={{ borderColor: topic.themeColors.cardBorder }}
                  >
                    <CardImage
                      image={topic.cardImage}
                      alt={isEnglish ? (topic.cardAltEn || topic.cardAlt) : topic.cardAlt}
                      sizes="(min-width: 640px) 104px, 92px"
                      className="w-full h-full object-cover object-center"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* ข้อความและคำอธิบาย */}
                <div className="w-full min-w-0 space-y-1 px-1">
                  <div className="text-[10px] sm:text-[11px] font-serif-th text-[#8F5C1A] tracking-wider font-semibold truncate">
                    {isEnglish ? (topic.elementalGlyphEn || topic.elementalGlyph) : topic.elementalGlyph}
                  </div>
                  <h3 className="text-sm sm:text-base font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors duration-200 leading-snug">
                    {isEnglish ? (topic.titleEn || topic.title) : topic.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs font-serif-th text-[#635B4E] leading-relaxed line-clamp-2">
                    {isEnglish ? (topic.taglineEn || topic.tagline) : topic.tagline}
                  </p>
                </div>
              </div>

              {/* แถบการกระทำด้านล่าง: เชิญชวนเปิดไพ่พร้อมประกายทอง */}
              <div className="pt-2 border-t border-[#D5CEC2]/40 relative z-10">
                <div className="flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl bg-[#F6F2EA]/70 group-hover:bg-[#29261F] text-[#4A3E31] group-hover:text-[#FAF7F2] transition-colors duration-300 shadow-2xs">
                  <span className="text-[11px] sm:text-xs font-serif-th font-medium truncate mr-1">
                    {isEnglish ? (topic.highlightTextEn || topic.highlightText) : topic.highlightText}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-serif-th font-semibold text-[#8F5C1A] group-hover:text-[#E8D5B5] transition-colors shrink-0">
                    <span>{isEnglish ? "Begin Reading" : "เริ่มทำนาย"}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">➔</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Pills เฉพาะหน้าจอมือถือ */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 pt-1 pb-1">
          {QUICK_TOPICS.map((topic, index) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={isEnglish ? `Navigate to ${topic.titleEn || topic.title}` : `ไปยังหัวข้อ ${topic.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                activeIndex === index
                  ? "w-6 bg-[#8F5C1A] shadow-xs"
                  : "w-1.5 bg-[#D5CEC2] hover:bg-[#A58A5C]/70"
              }`}
            />
          ))}
        </div>
      </div>


      {/* โมดัลถามชื่อเล่นครั้งแรก (Fast & Sacred Popover) */}
      {showNicknameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171512]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-[#D5CEC2] bg-gradient-to-b from-[#FFFFFF] via-[#FDFBF9] to-[#F7F4EE] p-6 shadow-[var(--shadow-overlay)] space-y-4 text-left">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F] flex items-center gap-1.5">
                  
                  <span>{isEnglish ? "Your Name or Pseudonym" : "นามสมมุติของคุณ"}</span>
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
                {isEnglish
                  ? "Please share a name to connect with the cards (saved locally for future sessions)"
                  : "ขอทราบชื่อเล่นเพื่อเชื่อมจิตกับไพ่ (ระบบจะจำไว้ ไม่ต้องกรอกซ้ำในครั้งถัดไป)"}
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
                  placeholder={isEnglish ? "e.g., Alex, Jordan, Taylor..." : "เช่น บี, น้ำ, เจมส์, วิน..."}
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
                  {isEnglish ? "Cancel" : "ยกเลิก"}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !inputNickname.trim()}
                  className="px-4 py-2 text-xs font-serif-th font-semibold rounded-xl bg-[#29261F] text-[#FAF7F2] hover:bg-[#3D372E] border border-[#8F5C1A]/40 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>{isEnglish ? "Begin Reading Now" : "เริ่มทำนายทันที"}</span>
                  
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
