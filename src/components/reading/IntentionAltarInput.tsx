"use client";

import React from "react";
import { motion } from "motion/react";
import type { Category } from "@/data/cards/types";
import type { Persona } from "@/data/personas";
import { CardImage } from "@/components/card/CardImage";

import { useLocale } from "@/lib/i18n";

interface IntentionAltarInputProps {
  question: string;
  onQuestionChange: (val: string) => void;
  nickname: string;
  onNicknameChange: (val: string) => void;
  situation: string;
  onSituationChange: (val: string) => void;
  selectedCategory: Category;
  onCategoryChange: (val: Category) => void;
  persona?: Persona;
}

interface MysticSeal {
  id: string;
  category: Category;
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  promptSeed: string;
  promptSeedEn?: string;
  majorCard: string;
  romanNum: string;
  image: string;
  accent: string;
}

const MYSTIC_SEALS: MysticSeal[] = [
  {
    id: "love",
    category: "love",
    title: "ความรัก & คนในใจ",
    titleEn: "Love & Relationships",
    subtitle: "ความรู้สึก & ทิศทาง",
    subtitleEn: "Feelings & Trajectory",
    promptSeed: "ความสัมพันธ์กับคนที่อยู่ในใจตอนนี้มีแนวโน้มเป็นอย่างไร และควรวางตัวอย่างไร",
    promptSeedEn: "What is the present trajectory of my relationship and what is the highest way to navigate my heart?",
    majorCard: "THE LOVERS",
    romanNum: "VI",
    image: "/cards/major-06.jpg",
    accent: "#8F5C1A",
  },
  {
    id: "career",
    category: "work",
    title: "การงาน & อนาคต",
    titleEn: "Career & Horizons",
    subtitle: "โอกาส & การเติบโต",
    subtitleEn: "Opportunities & Growth",
    promptSeed: "ทิศทางการงานและโอกาสสำคัญในช่วงนี้ ควรระวังและมุ่งเน้นสิ่งใด",
    promptSeedEn: "What is the key direction for my career right now, and what should I be mindful of?",
    majorCard: "THE CHARIOT",
    romanNum: "VII",
    image: "/cards/major-07.jpg",
    accent: "#8F5C1A",
  },
  {
    id: "finance",
    category: "money",
    title: "การเงิน & โชคลาภ",
    titleEn: "Finances & Abundance",
    subtitle: "ความมั่งคั่ง & จังหวะ",
    subtitleEn: "Prosperity & Timing",
    promptSeed: "การหมุนเวียนทางการเงิน โชคลาภ และสิ่งที่จะช่วยเปิดทางความมั่งคั่ง",
    promptSeedEn: "What is the current energy surrounding my finances and how can I invite grounded prosperity?",
    majorCard: "WHEEL OF FORTUNE",
    romanNum: "X",
    image: "/cards/major-10.jpg",
    accent: "#8F5C1A",
  },
  {
    id: "general",
    category: "general",
    title: "พลังงานรวม & ชีวิต",
    titleEn: "Universal Guidance",
    subtitle: "คำแนะนำสำหรับตัวตน",
    subtitleEn: "Core Spiritual Guidance",
    promptSeed: "พลังงานโดยรวมในชีวิตช่วงนี้ สิ่งที่จักรวาลกำลังเตือน และบทเรียนสำคัญ",
    promptSeedEn: "What overall life guidance does the universe offer me at this time, and what is my primary lesson?",
    majorCard: "THE STAR",
    romanNum: "XVII",
    image: "/cards/major-17.jpg",
    accent: "#8F5C1A",
  },
];

export const IntentionAltarInput: React.FC<IntentionAltarInputProps> = ({
  question,
  onQuestionChange,
  nickname,
  onNicknameChange,
  situation,
  onSituationChange,
  selectedCategory,
  onCategoryChange,
  persona,
}) => {
  const { isEnglish } = useLocale();

  const handleSelectSeal = (seal: MysticSeal) => {
    onCategoryChange(seal.category);
    onQuestionChange(isEnglish ? (seal.promptSeedEn || seal.promptSeed) : seal.promptSeed);
  };

  const [touchedNickname, setTouchedNickname] = React.useState(false);
  const [touchedQuestion, setTouchedQuestion] = React.useState(false);

  const isNicknameEmpty = touchedNickname && !nickname.trim();
  const isQuestionEmpty = touchedQuestion && !question.trim();

  return (
    <div className="w-full rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-5 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Background Sacred Geometric Aura */}

      {/* Persona Welcoming Sanctuary Dialogue */}
      <div className="flex items-start gap-3.5 p-4 rounded-lg bg-[#F3EDE2] border border-[#D9C8AC] relative overflow-hidden">
        <div className="w-10 h-15 rounded-lg border-2 border-[#D9C8AC] overflow-hidden flex-shrink-0 bg-[#FFFFFF]">
          <CardImage
            image={persona?.cardImage || "major-02.jpg"}
            alt={isEnglish ? (persona?.nameEn || persona?.nameTh || "Tarot Reader") : (persona?.nameTh || "แม่หมอ")}
            className="w-full h-full object-cover object-top contrast-[1.05] tarot-hd-card-image"
            sizes="40px"
          />
        </div>
        <div className="space-y-1 my-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-serif-th font-bold font-mystic-gold">
              {isEnglish ? (persona?.nameEn || persona?.nameTh || "Tarot Reader") : (persona?.nameTh || "แม่หมอประจำวิหาร")}
            </span>
            <span className="text-[13px] text-[#635B4E] font-serif-th">
              {isEnglish ? "· Initial Intention" : "· ให้ข้อมูลเบื้องต้น"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#2E211A] leading-relaxed font-serif-th">
            {isEnglish
              ? persona?.id === "direct"
                ? `"Hello ${nickname.trim() || "seeker"}. Speak freely and tell me what is truly on your mind or what you wish to see clearly. The cards will give you direct, honest answers."`
                : persona?.id === "mystic"
                  ? `"Welcome, ${nickname.trim() || "seeker"}. Take a deep, grounding breath, center your spirit, and share whatever situation or question is calling for cosmic guidance."`
                  : `"Hello ${nickname.trim() || "friend"}! Whatever has been weighing on your heart today, take comfort in knowing this is a safe, compassionate space. What would you like to explore?"`
              : persona?.id === "direct"
                ? `"สวัสดีคุณ ${nickname.trim() || "คนสำคัญ"} เล่าให้แม่หมอฟังตรงๆ ได้เลยนะว่าตอนนี้มีเรื่องอะไรในใจ หรืออยากรู้เรื่องไหนเป็นพิเศษ จะได้เปิดไพ่ตอบให้ชัดเจนตรงประเด็น"`
                : persona?.id === "mystic"
                  ? `"สวัสดีคุณ ${nickname.trim() || "คนสำคัญ"} หายใจเข้าลึกๆ ผ่อนคลาย แล้วพิมพ์เรื่องราวหรือคำถามที่ต้องการคำแนะนำมาได้เลยนะ"`
                  : `"สวัสดีจ้าคุณ ${nickname.trim() || "คนดี"} วันนี้มีเรื่องอะไรที่ทำให้คิดมาก หรืออยากให้แม่หมอช่วยดูและให้กำลังใจ เล่าให้ฟังได้เลยนะ"`}
          </p>
        </div>
      </div>

      {/* Step 1 & 2: Name & Situation Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Step 1: Nickname */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="altar-nickname"
              className="text-xs sm:text-sm text-[#2E211A] flex items-center gap-1.5 font-serif-th font-bold [text-wrap:balance]"
            >
              <span className="text-[#8F5C1A]">✦</span> {isEnglish ? "1. Your Name or Pseudonym" : "1. ชื่อเล่นของคุณ"}{" "}
              <span className="whitespace-nowrap text-[#A6392C] font-mono text-xs">{isEnglish ? "(Required *)" : "(จำเป็น *)"}</span>
            </label>
            <span className="text-[13px] text-[#635B4E] font-mono">{nickname.length}/24</span>
          </div>
          <input
            id="altar-nickname"
            type="text"
            maxLength={24}
            value={nickname}
            onBlur={() => setTouchedNickname(true)}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder={isEnglish ? "e.g., Alex, Jordan, Taylor, Casey" : "เช่น ฟ้า, บิ๊ก, พลอย, เมย์"}
            className={`w-full bg-[#FFFFFF] rounded-lg px-4 py-3 text-xs sm:text-sm text-[#2E211A] placeholder-[#6F5B4A]/70 focus:outline-none transition-all duration-200 ${
              isNicknameEmpty
                ? "border border-[#A6392C] focus:border-[#A6392C] focus:ring-1 focus:ring-[#A6392C]"
                : "border border-[#D9C8AC] focus:border-[#8F5C1A] focus:ring-1 focus:ring-[#8F5C1A]"
            }`}
          />
        </div>

        {/* Step 2: Custom Situation */}
        <div className="space-y-1.5">
          <label
            htmlFor="altar-situation"
            className="text-xs sm:text-sm text-[#2E211A] flex items-center gap-1.5 font-serif-th font-bold [text-wrap:balance]"
          >
            <span className="text-[#8F5C1A]">✦</span> {isEnglish ? "2. Brief Context or Situation" : "2. เล่าเรื่องราวหรือสถานการณ์คร่าวๆ"}{" "}
            <span className="whitespace-nowrap text-[13px] text-[#635B4E] font-normal">{isEnglish ? "(Helps ground the reading)" : "(ช่วยให้อ่านได้ตรงจุดยิ่งขึ้น)"}</span>
          </label>
          <input
            id="altar-situation"
            type="text"
            maxLength={100}
            value={situation}
            onChange={(e) => onSituationChange(e.target.value)}
            placeholder={isEnglish ? "e.g., Navigating relationship friction / Awaiting job interview results" : "เช่น กำลังคุยกับคนเก่า / กำลังรอผลสัมภาษณ์งาน"}
            className="w-full bg-[#FFFFFF] border border-[#D9C8AC] focus:border-[#8F5C1A] focus:ring-1 focus:ring-[#8F5C1A] rounded-lg px-4 py-3 text-xs sm:text-sm text-[#2E211A] placeholder-[#6F5B4A]/70 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Quick Situation Selector Chips */}
      <div className="space-y-2">
        <span className="text-[13px] text-[#635B4E] font-serif-th">
          {isEnglish ? "✦ Or tap a quick situation:" : "✦ หรือแตะเลือกเรื่องราวด่วน:"}
        </span>
        <div className="flex flex-wrap gap-2">
          {(isEnglish
            ? [
                "Just starting out, discerning direction",
                "Facing obstacles, seeking a breakthrough",
                "At a crossroads between two choices",
                "Seeking an overview & spiritual guidance",
              ]
            : [
                "เพิ่งเริ่มต้น กำลังดูทิศทาง",
                "ติดปัญหา อยากหาทางออก",
                "กำลังลังเล เลือกระหว่าง 2 ทาง",
                "อยากรู้ภาพรวมและคำแนะนำ",
              ]
          ).map((sit) => (
            <button
              key={sit}
              type="button"
              onClick={() => onSituationChange(sit)}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif-th transition-all cursor-pointer ${
                situation === sit
                  ? "bg-[#8F5C1A] text-[#FFFFFF] font-bold"
                  : "bg-[#F3EDE2] text-[#2E211A] hover:bg-[#FFFFFF]/30 border border-[#D9C8AC]"
              }`}
            >
              {sit}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Main Mystic Question Textarea */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label
            htmlFor="altar-question"
            className="text-xs sm:text-sm text-[#2E211A] flex items-center gap-1.5 font-serif-th font-bold [text-wrap:balance]"
          >
            <span className="text-[#8F5C1A]">✦</span> {isEnglish ? "3. The Core Question on Your Heart" : "3. คำถามที่คุณอยากรู้มากที่สุด"}{" "}
            <span className="whitespace-nowrap text-[#A6392C] font-mono text-xs">{isEnglish ? "(Required *)" : "(จำเป็น *)"}</span>
          </label>
          <span className="text-[13px] text-[#635B4E] font-mono">{question.length}/300</span>
        </div>
        <div className="relative group">
          <textarea
            id="altar-question"
            rows={3}
            maxLength={300}
            value={question}
            onBlur={() => setTouchedQuestion(true)}
            onChange={(e) => onQuestionChange(e.target.value)}
            placeholder={
              isEnglish
                ? "Type the inquiry you wish the cards to illuminate, e.g., What is the trajectory of this relationship and how should I best guard my peace? / Will this career move align with my long-term purpose?..."
                : "พิมพ์คำถามที่คุณอยากให้ไพ่ช่วยชี้ทาง เช่น ความสัมพันธ์กับเขาจะมีทิศทางอย่างไร / งานใหม่ที่กำลังจะย้ายไปจะดีไหม..."
            }
            className={`w-full bg-[#FFFFFF] rounded-lg p-4 text-xs sm:text-sm text-[#2E211A] placeholder-[#6F5B4A]/70 focus:outline-none transition-all duration-200 leading-relaxed resize-none ${
              isQuestionEmpty
                ? "border border-[#A6392C] focus:border-[#A6392C] focus:ring-2 focus:ring-[#A6392C]/30"
                : "border border-[#D9C8AC] group-hover:border-[#8F5C1A] focus:border-[#8F5C1A] focus:ring-2 focus:ring-[#8F5C1A]/30"
            }`}
          />
        </div>
      </div>

      {/* 4 Authentic 1909 Rider-Waite Cards for Quick Question Selection */}
      <div className="space-y-3 pt-2 border-t border-[#D9C8AC]/30">
        <label className="text-xs sm:text-sm font-serif-th font-bold text-[#2E211A] tracking-wide flex items-center gap-2 [text-wrap:balance]">
          <span className="text-[#8F5C1A]">✦</span>{" "}
          {isEnglish
            ? "Or select a preset question (tap to apply):"
            : "หรือเลือกหัวข้อคำถามสำเร็จรูป (แตะเพื่อใช้งานทันที)"}
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          {MYSTIC_SEALS.map((seal) => {
            const isActive = Boolean(
              selectedCategory === seal.category &&
              (question === seal.promptSeed ||
                question === seal.promptSeedEn ||
                question.includes(seal.title) ||
                (seal.titleEn && question.includes(seal.titleEn)))
            );

            return (
              <motion.div
                key={seal.id}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={isEnglish ? `Select preset topic: ${seal.titleEn || seal.title}` : `เลือกหัวข้อสำเร็จรูป: ${seal.title}`}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectSeal(seal)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectSeal(seal);
                  }
                }}
                className={`rounded-lg border transition-all duration-300 cursor-pointer flex flex-col justify-between p-3 sm:p-4 relative overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] ${
                  isActive
                    ? "bg-[#FFFFFF] border-[#D9C8AC] ring-2 ring-[#8F5C1A]/50 shadow-[var(--shadow-overlay)]"
                    : "bg-[#F3EDE2] border-[#D9C8AC] hover:border-[#8F5C1A] hover:bg-[#FAF7F2]"
                }`}
                style={{ minHeight: "260px" }}
              >
                {/* Top Card Badge: Roman Numeral & Title */}
                <div className="flex items-center justify-between text-[13px] text-[#635B4E] font-mono pb-1.5 border-b border-[#D9C8AC]/30">
                  <span className="text-[#2E211A] font-bold bg-[#F3EDE2]/25 px-1.5 py-0.5 rounded">
                    {seal.romanNum}
                  </span>
                  <span className="tracking-widest uppercase text-[12px] truncate max-w-[90px] text-[#635B4E]">
                    {seal.majorCard}
                  </span>
                </div>

                {/* Center Authentic 1909 Rider-Waite Image */}
                <div className="my-auto py-1 flex items-center justify-center">
                  <div className="w-18 h-28 sm:w-20 sm:h-30 rounded-lg border border-[#D9C8AC] overflow-hidden ">
                    <CardImage
                      image={seal.image}
                      alt={isEnglish ? (seal.titleEn || seal.title) : seal.title}
                      className="w-full h-full object-cover object-top tarot-hd-card-image"
                      sizes="112px"
                    />
                  </div>
                </div>

                {/* Bottom Card Title & Subtitle */}
                <div className="text-center pt-2 border-t border-[#D9C8AC]/30">
                  <h4 className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A] group-hover:text-[#8F5C1A] transition-colors">
                    {isEnglish ? (seal.titleEn || seal.title) : seal.title}
                  </h4>
                  <p className="text-[12px] text-[#635B4E] mt-0.5">
                    {isEnglish ? (seal.subtitleEn || seal.subtitle) : seal.subtitle}
                  </p>
                </div>

                {/* Holographic Sheen Layer */}
                <div className="gold-foil-sheen absolute inset-0 opacity-15 hover:opacity-30 transition-opacity" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
