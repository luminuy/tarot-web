"use client";

import { useState } from "react";
import Link from "next/link";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { CardImage } from "@/components/card/CardImage";
import type { TarotCard as TarotCardType } from "@/data/cards/types";
import { useLocale } from "@/lib/i18n";
import { saveReading } from "@/lib/utils/history";
import { soundManager } from "@/lib/utils/audio";
import { RitualHero } from "@/components/reading/one-card/RitualHero";
import { OneCardRitual } from "@/components/reading/one-card/OneCardRitual";

type DailyFocus = "general" | "work" | "money" | "love" | "mind";

interface FocusChamber {
  id: DailyFocus;
  titleTh: string;
  titleEn: string;
  elementTh: string;
  elementEn: string;
  descTh: string;
  descEn: string;
  /** ภาพหน้าไพ่ 1909 Rider-Waite ประจำวิหาร — ต้องเป็นไฟล์จริงใน `/public/cards/` เท่านั้น */
  cardImage: string;
  cardNameTh: string;
  cardNameEn: string;
}

const FOCUS_CHAMBERS: FocusChamber[] = [
  {
    id: "general",
    titleTh: "มหาภาพรวม",
    titleEn: "Cosmic Totality",
    elementTh: "มิติภาพรวม",
    elementEn: "General Dimension",
    descTh: "คลื่นพลังงานหลักและเข็มทิศชีวิตประจำวัน",
    descEn: "Overall energy and spiritual alignment",
    cardImage: "major-19.jpg",
    cardNameTh: "ดวงอาทิตย์",
    cardNameEn: "The Sun",
  },
  {
    id: "work",
    titleTh: "การงาน & ภารกิจ",
    titleEn: "Career & Purpose",
    elementTh: "ธาตุไฟ (Wands)",
    elementEn: "Fire Element (Wands)",
    descTh: "การตัดสินใจ ภาวะผู้นำ และความก้าวหน้า",
    descEn: "Professional decisions and purposeful action",
    cardImage: "wands-01.jpg",
    cardNameTh: "เอซไม้เท้า",
    cardNameEn: "Ace of Wands",
  },
  {
    id: "money",
    titleTh: "การเงิน & โชคลาภ",
    titleEn: "Wealth & Luck",
    elementTh: "ธาตุดิน (Pentacles)",
    elementEn: "Earth Element (Pentacles)",
    descTh: "ความมั่งคั่ง สภาพคล่อง และโชคชะตา",
    descEn: "Financial liquidity and material harmony",
    cardImage: "pentacles-01.jpg",
    cardNameTh: "เอซแห่งเหรียญ",
    cardNameEn: "Ace of Pentacles",
  },
  {
    id: "love",
    titleTh: "ความรัก & สัมพันธภาพ",
    titleEn: "Love & Bonds",
    elementTh: "ธาตุน้ำ (Cups)",
    elementEn: "Water Element (Cups)",
    descTh: "ความผูกพัน คนในใจ และความจริงในดวงใจ",
    descEn: "Emotional resonance and sacred bonds",
    cardImage: "cups-01.jpg",
    cardNameTh: "เอซแห่งถ้วย",
    cardNameEn: "Ace of Cups",
  },
  {
    id: "mind",
    titleTh: "สติปัญญา & จิตวิญญาณ",
    titleEn: "Mind & Spirit",
    elementTh: "ธาตุลม (Swords)",
    elementEn: "Air Element (Swords)",
    descTh: "ความสงบภายใน สติสัมปชัญญะ และการปล่อยวาง",
    descEn: "Mental clarity and inner stillness",
    cardImage: "swords-01.jpg",
    cardNameTh: "เอซแห่งดาบ",
    cardNameEn: "Ace of Swords",
  },
];

export function DailyClient() {
  const { isEnglish } = useLocale();

  const [selectedFocus, setSelectedFocus] = useState<DailyFocus>("general");
  const [intentionText, setIntentionText] = useState("");

  const currentChamber = FOCUS_CHAMBERS.find((c) => c.id === selectedFocus) || FOCUS_CHAMBERS[0];

  // วันที่ปัจจุบัน
  const todayDateString = new Intl.DateTimeFormat(isEnglish ? "en-US" : "th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const handleRevealed = (card: TarotCardType) => {
    try {
      const cardIdx = CARD_SUMMARIES.findIndex((c) => c.id === card.id);
      // 🃏 กฎเหล็กข้อ 14 — ห้ามกุไพ่แทนใบที่หาไม่เจอเด็ดขาด
      // เดิมเขียน `cardIndex: cardIdx >= 0 ? cardIdx : 0` ซึ่งแปลว่าถ้า id ของไพ่
      // ไม่ตรงกับ CARD_SUMMARIES (เช่นข้อมูลสองฝั่งเลื่อนกัน) ระบบจะบันทึกเป็น
      // ไพ่ลำดับ 0 = The Fool ทั้งในสมุดบันทึก ในชิปประวัติ และใน content_hash ฝั่งเซิร์ฟเวอร์
      // ทั้งที่ผู้ใช้ไม่เคยจั่วใบนั้น — ไม่บันทึกเลยดีกว่าบันทึกไพ่ผิดใบ
      if (cardIdx < 0) {
        console.error("[Daily] หาไพ่ใน CARD_SUMMARIES ไม่เจอ — ข้ามการบันทึก:", card.id);
        return;
      }
      saveReading({
        spreadId: "daily-one",
        spreadName: isEnglish ? "Daily Tarot Reading" : "ดูดวงไพ่ยิปซีรายวัน",
        category: "daily",
        personaId: "seer",
        personaName: isEnglish ? "Seer" : "ผู้หยั่งรู้",
        question: intentionText.trim() || (isEnglish ? currentChamber.descEn : currentChamber.descTh),
        cards: [
          {
            order: 1,
            positionName: isEnglish ? currentChamber.titleEn : currentChamber.titleTh,
            cardIndex: cardIdx,
            cardNameTh: card.nameTh,
            cardNameEn: card.nameEn,
            isReversed: false,
            element: card.element,
          },
        ],
        summary: card.meanings.general.upright,
      });
    } catch {
      // Ignored
    }
  };

  const breadcrumbs = [
    { label: isEnglish ? "Home" : "หน้าแรก", href: "/" },
    { label: isEnglish ? "Daily Tarot" : "ดูดวงไพ่ยิปซีรายวัน" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <RitualHero
        breadcrumbs={breadcrumbs}
        badgeText={todayDateString}
        title={isEnglish ? "Daily Tarot Oracle" : "ดูดวงไพ่ยิปซีรายวัน"}
        tagline={
          isEnglish
            ? "Align your heart with the 78 archetypes of 1909 Rider-Waite. Choose your focus chamber and draw 1 card for today's wisdom."
            : "น้อมจิตสู่ความสงบ เชื่อมโยงกับแม่พิมพ์จิตวิทยาโบราณ 1909 Rider-Waite เลือกวิหารพลังงานที่คุณต้องการเปิดรับคำแนะนำ แล้วเปิดไพ่ 1 ใบเพื่อรับแสงสว่างนำทางชีวิต"
        }
      />

      {/* Main Interactive Ritual Canvas */}
      <OneCardRitual
        spreadId="daily-one"
        spreadName={isEnglish ? "Daily Tarot" : "ไพ่ยิปซีรายวัน"}
        deckLabel={isEnglish ? `Chamber: ${currentChamber.titleEn}` : `วิหาร: ${currentChamber.titleTh}`}
        drawButtonText={isEnglish ? "Draw Today's Card" : "เปิดไพ่รับสารนำทางวันนี้"}
        intention={intentionText}
        isEnglish={isEnglish}
        onRevealed={handleRevealed}
        headerSlot={
          <div className="space-y-6">
            {/* Chamber Selection */}
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Step 1: Choose Your Daily Chamber" : "ขั้นที่ 1: เลือกวิหารเจตจำนงของวัน"}
                </span>
                <h2 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F]">
                  {isEnglish ? "Select the energy you wish to illuminate today" : "เลือกมิติพลังงานที่ต้องการเปิดรับสารนำทาง"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {FOCUS_CHAMBERS.map((chamber) => {
                  const isSelected = selectedFocus === chamber.id;
                  return (
                    <button
                      key={chamber.id}
                      type="button"
                      onClick={() => {
                        soundManager.playMenuTapSound();
                        setSelectedFocus(chamber.id);
                      }}
                      className={`group text-left p-4 sm:p-4.5 rounded-2xl border transition duration-200 cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? "altar-panel-active ring-1 ring-[#A58A5C] shadow-raised"
                          : "altar-card-porcelain hover:border-[#A58A5C]/60 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-serif-th font-semibold px-2.5 py-0.5 rounded-full border bg-[#FFFFFF] border-[#D5CEC2] text-[#8F5C1A] shadow-2xs">
                            {isEnglish ? chamber.elementEn : chamber.elementTh}
                          </span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-[#8F5C1A] bg-[#8F5C1A]"
                                : "border-[#D5CEC2] bg-transparent"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          {/* ภาพหน้าไพ่ 1909 Rider-Waite ประจำวิหาร (กฎเหล็กข้อ 8 — ต้องผ่าน <CardImage /> พร้อม sizes) */}
                          <div
                            className={`shrink-0 w-12 h-18 rounded-lg overflow-hidden border-2 bg-[#F3EDE2] shadow-sm transition duration-300 group-hover:scale-105 ${
                              isSelected ? "border-[#8F5C1A]" : "border-[#D9C8AC]"
                            }`}
                          >
                            <CardImage
                              image={chamber.cardImage}
                              alt={isEnglish ? chamber.cardNameEn : chamber.cardNameTh}
                              className="w-full h-full object-cover"
                              sizes="48px"
                            />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-serif-th font-bold text-sm sm:text-base text-[#29261F]">
                              {isEnglish ? chamber.titleEn : chamber.titleTh}
                            </h3>
                            <span className="block text-[11px] font-mono text-[#8F5C1A] font-semibold mt-0.5">
                              {chamber.cardNameEn}
                            </span>
                            <p className="text-xs font-sans text-[#635B4E] mt-1.5 leading-relaxed line-clamp-2">
                              {isEnglish ? chamber.descEn : chamber.descTh}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intention Input */}
            <div className="space-y-2">
              <label
                htmlFor="daily-intention"
                className="block text-xs sm:text-sm font-serif-th font-semibold text-[#29261F]"
              >
                {isEnglish
                  ? "Set Your Daily Intention or Focus (Optional)"
                  : "ตั้งจิตอธิษฐานหรือระบุเรื่องที่ต้องการถามประจำวัน (ไม่บังคับ)"}
              </label>
              <input
                id="daily-intention"
                type="text"
                value={intentionText}
                onChange={(e) => setIntentionText(e.target.value)}
                maxLength={150}
                placeholder={
                  isEnglish
                    ? "e.g. Guidance on today's presentation, emotional calm, peace..."
                    : "เช่น สิ่งที่ควรระวังในที่ทำงานวันนี้, แนวทางรับมือเรื่องคน, กำลังใจ..."
                }
                className="w-full rounded-xl border border-[#D5CEC2] bg-[#FAF7F2] px-4 py-3 text-xs sm:text-sm font-sans text-[#29261F] placeholder-[#635B4E]/60 focus:border-[#A58A5C] focus:outline-hidden focus:ring-1 focus:ring-[#A58A5C] transition-colors"
              />
            </div>
          </div>
        }
        renderReading={(card) => (
          <div className="space-y-6">
            <div className="border-b border-[#D5CEC2] pb-3 text-center sm:text-left">
              <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                {isEnglish ? "Daily Oracle Analysis" : "ถอดรหัสสารทำนาย 5 มิติประจำวัน"}
              </span>
              <h3 className="text-lg sm:text-xl font-serif-th font-bold text-[#29261F]">
                {isEnglish ? "The 5 Pillars of Today" : "แสงสว่างนำทาง 5 มิติ"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pillar 1: General Energy */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2 md:col-span-2">
                <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Core Energy" : "พลังงานหลักวันนี้"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                  {isEnglish ? "Atmosphere of the Day" : "พลังงานหลักแห่งรุ่งอรุณ"}
                </h4>
                <p className="text-sm font-sans text-[#29261F] leading-relaxed">
                  {card.meanings.general.upright}
                </p>
              </div>

              {/* Pillar 2: Career */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2">
                <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Career & Purpose" : "การงานและภารกิจ"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                  {isEnglish ? "Work & Decisions" : "การงาน การตัดสินใจ และความก้าวหน้า"}
                </h4>
                <p className="text-sm font-sans text-[#29261F] leading-relaxed">
                  {card.meanings.work.upright}
                </p>
              </div>

              {/* Pillar 3: Money */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2">
                <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Wealth & Finance" : "การเงินและโชคลาภ"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                  {isEnglish ? "Financial Flow" : "การเงิน สภาพคล่อง และโอกาส"}
                </h4>
                <p className="text-sm font-sans text-[#29261F] leading-relaxed">
                  {card.meanings.money.upright}
                </p>
              </div>

              {/* Pillar 4: Love */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2">
                <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Love & Relations" : "ความรักและสัมพันธภาพ"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                  {isEnglish ? "Heartspace & Bonds" : "ความสัมพันธ์และคนใกล้ชิด"}
                </h4>
                <p className="text-sm font-sans text-[#29261F] leading-relaxed">
                  {card.meanings.love.upright}
                </p>
              </div>

              {/* Pillar 5: Mindful Reflection */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2">
                <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Mindful Reflection" : "ข้อคิดเตือนใจ"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-[#29261F]">
                  {isEnglish ? "Wisdom & Mindfulness" : "สติสัมปชัญญะและสิ่งพึงระวัง"}
                </h4>
                <p className="text-sm font-sans text-[#29261F] leading-relaxed">
                  {card.meanings.self.upright}
                </p>
              </div>
            </div>
          </div>
        )}
        recommendations={
          <div className="space-y-4">
            <h3 className="text-base font-serif-th font-bold text-[#29261F] text-center sm:text-left">
              {isEnglish ? "Recommended Sacred Readings" : "ผังพยากรณ์ที่แนะนำเพิ่มเติม"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/love/1-card"
                className="altar-card-porcelain rounded-xl p-4 block text-left transition"
              >
                <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Love Tarot" : "ความรัก"}
                </span>
                <h4 className="text-sm font-serif-th font-bold text-[#29261F] mt-1">
                  {isEnglish ? "1-Card Love Oracle" : "ดูดวงความรัก 1 ใบ"}
                </h4>
                <p className="text-xs text-[#635B4E] mt-1">
                  {isEnglish
                    ? "Direct insight tailored to your relationship status"
                    : "เช็กสถานะหัวใจ คนโสด คนคุย หรือมีคู่"}
                </p>
              </Link>

              <Link
                href="/cards/birth-card"
                className="altar-card-porcelain rounded-xl p-4 block text-left transition"
              >
                <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Numerology" : "เลขศาสตร์"}
                </span>
                <h4 className="text-sm font-serif-th font-bold text-[#29261F] mt-1">
                  {isEnglish ? "Birth Card Calculator" : "คำนวณไพ่ประจำตัว"}
                </h4>
                <p className="text-xs text-[#635B4E] mt-1">
                  {isEnglish
                    ? "Discover your personality and soul archetypes"
                    : "ค้นพบตัวตนและพรสวรรค์ติดตัวจากวันเกิด"}
                </p>
              </Link>

              <Link
                href="/spreads"
                className="altar-card-porcelain rounded-xl p-4 block text-left transition"
              >
                <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
                  {isEnglish ? "Spreads" : "ผังพยากรณ์"}
                </span>
                <h4 className="text-sm font-serif-th font-bold text-[#29261F] mt-1">
                  {isEnglish ? "All 25 Tarot Spreads" : "ผังพยากรณ์ 25 แบบ"}
                </h4>
                <p className="text-xs text-[#635B4E] mt-1">
                  {isEnglish
                    ? "Golden Ratio spreads for complex life dilemmas"
                    : "เปิดไพ่เชิงลึกด้วยผังสัดส่วนทองคำครบทุกมิติ"}
                </p>
              </Link>
            </div>
          </div>
        }
      />
    </div>
  );
}
