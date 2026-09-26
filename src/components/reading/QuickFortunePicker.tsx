"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { RailArrows } from "@/components/ui/RailArrows";
import { useRail } from "@/components/ui/use-rail";
import type { Category } from "@/data/cards/types";
import { CardImage } from "@/components/card/CardImage";

import { useLocale } from "@/lib/i18n";
import { useDialogBehavior } from "@/lib/use-dialog-behavior";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

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
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    accentText: string;
    cardBorder: string;
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
      badgeBg: "bg-[#FBF2EC]",
      badgeText: "text-[#9E4E28]",
      badgeBorder: "border-[#E8D0C3]",
      accentText: "text-[#9E4E28]",
      cardBorder: "#E0C9BB",
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
      badgeBg: "bg-[#F6EFE0]",
      badgeText: "text-gold-ink",
      badgeBorder: "border-[#E2D4BE]",
      accentText: "text-gold-ink",
      cardBorder: "#D9C8AC",
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
      badgeBg: "bg-[#F7F3DC]",
      badgeText: "text-[#8C6615]",
      badgeBorder: "border-[#E0D8B4]",
      accentText: "text-[#8C6615]",
      cardBorder: "#D8CEAA",
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
      badgeBg: "bg-[#F0EEE6]",
      badgeText: "text-[#595042]",
      badgeBorder: "border-[#DAD4C7]",
      accentText: "text-[#595042]",
      cardBorder: "#D2CCC0",
    },
  },
];

export interface QuickFortunePickerProps {
  currentNickname: string;
  onSelectTopic: (topic: QuickTopic, nickname: string, question?: string) => void;
  isLoading?: boolean;
}

export function QuickFortunePicker({
  currentNickname,
  onSelectTopic,
  isLoading = false,
}: QuickFortunePickerProps) {
  const { isEnglish } = useLocale();
  const [selectedPendingTopic, setSelectedPendingTopic] = useState<QuickTopic | null>(null);
  const [inputNickname, setInputNickname] = useState(currentNickname || "");
  const [inputQuestion, setInputQuestion] = useState("");
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  // จังหวะขาออกของหน้าต่าง — ต้องค้างไว้ให้อนิเมชันเล่นจบก่อนค่อยถอดออกจากต้นไม้
  // (ไฟล์นี้ใช้ `AnimatePresence` ไม่ได้ ดูเหตุผลที่ .anim-scrim-in ใน globals.css)
  const [isNicknameClosing, setIsNicknameClosing] = useState(false);
  const nicknameCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // กันไทม์เมอร์ค้างเมื่อคอมโพเนนต์ถูกถอดกลางคัน
  useEffect(() => () => {
    if (nicknameCloseTimer.current) clearTimeout(nicknameCloseTimer.current);
  }, []);

  /** ปิดหน้าต่างแบบมีขาออก — ใช้กับปุ่มยกเลิก/ปิดทุกจุด (ปุ่มยืนยันปิดทันทีเพราะจอเปลี่ยนไปพิธีอ่านไพ่ต่อเลย) */
  const closeNicknameModal = () => {
    if (nicknameCloseTimer.current) return; // กดรัวแล้วอย่าตั้งไทม์เมอร์ซ้อน
    setIsNicknameClosing(true);
    nicknameCloseTimer.current = setTimeout(() => {
      setShowNicknameModal(false);
      setIsNicknameClosing(false);
      setSelectedPendingTopic(null);
      nicknameCloseTimer.current = null;
    }, 160); // ต้องเท่ากับ .anim-scrim-out ใน globals.css
  };

  // ซิงก์ชื่อเล่นกับ currentNickname เมื่อรีเซ็ตหรือเปลี่ยนค่า
  useEffect(() => {
    setInputNickname(currentNickname || "");
  }, [currentNickname]);

  const handleCardClick = (topic: QuickTopic) => {
    if (isLoading) return;

    // ต้องแสดงโมดัลถามชื่อและคำถามทุกครั้งเมื่อเริ่มทำนายใหม่ ไม่ข้ามขั้นตอน
    setSelectedPendingTopic(topic);
    setInputQuestion("");
    setNicknameError(null);
    if (nicknameCloseTimer.current) {
      clearTimeout(nicknameCloseTimer.current);
      nicknameCloseTimer.current = null;
    }
    setIsNicknameClosing(false);
    setShowNicknameModal(true);
  };

  const handleConfirmNickname = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputNickname.trim();
    if (!trimmed) {
      setNicknameError(isEnglish ? "Please provide a name to begin your reading" : "กรุณาระบุชื่อเล่นเพื่อเริ่มทำนาย");
      return;
    }

    setShowNicknameModal(false);
    if (selectedPendingTopic) {
      const fallbackQ = isEnglish
        ? (selectedPendingTopic.defaultQuestionEn || selectedPendingTopic.defaultQuestion)
        : selectedPendingTopic.defaultQuestion;
      const effectiveQuestion = inputQuestion.trim() || fallbackQ;
      onSelectTopic(selectedPendingTopic, trimmed, effectiveQuestion);
      setSelectedPendingTopic(null);
    }
  };

  // สถานะการเลื่อนและ Carousel สำหรับหน้าจอมือถือ
  const carouselRef = useRef<HTMLDivElement>(null);
  const nicknamePanelRef = useRef<HTMLDivElement>(null);

  /*
   * 🪟 แผงระบุชื่อเล่น/คำถาม เป็นหน้าต่างลอยเต็มจอที่ขวางทางผู้ใช้จริง
   * แต่เดิมไม่มีทั้ง `role="dialog"` · Esc · focus trap · scroll lock (UX-08)
   *
   * ⚠️ ต้องใช้ `closeNicknameModal` ไม่ใช่ `setShowNicknameModal(false)` ตรง ๆ
   * เพราะแผงนี้เล่นอนิเมชันขาออกก่อนแล้วค่อยถอดออกจาก DOM (`isNicknameClosing`)
   * ถ้าถอดทันทีจะดับหายวับ ผิดกฎคุณภาพโมชั่นของบ้านนี้
   */
  useDialogBehavior(showNicknameModal, () => closeNicknameModal(), nicknamePanelRef);
  /* แถวปัดทุกความกว้างจอ — จอใหญ่จัดวางแบบเดียวกับมือถือ (คำสั่งเจ้าของ 2026-09-26) */
  const rail = useRail(carouselRef, QUICK_TOPICS.length);

  return (
    <div className="space-y-5 sm:space-y-6 w-full">
      {/* ส่วนหัวแนะนำการทำนายด่วน สไตล์วิหารพยากรณ์ */}
      <div className="text-center space-y-2.5 sm:space-y-3 max-w-2xl mx-auto px-4">
        {/* ป้ายกล่องทองคำเปลว */}
        <div className="glass-chip inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 text-[11px] font-serif-th font-semibold tracking-wide text-gold-ink">
          
          <span>
            {isEnglish
              ? "Rapid Single-Card Reading · Direct & Insightful"
              : "เปิดไพ่ด่วน 1 ใบ · สรุปความหมายตรงประเด็น"}
          </span>
          
        </div>

        {/*
          * หัวข้อส่วนทำนายด่วน 1 ใบ: ใช้ `<h2>` ได้ถูกต้องตามลำดับเอกสาร (h1 ➔ h2 ➔ h3)
          * เพราะบล็อกนี้อยู่ใต้ `<h1>` ของหน้าแรกเสมอ (ดูลำดับใน `TarotFlow.tsx`)
          * ⚠️ ห้ามย้ายบล็อกนี้ขึ้นเหนือ `<h1>` — `<h2>` จะโผล่ก่อน `<h1>` ผิดลำดับหัวข้อทันที
          */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif-th font-bold text-ink tracking-wide leading-snug [text-wrap:balance]"><ThaiPhrases>
          {/* วรรคละ inline-block — ปล่อยเบราว์เซอร์ตัดเองบนมือถือได้ "อยาก / รู้" ขาดกลางคำ (เจ้าของทัก) */}
          {isEnglish ? (
            "Choose the area calling for clarity today"
          ) : (
            <>
              <span className="inline-block">เลือกเรื่องที่คุณอยากรู้</span>{" "}
              <span className="inline-block">มากที่สุดในตอนนี้</span>
            </>
          )}
        </ThaiPhrases></h2>
      </div>

      {/* การ์ด 4 หัวข้อยอดนิยม (Mobile: Horizontal Swipe / Desktop: 4-Column Grid พอเหมาะกับเว็บ) */}
      <div className="rail-wrap w-full">
        <div
          ref={carouselRef}
          onScroll={rail.onScroll}
          className="rail-flat rail-always flex flex-row overflow-x-auto snap-x snap-mandatory gap-3 pb-3 pt-1 px-4 -mx-4 no-scrollbar scroll-smooth sm:gap-4"
        >
          {QUICK_TOPICS.map((topic, index) => (
            <div
              key={topic.id}
              data-card-index={index}
              data-home-target={`quick:${topic.id}`}
              role="button"
              tabIndex={0}
              // ตั้งชื่อให้การ์ดตรง ๆ — ของเดิมไม่มี ชื่อจึงถูกประกอบจากข้อความทุกชิ้นในใบ
              // (ป้าย · ธาตุ · หัวข้อ · คำโปรย · จำนวนไพ่ · ปุ่ม) อ่านออกมายาวจนจับใจความไม่ได้
              aria-label={isEnglish ? (topic.titleEn || topic.title) : topic.title}
              onClick={() => handleCardClick(topic)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(topic);
                }
              }}
              /*
                 * พื้นผิวการ์ดมาจาก `.altar-card-porcelain` (ธีมกระจกอุ่น) เท่านั้น
                 * สีประจำหัวข้อยังอยู่ครบที่ป้ายด้านบนกับขอบภาพไพ่ จึงไม่ได้เสียเอกลักษณ์ไป
                 * ⚠️ ห้ามเอาพื้นไล่สีทึบ (`from-surface …`) กลับมา — ทึบ 100% บนพื้นหลังไล่สี
                 * จะอ่านเป็นกล่องขาวลอย ไม่ใช่กระจก
                 */
                className="altar-card-porcelain w-[82vw] max-w-[280px] shrink-0 snap-center sm:w-[calc((100%_-_32px)/2.25)] sm:max-w-none lg:w-[calc((100%_-_48px)/3.25)] sm:snap-start group relative flex flex-col justify-between p-4 sm:p-4.5 transform-gpu cursor-pointer select-none text-left overflow-hidden min-h-[368px] sm:min-h-[392px]"
            >
              {/* สัญลักษณ์มุมการ์ดทองคำเปลว */}
              
              

              {/* ป้ายกำกับด้านบน */}
              <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                <span
                  className={`text-[10px] sm:text-[11px] font-serif-th font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${topic.themeColors.badgeBg} ${topic.themeColors.badgeText} ${topic.themeColors.badgeBorder}`}
                >
                  {isEnglish ? (topic.badgeEn || topic.badge) : topic.badge}
                </span>
                <span className="text-[11px] sm:text-xs font-serif-th text-gold-ink flex items-center gap-1 group-hover:text-gold-ink transition-colors">
                  <span>{isEnglish ? "1 Card" : "ไพ่ 1 ใบ"}</span>
                  
                </span>
              </div>

              {/* ส่วนกลาง: ภาพไพ่ 1909 Rider-Waite ขนาดใหญ่กลางการ์ด (สัดส่วนเท่าการ์ดผังพยากรณ์) + รายละเอียดหัวข้อ */}
              <div className="flex flex-col items-center text-center gap-2.5 mb-3.5 relative z-10">
                {/* ภาพหน้าไพ่ 1909 Rider-Waite ประจำหัวข้อ */}
                <div className="relative flex-shrink-0">
                  {/* รัศมีแสงทองนุ่มนวลเบื้องหลัง */}
                  <div className="absolute -inset-1.5 rounded-xl bg-radial from-gold/20 to-transparent blur-2xs -z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                  <div
                    className="relative w-[92px] h-[152px] sm:w-[104px] sm:h-[172px] rounded-lg overflow-hidden border shadow-xs group-hover:shadow-md group-hover:scale-105 transition duration-300 transform-gpu bg-surface"
                    style={{ borderColor: topic.themeColors.cardBorder }}
                  >
                    {/*
                      ภาพไพ่ใบแรกของแถวนี้คือ **ตัว LCP ของหน้าแรกบนมือถือ** (วัดจริง 2026-09-14)
                      จึงต้องบอกลำดับความสำคัญสูงสุดให้เบราว์เซอร์ตั้งแต่สแกน HTML

                      ⚠️ ใบที่เหลือต้องเป็น `lazy` — บนมือถือแถวนี้เป็นสไลด์แนวนอนที่เห็นจริง
                         แค่ใบเดียวกับเศษของใบที่สอง การสั่ง `eager` ทั้งสี่ใบ (ของเดิม)
                         คือการดึงภาพ ~23 KB × 4 มาแย่งท่อเน็ตเส้นเดียวกับภาพ LCP
                         ส่วนบนจอ sm ขึ้นไปที่กลายเป็นกริดเห็นครบทุกใบ เบราว์เซอร์จะโหลด
                         ใบที่เหลือให้เองทันทีอยู่แล้วเพราะมันอยู่ในวิวพอร์ต
                    */}
                    <CardImage
                      image={topic.cardImage}
                      alt={isEnglish ? (topic.cardAltEn || topic.cardAlt) : topic.cardAlt}
                      sizes="(min-width: 640px) 104px, 92px"
                      className="w-full h-full object-cover object-center"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : undefined}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* ข้อความและคำอธิบาย */}
                <div className="w-full min-w-0 space-y-1 px-1">
                  <div className="text-[10px] sm:text-[11px] font-serif-th text-gold-ink tracking-wider font-semibold truncate">
                    {isEnglish ? (topic.elementalGlyphEn || topic.elementalGlyph) : topic.elementalGlyph}
                  </div>
                  {/* หัวข้อของการ์ดแต่ละหัวข้อ ใช้ `<h3>` ภายใต้ `<h2>` ของส่วนทำนายด่วน */}
                  <h3 className="text-sm sm:text-base font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors duration-200 leading-snug"><ThaiPhrases>
                    {isEnglish ? (topic.titleEn || topic.title) : topic.title}
                  </ThaiPhrases></h3>
                  <p className="text-[11px] sm:text-xs font-serif-th text-muted leading-relaxed line-clamp-2">
                    {isEnglish ? (topic.taglineEn || topic.tagline) : topic.tagline}
                  </p>
                </div>
              </div>

              {/* แถบการกระทำด้านล่าง: เชิญชวนเปิดไพ่พร้อมประกายทอง */}
              <div className="pt-2 border-t border-line/40 relative z-10">
                <div className="flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl bg-[#F6F2EA]/70 group-hover:bg-ink text-[#4A3E31] group-hover:text-surface-warm transition-colors duration-300 shadow-2xs">
                  <span className="text-[11px] sm:text-xs font-serif-th font-medium truncate mr-1">
                    {isEnglish ? (topic.highlightTextEn || topic.highlightText) : topic.highlightText}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-serif-th font-semibold text-gold-ink group-hover:text-[#E8D5B5] transition-colors shrink-0">
                    <span>{isEnglish ? "Begin Reading" : "เริ่มทำนาย"}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">➔</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* จอใหญ่: ลูกศรลอยทับกลางแถว ชิดขอบจอแบบ apple.com Store (2026-09-26) */}
        <RailArrows
          overlay
          isEnglish={isEnglish}
          canPrev={rail.canPrev}
          canNext={rail.canNext}
          onPrev={rail.prev}
          onNext={rail.next}
        />

        {/* มือถือ: ลูกศรใต้แถวชิดขวา (เจ้าของสั่งถอดจุดบอกตำแหน่งออก 2026-09-24) */}
        <div className="flex sm:hidden items-center justify-end pt-1 pb-1">
          <RailArrows
            isEnglish={isEnglish}
            canPrev={rail.canPrev}
            canNext={rail.canNext}
            onPrev={rail.prev}
            onNext={rail.next}
          />
        </div>
      </div>


      {/* โมดัลระบุชื่อเล่นและคำถามสำหรับรอบใหม่ (Fast & Sacred Sacred Popover) */}
      {/* ⚠️ วาดผ่าน portal ไป `<body>` — บล็อกนี้อยู่ใน `.home-band` (`isolation: isolate`)
          ถ้าวาดตรงนี้ แถบ "เลือกผัง" ถัดลงไปจะวาดทับหน้าต่างตอนเลื่อนจอ (เจ้าของทัก 2026-09-24) */}
      {showNicknameModal && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEnglish ? "Set your name and question" : "ระบุชื่อเล่นและคำถามของคุณ"}
          className={`fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 modal-scrim ${
            isNicknameClosing ? "anim-scrim-out" : "anim-scrim-in"
          }`}
        >
          <div
            ref={nicknamePanelRef}
            /* 🪟 ผิวกระจกอุ่นชุดเดียวกับ `Modal.tsx` — ของเดิมเป็นไล่สีทึบสามช่วง
               ซึ่งอ่านเป็นกล่องกระดาษขาว ไม่เข้ากับธีมกระจกของทั้งเว็บ (เจ้าของทัก 2026-09-21) */
            className={`altar-modal w-full max-w-md max-h-[calc(100svh-2rem)] overflow-y-auto overscroll-contain p-6 space-y-4 text-left${
              isNicknameClosing ? "" : " anim-modal-rise"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedPendingTopic && (
                    <span className="glass-chip text-[11px] font-serif-th font-semibold px-2.5 py-0.5 text-gold-ink">
                      {isEnglish
                        ? (selectedPendingTopic.titleEn || selectedPendingTopic.title)
                        : selectedPendingTopic.title}
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-serif-th font-bold text-ink"><ThaiPhrases>
                    {isEnglish ? "Your Name & Question" : "ชื่อเล่นและคำถามของคุณ"}
                  </ThaiPhrases></h3>
                </div>
                <button
                  type="button"
                  onClick={closeNicknameModal}
                  className="glass-chip tap-overlay-y grid h-8 w-8 shrink-0 place-items-center text-xs text-muted hover:text-ink hover:border-gold-ink transition-colors"
                  aria-label={isEnglish ? "Close" : "ปิด"}
                >
                  ✕
                </button>
              </div>
              <p className="text-xs font-serif-th text-muted leading-relaxed">
                {isEnglish
                  ? "Please share your name and what you wish to ask so the AI Oracle can connect with your energy and answer directly."
                  : "ระบุชื่อเล่นและคำถามที่คุณอยากรู้ เพื่อให้แม่หมอ AI เชื่อมจิตและทำนายคำตอบได้ตรงจุดที่สุด"}
              </p>
            </div>

            <form onSubmit={handleConfirmNickname} className="space-y-3.5">
              {/* Field 1: ชื่อเล่น */}
              <div>
                <label
                  htmlFor="quick-fortune-nickname"
                  className="text-xs font-serif-th font-semibold text-ink block mb-1"
                >
                  {isEnglish ? "Your Name or Nickname *" : "ชื่อเล่นของคุณ *"}
                </label>
                <input
                  id="quick-fortune-nickname"
                  type="text"
                  autoFocus={!inputNickname}
                  value={inputNickname}
                  onChange={(e) => {
                    setInputNickname(e.target.value);
                    if (nicknameError) setNicknameError(null);
                  }}
                  placeholder={isEnglish ? "e.g., Alex, Jordan, Taylor..." : "เช่น บี, น้ำ, เจมส์, วิน..."}
                  maxLength={40}
                  className="glass-field w-full px-3.5 py-2 text-sm font-serif-th rounded-xl border border-line-interactive focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold text-ink"
                />
                {/* ♿ R-21: ชื่อเล่นที่กรอกผิดต้องถูกประกาศ ไม่งั้นผู้ใช้กดต่อไม่ได้โดยไม่รู้สาเหตุ */}
                {nicknameError && (
                  <p role="alert" className="text-[11px] font-serif-th text-err mt-1">
                    {nicknameError}
                  </p>
                )}
              </div>

              {/* Field 2: คำถามของคุณ */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="quick-fortune-question"
                    className="text-xs font-serif-th font-semibold text-ink"
                  >
                    {isEnglish ? "Your Question" : "คำถามที่คุณอยากรู้"}
                  </label>
                  {selectedPendingTopic && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputQuestion(
                          isEnglish
                            ? (selectedPendingTopic.defaultQuestionEn || selectedPendingTopic.defaultQuestion)
                            : selectedPendingTopic.defaultQuestion
                        );
                      }}
                      className="text-[11px] font-serif-th text-gold-ink hover:text-gold-ink-deep hover:underline cursor-pointer"
                    >
                      {isEnglish ? "Use suggested question" : "ใช้คำถามแนะนำ"}
                    </button>
                  )}
                </div>
                <textarea
                  id="quick-fortune-question"
                  rows={3}
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder={
                    selectedPendingTopic
                      ? (isEnglish
                          ? (selectedPendingTopic.defaultQuestionEn || selectedPendingTopic.defaultQuestion)
                          : selectedPendingTopic.defaultQuestion)
                      : (isEnglish ? "Type your question here..." : "พิมพ์คำถามของคุณที่นี่...")
                  }
                  maxLength={300}
                  className="glass-field w-full px-3.5 py-2 text-sm font-serif-th rounded-xl border border-line-interactive focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold text-ink resize-none"
                />
                <div className="flex items-center justify-between text-[11px] font-serif-th text-muted mt-1">
                  <span>
                    {isEnglish
                      ? "Leave blank to use the suggested question"
                      : "หากเว้นว่าง ระบบจะใช้คำถามแนะนำของหัวข้อนี้"}
                  </span>
                  <span className="font-mono text-[10px]">{inputQuestion.length}/300</span>
                </div>
              </div>

              <div className="glass-divider-t flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={closeNicknameModal}
                  className="tap-overlay-y px-3.5 py-2 text-xs font-serif-th text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  {isEnglish ? "Cancel" : "ยกเลิก"}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !inputNickname.trim()}
                  className="btn-gold-glass tap-overlay-y px-5 py-2.5 text-xs font-serif-th font-semibold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isEnglish ? "Begin Reading Now" : "เริ่มทำนายทันที"}</span>
                  <span aria-hidden="true">➔</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
