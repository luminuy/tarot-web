"use client";

import React from "react";
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
  /** ของไม่บังคับเพิ่มเติมจาก TarotFlow (เรื่องที่ติดตาม · ใจตอนนี้) — อยู่ในกล่องพับ "เพิ่มรายละเอียด" */
  children?: React.ReactNode;
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
  children,
}) => {
  const { isEnglish } = useLocale();

  const handleSelectSeal = (seal: MysticSeal) => {
    onCategoryChange(seal.category);
    onQuestionChange(isEnglish ? (seal.promptSeedEn || seal.promptSeed) : seal.promptSeed);
  };

  const [touchedQuestion, setTouchedQuestion] = React.useState(false);
  const isQuestionEmpty = touchedQuestion && !question.trim();

  /*
   * v2 (เจ้าของ 2026-10-17 "ออกแบบใหม่ทั้งหมด หน้าขั้นตอนดูไพ่") — คำถามมาก่อน
   * v1: ชื่อเล่น ➔ สถานการณ์ ➔ ชิป ➔ คำถาม (ช่องเดียวที่จำเป็นอยู่ลำดับที่ 3) ➔ การ์ดหัวข้อสูง 260px
   * v2: คำทักของแม่หมอ ➔ **คำถาม** ➔ หัวข้อสำเร็จรูปเป็นชิป ➔ รายละเอียดเพิ่ม (ไม่บังคับ) พับเก็บ
   */
  return (
    <div className="v2-in w-full relative">
      {/* Persona Welcoming Sanctuary Dialogue */}
      <div className="v2-in-greet">
        <div className="v2-in-greet-img overflow-hidden flex-shrink-0">
          <CardImage
            image={persona?.cardImage || "major-02.jpg"}
            /* ภาพประกอบล้วน — ข้อความข้าง ๆ บอกชื่อเดียวกันอยู่แล้ว (INC-0125) — <span> ข้างภาพพิมพ์ชื่อแม่หมออยู่แล้ว */
            alt=""
            className="w-full h-full object-cover object-top contrast-[1.05] tarot-hd-card-image"
            sizes="40px"
          />
        </div>
        <div className="v2-in-greet-say space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-serif-th font-bold font-mystic-gold">
              {isEnglish ? (persona?.nameEn || persona?.nameTh || "Tarot Reader") : (persona?.nameTh || "แม่หมอประจำวิหาร")}
            </span>
            <span className="text-[13px] text-muted font-serif-th">
              {isEnglish ? "· Initial Intention" : "· ให้ข้อมูลเบื้องต้น"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-deep leading-relaxed font-serif-th">
            {isEnglish
              ? persona?.id === "direct"
                ? `"Hello ${nickname.trim() || "seeker"}. Speak freely and tell me what is truly on your mind or what you wish to see clearly. The cards will give you direct, honest answers."`
                : persona?.id === "mystic"
                  ? `"Welcome, ${nickname.trim() || "seeker"}. Take a deep, grounding breath, center your spirit, and share whatever situation or question is calling for cosmic guidance."`
                  : `"Hello ${nickname.trim() || "friend"}! Whatever has been weighing on your heart today, take comfort in knowing this is a safe, compassionate space. What would you like to explore?"`
              : persona?.id === "direct"
                ? `"สวัสดีคุณ ${nickname.trim() || "คนสำคัญ"} เล่าให้แม่หมอฟังตรง ๆ ได้เลยนะว่าตอนนี้มีเรื่องอะไรในใจ หรืออยากรู้เรื่องไหนเป็นพิเศษ จะได้เปิดไพ่ตอบให้ชัดเจนตรงประเด็น"`
                : persona?.id === "mystic"
                  ? `"สวัสดีคุณ ${nickname.trim() || "คนสำคัญ"} หายใจเข้าลึก ๆ ผ่อนคลาย แล้วพิมพ์เรื่องราวหรือคำถามที่ต้องการคำแนะนำมาได้เลยนะ"`
                  : `"สวัสดีจ้าคุณ ${nickname.trim() || "คนดี"} วันนี้มีเรื่องอะไรที่ทำให้คิดมาก หรืออยากให้แม่หมอช่วยดูและให้กำลังใจ เล่าให้ฟังได้เลยนะ"`}
          </p>
        </div>
      </div>

      {/* Step 3: Main Mystic Question Textarea */}
      <div className="v2-in-q space-y-2">
        <div className="flex justify-between items-center">
          <label
            htmlFor="altar-question"
            className="text-xs sm:text-sm text-ink-deep flex items-center gap-1.5 font-serif-th font-bold [text-wrap:balance]"
          >
            {isEnglish ? "The Core Question on Your Heart" : "คำถามที่คุณอยากรู้มากที่สุด"}
            <span className="whitespace-nowrap text-err font-mono text-xs">{isEnglish ? "(Required *)" : "(จำเป็น *)"}</span>
          </label>
          <span className="text-[13px] text-muted font-mono">{question.length}/300</span>
        </div>
        <div className="relative group">
          <textarea
            id="altar-question"
            rows={4}
            maxLength={300}
            value={question}
            onBlur={() => setTouchedQuestion(true)}
            onChange={(e) => onQuestionChange(e.target.value)}
            placeholder={
              isEnglish
                ? "Type the inquiry you wish the cards to illuminate, e.g., What is the trajectory of this relationship and how should I best guard my peace? / Will this career move align with my long-term purpose?..."
                : "พิมพ์คำถามที่คุณอยากให้ไพ่ช่วยชี้ทาง เช่น ความสัมพันธ์กับเขาจะมีทิศทางอย่างไร / งานใหม่ที่กำลังจะย้ายไปจะดีไหม..."
            }
            className={`v2-in-textarea w-full bg-surface rounded-lg p-4 text-xs sm:text-sm text-ink-deep placeholder-ink-soft/70 focus:outline-none transition duration-200 leading-relaxed resize-none ${
              isQuestionEmpty
                ? "border border-err focus:border-err focus:ring-2 focus:ring-err/30"
                : "border border-line-interactive-warm group-hover:border-gold-ink focus:border-gold-ink focus:ring-2 focus:ring-gold-ink/30"
            }`}
          />
        </div>
      </div>

      {/* หัวข้อสำเร็จรูป — ชิปพร้อมภาพไพ่ แตะแล้วเติมคำถามให้ (v1 เป็นการ์ดสูง 260px สี่ใบ ดันเนื้อหาลงไปไกล) */}
      <div className="v2-in-topics">
        <p className="v2-in-topics-k">
          {isEnglish ? "Or select a preset question (tap to apply):" : "หรือเลือกหัวข้อคำถามสำเร็จรูป (แตะเพื่อใช้งานทันที)"}
        </p>
        <div className="v2-in-topic-row">
          {MYSTIC_SEALS.map((seal) => {
            const isActive = Boolean(
              selectedCategory === seal.category &&
                (question === seal.promptSeed ||
                  question === seal.promptSeedEn ||
                  question.includes(seal.title) ||
                  (seal.titleEn && question.includes(seal.titleEn))),
            );
            return (
              <button
                key={seal.id}
                type="button"
                aria-pressed={isActive}
                aria-label={isEnglish ? `Select preset topic: ${seal.titleEn || seal.title}` : `เลือกหัวข้อสำเร็จรูป: ${seal.title}`}
                onClick={() => handleSelectSeal(seal)}
                className="v2-in-topic"
              >
                <span className="v2-in-topic-img" aria-hidden="true">
                  <CardImage image={seal.image} alt="" className="w-full h-full object-cover object-top" sizes="40px" />
                </span>
                <span className="v2-in-topic-txt">
                  <b>{isEnglish ? seal.titleEn || seal.title : seal.title}</b>
                  <small>{isEnglish ? seal.subtitleEn || seal.subtitle : seal.subtitle}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* รายละเอียดเพิ่ม — ไม่บังคับ พับไว้ (เปิดค้างถ้ากรอกไว้แล้ว) */}
      <details className="v2-in-more" open={nickname || situation ? true : undefined}>
        <summary>
          {isEnglish ? "Add details for the reader" : "เพิ่มรายละเอียดให้แม่หมอ"}
          <span>{isEnglish ? "Optional" : "ไม่บังคับ"}</span>
        </summary>
        <div className="v2-in-more-body space-y-5">
          {/* Step 1 & 2: Name & Situation Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 1: Nickname */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="altar-nickname"
                  className="text-xs sm:text-sm text-ink-deep flex items-center gap-1.5 font-serif-th font-bold [text-wrap:balance]"
                >
                  {isEnglish ? "Your Name or Pseudonym" : "ชื่อเล่นของคุณ"}
                  <span className="whitespace-nowrap text-muted font-serif-th text-xs font-normal">{isEnglish ? "(Optional)" : "(ไม่บังคับ)"}</span>
                </label>
                <span className="text-[13px] text-muted font-mono">{nickname.length}/24</span>
              </div>
              <input
                id="altar-nickname"
                type="text"
                maxLength={24}
                value={nickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                placeholder={isEnglish ? "e.g., Alex, Jordan (or leave blank)" : "เช่น ฟ้า, บิ๊ก, พลอย (เว้นว่างได้)"}
                className="glass-field w-full rounded-lg px-4 py-3 text-xs sm:text-sm text-ink-deep placeholder-ink-soft/70 focus:outline-none transition duration-200 border border-line-interactive-warm focus:border-gold-ink focus:ring-1 focus:ring-gold-ink"
              />
            </div>

            {/* Step 2: Custom Situation */}
            <div className="space-y-1.5">
              <label
                htmlFor="altar-situation"
                className="text-xs sm:text-sm text-ink-deep flex items-center gap-1.5 font-serif-th font-bold [text-wrap:balance]"
              >
                {isEnglish ? "Brief Context or Situation" : "เล่าเรื่องราวหรือสถานการณ์คร่าว ๆ"}
                <span className="whitespace-nowrap text-[13px] text-muted font-normal">{isEnglish ? "(Helps ground the reading)" : "(ช่วยให้อ่านได้ตรงจุดยิ่งขึ้น)"}</span>
              </label>
              <input
                id="altar-situation"
                type="text"
                maxLength={100}
                value={situation}
                onChange={(e) => onSituationChange(e.target.value)}
                placeholder={isEnglish ? "e.g., Navigating relationship friction / Awaiting job interview results" : "เช่น กำลังคุยกับคนเก่า / กำลังรอผลสัมภาษณ์งาน"}
                className="glass-field w-full border border-line-interactive-warm focus:border-gold-ink focus:ring-1 focus:ring-gold-ink rounded-lg px-4 py-3 text-xs sm:text-sm text-ink-deep placeholder-ink-soft/70 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Quick Situation Selector Chips */}
          <div className="space-y-2">
            <span className="text-[13px] text-muted font-serif-th">
              {isEnglish ? "Or tap a quick situation:" : "หรือแตะเลือกเรื่องราวด่วน:"}
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
                  className={`tap-overlay-y px-3 py-1.5 rounded-lg text-xs font-serif-th transition cursor-pointer ${
                    situation === sit
                      ? "bg-gold-ink text-surface font-bold"
                      : "bg-inset-warm text-ink-deep hover:bg-surface/30 border border-line-warm"
                  }`}
                >
                  {sit}
                </button>
              ))}
            </div>
          </div>

          {children}
        </div>
      </details>
    </div>
  );
};
