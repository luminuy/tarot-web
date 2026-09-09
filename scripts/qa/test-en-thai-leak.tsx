/**
 * 🌐 ด่านกันภาษาไทยหลุดในโหมดอังกฤษ (EN Thai-Leak Gate)
 * ---------------------------------------------------------------------------
 * ที่มา: เจ้าของโปรเจกต์กด EN แล้วยังเจอคำไทยโผล่ 2 จุดในเส้นทางเปิดไพ่
 *   1. หน้าจับไพ่ — หัวข้อ "เลือกไพ่สำหรับ …" กับป้ายนับใบ เขียนไทยตายตัวไม่มีสาขา EN
 *   2. หน้าผลคำอ่าน — ป้าย "Key Themes" ได้คำสำคัญไทย เพราะโค้ดหยิบ "ไพ่ก้อนย่อ"
 *      จากเซสชัน (มีแต่ `keywords` ไทย) มาก่อนไพ่เต็มจากสำรับที่มี `keywordsEn`
 *
 * วิธีตรวจ: เรนเดอร์คอมโพเนนต์จริงด้วย `renderToStaticMarkup` โดยตรึงภาษาเป็น `en`
 * แล้วยืนยันว่า **ไม่มีอักษรไทยแม้แต่ตัวเดียว** ใน HTML ที่ออกมา
 * เป็นการวัดสิ่งที่ผู้ใช้เห็นจริง ไม่ใช่การเดาจากรูปแบบข้อความในซอร์ส
 * (ของเดิมไม่มีด่านไหนตรวจเรื่องนี้เลย คำไทยจึงหลุดขึ้น production ได้)
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";
import { LocaleProvider } from "../../src/lib/i18n/context";
import { InteractiveCardFan } from "../../src/components/deck/InteractiveCardFan";
import { ShuffleRitual } from "../../src/components/deck/ShuffleRitual";
import { StreamReader } from "../../src/components/reading/StreamReader";
import { QuickChatResult } from "../../src/components/reading/QuickChatResult";
import { ElementalBalanceWidget } from "../../src/components/reading/ElementalBalanceWidget";
import { resolveDisplayKeywords } from "../../src/lib/tarot/keywords";
import { CARD_KEYWORDS_EN } from "../../src/data/cards/keywords-en";
import { DECK, cardByIndex } from "../../src/data/cards";
import { PERSONAS } from "../../src/data/personas";
import type { DrawnSlotCard } from "../../src/components/spread/SpreadBoard";

const THAI = /[฀-๿]/;

/**
 * ไพ่ที่ "ถูกจั่วแล้ว" แบบเดียวกับที่เซสชันเก็บไว้ — มีแต่คำสำคัญภาษาไทย
 * นี่คือรูปข้อมูลที่ทำให้เกิดบั๊ก Key Themes ภาษาไทยในภาพหน้าจอที่เจ้าของส่งมา
 * (Six of Wands = index 27 ในสำรับ)
 */
const SIX_OF_WANDS_INDEX = DECK.findIndex((card) => card.id === "wands-06");

const drawnCards: DrawnSlotCard[] = [
  {
    order: 0,
    cardIndex: SIX_OF_WANDS_INDEX,
    isReversed: false,
    position: {
      index: 0,
      nameTh: "1. สภาพการเงินปัจจุบัน",
      nameEn: "1. Current Financial State",
      meaning: "สภาพคล่อง กระแสเงินสด และความเป็นจริงทางการเงิน",
      meaningEn: "Current liquidity, monetary dynamics, and cash flow reality",
      x: 0.5,
      y: 0.5,
    },
    card: {
      id: "wands-06",
      nameTh: "ไพ่หกไม้เท้า",
      nameEn: "Six of Wands",
      image: "wands-06.jpg",
      element: "ไฟ",
      keywords: ["ชัยชนะ", "ได้รับการยอมรับ", "ความภูมิใจ", "คนมองเห็น", "ข่าวดี"],
    },
  },
];

const reading = {
  summary: "A season of visible progress.",
  cards: [{ position: 0, headline: "Riding the Wave of Recognition", reading: "Celebrate this win responsibly." }],
};

/** เรนเดอร์คอมโพเนนต์เดียวในโหมดอังกฤษ แล้วคืนอักษรไทยที่หลุดออกมา (ถ้ามี) */
function thaiLeakedFrom(label: string, node: React.ReactElement): string[] {
  const html = renderToStaticMarkup(<LocaleProvider forcedLocale="en">{node}</LocaleProvider>);
  const matches = html.match(/[฀-๿][฀-๿\s]*/g) || [];
  const unique = [...new Set(matches.map((m) => m.trim()).filter(Boolean))];
  return unique.map((text) => `[${label}] มีภาษาไทยหลุดในโหมดอังกฤษ: "${text}"`);
}

export function runQa() {
  console.log("🧪 ตรวจการรั่วของภาษาไทยในโหมดอังกฤษ (เรนเดอร์จริงด้วย forcedLocale=\"en\")...");
  const errors: string[] = [];

  if (SIX_OF_WANDS_INDEX < 0) {
    throw new Error("หาไพ่ wands-06 ในสำรับไม่เจอ — ลำดับสำรับเปลี่ยนไปหรือไม่?");
  }

  // ── A. ตรรกะเลือกคำสำคัญ (สาเหตุรากของ Key Themes ภาษาไทย) ───────────────
  const enKeywords = resolveDisplayKeywords({
    cardId: "wands-06",
    keywords: drawnCards[0].card!.keywords,
    isReversed: false,
    isEnglish: true,
  });
  if (enKeywords.length === 0) {
    errors.push("resolveDisplayKeywords โหมด EN คืนอาร์เรย์ว่างทั้งที่ไพ่ใบนี้มีคำสำคัญอังกฤษในพจนานุกรม");
  }
  for (const kw of enKeywords) {
    if (THAI.test(kw)) errors.push(`resolveDisplayKeywords โหมด EN คืนคำไทยหลุดออกมา: "${kw}"`);
  }

  const enReversed = resolveDisplayKeywords({ cardId: "wands-06", isReversed: true, isEnglish: true });
  if (enReversed.join("|") !== (CARD_KEYWORDS_EN["wands-06"]?.reversed || []).join("|")) {
    errors.push("resolveDisplayKeywords โหมด EN ไม่ได้ใช้ชุดคำสำคัญ reversed ของภาษาอังกฤษ");
  }

  // ไพ่ที่หาคำสำคัญอังกฤษไม่เจอ ต้องซ่อนแถบ (คืนว่าง) ห้ามตกกลับไปโชว์ภาษาไทย
  const unknownCard = resolveDisplayKeywords({
    cardId: "not-a-real-card",
    keywords: drawnCards[0].card!.keywords,
    isEnglish: true,
  });
  if (unknownCard.length !== 0) {
    errors.push("resolveDisplayKeywords โหมด EN ต้องคืนอาร์เรย์ว่างเมื่อไม่มีคำสำคัญอังกฤษ ห้ามตกไปใช้คำไทย");
  }

  // โหมดไทยต้องทำงานเหมือนเดิมทั้งแบบอาร์เรย์แบนและแบบ upright/reversed
  const thFlat = resolveDisplayKeywords({ keywords: drawnCards[0].card!.keywords, isEnglish: false });
  if (thFlat.join("|") !== drawnCards[0].card!.keywords.join("|")) {
    errors.push("resolveDisplayKeywords โหมดไทยไม่คืนคำสำคัญไทยตามที่ป้อนเข้าไป");
  }
  const thObject = resolveDisplayKeywords({
    keywords: { upright: ["หัวตั้ง"], reversed: ["กลับหัว"] },
    isReversed: true,
    isEnglish: false,
  });
  if (thObject.join("|") !== "กลับหัว") {
    errors.push("resolveDisplayKeywords โหมดไทยไม่รองรับคำสำคัญแบบอ็อบเจกต์ upright/reversed");
  }

  // สำรับต้องมีคำสำคัญอังกฤษครบทุกใบ ไม่งั้นโหมด EN จะเจอแถบว่างแทนคำแปล
  const missing = DECK.filter((card) => !CARD_KEYWORDS_EN[card.id]).map((card) => card.id);
  if (missing.length > 0) {
    errors.push(`ไพ่ที่ยังไม่มีคำสำคัญภาษาอังกฤษ ${missing.length} ใบ: ${missing.slice(0, 5).join(", ")}`);
  }

  // ไพ่เต็มจากสำรับต้องมี keywordsEn เสมอ — เป็นแหล่งข้อมูลที่หน้าผลคำอ่านใช้
  if (!cardByIndex(SIX_OF_WANDS_INDEX)?.keywordsEn) {
    errors.push("cardByIndex() คืนไพ่ที่ไม่มี keywordsEn — หน้าผลคำอ่านโหมด EN จะไม่มีคำสำคัญให้แสดง");
  }

  // ── B. เรนเดอร์จริง: ทุกจอในเส้นทางเปิดไพ่ต้องไม่มีอักษรไทยเลย ─────────────
  const persona = PERSONAS[0];

  errors.push(
    ...thaiLeakedFrom(
      "InteractiveCardFan · กำลังเลือกไพ่",
      <InteractiveCardFan
        pickedIndices={[]}
        targetCount={4}
        currentPositionName="1. Current Financial State"
        onPickCard={() => {}}
      />
    )
  );

  // สถานะ "เลือกครบแล้ว" เป็นคนละกิ่ง JSX จึงต้องเรนเดอร์แยก
  errors.push(
    ...thaiLeakedFrom(
      "InteractiveCardFan · เลือกครบแล้ว",
      <InteractiveCardFan pickedIndices={[0, 1, 2, 3]} targetCount={4} onPickCard={() => {}} />
    )
  );

  errors.push(
    ...thaiLeakedFrom(
      "ShuffleRitual",
      <ShuffleRitual
        onShuffleComplete={() => {}}
        spreadName="Financial Path"
        commitment="0f5a1c2d3e4b5a6978807162534455667788990aabbccddeeff00112233445566"
      />
    )
  );

  errors.push(
    ...thaiLeakedFrom(
      "StreamReader · ผลคำอ่าน",
      <StreamReader
        reading={reading}
        persona={persona}
        isStreaming={false}
        activeCardIndex={0}
        onSelectCardIndex={() => {}}
        drawnCards={drawnCards}
        question="How are my finances?"
      />
    )
  );

  errors.push(
    ...thaiLeakedFrom(
      "QuickChatResult · ทำนายด่วน",
      <QuickChatResult
        reading={reading}
        persona={persona}
        isStreaming={false}
        drawnCards={drawnCards}
        question="How are my finances?"
      />
    )
  );

  errors.push(
    ...thaiLeakedFrom(
      "ElementalBalanceWidget",
      <ElementalBalanceWidget cards={[cardByIndex(SIX_OF_WANDS_INDEX)!]} />
    )
  );

  if (errors.length > 0) {
    console.error(`❌ QA FAILED — พบภาษาไทยรั่วในโหมดอังกฤษ ${errors.length} จุด:`);
    for (const err of errors.slice(0, 20)) console.error(`  - ${err}`);
    if (errors.length > 20) console.error(`  ...และอีก ${errors.length - 20} จุด`);
    process.exit(1);
  }

  console.log("✅ ผ่าน — โหมดอังกฤษไม่มีภาษาไทยรั่ว");
  console.log("   - resolveDisplayKeywords โหมด EN ไม่คืนอักษรไทยแม้ป้อนไพ่ก้อนย่อที่มีแต่คำไทย");
  console.log(`   - ไพ่ ${DECK.length}/${DECK.length} ใบมีคำสำคัญภาษาอังกฤษครบ`);
  console.log("   - เรนเดอร์จริง 6 จอในเส้นทางเปิดไพ่ ไม่มีอักษรไทยหลุดสักตัว");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runQa();
}
