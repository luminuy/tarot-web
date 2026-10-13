"use client";

import { useEffect, useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { CardImage } from "@/components/card/CardImage";
import type { TarotCard as TarotCardType } from "@/data/cards/types";
import { useLocale } from "@/lib/i18n";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";
import { saveReading } from "@/lib/utils/history";
import { soundManager } from "@/lib/utils/audio";
import { GoldMark } from "@/components/ui/GoldMark";
import { OneCardRitual } from "@/components/reading/one-card/OneCardRitual";
import { DailyStreakRibbon } from "@/components/daily/DailyStreakRibbon";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { EveningCheckin, MorningReflection, WeekStrip } from "@/components/daily/DailyReflection";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import type { RitualFocus } from "@/lib/journal/journal-types";

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
    titleTh: "ภาพรวมวันนี้",
    titleEn: "The day ahead",
    elementTh: "ไพ่ใหญ่",
    elementEn: "Major Arcana",
    descTh: "พลังงานหลักและทิศทางของวัน",
    descEn: "The overall energy and direction of your day",
    cardImage: "major-19.jpg",
    cardNameTh: "ดวงอาทิตย์",
    cardNameEn: "The Sun",
  },
  {
    id: "work",
    titleTh: "การงาน",
    titleEn: "Work",
    elementTh: "ธาตุไฟ",
    elementEn: "Fire · Wands",
    descTh: "การตัดสินใจ ภาวะผู้นำ และความก้าวหน้า",
    descEn: "Decisions, leadership and moving forward",
    cardImage: "wands-01.jpg",
    cardNameTh: "เอซแห่งไม้เท้า",
    cardNameEn: "Ace of Wands",
  },
  {
    id: "money",
    titleTh: "การเงิน",
    titleEn: "Money",
    elementTh: "ธาตุดิน",
    elementEn: "Earth · Pentacles",
    descTh: "รายรับ รายจ่าย และโชคลาภ",
    descEn: "Spending, saving and good fortune",
    cardImage: "pentacles-01.jpg",
    cardNameTh: "เอซแห่งเหรียญ",
    cardNameEn: "Ace of Pentacles",
  },
  {
    id: "love",
    titleTh: "ความรัก",
    titleEn: "Love",
    elementTh: "ธาตุน้ำ",
    elementEn: "Water · Cups",
    descTh: "คนในใจ ความผูกพัน และความรู้สึกจริง",
    descEn: "The people you care about and how you feel",
    cardImage: "cups-01.jpg",
    cardNameTh: "เอซแห่งถ้วย",
    cardNameEn: "Ace of Cups",
  },
  {
    id: "mind",
    titleTh: "ใจและสติ",
    titleEn: "Mind & spirit",
    elementTh: "ธาตุลม",
    elementEn: "Air · Swords",
    descTh: "ความสงบในใจ สติ และการปล่อยวาง",
    descEn: "Calm, clarity and letting go",
    cardImage: "swords-01.jpg",
    cardNameTh: "เอซแห่งดาบ",
    cardNameEn: "Ace of Swords",
  },
];

/** วิหารเดิม ➔ ชิป "วันนี้อยากใส่ใจเรื่องอะไร" ของพิธีเช้า (ภาพรวม = ไม่ระบุ) */
const CHAMBER_TO_FOCUS: Record<DailyFocus, RitualFocus | undefined> = {
  general: undefined,
  work: "work",
  money: "money",
  love: "heart",
  mind: "self",
};

export function DailyClient() {
  const { isEnglish } = useLocale();

  const [selectedFocus, setSelectedFocus] = useState<DailyFocus>("general");
  const [intentionText, setIntentionText] = useState("");
  /** จำนวนวันที่เปิดไพ่ประจำวันติดต่อกัน — มาจากเซิร์ฟเวอร์เท่านั้น ห้ามนับเองฝั่งเบราว์เซอร์ */
  const [streak, setStreak] = useState(0);
  /** ✦ พิธีเช้า — ทิศไพ่ที่เปิดได้ + id ของบันทึกในสมุด (ใช้ต่อกับใจตอนนี้/บรรทัดเดียว) */
  const [ritual, setRitual] = useState<{ isReversed: boolean; journalId: string | null } | null>(null);

  const currentChamber = FOCUS_CHAMBERS.find((c) => c.id === selectedFocus) || FOCUS_CHAMBERS[0];

  /** คำถามที่ส่งให้แม่หมออ่าน — เจตจำนงที่ผู้ใช้พิมพ์เอง ถ้าเว้นว่างใช้เรื่องของวิหารที่เลือก */
  const dailyQuestion =
    intentionText.trim() ||
    (isEnglish
      ? `Daily guidance for ${currentChamber.titleEn}: ${currentChamber.descEn}`
      : `ขอคำชี้แนะประจำวันเรื่อง${currentChamber.titleTh} — ${currentChamber.descTh}`);

  /*
   * วันที่ปัจจุบัน — ต้องคำนวณ "หลัง mount" เท่านั้น (A3-04)
   * หน้านี้ถูก prerender ครั้งเดียวตอนบิลด์ ถ้าคำนวณตอน render ป้ายจะค้างเป็น "วันบิลด์"
   * (โซนเวลา UTC ของเครื่องบิลด์) และทุกวันที่ไม่ใช่วัน deploy จะ hydration mismatch
   * จน React ทิ้ง DOM ทั้ง island เรนเดอร์ใหม่ · ระหว่างรอแสดงป้ายกลาง ๆ ที่ไม่ผูกกับวัน
   */
  const [todayDateString, setTodayDateString] = useState<string | null>(null);
  useEffect(() => {
    setTodayDateString(
      new Intl.DateTimeFormat(isEnglish ? "en-US" : "th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: APP_TIME_ZONE,
      }).format(new Date()),
    );
  }, [isEnglish]);

  const handleRevealed = (card: TarotCardType, isReversed: boolean) => {
    // ประทับตรา "วันนี้มาเปิดไพ่แล้ว" ฝั่งเซิร์ฟเวอร์ — ต้องยิงก่อนทุกกรณี
    // แม้การบันทึกประวัติด้านล่างจะข้ามไป (ไพ่ไม่ตรงกับ CARD_SUMMARIES)
    // เพราะผู้ใช้ "เปิดไพ่วันนี้" ไปแล้วจริง ๆ ไม่ว่าสมุดบันทึกจะเขียนสำเร็จหรือไม่
    void fetch("/api/daily/checkin", { method: "POST", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { streak?: number } | null) => {
        if (typeof data?.streak === "number") setStreak(data.streak);
      })
      .catch(() => {
        // เช็กอินไม่สำเร็จ = แค่ไม่มีป้ายต่อเนื่องขึ้น ห้ามให้กระทบการอ่านคำทำนาย
      });

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
      const saved = saveReading({
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
            isReversed,
            element: card.element,
          },
        ],
        summary: isReversed ? card.meanings.general.reversed : card.meanings.general.upright,
        // ✦ บันทึกนี้คือพิธีเช้าของวันนี้ — รอบเย็นและสรุปสัปดาห์หาด้วย ritualKind (REFLECTION_JOURNAL_PLAN 1.9)
        ritualKind: "morning",
        ritual: CHAMBER_TO_FOCUS[selectedFocus] ? { focus: CHAMBER_TO_FOCUS[selectedFocus] } : undefined,
      });
      setRitual({ isReversed, journalId: saved.id });
    } catch {
      // Ignored
    }
  };

  const breadcrumbs = [
    { label: isEnglish ? "Home" : "หน้าแรก", href: "/" },
    { label: isEnglish ? "Daily Tarot" : "ดูดวงไพ่ยิปซีรายวัน" },
  ];

  return (
    <div className="ui2-dy-ritual">
      {/* หัวหน้า UI 2.0 (คืนท้องฟ้า · แผน UI_2_0) — h1 ข้อความเดิม "ดูดวงไพ่ยิปซีรายวัน" (คำว่า "รายวัน" เป็นทองไล่สี) */}
      <header className="ui2-dy-hero">
        <nav aria-label="Breadcrumb" className="ui2-dy-crumb">
          <ol>
            {breadcrumbs.map((crumb, idx) => (
              <li key={idx} aria-current={idx === breadcrumbs.length - 1 ? "page" : undefined}>
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <span className="ui2-chip ui2-dy-date">
          <GoldMark className="ui2-mark" />
          {todayDateString ?? (isEnglish ? "Today's Card" : "ไพ่ประจำวันนี้")}
        </span>
        <h1 className="ui2-h1 ui2-dy-h1">
          {isEnglish ? (
            <>
              <span className="ui2-gold-night ui2-loop">Daily</span> Tarot Oracle
            </>
          ) : (
            <ThaiPhrases>
              ดูดวงไพ่ยิปซี<span className="tp ui2-gold-night ui2-loop">รายวัน</span>
            </ThaiPhrases>
          )}
        </h1>
        <p className="ui2-lede ui2-dy-lede">
          {isEnglish
            ? "Choose what you want guidance on, set a quiet intention, and draw one card from the 1909 Rider-Waite deck for today."
            : "เลือกเรื่องที่อยากรู้ ตั้งใจถามสั้น ๆ แล้วเปิดไพ่ 1 ใบจากสำรับ 1909 Rider-Waite รับข้อคิดนำทางสำหรับวันนี้"}
        </p>
      </header>

      {/* Main Interactive Ritual Canvas */}
      <OneCardRitual
        spreadId="daily"
        category="general"
        question={dailyQuestion}
        spreadName={isEnglish ? "Daily Tarot" : "ไพ่ยิปซีรายวัน"}
        deckLabel={isEnglish ? `Focus: ${currentChamber.titleEn}` : `เรื่อง: ${currentChamber.titleTh}`}
        drawButtonText={isEnglish ? "Draw today's card" : "เปิดไพ่ของวันนี้"}
        intention={intentionText}
        isEnglish={isEnglish}
        onRevealed={handleRevealed}
        headerSlot={
          <div className="space-y-6">
            <InstallPrompt isEnglish={isEnglish} />
            {/* ✦ กลับมาวันเดียวกัน = เช็กอินเย็น · มีพิธีหลายวันแล้ว = แถบ 7 วัน */}
            <EveningCheckin isEnglish={isEnglish} />
            <WeekStrip isEnglish={isEnglish} />
            {/* ขั้น 1 — เลือกเรื่องของวัน: ไพ่จริงประจำเรื่อง 5 ใบ (มือถือเป็นแถว · คอมเป็นไพ่ตั้ง) */}
            <div className="ui2-dy-step">
              <p className="ui2-dy-step-k">
                <span className="ui2-num">1</span>
                {isEnglish ? "Your focus for today" : "วันนี้อยากรู้เรื่องไหน"}
              </p>
              <h2 className="ui2-dy-step-h"><ThaiPhrases>
                {isEnglish ? "Pick what you want the card to speak to" : "เลือกเรื่องที่อยากให้ไพ่ชี้ทาง"}
              </ThaiPhrases></h2>
            </div>
            <div className="ui2-dy-focus-grid" role="group" aria-label={isEnglish ? "Focus for today" : "เรื่องของวันนี้"}>
              {FOCUS_CHAMBERS.map((chamber) => {
                const isSelected = selectedFocus === chamber.id;
                return (
                  <button
                    key={chamber.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      soundManager.playMenuTapSound();
                      setSelectedFocus(chamber.id);
                    }}
                    className="ui2-dy-focus"
                  >
                    {/* ภาพหน้าไพ่ 1909 ประจำเรื่อง (กฎเหล็กข้อ 8 — ผ่าน <CardImage /> พร้อม sizes) · ภาพประกอบ ไม่ใช่ผลสุ่ม */}
                    <span className="ui2-dy-focus-art">
                      <CardImage image={chamber.cardImage} alt="" sizes="(min-width: 768px) 170px, 56px" />
                    </span>
                    <span className="ui2-dy-focus-body">
                      <span className="ui2-dy-focus-el">{isEnglish ? chamber.elementEn : chamber.elementTh}</span>
                      <span className="ui2-dy-focus-name">{isEnglish ? chamber.titleEn : chamber.titleTh}</span>
                      <span className="ui2-dy-focus-desc">{isEnglish ? chamber.descEn : chamber.descTh}</span>
                    </span>
                    <span className="ui2-dy-focus-tick" aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            {/* ขั้น 2 — ตั้งใจถาม (ไม่บังคับ) */}
            <div className="ui2-dy-intent">
              <label htmlFor="daily-intention" className="ui2-dy-step-k">
                <span className="ui2-num">2</span>
                {isEnglish ? "Set an intention (optional)" : "ตั้งใจถามสั้น ๆ (ไม่ใส่ก็ได้)"}
              </label>
              <input
                id="daily-intention"
                type="text"
                value={intentionText}
                onChange={(e) => setIntentionText(e.target.value)}
                maxLength={150}
                placeholder={
                  isEnglish
                    ? "e.g. How should I handle today's presentation?"
                    : "เช่น วันนี้ควรระวังอะไรในที่ทำงาน, ขอกำลังใจหน่อย"
                }
                className="ui2-dy-input"
              />
            </div>
          </div>
        }
        renderReading={(card) => (
          <div className="space-y-6">
            <DailyStreakRibbon streak={streak} isEnglish={isEnglish} />

            <MorningReflection
              cardId={card.id}
              isReversed={!!ritual?.isReversed}
              keywords={
                ritual?.isReversed
                  ? (isEnglish ? card.keywordsEn?.reversed : undefined) ?? card.keywords.reversed
                  : (isEnglish ? card.keywordsEn?.upright : undefined) ?? card.keywords.upright
              }
              journalId={ritual?.journalId ?? null}
              isEnglish={isEnglish}
            />

            <div className="border-b border-line pb-3 text-center sm:text-left">
              <span className="text-xs font-serif-th font-semibold text-gold-ink">
                {isEnglish ? "Daily Oracle Analysis" : "ถอดรหัสสารทำนาย 5 มิติประจำวัน"}
              </span>
              <h3 className="text-lg sm:text-xl font-serif-th font-bold text-ink"><ThaiPhrases>
                {isEnglish ? "The 5 Pillars of Today" : "แสงสว่างนำทาง 5 มิติ"}
              </ThaiPhrases></h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pillar 1: General Energy */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2 md:col-span-2">
                <span className="text-xs font-serif-th font-semibold text-gold-ink">
                  {isEnglish ? "Core Energy" : "พลังงานหลักวันนี้"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-ink">
                  {isEnglish ? "Atmosphere of the Day" : "พลังงานหลักแห่งรุ่งอรุณ"}
                </h4>
                <p className="text-sm font-sans text-ink leading-relaxed">
                  {card.meanings.general.upright}
                </p>
              </div>

              {/* Pillar 2: Career */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2">
                <span className="text-xs font-serif-th font-semibold text-gold-ink">
                  {isEnglish ? "Career & Purpose" : "การงานและภารกิจ"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-ink">
                  {isEnglish ? "Work & Decisions" : "การงาน การตัดสินใจ และความก้าวหน้า"}
                </h4>
                <p className="text-sm font-sans text-ink leading-relaxed">
                  {card.meanings.work.upright}
                </p>
              </div>

              {/* Pillar 3: Money */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2">
                <span className="text-xs font-serif-th font-semibold text-gold-ink">
                  {isEnglish ? "Wealth & Finance" : "การเงินและโชคลาภ"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-ink">
                  {isEnglish ? "Financial Flow" : "การเงิน สภาพคล่อง และโอกาส"}
                </h4>
                <p className="text-sm font-sans text-ink leading-relaxed">
                  {card.meanings.money.upright}
                </p>
              </div>

              {/* Pillar 4: Love */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2">
                <span className="text-xs font-serif-th font-semibold text-gold-ink">
                  {isEnglish ? "Love & Relations" : "ความรักและสัมพันธภาพ"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-ink">
                  {isEnglish ? "Heartspace & Bonds" : "ความสัมพันธ์และคนใกล้ชิด"}
                </h4>
                <p className="text-sm font-sans text-ink leading-relaxed">
                  {card.meanings.love.upright}
                </p>
              </div>

              {/* Pillar 5: Mindful Reflection */}
              <div className="altar-card-porcelain rounded-xl p-5 space-y-2">
                <span className="text-xs font-serif-th font-semibold text-gold-ink">
                  {isEnglish ? "Mindful Reflection" : "ข้อคิดเตือนใจ"}
                </span>
                <h4 className="text-base font-serif-th font-bold text-ink">
                  {isEnglish ? "Wisdom & Mindfulness" : "สติสัมปชัญญะและสิ่งพึงระวัง"}
                </h4>
                <p className="text-sm font-sans text-ink leading-relaxed">
                  {card.meanings.self.upright}
                </p>
              </div>
            </div>
          </div>
        )}
        recommendations={
          <div className="space-y-4">
            <h3 className="text-base font-serif-th font-bold text-ink text-center sm:text-left"><ThaiPhrases>
              {isEnglish ? "Recommended Sacred Readings" : "ผังพยากรณ์ที่แนะนำเพิ่มเติม"}
            </ThaiPhrases></h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/love/1-card"
                className="altar-card-porcelain rounded-xl p-4 block text-left transition"
              >
                <span className="text-xs font-serif-th font-semibold text-gold-ink">
                  {isEnglish ? "Love Tarot" : "ความรัก"}
                </span>
                <h4 className="text-sm font-serif-th font-bold text-ink mt-1">
                  {isEnglish ? "1-Card Love Oracle" : "ดูดวงความรัก 1 ใบ"}
                </h4>
                <p className="text-xs text-muted mt-1">
                  {isEnglish
                    ? "Direct insight tailored to your relationship status"
                    : "เช็กสถานะหัวใจ คนโสด คนคุย หรือมีคู่"}
                </p>
              </Link>

              <Link
                href="/cards/birth-card"
                className="altar-card-porcelain rounded-xl p-4 block text-left transition"
              >
                <span className="text-xs font-serif-th font-semibold text-gold-ink">
                  {isEnglish ? "Numerology" : "เลขศาสตร์"}
                </span>
                <h4 className="text-sm font-serif-th font-bold text-ink mt-1">
                  {isEnglish ? "Birth Card Calculator" : "คำนวณไพ่ประจำตัว"}
                </h4>
                <p className="text-xs text-muted mt-1">
                  {isEnglish
                    ? "Discover your personality and soul archetypes"
                    : "ค้นพบตัวตนและพรสวรรค์ติดตัวจากวันเกิด"}
                </p>
              </Link>

              <Link
                href="/spreads"
                className="altar-card-porcelain rounded-xl p-4 block text-left transition"
              >
                <span className="text-xs font-serif-th font-semibold text-gold-ink">
                  {isEnglish ? "Spreads" : "ผังพยากรณ์"}
                </span>
                <h4 className="text-sm font-serif-th font-bold text-ink mt-1">
                  {isEnglish ? "All 26 Tarot Spreads" : "ผังพยากรณ์ 26 แบบ"}
                </h4>
                <p className="text-xs text-muted mt-1">
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
