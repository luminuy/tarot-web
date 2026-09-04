/**
 * src/lib/ai/consistency.ts
 * ---------------------------------------------------------------------------
 * 🛡️ Deterministic Reading Consistency Checker (AI_INTELLIGENCE_PLAN W1.3)
 * ตรวจสอบคุณภาพและความสอดคล้องของคำทำนายด้วยโค้ด (ไม่ใช่ LLM ตรวจ LLM)
 *
 * การตรวจสอบ:
 * 1. MISSING_POSITION / DUPLICATE_POSITION: ไพ่ต้องครบทุกตำแหน่งและไม่ซ้ำ
 * 2. FOREIGN_CARD (กฎเหล็กข้อ 14 ระดับข้อความ): ชื่อไพ่ในคำอ่านต้องอยู่ในชุดที่เปิดจริงเท่านั้น
 *    (มีเกราะป้องกันผลบวกลวง: คำสามัญอย่าง "ดวงอาทิตย์", "ดวงจันทร์", "โลก", "ความตาย"
 *     ต้องมี "ไพ่" นำหน้า หรืออยู่ในวงเล็บ ถึงจะนับเป็นการอ้างอิงไพ่)
 * 3. YESNO_CONTRADICTION: yesNoAnswer ต้องไม่ขัดแย้งกับคำสรุปใน summary
 * 4. ADVICE_MISSING_MINDFUL: ข้อสุดท้ายใน advice ควรเป็น Mindful Ritual (ขึ้นต้นด้วย 🧘)
 * 5. CARD_READING_LENGTH: ความยาวคำอ่านแต่ละใบต้องสมเหตุสมผล
 */

import { DECK, type TarotCard } from "@/data/cards";
import type { Reading } from "@/lib/schema/reading";
import type { PastReadingSnapshot } from "@/lib/ai/karmic";

export interface ConsistencyIssue {
  code:
    | "MISSING_POSITION"
    | "DUPLICATE_POSITION"
    | "FOREIGN_CARD"
    | "YESNO_CONTRADICTION"
    | "ADVICE_MISSING_MINDFUL"
    | "CARD_READING_TOO_SHORT"
    | "CARD_READING_TOO_LONG";
  message: string;
  fatal: boolean;
}

export interface ConsistencyResult {
  ok: boolean;
  fatal: boolean;
  issues: ConsistencyIssue[];
}

export interface ConsistencyOptions {
  drawnCount?: number;
  yesNoMode?: boolean;
  pastReading?: PastReadingSnapshot;
  allowedExtraCardNames?: string[];
}

// แผนที่คำอ่านทับศัพท์ภาษาไทยสำหรับไพ่ชุดหลัก (Major Arcana Transliterations)
const MAJOR_TRANSLITERATIONS: Record<string, string[]> = {
  "major-00": ["เดอะฟูล", "เดอะ ฟูล"],
  "major-01": ["เดอะเมจิเชียน", "เดอะ เมจิเชียน"],
  "major-02": ["เดอะไฮพรีสเตส", "เดอะ ไฮพรีสเตส"],
  "major-03": ["เดอะเอมเพรส", "เดอะ เอมเพรส"],
  "major-04": ["เดอะเอมเพอเรอร์", "เดอะ เอมเพอเรอร์"],
  "major-05": ["เดอะไฮโรแฟนท์", "เดอะ ไฮโรแฟนท์"],
  "major-06": ["เดอะเลิฟเวอร์", "เดอะ เลิฟเวอร์ส", "เดอะเลิฟเวอร์ส"],
  "major-07": ["เดอะแชริออต", "เดอะ แชริออต"],
  "major-08": ["เดอะสเตร็งธ์", "เดอะ สเตร็งธ์"],
  "major-09": ["เดอะเฮอร์มิท", "เดอะ เฮอร์มิท"],
  "major-10": ["เดอะวีล", "วีลออฟฟอร์จูน", "เดอะ วีล"],
  "major-11": ["เดอะจัสติซ", "เดอะ จัสติซ"],
  "major-12": ["เดอะแฮงแมน", "เดอะแฮงด์แมน", "เดอะ แฮงแมน"],
  "major-13": ["เดอะเดธ", "เดอะ เดธ"],
  "major-14": ["เดอะเทมเพอแรนซ์", "เดอะ เทมเพอแรนซ์"],
  "major-15": ["เดอะเดวิล", "เดอะ เดวิล"],
  "major-16": ["เดอะทาวเวอร์", "เดอะ ทาวเวอร์"],
  "major-17": ["เดอะสตาร์", "เดอะ สตาร์"],
  "major-18": ["เดอะมูน", "เดอะ มูน"],
  "major-19": ["เดอะซัน", "เดอะ ซัน"],
  "major-20": ["เดอะจัดจ์เมนต์", "เดอะ จัดจ์เมนต์"],
  "major-21": ["เดอะเวิลด์", "เดอะ เวิลด์"],
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * สกัดรายชื่อไพ่ทาโรต์ที่มีการอ้างอิงชัดเจนในข้อความ
 * โดยป้องกันผลบวกลวง (False Positives) จากคำสามัญในภาษาไทย
 */
export function extractReferencedCards(text: string): Array<{ card: TarotCard; rawMatch: string }> {
  if (!text || !text.trim()) return [];

  const matches: Array<{ card: TarotCard; rawMatch: string }> = [];
  const seenCardIds = new Set<string>();

  for (const card of DECK) {
    if (seenCardIds.has(card.id)) continue;

    let matched = false;
    let matchStr = "";

    // 1. นำหน้าด้วยคำว่า "ไพ่" (เช่น "ไพ่หอคอย", "ไพ่ The Tower", "ไพ่ดวงอาทิตย์", "ไพ่ 3 ดาบ")
    const thaiCardRegex = new RegExp(
      "(?:ไพ่|ไพ่ใบนี้คือ|ไพ่ใบที่\\s*\\d+|ไพ่\\s*(?:ของ|แห่ง)?)\\s*" + escapeRegex(card.nameTh),
      "gi"
    );
    if (thaiCardRegex.test(text)) {
      matched = true;
      matchStr = `ไพ่${card.nameTh}`;
    }

    // 2. อยู่ในวงเล็บ (เช่น "(The Tower)", "(หอคอย)", "(The Sun)", "(ดวงอาทิตย์)")
    if (!matched) {
      const parenEnRegex = new RegExp("\\(\\s*" + escapeRegex(card.nameEn) + "\\s*\\)", "gi");
      const parenThRegex = new RegExp("\\(\\s*" + escapeRegex(card.nameTh) + "\\s*\\)", "gi");
      if (parenEnRegex.test(text) || parenThRegex.test(text)) {
        matched = true;
        matchStr = `(${card.nameEn})`;
      }
    }

    // 3. ภาษาอังกฤษหลายคำ (Multi-word English Card Name) พร้อม Word Boundary (เช่น "The Tower", "The Sun", "Three of Swords")
    if (!matched) {
      if (card.nameEn.includes(" ")) {
        const enRegex = new RegExp("\\b" + escapeRegex(card.nameEn) + "\\b", "i");
        if (enRegex.test(text)) {
          matched = true;
          matchStr = card.nameEn;
        }
      } else {
        // ภาษาอังกฤษคำเดียว (Death, Justice, Strength, Temperance, Judgement)
        // ต้องมีคำว่า "ไพ่", "card", หรืออยู่ในเครื่องหมายคำพูด เพื่อกันคำภาษาอังกฤษทั่วไป
        const singleEnRegex = new RegExp(
          "(?:ไพ่\\s*|card\\s*|\"|“|\\()\\b" + escapeRegex(card.nameEn) + "\\b(?:\"|”|\\)|\\s|$)",
          "i"
        );
        if (singleEnRegex.test(text)) {
          matched = true;
          matchStr = card.nameEn;
        }
      }
    }

    // 4. คำอ่านทับศัพท์ภาษาไทยของไพ่ Major (เช่น "เดอะทาวเวอร์", "ไพ่เดอะซัน")
    if (!matched && MAJOR_TRANSLITERATIONS[card.id]) {
      for (const trans of MAJOR_TRANSLITERATIONS[card.id]) {
        const transRegex = new RegExp("(?:ไพ่\\s*)?" + escapeRegex(trans), "gi");
        if (transRegex.test(text)) {
          matched = true;
          matchStr = trans;
          break;
        }
      }
    }

    if (matched) {
      seenCardIds.add(card.id);
      matches.push({ card, rawMatch: matchStr });
    }
  }

  return matches;
}

/**
 * 🔍 ตรวจสอบความสอดคล้องของคำทำนาย (Deterministic Reading Consistency Gate)
 */
export function checkReadingConsistency(
  reading: Reading,
  drawnCards: TarotCard[],
  opts?: ConsistencyOptions
): ConsistencyResult {
  const issues: ConsistencyIssue[] = [];
  const expectedCount = opts?.drawnCount ?? drawnCards.length;

  // ── 1. ตรวจสอบตำแหน่งไพ่ (MISSING_POSITION & DUPLICATE_POSITION) ──
  const positionsPresent = new Set<number>();
  for (const c of reading.cards || []) {
    if (positionsPresent.has(c.position)) {
      issues.push({
        code: "DUPLICATE_POSITION",
        message: `พบตำแหน่งที่ ${c.position} ซ้ำซ้อนในคำอ่าน`,
        fatal: true,
      });
    }
    positionsPresent.add(c.position);
  }

  for (let i = 0; i < expectedCount; i++) {
    if (!positionsPresent.has(i)) {
      issues.push({
        code: "MISSING_POSITION",
        message: `ขาดคำอ่านตำแหน่งที่ ${i} (ต้องการ ${expectedCount} ตำแหน่ง แต่มีไม่ครบ)`,
        fatal: true,
      });
    }
  }

  // ── 2. ตรวจสอบการกุไพ่ปลอม / ไพ่นอกชุด (FOREIGN_CARD - Rule 14 Guard) ──
  // ไพ่ที่อนุญาต: ไพ่ที่เปิดจริง + ไพ่ในบริบท Karmic Memory (ถ้ามี)
  const allowedCardIds = new Set<string>(drawnCards.map((c) => c.id));

  // อนุญาตไพ่ในอดีตจาก Karmic Memory ไม่ให้ถือว่าเป็น hallucination
  if (opts?.pastReading?.primaryCardName) {
    for (const c of DECK) {
      if (
        opts.pastReading.primaryCardName.includes(c.nameTh) ||
        opts.pastReading.primaryCardName.toLowerCase().includes(c.nameEn.toLowerCase())
      ) {
        allowedCardIds.add(c.id);
      }
    }
  }
  if (opts?.pastReading?.recentPrimaryCards) {
    for (const cardName of opts.pastReading.recentPrimaryCards) {
      for (const c of DECK) {
        if (cardName.includes(c.nameTh) || cardName.toLowerCase().includes(c.nameEn.toLowerCase())) {
          allowedCardIds.add(c.id);
        }
      }
    }
  }

  if (opts?.allowedExtraCardNames) {
    for (const name of opts.allowedExtraCardNames) {
      for (const c of DECK) {
        if (name.includes(c.nameTh) || name.toLowerCase().includes(c.nameEn.toLowerCase())) {
          allowedCardIds.add(c.id);
        }
      }
    }
  }

  // รวมข้อความเนื้อหาคำอ่านทั้งหมดเพื่อตรวจจับ
  const cardTexts = (reading.cards || []).map((c) => `${c.headline} ${c.reading}`).join(" ");
  const fullText = `${cardTexts} ${reading.connections || ""} ${reading.summary || ""}`;

  const referenced = extractReferencedCards(fullText);
  for (const ref of referenced) {
    if (!allowedCardIds.has(ref.card.id)) {
      issues.push({
        code: "FOREIGN_CARD",
        message: `พบการอ้างอิงไพ่นอกชุดที่เปิดจริง: "${ref.rawMatch}" (${ref.card.nameEn} / ${ref.card.nameTh})`,
        fatal: true,
      });
    }
  }

  // ── 3. ตรวจสอบความขัดแย้งของ ใช่/ไม่ใช่ (YESNO_CONTRADICTION) ──
  if (opts?.yesNoMode && reading.yesNoAnswer) {
    const summary = reading.summary || "";
    if (reading.yesNoAnswer === "ใช่") {
      if (/คำตอบคือ\s*ไม่ใช่|ไม่ใช่คำตอบ|สรุปคือ\s*ไม่ใช่|คำตอบฟันธงคือ\s*ไม่ใช่/i.test(summary)) {
        issues.push({
          code: "YESNO_CONTRADICTION",
          message: "yesNoAnswer ระบุ \"ใช่\" แต่ summary กลับสรุปว่า \"ไม่ใช่\"",
          fatal: false,
        });
      }
    } else if (reading.yesNoAnswer === "ไม่ใช่") {
      if (/คำตอบคือ\s*ใช่|สรุปคือ\s*ใช่|คำตอบฟันธงคือ\s*ใช่/i.test(summary)) {
        issues.push({
          code: "YESNO_CONTRADICTION",
          message: "yesNoAnswer ระบุ \"ไม่ใช่\" แต่ summary กลับสรุปว่า \"ใช่\"",
          fatal: false,
        });
      }
    }
  }

  // ── 4. ตรวจสอบ Mindful Ritual ใน advice (ADVICE_MISSING_MINDFUL) ──
  const adviceList = reading.advice || [];
  if (adviceList.length > 0) {
    const lastAdvice = adviceList[adviceList.length - 1];
    if (!lastAdvice.includes("🧘")) {
      issues.push({
        code: "ADVICE_MISSING_MINDFUL",
        message: "ข้อสุดท้ายใน advice ไม่พบสัญลักษณ์ฝึกสติ 🧘",
        fatal: false,
      });
    }
  }

  // ── 5. ตรวจสอบความยาวคำอ่านรายใบ (CARD_READING_LENGTH) ──
  for (const c of reading.cards || []) {
    if (!c.reading || c.reading.trim().length < 15) {
      issues.push({
        code: "CARD_READING_TOO_SHORT",
        message: `คำอ่านตำแหน่งที่ ${c.position} สั้นเกินไป (${c.reading?.length ?? 0} ตัวอักษร)`,
        fatal: true,
      });
    } else if (c.reading.length > 3500) {
      issues.push({
        code: "CARD_READING_TOO_LONG",
        message: `คำอ่านตำแหน่งที่ ${c.position} ยาวผิดปกติ (${c.reading.length} ตัวอักษร)`,
        fatal: false,
      });
    }
  }

  const hasFatal = issues.some((i) => i.fatal);
  return {
    ok: issues.length === 0,
    fatal: hasFatal,
    issues,
  };
}
