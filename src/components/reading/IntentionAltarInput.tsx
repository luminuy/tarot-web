"use client";

import React from "react";
import { motion } from "motion/react";
import type { Category } from "@/data/cards/types";
import type { Persona } from "@/data/personas";
import { CardImage } from "@/components/card/CardImage";

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
  subtitle: string;
  promptSeed: string;
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
    subtitle: "ความรู้สึก & ทิศทาง",
    promptSeed: "ความสัมพันธ์กับคนที่อยู่ในใจตอนนี้มีแนวโน้มเป็นอย่างไร และควรวางตัวอย่างไร",
    majorCard: "THE LOVERS",
    romanNum: "VI",
    image: "/cards/major-06.jpg",
    accent: "#ec4899",
  },
  {
    id: "career",
    category: "work",
    title: "การงาน & อนาคต",
    subtitle: "โอกาส & การเติบโต",
    promptSeed: "ทิศทางการงานและโอกาสสำคัญในช่วงนี้ ควรระวังและมุ่งเน้นสิ่งใด",
    majorCard: "THE CHARIOT",
    romanNum: "VII",
    image: "/cards/major-07.jpg",
    accent: "#f59e0b",
  },
  {
    id: "finance",
    category: "money",
    title: "การเงิน & โชคลาภ",
    subtitle: "ความมั่งคั่ง & จังหวะ",
    promptSeed: "การหมุนเวียนทางการเงิน โชคลาภ และสิ่งที่จะช่วยเปิดทางความมั่งคั่ง",
    majorCard: "WHEEL OF FORTUNE",
    romanNum: "X",
    image: "/cards/major-10.jpg",
    accent: "#10b981",
  },
  {
    id: "general",
    category: "general",
    title: "พลังงานรวม & ชีวิต",
    subtitle: "คำแนะนำสำหรับตัวตน",
    promptSeed: "พลังงานโดยรวมในชีวิตช่วงนี้ สิ่งที่จักรวาลกำลังเตือน และบทเรียนสำคัญ",
    majorCard: "THE STAR",
    romanNum: "XVII",
    image: "/cards/major-17.jpg",
    accent: "#a855f7",
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
  const handleSelectSeal = (seal: MysticSeal) => {
    onCategoryChange(seal.category);
    onQuestionChange(seal.promptSeed);
  };

  const [touchedNickname, setTouchedNickname] = React.useState(false);
  const [touchedQuestion, setTouchedQuestion] = React.useState(false);

  const isNicknameEmpty = touchedNickname && !nickname.trim();
  const isQuestionEmpty = touchedQuestion && !question.trim();

  return (
    <div className="w-full rounded-[1.618rem] border border-[#D6B48D] bg-[#FDF7F0] p-5 sm:p-8 shadow-md space-y-6 relative overflow-hidden">
      {/* Background Sacred Geometric Aura */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#E4C09F]/20 via-transparent to-transparent pointer-events-none blur-2xl" />

      {/* Persona Welcoming Sanctuary Dialogue */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FCF0E6] border border-[#D6B48D] shadow-xs relative overflow-hidden">
        <div className="w-10 h-15 rounded-lg border-2 border-[#D6B48D] overflow-hidden flex-shrink-0 shadow-xs bg-[#FDF7F0]">
          <CardImage
            image={persona?.cardImage || "major-02.jpg"}
            alt={persona?.nameTh || "แม่หมอ"}
            className="w-full h-full object-cover object-top contrast-[1.05] tarot-hd-card-image"
            sizes="40px"
          />
        </div>
        <div className="space-y-1 my-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-serif-th font-bold font-mystic-gold">
              {persona?.nameTh || "แม่หมอประจำวิหาร"}
            </span>
            <span className="text-[10px] text-[#8C735D] font-serif-th">
              · ให้ข้อมูลเบื้องต้น
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5A432F] leading-relaxed font-serif-th">
            {persona?.id === "direct"
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
            <label htmlFor="altar-nickname" className="text-xs sm:text-sm text-[#5A432F] flex items-center gap-1.5 font-serif-th font-bold">
              <span className="text-[#CD9F5B]">✦</span> 1. ชื่อเล่นของคุณ <span className="text-rose-600 font-mono text-xs">(จำเป็น *)</span>
            </label>
            <span className="text-[10px] text-[#8C735D] font-mono">{nickname.length}/24</span>
          </div>
          <input
            id="altar-nickname"
            type="text"
            maxLength={24}
            value={nickname}
            onBlur={() => setTouchedNickname(true)}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder="เช่น ฟ้า, บิ๊ก, พลอย, เมย์"
            className={`w-full bg-[#FFFFFF] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#5A432F] placeholder-[#8C735D]/70 focus:outline-none transition-all duration-200 ${
              isNicknameEmpty
                ? "border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                : "border border-[#D6B48D] focus:border-[#CD9F5B] focus:ring-1 focus:ring-[#CD9F5B]"
            }`}
          />
        </div>

        {/* Step 2: Custom Situation */}
        <div className="space-y-1.5">
          <label htmlFor="altar-situation" className="text-xs sm:text-sm text-[#5A432F] flex items-center gap-1.5 font-serif-th font-bold">
            <span className="text-[#CD9F5B]">✦</span> 2. เล่าเรื่องราวหรือสถานการณ์คร่าวๆ <span className="text-[10px] text-[#8C735D] font-normal">(ช่วยให้อ่านได้ตรงจุดยิ่งขึ้น)</span>
          </label>
          <input
            id="altar-situation"
            type="text"
            maxLength={100}
            value={situation}
            onChange={(e) => onSituationChange(e.target.value)}
            placeholder="เช่น กำลังคุยกับคนเก่า / กำลังรอผลสัมภาษณ์งาน"
            className="w-full bg-[#FFFFFF] border border-[#D6B48D] focus:border-[#CD9F5B] focus:ring-1 focus:ring-[#CD9F5B] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#5A432F] placeholder-[#8C735D]/70 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Quick Situation Selector Chips */}
      <div className="space-y-2">
        <span className="text-[11px] text-[#8C735D] font-serif-th">
          ✦ หรือแตะเลือกเรื่องราวด่วน:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            "เพิ่งเริ่มต้น กำลังดูทิศทาง",
            "ติดปัญหา อยากหาทางออก",
            "กำลังลังเล เลือกระหว่าง 2 ทาง",
            "อยากรู้ภาพรวมและคำแนะนำ",
          ].map((sit) => (
            <button
              key={sit}
              type="button"
              onClick={() => onSituationChange(sit)}
              className={`px-3 py-1.5 rounded-xl text-xs font-serif-th transition-all cursor-pointer ${
                situation === sit
                  ? "bg-[#CD9F5B] text-[#FDF7F0] font-bold shadow-xs"
                  : "bg-[#FCF0E6] text-[#5A432F] hover:bg-[#E4C09F]/30 border border-[#D6B48D]"
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
          <label htmlFor="altar-question" className="text-xs sm:text-sm text-[#5A432F] flex items-center gap-1.5 font-serif-th font-bold">
            <span className="text-[#CD9F5B]">✦</span> 3. คำถามที่คุณอยากรู้มากที่สุด <span className="text-rose-600 font-mono text-xs">(จำเป็น *)</span>
          </label>
          <span className="text-[10px] text-[#8C735D] font-mono">{question.length}/300</span>
        </div>
        <div className="relative group">
          <textarea
            id="altar-question"
            rows={3}
            maxLength={300}
            value={question}
            onBlur={() => setTouchedQuestion(true)}
            onChange={(e) => onQuestionChange(e.target.value)}
            placeholder="พิมพ์คำถามที่คุณอยากให้ไพ่ช่วยชี้ทาง เช่น ความสัมพันธ์กับเขาจะมีทิศทางอย่างไร / งานใหม่ที่กำลังจะย้ายไปจะดีไหม..."
            className={`w-full bg-[#FFFFFF] rounded-2xl p-4 text-xs sm:text-sm text-[#5A432F] placeholder-[#8C735D]/70 focus:outline-none transition-all duration-200 leading-relaxed resize-none ${
              isQuestionEmpty
                ? "border border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-400/30"
                : "border border-[#D6B48D] group-hover:border-[#CD9F5B] focus:border-[#CD9F5B] focus:ring-2 focus:ring-[#CD9F5B]/30"
            }`}
          />
        </div>
      </div>

      {/* 4 Authentic 1909 Rider-Waite Cards for Quick Question Selection */}
      <div className="space-y-3 pt-2 border-t border-[#D6B48D]/30">
        <label className="text-xs sm:text-sm font-serif-th font-bold text-[#5A432F] tracking-wide flex items-center gap-2">
          <span className="text-[#CD9F5B]">✦</span> หรือเลือกหัวข้อคำถามสำเร็จรูป (แตะเพื่อใช้งานทันที)
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          {MYSTIC_SEALS.map((seal) => {
            const isActive =
              selectedCategory === seal.category &&
              (question === seal.promptSeed || question.includes(seal.title));

            return (
              <motion.div
                key={seal.id}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`เลือกหัวข้อสำเร็จรูป: ${seal.title}`}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectSeal(seal)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectSeal(seal);
                  }
                }}
                className={`rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between p-3 sm:p-4 relative overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] ${
                  isActive
                    ? "bg-[#FFFFFF] border-[#CD9F5B] ring-2 ring-[#CD9F5B]/50 shadow-[0_8px_30px_rgba(205,159,91,0.25)]"
                    : "bg-[#FCF0E6] border-[#D6B48D] hover:border-[#CD9F5B] hover:bg-[#FFFFFF] shadow-sm"
                }`}
                style={{ minHeight: "260px" }}
              >
                {/* Top Card Badge: Roman Numeral & Title */}
                <div className="flex items-center justify-between text-[10px] text-[#8C735D] font-mono pb-1.5 border-b border-[#D6B48D]/30">
                  <span className="text-[#5A432F] font-bold bg-[#E4C09F]/25 px-1.5 py-0.5 rounded">
                    {seal.romanNum}
                  </span>
                  <span className="tracking-widest uppercase text-[9px] truncate max-w-[90px] text-[#8C735D]">
                    {seal.majorCard}
                  </span>
                </div>

                {/* Center Authentic 1909 Rider-Waite Image */}
                <div className="my-auto py-1 flex items-center justify-center">
                  <div className="w-18 h-28 sm:w-20 sm:h-30 rounded-lg border border-[#D6B48D] overflow-hidden shadow-xs">
                    <CardImage
                      image={seal.image}
                      alt={seal.title}
                      className="w-full h-full object-cover object-top tarot-hd-card-image"
                      sizes="112px"
                    />
                  </div>
                </div>

                {/* Bottom Card Title & Subtitle */}
                <div className="text-center pt-2 border-t border-[#D6B48D]/30">
                  <h4 className="font-serif-th text-xs sm:text-sm font-bold text-[#5A432F] group-hover:text-[#CD9F5B] transition-colors">
                    {seal.title}
                  </h4>
                  <p className="text-[9.5px] text-[#8C735D] mt-0.5">{seal.subtitle}</p>
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
