/**
 * สร้างแผนที่ "ไพ่ที่พลังงานใกล้เคียง" แบบออฟไลน์ 100% (ไม่แตะ network)
 * ผลลัพธ์ → src/data/cards/related.generated.ts  ⚠️ ห้ามแก้ไฟล์นั้นด้วยมือ
 * รันซ้ำได้ผลเหมือนเดิมทุกครั้ง (deterministic)
 */
import { writeFileSync } from "fs";
import { resolve } from "path";
import { DECK } from "../src/data/cards";
import type { TarotCard } from "../src/data/cards/types";

const W = {
  keyword: 3.0,   // คำสำคัญร่วม (Jaccard ของ upright ∪ reversed)
  number: 1.5,    // เลขเดียวกันข้ามดอก — เอซ 4 ใบ / อัศวิน 4 ใบ เชื่อมถึงกัน
  element: 1.2,   // ธาตุเดียวกัน
  astrology: 1.0, // ดาว/ราศีเดียวกัน
  suit: 0.8,      // ดอกเดียวกัน
  yesNo: 0.3,     // แนวโน้มคำตอบเดียวกัน
  neighborPenalty: -1.2, // ใบติดกันในสำรับ (มีปุ่ม prev/next อยู่แล้ว ไม่ต้องซ้ำ)
} as const;

function getKeywordSet(card: TarotCard): Set<string> {
  return new Set([
    ...card.keywords.upright.map((k) => k.trim().toLowerCase()),
    ...card.keywords.reversed.map((k) => k.trim().toLowerCase()),
  ]);
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize > 0 ? intersection / unionSize : 0;
}

function computeScore(
  target: TarotCard,
  candidate: TarotCard,
  targetIdx: number,
  candidateIdx: number,
  targetKeywords: Set<string>,
  candidateKeywords: Set<string>
): number {
  let score = 0;

  // 1. Keyword similarity (Jaccard)
  const jaccard = jaccardSimilarity(targetKeywords, candidateKeywords);
  score += jaccard * W.keyword;

  // 2. Number matching (Major 0..21 or Minor 1..14)
  if (target.number === candidate.number) {
    score += W.number;
  }

  // 3. Element matching
  if (target.element === candidate.element) {
    score += W.element;
  }

  // 4. Astrology matching
  const astroA = target.astrology.trim().toLowerCase();
  const astroB = candidate.astrology.trim().toLowerCase();
  if (astroA && astroB && (astroA === astroB || astroA.includes(astroB) || astroB.includes(astroA))) {
    score += W.astrology;
  }

  // 5. Suit matching (Minor arcana)
  if (target.suit && candidate.suit && target.suit === candidate.suit) {
    score += W.suit;
  }

  // 6. Yes/No matching
  if (target.yesNo === candidate.yesNo) {
    score += W.yesNo;
  }

  // 7. Neighbor penalty
  if (Math.abs(targetIdx - candidateIdx) === 1) {
    score += W.neighborPenalty;
  }

  return score;
}

export function generateRelatedCardsMap(): Record<string, [string, string, string, string]> {
  if (DECK.length !== 78) {
    throw new Error(`[Rule 14] สำรับไพ่ต้องมี 78 ใบพอดี พบ ${DECK.length} ใบ`);
  }

  const keywordCache = new Map<string, Set<string>>();
  for (const card of DECK) {
    keywordCache.set(card.id, getKeywordSet(card));
  }

  const result: Record<string, [string, string, string, string]> = {};

  for (let i = 0; i < DECK.length; i++) {
    const target = DECK[i];
    const targetKeywords = keywordCache.get(target.id)!;

    const scoredCandidates: Array<{ id: string; score: number }> = [];

    for (let j = 0; j < DECK.length; j++) {
      if (i === j) continue; // ตัดตัวเอง
      const candidate = DECK[j];
      const candidateKeywords = keywordCache.get(candidate.id)!;

      const score = computeScore(target, candidate, i, j, targetKeywords, candidateKeywords);
      scoredCandidates.push({ id: candidate.id, score });
    }

    // เรียงลำดับคะแนนจากมากไปน้อย (ถ้าคะแนนเท่ากัน ให้เรียงตาม id จากน้อยไปมาก เพื่อความ Deterministic)
    scoredCandidates.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 1e-6) {
        return b.score - a.score;
      }
      return a.id.localeCompare(b.id);
    });

    const top4 = scoredCandidates.slice(0, 4).map((c) => c.id);

    if (top4.length !== 4) {
      throw new Error(`[Rule 14] ไม่สามารถหาไพ่ใกล้เคียงครบ 4 ใบสำหรับ ${target.id} (ห้ามกุไพ่ปลอม)`);
    }

    result[target.id] = [top4[0], top4[1], top4[2], top4[3]];
  }

  return result;
}

function run() {
  console.log("🔮 กำลังคำนวณแผนที่ไพ่ที่พลังงานใกล้เคียง 78 × 4 ใบ (Deterministic)...");
  const relatedMap = generateRelatedCardsMap();

  const lines = [
    "// AUTO-GENERATED — อย่าแก้ด้วยมือ · สร้างด้วย `npm run cards:related`",
    "export const RELATED_CARDS: Readonly<Record<string, readonly [string, string, string, string]>> = {",
  ];

  for (const card of DECK) {
    const refs = relatedMap[card.id];
    lines.push(`  "${card.id}": [${refs.map((r) => `"${r}"`).join(", ")}],`);
  }

  lines.push("} as const;\n");

  const targetPath = resolve(process.cwd(), "src/data/cards/related.generated.ts");
  writeFileSync(targetPath, lines.join("\n"), "utf-8");
  console.log(`✨ เขียนไฟล์สำเร็จ: ${targetPath}`);
}

run();
