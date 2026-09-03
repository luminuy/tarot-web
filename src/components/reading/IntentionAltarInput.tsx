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
    accent: "#8F5C1A",
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
    accent: "#8F5C1A",
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
    accent: "#8F5C1A",
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
  const handleSelectSeal = (seal: MysticSeal) => {
    onCategoryChange(seal.category);
    onQuestionChange(seal.promptSeed);
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
            <span className="text-[13px] text-[#635B4E] font-serif-th">· ให้ข้อมูลเบื้องต้น</span>
          </div>
          <p className="text-xs sm:text-sm text-[#2E211A] leading-relaxed font-serif-th">
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
            <label
              htmlFor="altar-nickname"
              className="text-xs sm:text-sm text-[#2E211A] flex items-center gap-1.5 font-serif-th font-bold"
            >
              <span className="text-[#8F5C1A]">✦</span> 1. ชื่อเล่นของคุณ{" "}
              <span className="text-[#A6392C] font-mono text-xs">(จำเป็น *)</span>
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
            placeholder="เช่น ฟ้า, บิ๊ก, พลอย, เมย์"
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
            className="text-xs sm:text-sm text-[#2E211A] flex items-center gap-1.5 font-serif-th font-bold"
          >
            <span className="text-[#8F5C1A]">✦</span> 2. เล่าเรื่องราวหรือสถานการณ์คร่าวๆ{" "}
            <span className="text-[13px] text-[#635B4E] font-normal">(ช่วยให้อ่านได้ตรงจุดยิ่งขึ้น)</span>
          </label>
          <input
            id="altar-situation"
            type="text"
            maxLength={100}
            value={situation}
            onChange={(e) => onSituationChange(e.target.value)}
            placeholder="เช่น กำลังคุยกับคนเก่า / กำลังรอผลสัมภาษณ์งาน"
            className="w-full bg-[#FFFFFF] border border-[#D9C8AC] focus:border-[#8F5C1A] focus:ring-1 focus:ring-[#8F5C1A] rounded-lg px-4 py-3 text-xs sm:text-sm text-[#2E211A] placeholder-[#6F5B4A]/70 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Quick Situation Selector Chips */}
      <div className="space-y-2">
        <span className="text-[13px] text-[#635B4E] font-serif-th">✦ หรือแตะเลือกเรื่องราวด่วน:</span>
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
            className="text-xs sm:text-sm text-[#2E211A] flex items-center gap-1.5 font-serif-th font-bold"
          >
            <span className="text-[#8F5C1A]">✦</span> 3. คำถามที่คุณอยากรู้มากที่สุด{" "}
            <span className="text-[#A6392C] font-mono text-xs">(จำเป็น *)</span>
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
            placeholder="พิมพ์คำถามที่คุณอยากให้ไพ่ช่วยชี้ทาง เช่น ความสัมพันธ์กับเขาจะมีทิศทางอย่างไร / งานใหม่ที่กำลังจะย้ายไปจะดีไหม..."
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
        <label className="text-xs sm:text-sm font-serif-th font-bold text-[#2E211A] tracking-wide flex items-center gap-2">
          <span className="text-[#8F5C1A]">✦</span> หรือเลือกหัวข้อคำถามสำเร็จรูป (แตะเพื่อใช้งานทันที)
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          {MYSTIC_SEALS.map((seal) => {
            const isActive =
              selectedCategory === seal.category && (question === seal.promptSeed || question.includes(seal.title));

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
                      alt={seal.title}
                      className="w-full h-full object-cover object-top tarot-hd-card-image"
                      sizes="112px"
                    />
                  </div>
                </div>

                {/* Bottom Card Title & Subtitle */}
                <div className="text-center pt-2 border-t border-[#D9C8AC]/30">
                  <h4 className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A] group-hover:text-[#8F5C1A] transition-colors">
                    {seal.title}
                  </h4>
                  <p className="text-[12px] text-[#635B4E] mt-0.5">{seal.subtitle}</p>
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
